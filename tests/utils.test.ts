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

import { omit } from 'lodash-es'
import type nock from 'nock'

export const getFilenameFromFilesServiceReq = (body: nock.Body): string => {
  if (typeof body !== 'string') { return crypto.randomUUID() }

  const hexText = `0x${body.substring(0, 500)}`.replace(/\s+/gi, '')
  const stack = []

  for (let i = 0; i < hexText.length; i += 2) {
    const code = parseInt(hexText.substring(i, i + 2), 16)
    if (!isNaN(code) && code !== 0) {
      stack.push(String.fromCharCode(code))
    }
  }

  const convertedText = stack.join('')

  return convertedText.split('"').at(3) as string
}

export const cleanCategorySnap = (category: object): object => {
  const variableProps = ['_id']

  return omit(category, variableProps)
}

export const cleanItemSnap = (item: object): object => {
  const variableProps = [
    '_id',
    'createdAt',
    'image.[0].id',
    'image.[0].createdAt',
    'supportedByImage.[0].id',
    'supportedByImage.[0].createdAt',
  ]

  return omit(item, variableProps)
}

export const cleanFileSnap = (file: object): object => {
  const variableProps = ['_id', 'createdAt']

  return omit(file, variableProps)
}
