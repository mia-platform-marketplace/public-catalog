# Sync script docker image

DOCKER_BIN := docker
DOCKER_BUILD := $(DOCKER_BIN) buildx build

docker_image := public-catalog-sync

d-build:
	$(DOCKER_BUILD) \
    --output=type=docker \
		--tag ${docker_image}:latest \
		.
.PHONY: d-build

d-run:
	$(DOCKER_BIN) run --rm \
    --env-file ./.dev/local.env \
		--network="host" \
		${docker_image}:latest
.PHONY: d-run

########################################################################################################################

# Sync script dev environment

DEV_DOCKER_COMPOSE_FILE := .dev/docker-compose.yml
DEV_DOCKER_COMPOSE_FLAGS := -f ${DEV_DOCKER_COMPOSE_FILE}

dev-up:
	docker compose ${DEV_DOCKER_COMPOSE_FLAGS} up -d
.PHONY: dev-up

dev-down:
	docker compose ${DEV_DOCKER_COMPOSE_FLAGS} down --remove-orphans -v
.PHONY: dev-down

########################################################################################################################

# Sync script test environment

test-up:
	docker run -d -p 27017:27017 --name catalog-mongo-test mongo:8
.PHONY: test-up

test-down:
	docker rm -f catalog-mongo-test
.PHONY: test-down

test-mongo7-up:
	docker run -d -p 27017:27017 --name catalog-mongo7-test mongo:7
.PHONY: test-mongo7-up

test-mongo7-down:
	docker rm -f catalog-mongo7-test
.PHONY: test-mongo7-down

test-mongo6-up:
	docker run -d -p 27017:27017 --name catalog-mongo6-test mongo:6
.PHONY: test-mongo6-up

test-mongo6-down:
	docker rm -f catalog-mongo6-test
.PHONY: test-mongo6-down
