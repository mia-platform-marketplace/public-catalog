import fs from 'fs/promises'
import path from 'path'
import process from 'process'

import { build } from 'esbuild'
import { rimraf } from 'rimraf'

import logger from './logger'

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
