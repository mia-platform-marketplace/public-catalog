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

import { catalogWellKnownItemsCustomResourceDefinitions, NA_VERSION } from '@mia-platform/console-types'
import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import type { JSONSchema } from 'json-schema-to-ts'
import semver from 'semver'

import supporters from '../assets/supporters.json' with { type: 'json' }

import type { ItemTypeData, ItemTypeModule, Manifest } from './utils'
import { logger } from './utils'

const ajv = new Ajv({ addUsedSchema: false, allErrors: true })
addFormats(ajv)

const assertUniqueItemDirectories = async () => {
  const permittedFiles = ['index.ts', 'manifest.schema.json']

  const itemDirsSet = new Set<string>()

  const typeDirs = await fs.readdir(path.resolve(process.cwd(), 'items'), { withFileTypes: true })

  for (const typeDirent of typeDirs) {
    if (!typeDirent.isDirectory()) {
      throw new Error(`Fund unexpected file 'items/${typeDirent.name}'`)
    }

    const itemDirs = await fs.readdir(path.resolve(typeDirent.parentPath, typeDirent.name), { withFileTypes: true })
    for (const itemDirent of itemDirs) {
      if (!itemDirent.isDirectory()) {
        if (permittedFiles.includes(itemDirent.name)) { continue }
        throw new Error(`Fund unexpected file 'items/${typeDirent.name}/${itemDirent.name}'`)
      }

      if (itemDirsSet.has(itemDirent.name)) {
        throw new Error(`Item directory '${itemDirent.name}' found multiple times`)
      }

      itemDirsSet.add(itemDirent.name)
    }
  }
}

const computePathsToCheck = async (): Promise<string[]> => {
  const args = process.argv.slice(2)
  if (args.length === 0) { args.push('**') }

  const paths = new Set<string>()

  for (const arg of args) {
    let foundPath = false

    for await (const entry of fs.glob(`items/**/${arg}/**/versions`)) {
      foundPath = true
      const itemAbsPath = path.dirname(path.resolve(process.cwd(), entry))
      paths.add(itemAbsPath)
    }

    if (foundPath === false) { logger.warn(`No matching items found for arg '${arg}'`) }
  }

  return Array.from(paths)
}

const getItemFilesPaths = async (itemDirPath: string, typeData: ItemTypeData): Promise<string[]> => {
  const versionsDirPath = path.resolve(itemDirPath, 'versions')

  let versionsDirent: Dirent[]
  try {
    versionsDirent = await fs.readdir(versionsDirPath, { withFileTypes: true })
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error('Missing "versions" directory')
    }

    throw err
  }

  const paths: string[] = []

  let hasNa = false
  let hasSemver = false

  for (const versionDirent of versionsDirent) {
    if (!versionDirent.isFile) {
      throw new Error(`Found unexpected directory 'versions/${versionDirent.name}'`)
    }

    const fileAbsPath = path.resolve(versionDirent.parentPath, versionDirent.name)
    const parsedFilename = path.parse(versionDirent.name)

    if (parsedFilename.ext !== '.json') {
      throw new Error(`Found unexpected non-json file 'versions/${versionDirent.name}'`)
    }

    if (parsedFilename.name === NA_VERSION) {
      paths.push(fileAbsPath)
      hasNa = true
      continue
    }

    if (semver.valid(parsedFilename.name) === null) {
      throw new Error(`File 'versions/${versionDirent.name}' has an unsupported name: must be a valid semver or 'NA'`)
    }

    paths.push(fileAbsPath)
    hasSemver = true
  }

  if (paths.length === 0) {
    throw new Error(`Directory 'versions' is empty`)
  }

  const crd = catalogWellKnownItemsCustomResourceDefinitions[typeData.type]
  if (!crd) {
    throw new Error(`Could not found a Custom Resource Definition for the item's type '${typeData.type}'`)
  }

  if (!crd.isVersioningSupported && (hasSemver || !hasNa)) {
    throw new Error(`Items of type '${typeData.type}' must have only a single 'NA.json' file`)
  }

  if (crd.isVersioningSupported && !hasSemver) {
    throw new Error(`Items of type '${typeData.type}' must have at least one semver version file`)
  }

  return paths
}

// eslint-disable-next-line func-style
function assertManifestCompliant(manifest: unknown, schema: JSONSchema): asserts manifest is Manifest {
  const validate = ajv.compile(schema)

  const valid = validate(manifest)
  if (valid) { return }

  if (!validate.errors) {
    throw new Error('Error validating manifest against schema: AJV did not return any error')
  }

  validate.errors.forEach((error) => logger.error(`Error validating manifest against schema: ${JSON.stringify(error)}`))
  throw new Error('Manifest not valid')
}

const assertValidImageFile = async (manifest: Manifest, manifestPath: string) => {
  const imageAbsPath = path.resolve(manifestPath, manifest.image.localPath)
  try {
    await fs.access(imageAbsPath)
  } catch {
    throw new Error(`Invalid 'image' property: file does not exist`)
  }
}

const assertValidSupportedByImageFile = async (manifest: Manifest, manifestPath: string) => {
  const imageAbsPath = path.resolve(manifestPath, manifest.supportedByImage.localPath)
  try {
    await fs.access(imageAbsPath)
  } catch {
    throw new Error(`Invalid 'supportedByImage' property: file does not exist`)
  }

  const filename = path.basename(imageAbsPath)
  const supporterImages = supporters.supporters.find(({ label }) => label === manifest.supportedBy)?.images ?? []

  if (!supporterImages.includes(filename)) {
    throw new Error(`Invalid 'supportedByImage' property: expected one of [${supporterImages.join(', ')}], found '${filename}'`)
  }
}

const assertVersionValid = async (manifestPath: string, typeData: ItemTypeData) => {
  const manifestModule = await import(manifestPath, { with: { type: 'json' } }) as { default: unknown }
  const manifest = manifestModule.default

  assertManifestCompliant(manifest, typeData.schema)

  const itemFolderName = manifestPath.split('/').at(-3)
  if (manifest.itemId !== itemFolderName) {
    throw new Error(`Property 'itemId' has wrong value: expected '${itemFolderName}', found '${manifest.itemId}'`)
  }

  const filename = path.basename(manifestPath, '.json')
  if (filename === NA_VERSION && manifest.version) {
    throw new Error(`Manifests for 'NA' versions must not have property 'version'`)
  }

  if (filename !== NA_VERSION && filename !== manifest.version?.name) {
    throw new Error(`Property 'version.name' must be equal to filename: expected '${filename}', found '${manifest.version?.name}'`)
  }

  await assertValidImageFile(manifest, manifestPath)
  await assertValidSupportedByImageFile(manifest, manifestPath)
}

const assertItemValid = async (itemDirPath: string) => {
  const itemId = itemDirPath.split('/').at(-1)
  logger.info(`Checking '${itemId}'...`)

  try {
    const typeDir = path.dirname(itemDirPath)
    const typeDataModule = await import(typeDir) as ItemTypeModule
    const typeData = typeDataModule.default

    const manifestPaths = await getItemFilesPaths(itemDirPath, typeData)

    for (const manifestPath of manifestPaths) {
      logger.info(`Checking ${path.basename(manifestPath)}...`)

      try {
        await assertVersionValid(manifestPath, typeData)
      } catch (err) {
        logger.error({ err }, err instanceof Error ? err.message : 'Unexpected error checking item version validity')
      }
    }
  } catch (err) {
    logger.error({ err }, err instanceof Error ? err.message : 'Unexpected error checking item validity')
  }
}

const main = async () => {
  await assertUniqueItemDirectories()

  const paths = await computePathsToCheck()

  for (const itemDirPath of paths) {
    await assertItemValid(itemDirPath)
  }
}

main()
  .catch((error) => logger.error(error instanceof Error ? error.message : 'Unexpected error checking items validity'))
