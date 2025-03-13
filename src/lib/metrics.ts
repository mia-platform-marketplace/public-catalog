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

type CategoryMetric = { count: number; data: { categoryId: string }[] }
type ItemMetric = { count: number; data: ItemTriple[] }

export type MetricsReport = {
  categories: { created: CategoryMetric; errors: CategoryMetric; updated: CategoryMetric }
  items: { created: ItemMetric; errors: ItemMetric; updated: ItemMetric }
}

class Metrics {
  private _categoriesCreated: CategoryMetric = { count: 0, data: [] }
  private _categoriesUpdated: CategoryMetric = { count: 0, data: [] }
  private _categoriesErrors: CategoryMetric = { count: 0, data: [] }

  private _itemsCreated: ItemMetric = { count: 0, data: [] }
  private _itemsUpdated: ItemMetric = { count: 0, data: [] }
  private _itemsErrors: ItemMetric = { count: 0, data: [] }

  incCategoriesCreated(data: { categoryId: string }) {
    this._categoriesCreated.count += 1
    this._categoriesCreated.data.push(data)
  }

  incCategoriesUpdated(data: { categoryId: string }) {
    this._categoriesUpdated.count += 1
    this._categoriesUpdated.data.push(data)
  }

  incCategoriesErrors(data: { categoryId: string }) {
    this._categoriesErrors.count += 1
    this._categoriesErrors.data.push(data)
  }

  incItemsCreated(data: ItemTriple) {
    this._itemsCreated.count += 1
    this._itemsCreated.data.push(data)
  }

  incItemsUpdated(data: ItemTriple) {
    this._itemsUpdated.count += 1
    this._itemsUpdated.data.push(data)
  }

  incItemsErrors(data: ItemTriple) {
    this._itemsErrors.count += 1
    this._itemsErrors.data.push(data)
  }


  getReport(): MetricsReport {
    return {
      categories: {
        created: this._categoriesCreated,
        errors: this._categoriesErrors,
        updated: this._categoriesUpdated,
      },
      items: {
        created: this._itemsCreated,
        errors: this._itemsErrors,
        updated: this._itemsUpdated,
      },
    }
  }
}

export default Metrics
