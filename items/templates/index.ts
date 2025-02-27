import { catalogTemplate } from '@mia-platform/console-types'

import manifestSchema from './manifest.schema.json' with { type: 'json' }

export default {
  schema: manifestSchema,
  type: catalogTemplate.type,
}
