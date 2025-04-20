# Contribution Guidelines

What follows are important information on how to work with this repository, whether you want to [change the Catalog content](#change-the-catalog-content) or [modify the sync script](#work-with-the-sync-script).

## Conventions

For **commits** and **pull requests titles** always follow the [Conventional Commit](https://www.conventionalcommits.org/en/v1.0.0/) standard of `<type>(<scope>): <subject>` (e.g. `feat(core): Add new feature`).

Pull request titles and labels are automatically used as entries in the release note, so please pay extra attention when setting one up and follow the guidelines provided in the next sections. You can find the complete mapping between pull request labels and release note categories [here](./.github/release.yml). Unlabeled PRs will be automatically assigned the `Other changes` category in the release note.

## Setup

This repository requires Node.js 23 or higher. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions and running `nvm use` to install the correct version of Node.

To set up the repository run:

```sh
corepack enable
yarn install
yarn sync-crd
yarn build:script
```

## Change the Catalog content

> ‼ **IMPORTANT NOTICE**
>
> To ensure that release notes are properly formatted, changes to the Catalog content MUST be submitted through **atomic pull requests**, meaning that each pull request MUST ship a single change described in the title and in the PR label as outlined [below](#common-operations).
>
> Generally speaking, pull requests regarding the Catalog content MUST have a title following the format `feat(catalog): <description of the changes>` and MUST have the label `catalog content`.

If you want to edit the Catalog, chances are that you will have to write or edit a **manifest**. A manifest is a JSON or YAML representation of an item version that defines its *metadata* and *resources*. The manifests are contained in the `/items/` directory, which follows a [hierarchical structure](./README.md#catalog-items) of `item type > item id > item versions`.

Everything you need to know about items and manifests is written in the official [Mia-Platform documentation](https://docs.mia-platform.eu/docs/software-catalog/manage-items/overview-manage-items).

### Rules & conventions

The content of the directory must adhere to a strict set of rules. To check if the Catalog is valid run `yarn check:items`. The command expects to be provided with a set of credentials to call the Mia-Platform Nexus registry API. You can do so with the required flag `-u` (or `--user`) that accepts the credentials in plaintext Basic Auth format (i.e., `user:password`). Moreover, you can restrict the items to check by passing a list of item IDs with the `-i, --item` flag (e.g., `yarn check:items -u nexus-user:nexus-password -i crud-service files-service`).

It is also recommended to instruct you IDE to validate the manifest against its JSON schema. Each item type has its own schema placed at the root of the type directory (i.e., `/<item-type>/manifest.schema.json`).

- For **JSON manifests**, reference the schema in the file adding `"$schema": "../../manifest.schema.json"`.
- For **YAML manifests**, instruct your IDE to perform the validation. For Visual Studio Code we recommend you install the [YAML extension by Red Hat](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml): the workspace is already configured to use the correct schema (see `/.vscode/settings.json`).

> ‼ **IMPORTANT NOTICE**
>
> Item types JSON schemas are built on top of well-known items schemas shipped by [`@mia-platform/console-types` lib](https://github.com/mia-platform/console-sdk/tree/main/packages/console-types/src/types/catalog/well-known-items).
>
> Whenever you update that library, remember to run `yarn sync-crd` to re-create them.

#### Files organization

- Each item MUST have its directory under the corresponding type directory.
- Each item directory MUST be named as the item `itemId` property.
- Item IDs MUST be unique (i.e., item directory names must be unique across all types).
- Each item directory MUST have a `versions` subdirectory containing the versions manifests.
- Each item directory SHOULD have a `assets` subdirectory containing any useful asset (e.g., the logo of the item).
- Each item MUST have at least one manifest.
- Each manifest MUST be a JSON (`.json`) or YAML (`.yaml`, `.yml`) file.
- Each manifest file MUST be named as the version it's describing (i.e., a valid semver or the string `NA`).
- Items of types that do not support versioning MUST have only one `NA` manifest.
- Items of types that support versioning MUST have at least one versioned manifest.

#### Manifests rules

- All the manifests of an item MUST declare the same `itemId` that MUST also be equal to the item directory name.
- Each manifest MUST be compliant with the JSON schema of the item type (which can be found under `/items/<item-type>/manifest.schema.json`), with the following extra constraints:
  - property `categoryId` MUST be one of the possible categories (see `/assets/categories.json`);
  - property `supportedBy` MUST be one of the possible supporters (see `/assets/supporters.json`);
  - property `tenantId` MUST be equal to `mia-platform`;
  - property `visibility` MUST be equal to `{ "public": true }`;
  - properties `image` and `supportedByImage` MUST be objects with the property `localPath` pointing to an existing `.png` file;
  - property `supportedByImage.localPath` MUST be one of the possible supporters images (see `/assets/supporters.json` and `/assets/img/`);
  - property `version` MUST be set in versioned manifests and MUST not be set in `NA` manifests;
  - property `version.name` MUST be equal to the manifest file name;
  - property `lifecycleStatus` MUST be equal to `deprecated` or `archived` in `NA` manifests.

Moreover, any **Docker image** referenced inside a manifest (e.g., property `dockerImage` in `resources.services` for some of the types):

- MUST come from Mia-Platform Nexus registry (i.e., MUST start with `nexus.mia-platform.eu`), and
- MUST actually be loaded on the registry.

The following set of extra rules **applies only to application** items:

- each service declared in `resources.services` MUST have its `name` property equal to the object key;
- each service name declared in `resources.services` MUST differ from the first-level `name` property of the application itself;
- an application that declares a service with `componentId` equal to `api-gateway-envoy` MUST have at least one listener declared in `resources.listeners`;
- an application that declares endpoints in `resources.endpoints` MUST have at least one service declared in `resources.services` with `componentId` equal to `api-gateway-envoy` or `api-gateway`;
- each endpoint declared in `resources.endpoints` MUST have its `defaultBasePath` property equal to the object key;
- an application that declares collections in `resources.collections` MUST have at least one service declared in `resources.services` with `componentId` equal to `crud-service`;
- each collection declared in `resources.collections` MUST have its `defaultName` property equal to the object key.

### Common operations

Below are listed some common operations you may want to perform on the catalog. For each of them, we provide the *title* and *label(s)* that the corresponding **atomic pull request** MUST have.

#### Add a new item

- Create a new directory named as the item `itemId` under the directory of the item type (i.e. `/items/<item-type>/<item-id>/`).
- Create a `versions` directory and, optionally, a `assets` directory in the item directory.
- Create the first manifest file under the `versions` directory. Name the file as the version you want to create (`NA` if the item type does not support versioning, a valid semver if the item type supports versioning).
- Write the manifest content following the JSON schema in the item type directory (i.e., `"$schema": "../../manifest.schema.json"`).
- Validate your work running `yarn check:items -u <nexus-user:nexus-password> -i <item-id>`.
- Re-generate the snapshots running

  ```sh
  make test-up
  yarn test:snapshot
  make test-down  
  ```

- Open a pull request with:
  - **title**: `feat(catalog): add new <item-type> <item-id>` (e.g., `feat(catalog): add new plugin my-awesome-service`)
  - **label**: `catalog-content`

#### Add a new version to an existing item

> ⚠ **Warning**
>
> This operation can be performed only for items of types supporting versioning.

- Create a new manifest file under the `versions` directory of the item (i.e. `/items/<item-type>/<item-id>/versions/`). Name the file as the version you want to create.
- Write the manifest content following the JSON schema in the item type directory (i.e., `"$schema": "../../manifest.schema.json"`).
- Validate your work running `yarn check:items -u <nexus-user:nexus-password> -i <item-id>`.
- Re-generate the snapshots running

  ```sh
  make test-up
  yarn test:snapshot
  make test-down  
  ```

- Open a pull request with:
  - **title**: `feat(catalog): add version <version-name> to <item-type> <item-id>` (e.g., `feat(catalog): add version 1.0.0 to plugin my-awesome-service`)
  - **label**: `catalog-content`

#### Update an item existing version

- Locate the manifest file you want to edit (i.e., `/items/<item-type>/<item-id>/versions/<version-name>.json`).
- Edit the manifest content following the JSON schema in the item type directory (i.e., `"$schema": "../../manifest.schema.json"`).
- Validate your work running `yarn check:items -u <nexus-user:nexus-password> -i <item-id>`.
- Re-generate the snapshots running

  ```sh
  make test-up
  yarn test:snapshot
  make test-down  
  ```

- Open a pull request with:
  - **title**: `feat(catalog): update version <version-name> of <item-type> <item-id>` (e.g., `feat(catalog): update version 1.0.0 of plugin my-awesome-service`)
  - **label**: `catalog-content`

#### Deprecate or archive an item version

- Locate the manifest file you want to deprecate (i.e., `/items/<item-type>/<item-id>/versions/<version-name>.json`).
- Set the `lifecycleStatus` property to `deprecated` or `archived`.
- Validate your work running `yarn check:items -u <nexus-user:nexus-password> -i <item-id>`.
- Re-generate the snapshots running

  ```sh
  make test-up
  yarn test:snapshot
  make test-down  
  ```

- Open a pull request with:
  - **title**: `feat(catalog): deprecate/archive <version-name> of <item-type> <item-id>` (e.g., `feat(catalog): deprecate version 1.0.0 of plugin my-awesome-service`)
  - **label**: `catalog-content`

#### Deprecate an item

An item is considered deprecated if all of its versions are deprecated.

- Locate the item you want to deprecate (i.e., `/items/<item-type>/<item-id>/`).
- [Deprecate](#deprecate-or-archive-an-item-version) each version of the item.
- Validate your work running `yarn check:items -u <nexus-user:nexus-password> -i <item-id>`.
- Re-generate the snapshots running

  ```sh
  make test-up
  yarn test:snapshot
  make test-down  
  ```

- Open a pull request with:
  - **title**: `feat(catalog): deprecate <item-type> <item-id>` (e.g., `feat(catalog): deprecate plugin my-awesome-service`)
  - **label**: `catalog-content`

#### Add or edit a new category

> ‼ **IMPORTANT NOTICE**
>
> You cannot edit the `categoryId` of an existing category since there may be other items using it outside the ones declared here.

- Add the new category or edit the exiling one in `/assets/categories.json`.
- Update the manifest JSON schemas running `yarn sync-crd`
- Open a pull request with:
  - **title**: `feat(catalog): [add | edit] category <category-id>` (e.g., `feat(catalog): add category my-awesome-category`)
  - **label**: `catalog-content`

### Test your changes

Whenever you make a change to the Catalog content remember to:

- run check script with `yarn check:items -u <nexus-user:nexus-password> -i <changed-item-itemId>`, and
- re-generate snapshots running `yarn test:snapshot` (you can spin up the needed MongoDB instance with `make test-up`, and stop it with `make test-down`).

## Work with the sync script

> ‼ **IMPORTANT NOTICE**
>
> To ensure that release notes are properly formatted, changes to the sync script content MUST be submitted through pull requests with the title following the format `<type>(sync): <description of the changes>` and MUST have the label `sync script`.

The source code for the sync script is in the `/src/` directory and can be built running `yarn build:script`.

### Run the script

To spin up the stack needed to [run the script](./README.md#running-the-script) locally, you can use the Docker Compose in the `/.dev/` directory, which will start

- a MongoDB instance,
- a Mia-Platform [Crud Service](https://github.com/mia-platform/crud-service) instance, and
- a Mia-Platform [Files Service](https://docs.mia-platform.eu/docs/runtime_suite/files-service/configuration) instance.

> ⚠ **Warning**
>
> To pull the Files Service Docker image you need to be logged in the Mia-Platform private registry.

The Docker Compose can be started running `make dev-up` and stop running `make dev-down`, while the script can be launched with `yarn dev` or `yarn start` for the un-compiled and compiled versions respectively.

### Test the script

The script comes with a suite of integration tests, that will execute it on an empty database and confront the results against a snapshot. To run the tests first spin up a MongoDB Docker container with `make test-up`, and then run `yarn test` (remember to stop the container afterwards with `make test-down`).

## Housekeeping

### Tag the repository

To tag the repository run:

```sh
npm version <semver>
git push main && git push origin v<semver>
```
