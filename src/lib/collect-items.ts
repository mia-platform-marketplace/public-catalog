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

import fs from 'node:fs/promises'
import path from 'node:path'

import type { CatalogPlugin } from '@mia-platform/console-types'
import { get, set, unset } from 'lodash-es'

import type { ReleaseData, Manifest, SyncCtx } from './types'
import { findLatestRelease, replaceMiaPlatformDockerImageHost } from './utils'

const itemsDirPath = path.resolve(process.cwd(), 'items')

const buildItemTypeToDirPathMap = async (ctx: SyncCtx): Promise<Map<string, string>> => {
  const map = new Map<string, string>()

  const itemTypesDirent = await fs.readdir(itemsDirPath, { withFileTypes: true })

  for (const itemTypeDirent of itemTypesDirent) {
    if (!itemTypeDirent.isDirectory()) { continue }

    const itemTypeDirPath = path.resolve(itemTypeDirent.parentPath, itemTypeDirent.name)

    try {
      const itemTypeModule = await import(`${itemTypeDirPath}/index.ts`) as { default: { type: string }}
      map.set(itemTypeModule.default.type, itemTypeDirPath)
    } catch (err) {
      ctx.logger.error({ err }, `Could not load module "index.ts" for item type directory ${itemTypeDirent.name}: skipping directory`)
      continue
    }
  }

  return map
}

const setTenantId = (ctx: SyncCtx, manifest: Manifest) => { manifest.tenantId = ctx.env.TENANT_ID_TO_SET }

const setContainerRegistry = (ctx: SyncCtx, manifest: Manifest) => {
  if (!ctx.env.DOCKER_IMAGE_REGISTRY_TO_SET) { return }

  type Services = Record<string, CatalogPlugin> | undefined

  const services = get(manifest, ['resources', 'services']) as Services

  for (const service of Object.values(services ?? {})) {
    if (service.dockerImage) {
      service.dockerImage = replaceMiaPlatformDockerImageHost(
        service.dockerImage,
        ctx.env.DOCKER_IMAGE_REGISTRY_TO_SET
      )
    }

    for (const additionalContainer of Object.values(service.additionalContainers ?? {})) {
      if (additionalContainer.dockerImage) {
        additionalContainer.dockerImage = replaceMiaPlatformDockerImageHost(
          additionalContainer.dockerImage,
          ctx.env.DOCKER_IMAGE_REGISTRY_TO_SET
        )
      }
    }
  }
}

// TODO: fix latest
const setIsLatest = (manifests: Manifest[]) => {
  const latestManifest = findLatestRelease(manifests)

  if (latestManifest) {
    set(latestManifest, 'isLatest', true)
  }
}

const collectItems = async (ctx: SyncCtx, itemTypesToCollect: string[]): Promise<ReleaseData[]> => {
  const itemTypeToDirPathMap = await buildItemTypeToDirPathMap(ctx)

  const manifests: ReleaseData[] = []

  for (const itemType of itemTypesToCollect) {
    if (itemType !== 'application') { continue }

    ctx.logger.debug(`Collecting manifests for items of type "${itemType}"`)

    const itemsManifests: ReleaseData[] = []

    const itemTypeDirPath = itemTypeToDirPathMap.get(itemType)
    if (!itemTypeDirPath) {
      ctx.logger.info(`Could not find directory for type "${itemType}" specified in environment variable "ITEM_TYPES_FILTER": assuming there are not items of this type and skipping`)
      continue
    }

    const itemDirent = await fs.readdir(itemTypeDirPath, { withFileTypes: true })
    const itemDirs = itemDirent.filter((dirent) => dirent.isDirectory())
    ctx.logger.debug(`Found ${itemDirs.length} items of type "${itemType}"`)

    for (const itemDirent of itemDirs) {
      if (itemDirent.name !== 'microfrontend-composer-toolkit') { continue }

      ctx.logger.debug(`Collecting manifests for item "${itemDirent.name}"`)

      const itemDirPath = path.resolve(itemDirent.parentPath, itemDirent.name)
      const manifestPaths = fs.glob(`${itemDirPath}/versions/*.json`)

      const releasesManifests: ReleaseData[] = []

      for await (const manifestPath of manifestPaths) {
        const { default: manifest } = await import(manifestPath, { with: { type: 'json' } }) as { default: Manifest }

        unset(manifest, '$schema')
        setTenantId(ctx, manifest)
        setContainerRegistry(ctx, manifest)

        // TODO: transform container ports?

        releasesManifests.push({ manifest, manifestAbsPath: manifestPath })
      }

      setIsLatest(releasesManifests.map(({ manifest }) => manifest))

      ctx.logger.debug(`Collected ${releasesManifests.length} manifests for item "${itemDirent.name}"`)

      itemsManifests.push(...releasesManifests)
    }

    ctx.logger.debug(`Collected ${itemsManifests.length} manifests for type "${itemType}"`)

    manifests.push(...itemsManifests)
  }

  ctx.logger.debug(`Collected a total of ${manifests.length} manifests`)

  return manifests
}

export default collectItems
