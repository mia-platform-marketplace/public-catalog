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
