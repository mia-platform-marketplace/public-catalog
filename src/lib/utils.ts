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

import { CATALOG_ITEM_NA_VERSION, catalogItemLifecycleStatusEnum } from '@mia-platform/console-types'
import type { CatalogItemManifest } from '@mia-platform/console-types'
import semver from 'semver'

import { replaceMiaPlatformDockerImageHostCustom } from './override-items-fields'
import type { CustomFilters } from './types'

export const __STATE__ = 'PUBLIC'
export const CREATOR_ID = 'marketplace-sync'

const DEFAULT_HOST_DOCKER_IMAGE = 'nexus.mia-platform.eu'

const replaceMiaPlatformDockerImageHostSimple = (dockerImage: string, newHost: string | undefined): string => {
  if (newHost === undefined || newHost === '') {
    return dockerImage
  }
  const [host, ...restDockerImage] = dockerImage.split('/')

  return host === DEFAULT_HOST_DOCKER_IMAGE
    ? `${newHost}${restDockerImage.length > 0 ? `/${restDockerImage.join('/')}` : ''}`
    : dockerImage
}

export const replaceMiaPlatformDockerImageHost = (dockerImage: string, newHost: string | undefined, customFilters: CustomFilters | undefined): string => {
  if (customFilters) {
    return replaceMiaPlatformDockerImageHostCustom(dockerImage, customFilters)
  }
  return replaceMiaPlatformDockerImageHostSimple(dockerImage, newHost)
}

type Matcher = (item: CatalogItemManifest) => boolean

const findLatestVersionBySemVer = (releases: CatalogItemManifest[]): CatalogItemManifest | undefined => {
  let latestItem: CatalogItemManifest | undefined

  for (const release of releases) {
    const isVersionSemver = semver.valid(release.version?.name)
    const isVersionNa = release.version?.name === undefined

    if (!isVersionSemver && !isVersionNa) { continue }

    if (!latestItem || !semver.valid(latestItem.version?.name)) {
      latestItem = release
      continue
    }

    const isCurrVersionGreater = isVersionSemver && semver.gt(release.version!.name, latestItem.version!.name)
    if (isCurrVersionGreater) { latestItem = release }
  }

  return latestItem
}

const findLatestReleaseBySemVer = (releases: CatalogItemManifest[], matchers: { comingSoonMatcher: Matcher; releaseStageMatcher: Matcher }): CatalogItemManifest | undefined => {
  const filteredReleases = releases.filter(release => {
    if (!matchers.comingSoonMatcher(release)) { return false }

    if (!matchers.releaseStageMatcher(release)) { return false }

    return true
  })

  return findLatestVersionBySemVer(filteredReleases)
}

export const findLatestRelease = (releases: CatalogItemManifest[]): CatalogItemManifest | undefined => {
  if (releases.length === 0) { return undefined }

  const isReleaseStable = (release: CatalogItemManifest) => release.lifecycleStatus === catalogItemLifecycleStatusEnum.PUBLISHED
  const isReleaseComingSoon = (release: CatalogItemManifest) => release.lifecycleStatus === catalogItemLifecycleStatusEnum.COMING_SOON

  const latestStable = findLatestReleaseBySemVer(
    releases,
    {
      comingSoonMatcher: (item: CatalogItemManifest) => !isReleaseComingSoon(item),
      releaseStageMatcher: (item: CatalogItemManifest) => isReleaseStable(item),
    }
  )

  if (latestStable) { return latestStable }

  const latestUnstable = findLatestReleaseBySemVer(
    releases,
    {
      comingSoonMatcher: (item: CatalogItemManifest) => !isReleaseComingSoon(item),
      releaseStageMatcher: (item: CatalogItemManifest) => !isReleaseStable(item),
    }
  )

  if (latestUnstable) { return latestUnstable }

  const latestComingSoon = findLatestReleaseBySemVer(
    releases,
    {
      comingSoonMatcher: (item) => isReleaseComingSoon(item),
      releaseStageMatcher: () => true,
    }
  )

  if (latestComingSoon) { return latestComingSoon }
}


interface ItemWithTriple { itemId: string; tenantId: string; version?: { name: string } }
export type ItemTriple = { itemId: string; tenantId: string; version: string }
export const getItemTriple = (item: ItemWithTriple): ItemTriple => {
  return {
    itemId: item.itemId,
    tenantId: item.tenantId,
    version: item.version?.name ?? CATALOG_ITEM_NA_VERSION,
  }
}

export const findMatchByTriple = <I extends ItemWithTriple, L extends ItemWithTriple>(input: I, list: L[]): L | undefined => {
  return list.find(({ itemId, tenantId, version }) => Boolean(
    itemId === input.itemId
    && tenantId === input.tenantId
    && version?.name === input.version?.name
  ))
}
