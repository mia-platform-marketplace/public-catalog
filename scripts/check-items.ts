/**
 * Copyright 2025 Mia srl
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import type { Dirent } from 'node:fs'
import fs from 'node:fs/promises'
import path from 'node:path'

import { CatalogReleaseStage, catalogWellKnownItemsCustomResourceDefinitions, NA_VERSION } from '@mia-platform/console-types'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { Command } from 'commander'
import type { JSONSchema } from 'json-schema-to-ts'
import semver from 'semver'

import supporters from '../assets/supporters.json' with { type: 'json' }

import logger from './logger'
import type { ItemTypeData, ItemTypeModule, Manifest } from './utils'

const ajv = new Ajv({ addUsedSchema: false, allErrors: true })
addFormats(ajv)

const computePathsToCheck = async (itemIds: string[] = ['*']): Promise<string[]> => {
  const patterns = new Set(itemIds)
  const foundItemIds = new Set<string>()

  const paths: string[] = []

  for (const pattern of patterns) {
    let hasMatch = false

    for await (const dirent of fs.glob(`items/*/${pattern}`, { withFileTypes: true })) {
      if (!dirent.isDirectory()) { continue }

      if (foundItemIds.has(dirent.name)) {
        throw new Error(`Found multiple directories for item with id "${dirent.name}"`)
      }

      foundItemIds.add(dirent.name)
      hasMatch = true

      const itemPath = path.resolve(dirent.parentPath, dirent.name)
      paths.push(itemPath)
    }

    if (hasMatch === false) {
      throw new Error(pattern === '*' ? 'No items found' : `No items found for id "${pattern}"`)
    }
  }

  return paths
}

const computeAndValidateReleaseFilesPaths = async (itemDirPath: string, typeData: ItemTypeData): Promise<string[]> => {
  const versionsDirPath = path.resolve(itemDirPath, 'versions')

  let versionsDirent: Dirent[]
  try {
    versionsDirent = await fs.readdir(versionsDirPath, { withFileTypes: true })
  } catch (error) {
    throw (error as NodeJS.ErrnoException).code === 'ENOENT' ? new Error('Missing "versions" directory') : error
  }

  const paths: string[] = []

  let hasNa = false
  let hasSemver = false

  for (const versionDirent of versionsDirent) {
    if (!versionDirent.isFile) {
      throw new Error(`Found unexpected directory "versions/${versionDirent.name}"`)
    }

    const fileAbsPath = path.resolve(versionDirent.parentPath, versionDirent.name)
    const parsedFilename = path.parse(versionDirent.name)

    if (parsedFilename.ext !== '.json') {
      throw new Error(`Found unexpected non-json file "versions/${versionDirent.name}"`)
    }

    if (parsedFilename.name === NA_VERSION) {
      paths.push(fileAbsPath)
      hasNa = true
      continue
    }

    if (semver.valid(parsedFilename.name) === null) {
      throw new Error(`File "versions/${versionDirent.name}" has an unsupported name: must be a valid semver or "NA"`)
    }

    paths.push(fileAbsPath)
    hasSemver = true
  }

  if (paths.length === 0) {
    throw new Error(`Unexpected empty directory "versions"`)
  }

  const crd = catalogWellKnownItemsCustomResourceDefinitions[typeData.type]
  if (!crd) {
    throw new Error(`Could not find a Custom Resource Definition for the item's type "${typeData.type}"`)
  }

  if (!crd.isVersioningSupported && (hasSemver || !hasNa)) {
    throw new Error(`Items of type "${typeData.type}" must have only a single "NA.json" file`)
  }

  if (crd.isVersioningSupported && !hasSemver) {
    throw new Error(`Items of type "${typeData.type}" must have at least one versioned manifest`)
  }

  return paths
}

const validateManifest = (manifest: unknown, schema: JSONSchema): string[] | undefined => {
  const validate = ajv.compile(schema)

  const valid = validate(manifest)
  if (valid) { return }

  if (!validate.errors) {
    return ['Error validating manifest against schema: AJV did not return any error']
  }

  return validate.errors.map((error) => `Error validating manifest against schema: ${JSON.stringify(error)}`)
}

const assertValidImageFile = async (manifest: Manifest, manifestPath: string): Promise<string[] | undefined> => {
  const imageAbsPath = path.resolve(manifestPath, manifest.image.localPath)
  try {
    await fs.access(imageAbsPath)
  } catch {
    return [`Invalid "image" property: file does not exist`]
  }
}

const assertValidSupportedByImageFile = async (manifest: Manifest, manifestPath: string): Promise<string[] | undefined> => {
  const imageAbsPath = path.resolve(manifestPath, manifest.supportedByImage.localPath)
  try {
    await fs.access(imageAbsPath)
  } catch {
    return [`Invalid "supportedByImage" property: file does not exist`]
  }

  const filename = path.basename(imageAbsPath)
  const supporterImages = supporters.supporters.find(({ label }) => label === manifest.supportedBy)?.images ?? []

  if (!supporterImages.includes(filename)) {
    return [`Invalid "supportedByImage" property: expected one of [${supporterImages.join(', ')}], found "${filename}"`]
  }
}

const assertVersionValid = async (manifestPath: string, typeData: ItemTypeData): Promise<string[] | undefined> => {
  let manifest: Manifest
  try {
    const manifestModule = await import(manifestPath, { with: { type: 'json' } }) as { default: Manifest }
    manifest = manifestModule.default
  } catch (error) {
    return [`Could not load manifest${error instanceof Error ? `: ${error.message}` : ''}`]
  }

  const errors: string[] = []

  const validationErrors = validateManifest(manifest, typeData.schema)
  errors.push(...validationErrors ?? [])

  const itemFolderName = manifestPath.split('/').at(-3)
  if (manifest.itemId !== itemFolderName) {
    errors.push(`Property "itemId" has wrong value: expected "${itemFolderName}", found "${manifest.itemId}"`)
  }

  const filename = path.basename(manifestPath, '.json')

  if (filename === NA_VERSION) {
    if (manifest.version) {
      errors.push(`Manifests for "NA" versions must not have property "version"`)
    }

    if (manifest.releaseStage !== CatalogReleaseStage.DEPRECATED) {
      errors.push(`Manifests for "NA" versions must have "releaseStage" set to "deprecated"`)
    }
  }

  if (filename !== NA_VERSION && filename !== manifest.version?.name) {
    errors.push(`Property "version.name" must be equal to filename: expected "${filename}", found "${manifest.version?.name}"`)
  }

  const imageValidationErrors = await assertValidImageFile(manifest, manifestPath)
  errors.push(...imageValidationErrors ?? [])

  const supportedByImageValidationErrors = await assertValidSupportedByImageFile(manifest, manifestPath)
  errors.push(...supportedByImageValidationErrors ?? [])
}

const assertItemValid = async (itemDirPath: string): Promise<string[] | undefined> => {
  const typeDir = path.dirname(itemDirPath)

  let typeData: ItemTypeData
  try {
    const typeDataModule = await import(typeDir) as ItemTypeModule
    typeData = typeDataModule.default
  } catch (error) {
    return [`Could not load type-related data${error instanceof Error ? `: ${error.message}` : ''}`]
  }

  let manifestPaths: string[]
  try {
    manifestPaths = await computeAndValidateReleaseFilesPaths(itemDirPath, typeData)
  } catch (error) {
    return [error instanceof Error ? error.message : 'Could not retrieve manifests']
  }

  for (const manifestPath of manifestPaths) {
    logger.info(`Checking "${path.basename(manifestPath)}"...`)

    const errors = await assertVersionValid(manifestPath, typeData)
    if (errors?.length) {
      errors.forEach((error) => { logger.error(error) })
    }
  }
}

// TODO: check that services, endpoints, and collections have `name` equal to `key`
const main = async () => {
  const program = new Command()

  program.option('-i, --items <value...>', 'ids of the items to check')
  program.parse()

  const options = program.opts<{ items?: string[] }>()

  const paths = await computePathsToCheck(options.items)

  for (const itemDirPath of paths) {
    const itemId = itemDirPath.split('/').at(-1)
    logger.info(`Checking "${itemId}"`)
    // const spinner = logger.spin(`Checking "${itemId}"`)

    const errors = await assertItemValid(itemDirPath)
    if (errors?.length) {
      errors.forEach((error) => { logger.error(error) })
    }

    // if (!errors?.length) {
    //   spinner.succeed()
    // } else {
    //   spinner.fail()
    //   errors.forEach((error) => { logger.error(error) })
    // }

    logger.newLine()
  }
}

main()
  .catch((error) => logger.error(error instanceof Error ? error.message : 'Unexpected error checking items validity'))
