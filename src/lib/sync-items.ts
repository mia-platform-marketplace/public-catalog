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

import type { Collection, Filter, UpdateFilter, WithId } from 'mongodb'

import { uploadImage, uploadSupportedByImage } from './assets'
import collectItems from './collect-items'
import type { DbItem, ReleaseData, SyncCtx } from './types'
import { CREATOR_ID, getItemTriple } from './utils'

const insertNewManifest = async (ctx: SyncCtx, itemsCollection: Collection<DbItem>, { manifestAbsPath, manifest }: ReleaseData) => {
  const itemTriple = getItemTriple(manifest)

  ctx.logger.info({ item: itemTriple }, 'Inserting new item in DB')

  try {
    const { image, supportedByImage, ...manifestData } = manifest

    const newDoc: DbItem = {
      ...manifestData,
      __STATE__: 'PUBLIC',
      createdAt: new Date(),
      creatorId: CREATOR_ID,
    }

    const imageData = await uploadImage(ctx, manifestAbsPath, manifest)
    if (imageData !== null) { newDoc.image = imageData }

    const supportedByImageData = await uploadSupportedByImage(ctx, manifestAbsPath, manifest)
    if (supportedByImageData !== null) { newDoc.supportedByImage = supportedByImageData }

    const result = await itemsCollection.insertOne(newDoc)
    if (!result.acknowledged) {
      throw new Error('DB returned an unacknowledged result')
    }

    ctx.logger.debug({ item: itemTriple, result }, 'Inserted item in DB')
  } catch (err) {
    ctx.logger.error({ err, item: itemTriple }, 'Error inserting item in DB')
  }
}

const patchExistingUnknownItem = async (ctx: SyncCtx, itemsCollection: Collection<DbItem>, item: WithId<DbItem>) => {
  const itemTriple = getItemTriple(item)

  ctx.logger.info({ item: itemTriple }, 'Found item in DB that is not part of the public catalog: set default properties for retro-compatibility')

  const filter: Filter<WithId<DbItem>> = { _id: item._id, categoryId: { $exists: false } }
  const payload: UpdateFilter<DbItem> = { $set: { categoryId: 'utility' } }
  ctx.logger.debug({ filter, payload }, 'Patching existing unknown item')

  try {
    // Set `utility` category if the item is unknown to the script and it has no category yet
    const result = await itemsCollection.updateOne(filter, payload)
    if (!result.acknowledged) {
      throw new Error('DB returned an unacknowledged result')
    }

    ctx.logger.debug({ item: itemTriple, result }, 'Patched existing unknown item')
  } catch (err) {
    ctx.logger.error({ err, item: itemTriple }, 'Error setting default properties for retro-compatibility')
  }
}

const applyNewManifestToExistingItem = async (ctx: SyncCtx, itemsCollection: Collection<DbItem>, item: WithId<DbItem>, { manifestAbsPath, manifest }: ReleaseData) => {
  const itemTriple = getItemTriple(item)

  ctx.logger.info({ item: itemTriple }, 'Updating existing item in DB')

  const filter: Filter<WithId<DbItem>> = { _id: item._id }
  ctx.logger.debug({ filter }, 'Patching existing item')

  const setPayload: UpdateFilter<DbItem>['$set'] = {}
  const unsetPayload: UpdateFilter<DbItem>['$unset'] = {}

  try {
    const imageData = await uploadImage(ctx, manifestAbsPath, manifest)
    const supportedByImageData = await uploadSupportedByImage(ctx, manifestAbsPath, manifest)

    const data = { ...manifest, image: imageData, supportedByImage: supportedByImageData }
    Object.entries(data).forEach(([key, val]) => {
      if (val === null) {
        unsetPayload[key] = true
      } else {
        setPayload[key] = val
      }
    })

    const payload: UpdateFilter<DbItem> = { $set: setPayload, $unset: unsetPayload }
    const result = await itemsCollection.updateOne(filter, payload)
    if (!result.acknowledged) {
      throw new Error('DB returned an unacknowledged result')
    }

    ctx.logger.debug({ item: itemTriple, result }, 'Updated existing item')
  } catch (err) {
    ctx.logger.error({ err, item: itemTriple }, 'Error updating existing item')
  }
}

const syncItems = async (ctx: SyncCtx) => {
  ctx.logger.info('Starting syncing catalog items')

  const itemTypesToCollect = ctx.env.ITEM_TYPES_FILTER.split(',')
  ctx.logger.debug({ typesToCollect: itemTypesToCollect }, 'Types filter to apply based on "ITEM_TYPES_FILTER" environment variable')

  const itemsCollection = ctx.mongoClient
    .db()
    .collection<DbItem>(ctx.env.ITEMS_COLLECTION_NAME)

  let dbItems: WithId<DbItem>[]
  try {
    const filter: Filter<DbItem> = { __STATE__: 'PUBLIC', type: { $in: itemTypesToCollect } }
    ctx.logger.debug({ filter }, 'Retrieving existing item from DB')

    dbItems = await itemsCollection.find().toArray()
    ctx.logger.debug(`Found ${dbItems.length} existing item on DB`)
  } catch (err) {
    ctx.logger.error({ err }, 'Error retrieving existing items from DB')
    return
  }

  let releasesData: ReleaseData[]
  try {
    releasesData = await collectItems(ctx, itemTypesToCollect)
  } catch (err) {
    ctx.logger.error({ err }, 'Error collecting manifests to apply')
    return
  }

  for (const releaseData of releasesData) {
    const alreadyInDb = dbItems.some(({ itemId, tenantId, version }) => Boolean(
      itemId === releaseData.manifest.itemId
      && tenantId === releaseData.manifest.tenantId
      && version?.name === releaseData.manifest.version?.name
    ))

    if (!alreadyInDb) {
      await insertNewManifest(ctx, itemsCollection, releaseData)
    }
  }

  for (const dbItem of dbItems) {
    const newReleaseData = releasesData.find(({ manifest: { itemId, tenantId, version } }) => Boolean(
      itemId === dbItem.itemId
      && tenantId === dbItem.tenantId
      && version?.name === dbItem.version?.name
    ))

    if (!newReleaseData) {
      await patchExistingUnknownItem(ctx, itemsCollection, dbItem)
    } else {
      await applyNewManifestToExistingItem(ctx, itemsCollection, dbItem, newReleaseData)
    }
  }

  ctx.logger.info('Finished syncing catalog items')
}

export default syncItems
