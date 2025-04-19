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

import assert, { fail } from 'node:assert'
import { afterEach, beforeEach, describe, it } from 'node:test'

import { MongoClient } from 'mongodb'
import nock from 'nock'
import pino from 'pino'

import sync from '../src/lib'
import type { FilesServiceResponse } from '../src/lib/assets'
import { defaultItemTypesFilter, type Env } from '../src/lib/process'
import { __STATE__ } from '../src/lib/utils'

import { cleanCategorySnap, cleanFileSnap, cleanItemSnap, getFilenameFromFilesServiceReq } from './utils.test'

describe('Sync script', async () => {
  const MONGODB_URL = `mongodb://${process.env.MONGO_HOST ?? '127.0.0.1:27017'}/catalog`

  const envs: Env = {
    CATEGORIES_COLLECTION_NAME: 'categories',
    FILES_COLLECTION_NAME: 'files',
    FILES_SERVICE_URL: 'http://files-service/',
    ITEMS_COLLECTION_NAME: 'items',
    ITEM_TYPES_FILTER: defaultItemTypesFilter.join(','),
    LOG_LEVEL: 'silent',
    MONGODB_URL,
    TENANT_ID_TO_SET: 'mia-platform',
  }

  const logger = pino({ level: envs.LOG_LEVEL })

  let mongoClient: MongoClient

  beforeEach(async () => {
    mongoClient = new MongoClient(MONGODB_URL)
    await mongoClient.connect()
    await mongoClient.db().dropDatabase()

    nock.disableNetConnect()
  })

  afterEach(async () => {
    await mongoClient.close()

    nock.cleanAll()
    nock.enableNetConnect()
  })

  await it('should match snapshot', async (test) => {
    const filesServiceScope = nock(envs.FILES_SERVICE_URL, { reqheaders: { 'content-type': (header) => header.includes('multipart/form-data') } })
      .persist()
      .post('/')
      .reply(200, (_, reqBody) => {
        const fileName = getFilenameFromFilesServiceReq(reqBody)

        const res: FilesServiceResponse = {
          file: `file-${fileName}`,
          location: `location-${fileName}`,
          name: fileName,
          size: fileName?.length,
        }

        return res
      })

    const metricsReport = await sync(envs, logger)

    assert.equal(metricsReport.categories.errors.count, 0)
    assert.equal(metricsReport.items.errors.count, 0)

    const insertedCategories = await mongoClient
      .db()
      .collection(envs.CATEGORIES_COLLECTION_NAME)
      .find()
      .sort({ categoryId: 1 })
      .toArray()
    test.assert.snapshot(insertedCategories.map(cleanCategorySnap))

    const insertedItems = await mongoClient
      .db()
      .collection(envs.ITEMS_COLLECTION_NAME)
      .find()
      .sort({ itemId: 1, version: -1 })
      .toArray()
    test.assert.snapshot(insertedItems.map(cleanItemSnap))

    const insertedFiles = await mongoClient
      .db()
      .collection(envs.FILES_COLLECTION_NAME)
      .find()
      .sort({ name: 1 })
      .toArray()
    test.assert.snapshot(insertedFiles.map(cleanFileSnap))

    assert.ok(filesServiceScope.isDone())
  })

  await it('should behave correctly if the DB is not empty', async () => {
    nock(envs.FILES_SERVICE_URL, { reqheaders: { 'content-type': (header) => header.includes('multipart/form-data') } })
      .persist()
      .post('/')
      .reply(200, (_, reqBody) => {
        const fileName = getFilenameFromFilesServiceReq(reqBody)

        const res: FilesServiceResponse = {
          file: `file-${fileName}`,
          location: `location-${fileName}`,
          name: fileName,
          size: fileName?.length,
        }

        return res
      })

    const tenantId = 'mia-platform'
    const itemId = 'micro-lc'
    const versionName = '2.4.2'

    const mockPlugin = {
      __STATE__,
      isLatest: true,
      itemId,
      lifecycleStatus: 'published',
      name: 'micro-lc',
      resources: {
        services: {
          'micro-lc': { dockerImage: 'foo', name: 'micro-lc', type: 'plugin' },
        },
      },
      tenantId,
      type: 'plugin',
      version: { name: versionName, releaseNote: '-' },
    }

    const itemsCollection = mongoClient.db().collection(envs.ITEMS_COLLECTION_NAME)

    const insertResult = await itemsCollection.insertOne(mockPlugin)
    if (!insertResult.acknowledged) { fail('Error setting up DB') }

    const metricsReport = await sync(envs, logger)

    assert.equal(metricsReport.items.updated.count, 1)

    const mockPluginAfterSync = await itemsCollection.findOne({ itemId, tenantId, 'version.name': versionName })
    if (!mockPluginAfterSync) { fail('Mock item disappeared after sync') }

    assert.equal(mockPluginAfterSync.isLatest, undefined)

    const latestPluginAfterSync = await itemsCollection
      .find({ isLatest: true, itemId, tenantId })
      .toArray()

    assert.equal(latestPluginAfterSync.length, 1)
    assert.notEqual(latestPluginAfterSync.at(0)?.version.name, versionName)
  })
})
