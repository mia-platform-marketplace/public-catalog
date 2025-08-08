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

import type { LevelWithSilent, LoggerOptions } from 'pino'
import { stdSerializers } from 'pino'

export type LogLevel = LevelWithSilent

export const logLevels: LogLevel[] = ['debug', 'error', 'fatal', 'info', 'silent', 'trace', 'warn']
export const availableLogLevels = logLevels.map((next) => `[${next}]`).join(', ')

export const isLogLevel = (input: unknown): input is LogLevel => {
  return typeof input === 'string' && (logLevels as string[]).includes(input)
}

const redactionRules: LoggerOptions['redact'] = {
  censor: '[REDACTED]',
  paths: [
    'email', '[*].email',
    'password', '[*].password',
    'username', '[*].username',
    'authorization', 'Authorization', '[*].authorization', '[*].Authorization',
    'cookie', 'Cookie', '[*].cookie', '[*].Cookie',
  ],
}

export const buildLoggerOpts = (level: LogLevel, pretty = false): LoggerOptions => {
  return {
    level,
    redact: redactionRules,
    serializers: { error: stdSerializers.err },
    timestamp: () => `,"time":${Date.now()}`,
    transport: pretty ? { target: 'pino-pretty' } : undefined,
  }
}
