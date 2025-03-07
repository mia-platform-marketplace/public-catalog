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

import fs from 'node:fs'
import path from 'node:path'
import { blob } from 'node:stream/consumers'

import type { Collection, Filter, FindOneAndUpdateOptions, UpdateFilter, WithId } from 'mongodb'

import type { DbFile, DbItemFileData, Manifest, SyncCtx } from './types'
import { __STATE__, CREATOR_ID } from './utils'

export type FilesServiceResponse = {
  file: string
  location: string
  name: string
  size: number
}

const uploadToFileService = async (ctx: SyncCtx, imagePath: string): Promise<FilesServiceResponse> => {
  ctx.logger.debug('Uploading image on Files Service')

  const imageName = path.basename(imagePath)
  const imageBlob = await blob(fs.createReadStream(imagePath)) as Blob

  const formdata = new FormData()
  formdata.append('file', imageBlob, imageName)

  const res = await globalThis.fetch(ctx.env.FILES_SERVICE_URL, { body: formdata, method: 'POST' })
  if (!res.ok) {
    throw new Error(`Files Service responded with a ${res.status} status code`)
  }

  const payload = await res.json() as FilesServiceResponse
  ctx.logger.debug({ payload }, 'Image successfully uploaded on Files Service')

  return payload
}

const patchFilesCollection = async (ctx: SyncCtx, collection: Collection<DbFile>, data: FilesServiceResponse): Promise<WithId<DbFile>> => {
  const fileData: DbFile = {
    __STATE__,
    createdAt: new Date(),
    creatorId: CREATOR_ID,
    file: data.file,
    location: data.location,
    name: data.name,
    size: data.size,
  }

  const filter: Filter<DbFile> = { name: data.name }
  const payload: UpdateFilter<DbFile> = { $set: fileData }
  const options: FindOneAndUpdateOptions = { upsert: true }

  ctx.logger.debug({ filter, options, payload }, 'Patching files collection')

  const result = await collection.findOneAndUpdate(filter, payload, options)
  ctx.logger.debug({ result }, 'Patched files collection')

  if (result === null) {
    throw new Error(`Error patching files collection`)
  }

  return { ...fileData, _id: result._id }
}

const uploadImageFile = async (ctx: SyncCtx, imagePath: string): Promise<DbItemFileData[]> => {
  const imageName = path.basename(imagePath)
  ctx.logger.debug({ image: imageName }, 'Uploading image')

  const filesCollection = ctx.mongoClient
    .db()
    .collection<DbFile>(ctx.env.FILES_COLLECTION_NAME)

  let dbFile: WithId<DbFile> | null = null

  try {
    const filter: Filter<DbFile> = { __STATE__: 'PUBLIC', name: imageName }
    ctx.logger.debug({ filter }, 'Searching image on DB')

    const existingFile = await filesCollection.findOne(filter)
    if (existingFile) {
      ctx.logger.debug({ file: existingFile }, 'Image is already uploaded on DB')
      dbFile = existingFile
    }
  } catch (err) {
    ctx.logger.error({ err }, 'Error searching image on DB')
    throw new Error('Error searching image on DB')
  }

  if (!dbFile) {
    ctx.logger.debug('Image not found on DB: uploading')

    let fileData: FilesServiceResponse
    try {
      fileData = await uploadToFileService(ctx, imagePath)
    } catch (err) {
      ctx.logger.error({ err, imageName }, 'Error uploading image on Files Service')
      throw new Error('Error uploading image on Files Service')
    }

    try {
      dbFile = await patchFilesCollection(ctx, filesCollection, fileData)
    } catch (err) {
      ctx.logger.error({ err, imageName }, 'Error patching files collection')
      throw new Error('Error patching files collection')
    }
  }

  const { _id, ...fileData } = dbFile
  return [{ id: _id.toString(), ...fileData }]
}

export const uploadImage = async (ctx: SyncCtx, manifestPath: string, manifest: Manifest): Promise<DbItemFileData[] | null> => {
  ctx.logger.debug({ image: manifest.image.localPath }, 'Uploading asset for field "image"')

  try {
    const manifestDir = path.dirname(manifestPath)
    const imageAbsPath = path.resolve(manifestDir, manifest.image.localPath)

    const data = await uploadImageFile(ctx, imageAbsPath)
    ctx.logger.debug({ data }, 'Uploaded asset for field "image"')

    return data
  } catch (err) {
    ctx.logger.error({ err, image: manifest.image.localPath }, 'Error uploading asset for field "image": field will be unset')
    return null
  }
}

export const uploadSupportedByImage = async (ctx: SyncCtx, manifestPath: string, manifest: Manifest): Promise<DbItemFileData[] | null> => {
  ctx.logger.debug({ image: manifest.supportedByImage.localPath }, 'Uploading asset for field "supportedByImage"')

  try {
    const manifestDir = path.dirname(manifestPath)
    const imageAbsPath = path.resolve(manifestDir, manifest.supportedByImage.localPath)

    const data = await uploadImageFile(ctx, imageAbsPath)
    ctx.logger.debug({ data }, 'Uploaded asset for field "image"')

    return data
  } catch (err) {
    ctx.logger.error({ err, image: manifest.supportedByImage.localPath }, 'Error uploading asset for field "supportedByImage": field will be unset')
    return null
  }
}
