import { catalogApplication, catalogExample, catalogInfrastructureResource, catalogPlugin, catalogProxy, catalogSidecar, catalogTemplate } from '@mia-platform/console-types'
import envSchema from 'env-schema'
import type { FromSchema, JSONSchema } from 'json-schema-to-ts'

import { logLevels } from './logger'

const defaultItemTypesFilter = [
  catalogApplication.type,
  catalogExample.type,
  catalogInfrastructureResource.type,
  catalogPlugin.type,
  catalogProxy.type,
  catalogSidecar.type,
  catalogTemplate.type,
]

const schema = {
  properties: {
    CATEGORIES_COLLECTION_NAME: { type: 'string' },
    DOCKER_IMAGE_REGISTRY_TO_SET: { type: 'string' },
    FILES_COLLECTION_NAME: { type: 'string' },
    FILES_SERVICE_URL: { type: 'string' },
    ITEMS_COLLECTION_NAME: { type: 'string' },
    ITEM_TYPES_FILTER: { default: defaultItemTypesFilter.join(','), type: 'string' },
    LOG_LEVEL: { default: 'info', enum: logLevels, type: 'string' },
    MONGODB_URL: { type: 'string' },
    TENANT_ID_TO_SET: { type: 'string' },
  },
  required: [
    'CATEGORIES_COLLECTION_NAME',
    'FILES_COLLECTION_NAME',
    'FILES_SERVICE_URL',
    'ITEMS_COLLECTION_NAME',
    'LOG_LEVEL',
    'MONGODB_URL',
    'TENANT_ID_TO_SET',
  ],
  type: 'object',
} as const satisfies JSONSchema

export type Env = FromSchema<typeof schema>

export const parseEnv = (): Env => {
  return envSchema({ dotenv: true, schema })
}

export type Args = { pretty?: boolean }

export const parseArgs = (): Args => {
  const args = process.argv.slice(2)

  return {
    pretty: args.includes('--pretty'),
  }
}
