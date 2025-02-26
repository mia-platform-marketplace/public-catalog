# Mia-Platform Public Catalog

Collection of manifests composing Mia-Platform public catalog.

## Development

### Check items

To check if the items are valid you can use the command

```sh
yarn check-items
```

You can restrict the checks to specific items or item types passing them as arguments. Not passing any argument will result in all items being checked.

For example:

```sh
$ yarn check-items
# All items will be checked

$ yarn check-items applications plugins
# All items of type `application` and `plugin` will be checked

$ yarn check-items crud-service
# Only the item with item id `crud-service` will be checked

$ yarn check-items applications crud-service
# All items of type `application` and the item with item id `crud-service` will be checked
```
