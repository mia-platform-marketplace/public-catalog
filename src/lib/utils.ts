import { CatalogReleaseStage, NA_VERSION, type CatalogItemManifest } from '@mia-platform/console-types'
import semver from 'semver'

export const __STATE__ = 'PUBLIC'
export const CREATOR_ID = 'marketplace-sync'

const DEFAULT_HOST_DOCKER_IMAGE = 'nexus.mia-platform.eu'
export const replaceMiaPlatformDockerImageHost = (dockerImage: string, newHost: string): string => {
  const [host, ...restDockerImage] = dockerImage.split('/')

  return host === DEFAULT_HOST_DOCKER_IMAGE
    ? `${newHost}${restDockerImage.length > 0 ? `/${restDockerImage.join('/')}` : ''}`
    : dockerImage
}


type Matcher = (item: CatalogItemManifest) => boolean

const findLatestVersionBySemVer = (releases: CatalogItemManifest[]): CatalogItemManifest | undefined => {
  let latestItem: CatalogItemManifest | undefined

  for (const release of releases) {
    const isVersionSemver = semver.valid(release.version?.name)
    const isVersionNa = release.version?.name.toUpperCase() === NA_VERSION

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

  const isReleaseStable = (release: CatalogItemManifest) => (!release.releaseStage || release.releaseStage === CatalogReleaseStage.STABLE)
  const isReleaseComingSoon = (release: CatalogItemManifest) => Boolean(release.comingSoon)

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

export const getItemTriple = (item: ItemWithTriple): { itemId: string; tenantId: string; version: string } => {
  return {
    itemId: item.itemId,
    tenantId: item.tenantId,
    version: item.version?.name ?? NA_VERSION,
  }
}

export const findMatchByTriple = <I extends ItemWithTriple, L extends ItemWithTriple>(input: I, list: L[]): L | undefined => {
  return list.find(({ itemId, tenantId, version }) => Boolean(
    itemId === input.itemId
    && tenantId === input.tenantId
    && version?.name === input.version?.name
  ))
}
