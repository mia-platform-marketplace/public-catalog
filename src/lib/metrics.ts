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

export type MetricsReport = {
  categories: { created: number; errors: number; updated: number }
  items: { created: number; errors: number; updated: number }
}

class Metrics {
  private _categoriesCreated = 0
  private _categoriesUpdated = 0
  private _categoriesErrors = 0

  private _itemsCreated = 0
  private _itemsUpdated = 0
  private _itemsErrors = 0

  incCategoriesCreated() { this._categoriesCreated += 1 }
  incCategoriesUpdated() { this._categoriesUpdated += 1 }
  incCategoriesErrors() { this._categoriesErrors += 1 }

  incItemsCreated() { this._itemsCreated += 1 }
  incItemsUpdated() { this._itemsUpdated += 1 }
  incItemsErrors() { this._itemsErrors += 1 }

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
