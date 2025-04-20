<div align="center">
  <a href=https://www.mia-platform.eu/>
  <img alt="logo" src="./public/mia-platform-logo.png" height="96">
</a>

# Mia-Platform Public Catalog

</div>

This repository is the source for [Mia-Platform public Software Catalog](https://docs.mia-platform.eu/docs/software-catalog/overview). It contains the manifests of publicly available items and ships a script to load them on a MongoDB database.

Please refer to the [official guidelines](./CONTRIBUTING.md) if you want to contribute.

## Catalog items

The Catalog items are described by *manifests*: JSON or YAML representations of their metadata and resources. The manifests are collected inside the [items](./items/) directory.

Each item has a *type*, at least one *version*, and, possibly, some *assets*. These entities are represented with the following folders hierarchical structure:

```txt
items
├── <item-type>
│   ├── <item-id>
|   |   ├── assets
|   |   |   ├── logo.png
|   |   |   └── ...
│   |   └── versions
|   |       ├── <version-name>.json
|   |       ├── <version-name>.yaml
|   |       └── ...
|   └── ...
└── ...
```

with manifests placed inside the "versions" directories.

Items and their manifests must follow a strict set of rules, so if you want to propose an addition or edit, make sure to read the [contributing guidelines](./CONTRIBUTING.md) carefully.

## The sync script

This repository ships a script intended to keep the Catalog content in sync with a given MongoDB database. It works by ensuring that all the *categories*, *items*, and *items files* of the public Catalog are present on the database *as they are* in the repository.

The script works only in addition and update, and never in delete, to avoid interfering with any custom item in the database. Namely, the script adheres to the following ruleset:

- if an entity is defined in the service and not in the database, it will be created on the database;
- if an entity is defined in the database and not in the service, it will be left untouched on the database;
- if an entity is defined both in the service and in the database, the service will take precedence, and the database will be updated accordingly.

The entities of which the script is in charge are:

- [items categories](./assets/categories.json), uniquely defined by the `categoryId` property,
- [items](./items), uniquely defined by the triple `tenantId`, `itemId`, and `version.name`, and
- items image assets, uniquely defined by their filename (with extension).

### Running the script

The script is shipped as a Docker image, available both on Dockerhub (`docker.io/miaplatform/public-software-catalog-sync`), and on Mia-Platform private registry (`nexus.mia-platform.eu/console/scripts/public-software-catalog-sync`).

To run the script needs an instance of [MongoDB](https://www.mongodb.com/) and an instance of Mia-Platform [Files Service](https://docs.mia-platform.eu/docs/runtime_suite/files-service/configuration).

The script accepts the following environment variables.

| Name                           |                                   Type                                   | Required | Default | Description                                                                                                                                                       |
| :----------------------------- | :----------------------------------------------------------------------: | :------: | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `LOG_LEVEL`                    | `debug` \| `error` \| `fatal` \| `info` \| `silent` \| `trace` \| `warn` |          | `info`  | [Pino](https://github.com/pinojs/pino) logger log level.                                                                                                          |
| `MONGODB_URL`                  |                                 `string`                                 |    ✔     |         | MongoDB connection string with database name.                                                                                                                     |
| `CATEGORIES_COLLECTION_NAME`   |                                 `string`                                 |    ✔     |         | Name of the *items categories* MongoDB collection.                                                                                                                |
| `ITEMS_COLLECTION_NAME`        |                                 `string`                                 |    ✔     |         | Name of the *items* MongoDB collection.                                                                                                                           |
| `FILES_SERVICE_URL`            |                                 `string`                                 |    ✔     |         | Base URL of the Files Service.                                                                                                                                    |
| `FILES_COLLECTION_NAME`        |                                 `string`                                 |    ✔     |         | Name of the *items files* MongoDB collection.                                                                                                                     |
| `ITEM_TYPES_FILTER`            |                                 `string`                                 |          |   All   | Comma-separated list of item types to sync.                                                                                                                       |
| `TENANT_ID_TO_SET`             |                                 `string`                                 |    ✔     |         | Identifier of the Mia-Platform [company](https://docs.mia-platform.eu/docs/console/company-configuration/overview) to set as `tenantId` property of synced items. |
| `DOCKER_IMAGE_REGISTRY_TO_SET` |                                 `string`                                 |          |         | Docker registry URL to set as `dockerImage` property of synced items.                                                                                             |
