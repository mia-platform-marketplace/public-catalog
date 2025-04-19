import { btoa } from 'node:buffer'

import type { ICatalogApplication } from '@mia-platform/console-types'
import { catalogWellKnownItems } from '@mia-platform/console-types'
import { JSONPath } from 'jsonpath-plus'

import type { Manifest } from './utils'

export const NEXUS_REGISTRY_HOSTNAME = 'nexus.mia-platform.eu'


const foundImages = new Set<string>()
const notFoundImages = new Map<string, number>()


type ParsedDockerImage = { image: string; path: string; version: string }

const expandDockerImage = (image: string, manifest: Manifest): ParsedDockerImage[] => {
  const imageWithoutHost = image.replace(`${NEXUS_REGISTRY_HOSTNAME}/`, '')

  const [path = '', version = 'latest'] = imageWithoutHost.split(':')

  const result: ParsedDockerImage = {
    image: `${NEXUS_REGISTRY_HOSTNAME}/${path}:${version}`,
    path,
    version,
  }

  const interpolatedVersionMatch = image.match(/{{(.*?)}}/)
  const versionPublicVariable = interpolatedVersionMatch?.at(1)

  if (!versionPublicVariable) { return [result] }

  if (manifest.type !== catalogWellKnownItems['application'].type) { return [result] }

  const resources = manifest.resources as ICatalogApplication.Resources

  const publicVariable = resources.unsecretedVariables?.[versionPublicVariable]
  if (!publicVariable) { return [result] }

  return [
    {
      image: image.replace(`{{${versionPublicVariable}}}`, publicVariable.noProductionEnv),
      path,
      version: publicVariable.noProductionEnv,
    },
    {
      image: image.replace(`{{${versionPublicVariable}}}`, publicVariable.productionEnv),
      path,
      version: publicVariable.productionEnv,
    },
  ]
}

/** @throws Error */
const assertImageExistsOnRegistry = async ({ path, image, version }: ParsedDockerImage, nexusBasicAuth: string) => {
  if (foundImages.has(image)) { return }

  if (notFoundImages.has(image)) {
    throw new Error(`Docker image "${image}" not found on Nexus registry: API responded with a ${notFoundImages.get(image)} status code`)
  }

  const res = await fetch(
    `https://nexus.mia-platform.eu/v2/${path}/manifests/${version}`,
    { headers: { Authorization: `Basic ${btoa(nexusBasicAuth)}` } }
  )

  if (!res.ok) {
    notFoundImages.set(image, res.status)
    throw new Error(`Docker image "${image}" not found on Nexus registry: API responded with a ${res.status} status code`)
  }

  foundImages.add(image)
}

/** @throws Error */
export const assertValidDockerImage = async (manifest: Manifest, nexusBasicAuth: string) => {
  type Data = { pointer: string; value: string }

  const dockerImagesData = JSONPath<Data[]>({ json: manifest, path: '$..dockerImage', resultType: 'all' })
  if (dockerImagesData.length === 0) { return }

  for (const data of dockerImagesData) {
    if (!data.value.startsWith(NEXUS_REGISTRY_HOSTNAME)) {
      continue
      // throw new Error(`Invalid Docker image at "${data.pointer}": registry must be "nexus.mia-platform.eu"`)
    }

    const resolvedDockerImages = expandDockerImage(data.value, manifest)
    for (const resolvedDockerImage of resolvedDockerImages) {
      await assertImageExistsOnRegistry(resolvedDockerImage, nexusBasicAuth)
    }
  }
}
