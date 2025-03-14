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

import type { Collection, Filter, UpdateFilter, UpdateOptions } from 'mongodb'

import categoriesModule from '../../assets/categories.json' with { type: 'json' }

import type { SyncCtx } from './types'
import { __STATE__ } from './utils'

type Category = {
  __STATE__: string
  categoryId: string
  label: string
}

/** @throws Error */
const upsertDefaultCategories = async (ctx: SyncCtx, collection: Collection<Category>) => {
  for (const category of categoriesModule.categories) {
    const filter: Filter<Category> = { categoryId: category.categoryId }
    const payload: UpdateFilter<Category> = { $set: { __STATE__, label: category.label } }
    const options: UpdateOptions = { upsert: true }

    ctx.logger.debug({ filter, options }, 'Upserting default category')

    const result = await collection.updateOne(filter, payload, { upsert: true })

    if (!result.acknowledged) {
      const error = 'DB returned an unacknowledged result'
      ctx.metrics.incCategoriesErrors({ entity: { categoryId: category.categoryId }, error })
      throw new Error(error)
    }

    ctx.logger.info(
      { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount },
      `Successfully upserted category "${category.categoryId}"`
    )

    if (result.upsertedCount === 1) { ctx.metrics.incCategoriesCreated({ categoryId: category.categoryId }) }
    if (result.modifiedCount === 1) { ctx.metrics.incCategoriesUpdated({ categoryId: category.categoryId }) }
  }
}

const syncCategories = async (ctx: SyncCtx) => {
  ctx.logger.info('Starting syncing catalog categories')

  try {
    const categoriesCollection = ctx.mongoClient
      .db()
      .collection<Category>(ctx.env.CATEGORIES_COLLECTION_NAME)

    await upsertDefaultCategories(ctx, categoriesCollection)

    ctx.logger.info('Finished syncing catalog categories')
  } catch (err) {
    ctx.logger.error({ err }, 'Error syncing catalog categories')
  }
}

export default syncCategories
