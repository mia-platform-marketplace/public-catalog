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

import type { ItemTriple } from './utils'

type CategoryEntity = { categoryId: string }
type ItemEntity = ItemTriple
type FileEntity = { name: string }

type CategoriesCreatedMetric = { count: number; data: CategoryEntity[] }
type CategoriesUpdatedMetric = { count: number; data: CategoryEntity[] }
type CategoriesErrorMetric = { count: number; data: { entity: CategoryEntity; error: string }[] }

type ItemsCreatedMetric = { count: number; data: ItemEntity[] }
type ItemsUpdatedMetric = { count: number; data: { diff: object; entity: ItemEntity }[] }
type ItemsPatchedMetric = { count: number; data: ItemEntity[] }
type ItemsErrorMetric = { count: number; data: { entity: ItemEntity; error: string }[] }

type FilesCreatedMetric = { count: number; data: FileEntity[] }
type FilesErrorMetric = { count: number; data: { entity: FileEntity; error: string }[] }

export type MetricsReport = {
  categories: { created: CategoriesCreatedMetric; errors: CategoriesErrorMetric; updated: CategoriesUpdatedMetric }
  files: { created:FilesCreatedMetric; errors: FilesErrorMetric }
  items: { created: ItemsCreatedMetric; errors: ItemsErrorMetric; patched: ItemsPatchedMetric; updated: ItemsUpdatedMetric }
}

class Metrics {
  private _categoriesCreated: CategoriesCreatedMetric = { count: 0, data: [] }
  private _categoriesUpdated: CategoriesUpdatedMetric = { count: 0, data: [] }
  private _categoriesErrors: CategoriesErrorMetric = { count: 0, data: [] }

  private _itemsCreated: ItemsCreatedMetric = { count: 0, data: [] }
  private _itemsUpdated: ItemsUpdatedMetric = { count: 0, data: [] }
  private _itemsPatched: ItemsPatchedMetric = { count: 0, data: [] }
  private _itemsErrors: ItemsErrorMetric = { count: 0, data: [] }

  private _filesCreated: FilesCreatedMetric = { count: 0, data: [] }
  private _filesErrors: FilesErrorMetric = { count: 0, data: [] }

  incCategoriesCreated(data: CategoryEntity) {
    this._categoriesCreated.count += 1
    this._categoriesCreated.data.push(data)
  }

  incCategoriesUpdated(data: CategoryEntity) {
    this._categoriesUpdated.count += 1
    this._categoriesUpdated.data.push(data)
  }

  incCategoriesErrors(data: { entity: CategoryEntity; error: string }) {
    this._categoriesErrors.count += 1
    this._categoriesErrors.data.push(data)
  }

  incItemsCreated(data: ItemEntity) {
    this._itemsCreated.count += 1
    this._itemsCreated.data.push(data)
  }

  incItemsUpdated(data: { diff: object; entity: ItemEntity }) {
    this._itemsUpdated.count += 1
    this._itemsUpdated.data.push(data)
  }

  incItemsPatched(data: ItemEntity) {
    this._itemsPatched.count += 1
    this._itemsPatched.data.push(data)
  }

  incItemsErrors(data: { entity: ItemEntity; error: string }) {
    this._itemsErrors.count += 1
    this._itemsErrors.data.push(data)
  }

  incFilesCreated(data: FileEntity) {
    this._filesCreated.count += 1
    this._filesCreated.data.push(data)
  }

  incFilesErrors(data: { entity: FileEntity; error: string }) {
    this._filesErrors.count += 1
    this._filesErrors.data.push(data)
  }


  getReport(): MetricsReport {
    return {
      categories: {
        created: this._categoriesCreated,
        errors: this._categoriesErrors,
        updated: this._categoriesUpdated,
      },
      files: {
        created: this._filesCreated,
        errors: this._filesErrors,
      },
      items: {
        created: this._itemsCreated,
        errors: this._itemsErrors,
        patched: this._itemsPatched,
        updated: this._itemsUpdated,
      },
    }
  }
}

export default Metrics
