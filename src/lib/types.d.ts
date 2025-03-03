import type { CatalogItemManifest } from '@mia-platform/console-types'
import type { MongoClient } from 'mongodb'
import type { Logger } from 'pino'

import type { Env } from './process'

export type SyncCtx = {
  env: Env
  logger: Logger
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
  updatedAt?:Date
  updaterId?: string
}
