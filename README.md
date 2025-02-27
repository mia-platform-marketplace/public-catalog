# Mia-Platform Public Catalog

Collection of manifests composing Mia-Platform public catalog.

## Development

The repository runs on Node.js 23 or higher. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions and running `nvm use` to install the correct version of Node.

To setup te repository run

```sh
corepack enable
yarn install
yarn build
```

### Check items

To check if the items are valid you can use the command

```sh
yarn check-items
```

You can restrict the checks to specific items passing a list of item it with the `-i, --item` flag (e.g., `yarn check-items -p crud-service`).
