DEV_DOCKER_COMPOSE_FILE := .dev/docker-compose.yml
DEV_DOCKER_COMPOSE_FLAGS := -f ${DEV_DOCKER_COMPOSE_FILE}

dev-up:
	docker compose ${DEV_DOCKER_COMPOSE_FLAGS} up -d
.PHONY: dev-up

dev-down:
	docker compose ${DEV_DOCKER_COMPOSE_FLAGS} down --remove-orphans -v
.PHONY: dev-down

test-up:
	docker run -d -p 27017:27017 --name catalog-mongo-test mongo:8.0
.PHONY: test-up

test-down:
	docker rm -f catalog-mongo-test
.PHONY: test-down
