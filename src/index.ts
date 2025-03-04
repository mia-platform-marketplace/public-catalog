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

import { MongoClient } from 'mongodb'
import pino from 'pino'

import { buildLoggerOpts } from './lib/logger'
import { parseArgs, parseEnv } from './lib/process'
import syncCategories from './lib/sync-categories'
import syncItems from './lib/sync-items'
import type { SyncCtx } from './lib/types'

const env = parseEnv()
const args = parseArgs()

const logger = pino(buildLoggerOpts(env.LOG_LEVEL, args.pretty))

const main = async () => {
  if (env.ITEM_TYPES_FILTER === '') {
    logger.info('Environment variable "ITEM_TYPES_FILTER" set to empty string: the script will not be executed')
    process.exit(0)
  }

  const mongoClient = new MongoClient(env.MONGODB_URL)
  await mongoClient.connect()

  const syncCtx: SyncCtx = { env, logger, mongoClient }

  await syncCategories(syncCtx)
  await syncItems(syncCtx)

  await mongoClient.close()
}

main().catch((err: Error) => {
  logger.error({ err }, 'Unexpected error executing the script')
  process.exit(1)
})
