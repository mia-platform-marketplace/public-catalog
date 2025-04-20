FROM node:23-alpine AS build

WORKDIR /build-dir

COPY ./.yarn .yarn
COPY ./assets assets
COPY ./items items
COPY ./scripts scripts
COPY ./src src
COPY ./.yarnrc.yml .yarnrc.yml
COPY ./package.json package.json
COPY ./tsconfig.json tsconfig.json
COPY ./yarn.lock yarn.lock

RUN yarn install --immutable

RUN yarn sync-crd
RUN yarn build:script

########################################################################################################################

FROM node:23-alpine AS deps

WORKDIR /build-dir

COPY ./.yarn .yarn
COPY ./.yarnrc.yml .yarnrc.yml
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock

RUN yarn workspaces focus --production

########################################################################################################################

FROM node:23-alpine

RUN apk add --no-cache tini

ARG COMMIT_SHA
ARG VERSION=latest
ENV LOG_LEVEL=info
ENV NODE_ENV=production

LABEL name="public-catalog-sync" \
      eu.mia-platform.url="https://www.mia-platform.eu" \
      eu.mia-platform.version=${VERSION}

WORKDIR /home/node/app

COPY ./LICENSE LICENSE

COPY --from=deps /build-dir/node_modules ./node_modules
COPY --from=build /build-dir/build ./build
COPY --from=build /build-dir/assets assets
COPY --from=build /build-dir/items items

RUN echo "public-catalog-sync: $COMMIT_SHA" >> ./commit.sha

USER node

ENTRYPOINT ["/sbin/tini", "--"]

CMD ["node", "build/index.cjs"]
