# Contribution Guidelines

## Setup

This repository requires Node.js 23 or higher. We recommend using [nvm](https://github.com/nvm-sh/nvm) to manage Node versions and running `nvm use` to install the correct version of Node.

To setup the repository run:

```sh
corepack enable
yarn install
yarn build
```

## Conventions

The library uses [Eslint](https://eslint.org/docs/) as **linter**, make sure to run `yarn lint` before committing.

For **commits** follow the [Conventional Commit](https://www.conventionalcommits.org/) standard: `<type>(<scope>): <subject>` (e.g. `feat(core): Add new feature`).

### Submitting a pull request

Pull request **titles** should follow the `<type>(<scope>): <summary of introduced changes>` structure. Pull Request titles are automatically used as **entries in the release note** when a new release is published, so they should effectively summarize the introduced change, specifying the type of change and the affected component (if possible).

Always remember to **label your Pull Requests** so they get categorized correctly in the release note. Some of the available labels are used to categorize entries in the release note. You can find the complete mapping between PR labels and RN categories [here](./.github/release.yml). Unlabeled PRs will be automatically assigned the `Other changes` category in the release note.

## Adding a new item

> TODO...

### Check items validity

To check if the items are valid you can use the command

```sh
yarn check-items
```

You can restrict the checks to specific items passing a list of item it with the `-i, --item` flag (e.g., `yarn check-items -p crud-service`).
