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

import fs from 'fs/promises'
import path from 'path'
import process from 'process'

import { build } from 'esbuild'
import { rimraf } from 'rimraf'

import logger from './lib/logger'

const outDir = path.resolve(process.cwd(), 'build')

const main = async () => {
  await rimraf(path.resolve(outDir))
  await fs.mkdir(outDir)

  await build({
    bundle: true,
    entryPoints: ['src/index.ts'],
    minify: true,
    outfile: path.resolve(outDir, 'index.cjs'),
    platform: 'node',
    sourcemap: true,
    target: ['node23'],
  })
}

main()
  .then(() => logger.success('Script built correctly'))
  .catch((...args) => logger.error('Error compiling script', ...args))
