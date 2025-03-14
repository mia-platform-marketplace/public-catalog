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

import type { CatalogItemManifest } from '@mia-platform/console-types'
import type { MongoClient } from 'mongodb'
import type { Logger } from 'pino'

import type Metrics from './metrics'
import type { Env } from './process'

export type SyncCtx = {
  env: Env
  logger: Logger
  metrics: Metrics
  mongoClient: MongoClient
}


export type Manifest = Omit<CatalogItemManifest, 'imageUrl' | 'supportedByImageUrl'> & {
  image: { localPath: string }
  supportedByImage: { localPath: string }
}

export type ManifestWithFileData = Manifest & { image?: DbItemFileData[]; supportedByImage?: DbItemFileData[] }

export type ReleaseData = { manifest: Manifest; manifestAbsPath: string }


export type DbItemFileData = {
  __STATE__: 'PUBLIC' | 'DRAFT' | 'TRASH' | 'DELETED'
  createdAt: Date
  creatorId: string
  file: string
  id: string
  location: string
  name: string
  size: number
  updatedAt?: Date
  updaterId?: string
}

export type DbItem = Omit<CatalogItemManifest, 'image' | 'supportedByImage'> & {
  __STATE__: 'PUBLIC' | 'DRAFT' | 'TRASH' | 'DELETED'
  createdAt: Date
  creatorId: string
  image?: DbItemFileData[]
  isLatest?: boolean
  supportedByImage?: DbItemFileData[]
}


export type DbFile = {
  __STATE__: 'PUBLIC' | 'DRAFT' | 'TRASH' | 'DELETED'
  createdAt: Date
  creatorId: string
  file: string
  location: string
  name: string
  size: number
  updatedAt: Date
  updaterId: string
}
