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

/* eslint-disable no-console */
import chalk from 'chalk'
import type { Ora } from 'ora'
import ora from 'ora'

export const indent = (spaces = 1) => new Array(spaces).fill(' ').join('')

const prefixesTexts = [
  `➤   debug${indent()}`,
  `➤   error${indent()}`,
  `➤    info${indent()}`,
  `➤ success${indent()}`,
  `➤    warn${indent()}`,
]

const prefixes = {
  debug: chalk.dim(prefixesTexts.at(0)),
  error: chalk.red(prefixesTexts.at(1)),
  info: chalk.blue(prefixesTexts.at(2)),
  success: chalk.green(prefixesTexts.at(3)),
  warn: chalk.yellow(prefixesTexts.at(4)),
}

const newLine = () => { console.log('\n') }

const info: typeof console.log = (...data) => { console.log(prefixes.info, ...data) }

const success: typeof console.log = (...data) => { console.log(prefixes.success, ...data) }

const warn: typeof console.log = (...data) => { console.log(prefixes.warn, ...data) }

const error: typeof console.log = (...data) => { console.log(prefixes.error, ...data) }

const spin = (msg: string): Ora => {
  const spinner = ora({
    hideCursor: false,
    prefixText: prefixes.info,
    text: msg,
  })

  return spinner.start()
}

export default {
  error,
  info,
  newLine,
  spin,
  success,
  warn,
}
