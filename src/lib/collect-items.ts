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

import type { ICatalogPlugin } from '@mia-platform/console-types'
import { get, set, unset } from 'lodash-es'
import YAML from 'yaml'

import type { ReleaseData, Manifest, SyncCtx } from './types'
import { findLatestRelease, replaceMiaPlatformDockerImageHost } from './utils'

const itemsDirPath = path.resolve(process.cwd(), 'items')

const setTenantId = (ctx: SyncCtx, manifest: Manifest) => { manifest.tenantId = ctx.env.TENANT_ID_TO_SET }

const setContainerRegistry = (ctx: SyncCtx, manifest: Manifest) => {
  if (!ctx.env.DOCKER_IMAGE_REGISTRY_TO_SET) { return }

  type Services = Record<string, ICatalogPlugin.Service> | undefined

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

const setIsLatest = (manifests: Manifest[]) => {
  // This is needed to unset "isLatest" to all but the latest release
  manifests.forEach((manifest) => { set(manifest, 'isLatest', null) })

  const latestManifest = findLatestRelease(manifests)

  if (latestManifest) {
    set(latestManifest, 'isLatest', true)
  }
}

const collectItems = async (ctx: SyncCtx, itemTypesToCollect: string[]): Promise<ReleaseData[]> => {
  const manifests: ReleaseData[] = []

  for (const itemType of itemTypesToCollect) {
    ctx.logger.debug(`Collecting manifests for items of type "${itemType}"`)

    const itemsManifests: ReleaseData[] = []

    const itemTypeDirPath = path.resolve(itemsDirPath, itemType)

    try {
      await fs.access(itemTypeDirPath)
    } catch {
      ctx.logger.info(`Could not find directory for type "${itemType}" specified in environment variable "ITEM_TYPES_FILTER": assuming there are not items of this type and skipping`)
      continue
    }

    const itemDirent = await fs.readdir(itemTypeDirPath, { withFileTypes: true })
    const itemDirs = itemDirent.filter((dirent) => dirent.isDirectory())
    ctx.logger.debug(`Found ${itemDirs.length} items of type "${itemType}"`)

    for (const itemDirent of itemDirs) {
      ctx.logger.debug(`Collecting manifests for item "${itemDirent.name}"`)

      const itemDirPath = path.resolve(itemDirent.parentPath, itemDirent.name)
      const manifestPaths = fs.glob(`${itemDirPath}/versions/*.{json,yaml,yml}`)

      const releasesManifests: ReleaseData[] = []

      for await (const manifestPath of manifestPaths) {
        const { ext: fileExtension } = path.parse(path.basename(manifestPath))
        const manifestRaw = await fs.readFile(manifestPath, 'utf-8')
        const manifest = fileExtension === '.json' ? JSON.parse(manifestRaw) as Manifest : YAML.parse(manifestRaw) as Manifest

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
