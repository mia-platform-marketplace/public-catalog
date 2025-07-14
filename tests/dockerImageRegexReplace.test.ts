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

import assert from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { type Collection, MongoClient } from 'mongodb'
import pino from 'pino'

import sync from '../src/lib'
import { defaultItemTypesFilter, type Env } from '../src/lib/process'


describe('Sync script', async () => {
  const MONGODB_URL = `mongodb://${process.env.MONGO_HOST ?? '127.0.0.1:27017'}/catalog`

  const envs: Env = {
    CATEGORIES_COLLECTION_NAME: 'categories',
    CONFIG_MAP_ABSOLUTE_PATH: 'tests/resources/examples.filters.json',
    FILES_COLLECTION_NAME: 'files',
    FILES_SERVICE_URL: 'http://localhost:3001/',
    ITEMS_COLLECTION_NAME: 'items',
    ITEM_TYPES_FILTER: defaultItemTypesFilter.join(','),
    LOG_LEVEL: 'silent',
    MONGODB_URL,
    TENANT_ID_TO_SET: 'mia-platform',
  }

  const logger = pino({ level: envs.LOG_LEVEL })

  let mongoClient: MongoClient
  let mongoDbItemsCollections: Collection<Document>

  beforeEach(async () => {
    mongoClient = new MongoClient(MONGODB_URL)
    mongoDbItemsCollections = mongoClient
      .db()
      .collection(envs.ITEMS_COLLECTION_NAME)
    await mongoClient.connect()
    await mongoClient.db().dropDatabase()
  })

  afterEach(async () => {
    await mongoClient.close()
  })

  const standardProject = {
    $project: {
      _id: 1,
      dockerImage: { $getField: { field: 'dockerImage', input: { $getField: { field: '$itemId', input: '$resources.services' } } } },
      itemId: 1,
      serviceType: { $getField: { field: 'type', input: { $getField: { field: '$itemId', input: '$resources.services' } } } },
      type: 1,
    },
  }

  await it('There should be at least one item with dockerImage defined and serviceType plugin', async () => {
    await sync(envs, logger)

    // list all items with dockerImage defined and serviceType plugin
    const itemsProjectionPlugin = await mongoDbItemsCollections
      .aggregate([
        standardProject,
        { $match: { dockerImage: { $exists: true, $ne: null }, serviceType: 'plugin' } },
      ]
      )
      .toArray()
    assert.ok(itemsProjectionPlugin.length > 1)
  })

  await it('There should be at least one item with dockerImage with subfolder core', async () => {
    await sync(envs, logger)

    // list all items with dockerImage defined and serviceType plugin
    const itemsProjectionPlugin = await mongoDbItemsCollections
      .aggregate([
        standardProject,
        { $match: { dockerImage: { $exists: true, $ne: null, $regex: /^my-registry-core.com/ } } },
      ]
      )
      .toArray()
    assert.ok(itemsProjectionPlugin.length > 1)
  })

  await it('There should be at least one item with dockerImage with subfolder cache', async () => {
    await sync(envs, logger)

    // list all items with dockerImage defined and serviceType plugin
    const itemsProjectionPlugin = await mongoDbItemsCollections
      .aggregate([
        standardProject,
        { $match: { dockerImage: { $exists: true, $ne: null, $regex: /^my-registry-cache.com/ } } },
      ]
      )
      .toArray()
    assert.ok(itemsProjectionPlugin.length > 1)
  })

  await it('There should be at least one item with dockerImage with subfolder plugins', async () => {
    await sync(envs, logger)

    // list all items with dockerImage defined and serviceType plugin
    const itemsProjectionPlugin = await mongoDbItemsCollections
      .aggregate([
        standardProject,
        { $match: { dockerImage: { $exists: true, $ne: null, $regex: /^my-registry-core-plugins.com/ } } },
      ]
      )
      .toArray()
    assert.ok(itemsProjectionPlugin.length > 1)
  })

  await it('There should be at least one item with dockerImage defined and serviceType plugin with custom registry', async () => {
    await sync(envs, logger)

    // list all items with dockerImage defined and serviceType plugin with custom registry
    const itemsProjectionPluginCustom = await mongoDbItemsCollections.aggregate([
      standardProject,
      { $match: { dockerImage: { $eq: 'my-registry-core.com/acl-service:1.0.2', $exists: true, $ne: null }, serviceType: 'plugin' } },
    ]
    )
      .toArray()
    assert.equal(itemsProjectionPluginCustom.length, 2)
  })

  await it('There should be no items with dockerImage starting with SHOULD_SKIP_THIS', async () => {
    await sync(envs, logger)

    // list all items with dockerImage that should be skipped since they start with SHOULD_SKIP_THIS so it should be an empty array
    const itemsProjectionSkipped = await mongoDbItemsCollections.aggregate([
      standardProject,
      {
        $match: {
          dockerImage: {
            $exists: true,
            $ne: null,
            $regex: /^SHOULD_SKIP_THIS/,
          },
        },
      },
    ]
    )
      .toArray()
    assert.equal(itemsProjectionSkipped.length, 0)
  })

  await it('There should be at least one item with dockerImage starting with "nexus.mia-platform.eu/fintech"', async () => {
    await sync(envs, logger)

    const itemsProjectionFintech = await mongoDbItemsCollections.aggregate([
      standardProject,
      {
        $match: {
          dockerImage: {
            $exists: true,
            $ne: null,
            $regex: /^nexus.mia-platform.eu\/fintech/,
          },
          serviceType: 'plugin',
        },
      },
    ]
    )
      .toArray()
    assert.ok(itemsProjectionFintech.length > 1)
  })

  await it('There should be the same number of items for fast data and custom source', async () => {
    await sync(envs, logger)

    const itemsProjectionFastData = await mongoDbItemsCollections.aggregate([
      standardProject,
      {
        $match: {
          dockerImage: { $exists: true, $ne: null, $regex: /^my-registry-fast-data.com/ },
        },
      },
    ]
    )
      .toArray()

    const itemsProjectionCustomSource = await mongoDbItemsCollections.aggregate([
      standardProject,
      {
        $match: {
          dockerImage: { $exists: true, $ne: null, $regex: /\/custom_source\// },
        },
      },
    ]
    )
      .toArray()
    assert.equal(itemsProjectionFastData.length, itemsProjectionCustomSource.length)
  })
})
