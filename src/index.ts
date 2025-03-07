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

import pino from 'pino'

import main from './lib'
import { buildLoggerOpts } from './lib/logger'
import { parseArgs, parseEnv } from './lib/process'

const env = parseEnv()
const args = parseArgs()

const logger = pino(buildLoggerOpts(env.LOG_LEVEL, args.pretty))

main(env, logger)
  .then((metrics) => logger.info({ ...metrics }, 'Finished sync script'))
  .catch((err: Error) => {
    logger.error({ err }, 'Unexpected error executing the script')
    process.exit(1)
  })
