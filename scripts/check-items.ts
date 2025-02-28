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
import chalk from 'chalk'
import { Command } from 'commander'
import type { JSONSchema } from 'json-schema-to-ts'
import type { ListrError, ListrTaskWrapper } from 'listr2'
import { Listr } from 'listr2'
import semver from 'semver'

import supporters from '../assets/supporters.json' with { type: 'json' }

import logger from './logger'
import type { ItemTypeData, ItemTypeModule, Manifest } from './utils'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Task = ListrTaskWrapper<any, any, any>

const ajv = new Ajv({ addUsedSchema: false, allErrors: true })
addFormats(ajv)

class CheckError extends Error {
  private readonly _taskErrors: ListrError[]

  constructor(message: string, taskErrors: ListrError[]) {
    super(message)

    this._taskErrors = taskErrors
  }

  get taskErrors() { return this._taskErrors }
}


/** @throws Error */
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

/** @throws Error */
const validateManifest = (task: Task, manifest: unknown, schema: JSONSchema) => {
  const validate = ajv.compile(schema)

  const valid = validate(manifest)
  if (valid) { return }

  validate.errors?.forEach((error) => { task.output = JSON.stringify(error) })

  throw new Error(`Error validating manifest against schema`)
}

/** @throws Error */
const assertValidImageFile = async (manifest: Manifest, manifestPath: string) => {
  const imageAbsPath = path.resolve(manifestPath, manifest.image.localPath)
  try {
    await fs.access(imageAbsPath)
  } catch {
    throw new Error(`Invalid "image" property: file does not exist`)
  }
}

/** @throws Error */
const assertValidSupportedByImageFile = async (manifest: Manifest, manifestPath: string) => {
  const imageAbsPath = path.resolve(manifestPath, manifest.supportedByImage.localPath)
  try {
    await fs.access(imageAbsPath)
  } catch {
    throw new Error(`Invalid "supportedByImage" property: file does not exist`)
  }

  const filename = path.basename(imageAbsPath)
  const supporterImages = supporters.supporters.find(({ label }) => label === manifest.supportedBy)?.images ?? []

  if (!supporterImages.includes(filename)) {
    throw new Error(`Invalid "supportedByImage" property: expected one of [${supporterImages.join(', ')}], found "${filename}"`)
  }
}

/** @throws Error */
const assertVersionValid = async (task: Task, manifestPath: string, typeData: ItemTypeData) => {
  const manifestModule = await import(manifestPath, { with: { type: 'json' } }) as { default: Manifest }
  const manifest = manifestModule.default

  validateManifest(task, manifest, typeData.schema)

  const itemFolderName = manifestPath.split('/').at(-3)
  if (manifest.itemId !== itemFolderName) {
    throw new Error(`Property "itemId" has wrong value: expected "${itemFolderName}", found "${manifest.itemId}"`)
  }

  const filename = path.basename(manifestPath, '.json')

  if (filename === NA_VERSION) {
    if (manifest.version) {
      throw new Error(`Manifests for "NA" versions must not have property "version"`)
    }

    if (typeData.crd.isVersioningSupported && manifest.releaseStage !== CatalogReleaseStage.DEPRECATED) {
      throw new Error(`Manifests for "NA" versions must have "releaseStage" set to "deprecated"`)
    }
  }

  if (filename !== NA_VERSION && filename !== manifest.version?.name) {
    throw new Error(`Property "version.name" must be equal to filename: expected "${filename}", found "${manifest.version?.name}"`)
  }

  await assertValidImageFile(manifest, manifestPath)
  await assertValidSupportedByImageFile(manifest, manifestPath)
}

/** @throws Error */
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

  if (!typeData.crd.isVersioningSupported && (hasSemver || !hasNa)) {
    throw new Error(`Items of type "${typeData.type}" must have only a single "NA.json" file`)
  }

  if (typeData.crd.isVersioningSupported && !hasSemver) {
    throw new Error(`Items of type "${typeData.type}" must have at least one versioned manifest`)
  }

  return paths
}

/** @throws Error */
const assertItemValid = async (task: Task, itemDirPath: string): Promise<Listr> => {
  const typeDir = path.dirname(itemDirPath)
  const typeDataModule = await import(typeDir) as ItemTypeModule

  const crd = catalogWellKnownItemsCustomResourceDefinitions[typeDataModule.default.type]
  if (!crd) {
    throw new Error(`Could not find a Custom Resource Definition for the item's type "${typeDataModule.default.type}"`)
  }

  const typeData = { ...typeDataModule.default, crd }

  const manifestPaths = await computeAndValidateReleaseFilesPaths(itemDirPath, typeData)

  const subTask = task.newListr([])

  for (const manifestPath of manifestPaths) {
    const versionName = path.basename(manifestPath, '.json')

    subTask.add({
      rendererOptions: { outputBar: Infinity, persistentOutput: true },
      task: async (_, task) => { await assertVersionValid(task, manifestPath, typeData) },
      title: `Checking version "${chalk.bold(versionName)}"`,
    })
  }

  return subTask
}

// TODO: check that services, endpoints, and collections have `name` equal to `key`
/**
 * @throws CheckError
 * @throws Error
 */
const main = async () => {
  const program = new Command()

  program.option('-i, --items <value...>', 'ids of the items to check')
  program.parse()

  const options = program.opts<{ items?: string[] }>()

  const paths = await computePathsToCheck(options.items)

  const tasks = new Listr([], {
    collectErrors: 'minimal',
    concurrent: false,
    exitOnError: false,
    rendererOptions: { collapseErrors: false, collapseSubtasks: false, showSubtasks: true },
  })

  for (const itemDirPath of paths) {
    const itemId = itemDirPath.split('/').at(-1)
    const itemType = itemDirPath.split('/').at(-2)

    tasks.add({
      task: async (_, task) => assertItemValid(task, itemDirPath),
      title: `Checking item "${chalk.bold(`${itemType}/${itemId}`)}"`,
    })
  }

  await tasks.run()

  if (tasks.errors.length > 0) {
    throw new CheckError('Some checks were not successful', tasks.errors)
  }
}

main()
  .then(() => {
    logger.log('\n')
    logger.success('No problems found in checked items')
    process.exit(0)
  })
  .catch((error) => {
    logger.log('\n')

    if (error instanceof CheckError) {
      logger.error('Some checks were not successful, here\'s a list of encountered errors:')

      error.taskErrors.forEach(({ error, path: taskPaths }) => {
        const logLines = [...taskPaths, error.message]

        logLines.forEach((logLine, idx) => {
          const indent = new Array(idx + 1).fill('   ').join('')
          logger.error(`${indent}${logLine}`)
        })
      })
    } else {
      logger.error('Unexpected error checking items validity')
    }

    process.exit(1)
  })
