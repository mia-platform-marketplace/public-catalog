import type { LevelWithSilent, LoggerOptions, redactOptions } from 'pino'
import { stdSerializers } from 'pino'

export type LogLevel = LevelWithSilent

export const logLevels: LogLevel[] = ['debug', 'error', 'fatal', 'info', 'silent', 'trace', 'warn']
export const availableLogLevels = logLevels.map((next) => `[${next}]`).join(', ')

export const isLogLevel = (input: unknown): input is LogLevel => {
  return typeof input === 'string' && (logLevels as string[]).includes(input)
}

const redactionRules: redactOptions = {
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
