import type { Collection, Filter, OptionalId, UpdateFilter, UpdateOptions } from 'mongodb'
import type { Logger } from 'pino'

import { categories } from '../../assets/categories.json' with { type: 'json' }

import type { SyncCtx } from './types'
import { __STATE__ } from './utils'

type Category = {
  __STATE__: string
  categoryId: string
  label: string
}

/** @throws Error */
const dumpDefaultCategories = async (collection: Collection<Category>, logger: Logger) => {
  logger.info('No existing categories found, inserting default ones')

  const payload: OptionalId<Category>[] = categories.map((category) => ({ ...category, __STATE__ }))
  logger.debug({ payload }, 'Performing an "insertMany" database operation')

  const result = await collection.insertMany(payload)

  if (!result.acknowledged) {
    throw new Error('Error inserting default categories')
  }

  logger.info({ insertedCount: result.insertedCount }, 'Successfully inserted default categories')
  logger.debug({ result }, 'Performed an "insertMany" database operation')
}

/** @throws Error */
const upsertDefaultCategories = async (collection: Collection<Category>, logger: Logger) => {
  for (const category of categories) {
    const filter: Filter<Category> = { categoryId: category.categoryId }
    const payload: UpdateFilter<Category> = { $set: { __STATE__: 'PUBLIC', label: category.label } }
    const options: UpdateOptions = { upsert: true }

    logger.debug({ filter, options, payload }, 'Performing an "updateOne" database operation')

    const result = await collection.updateOne(filter, payload, { upsert: true })

    if (!result.acknowledged) {
      throw new Error(`Error upserting category "${category.categoryId}"`)
    }

    logger.info(
      { matchedCount: result.matchedCount, modifiedCount: result.modifiedCount, upsertedCount: result.upsertedCount },
      `Successfully upserted category "${category.categoryId}"`
    )

    logger.debug({ result }, 'Performed an "updateOne" database operation')
  }
}

const syncCategories = async (ctx: SyncCtx) => {
  ctx.logger.info('Starting syncing catalog categories')

  try {
    const categoriesCollection = ctx.mongoClient
      .db()
      .collection<Category>(ctx.env.CATEGORIES_COLLECTION_NAME)

    const existingCategoriesCount = await categoriesCollection.countDocuments()
    ctx.logger.debug(`Found ${existingCategoriesCount} categories in database`)

    const operation = existingCategoriesCount === 0 ? dumpDefaultCategories : upsertDefaultCategories
    await operation(categoriesCollection, ctx.logger)

    ctx.logger.info('Finished syncing catalog categories')
  } catch (err) {
    ctx.logger.error({ err }, 'Error syncing catalog categories')
  }
}

export default syncCategories
