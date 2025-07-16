/**
 * Copyright 2025 Mia srl
 *
 * Licensed under the Apache License, Version 2.0 (the 'License')
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import Ajv from 'ajv'

import jsonSchema from '../filters.schema.json' with { type: 'json' }

import type { CustomFilters, SyncCtx } from './types'

const ajv = new Ajv()

const validateJsonWithSchema = (filters: CustomFilters, jsonSchema: object) => {
  const validate = ajv.compile(jsonSchema)
  const valid = validate(filters)
  if (valid) {
    return { valid: true }
  }
  return { errors: validate.errors, valid: false }
}

export const getCustomFilters = async (ctx: SyncCtx): Promise<CustomFilters | undefined> => {
  if (!ctx.env.CONFIG_MAP_ABSOLUTE_PATH || ctx.env.CONFIG_MAP_ABSOLUTE_PATH === '') {
    ctx.logger.info('Environment variable "CONFIG_MAP_ABSOLUTE_PATH" is not set or empty, skipping loading custom filters')
    return undefined
  }

  // Load the custom filters from the JSON file
  ctx.logger.info(`Loading custom filters from: ${ctx.env.CONFIG_MAP_ABSOLUTE_PATH}`)
  try {
    const importedJsonFilters = await import(ctx.env.CONFIG_MAP_ABSOLUTE_PATH, { with: { type: 'json' } }) as { default: CustomFilters }
    const customFilters = importedJsonFilters.default
    const validationResult = validateJsonWithSchema(customFilters, jsonSchema)
    if (!validationResult.valid) {
      ctx.logger.error(`Custom filters validation failed: ${JSON.stringify(validationResult.errors)}`)
      return undefined
    }
    return customFilters
  } catch (error) {
    ctx.logger.error(`Error loading custom filters from ${ctx.env.CONFIG_MAP_ABSOLUTE_PATH}: ${error instanceof Error ? error.message : String(error)}`)
    return undefined
  }
}

// Replace Mia Platform Docker image host using custom filters
export const replaceMiaPlatformDockerImageHostCustom = (dockerImage: string, customFilters: CustomFilters) => {
  // Return unchanged if undefined or not a string
  if (!dockerImage || typeof dockerImage !== 'string') {
    return dockerImage
  }

  // Check which filter matches this dockerImage
  for (const filter of customFilters.dockerImageFilterList) {
    const regex = new RegExp(filter.filter)
    if (regex.test(dockerImage)) {
      // Apply the replacement found and return
      return dockerImage.replace(regex, filter.replace)
    }
  }

  // No filter matched, return original
  return dockerImage
}
