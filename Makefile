DEV_DOCKER_COMPOSE_FILE := .dev/docker-compose.yml
DEV_DOCKER_COMPOSE_FLAGS := -f ${DEV_DOCKER_COMPOSE_FILE}

dev-up:
	docker compose ${DEV_DOCKER_COMPOSE_FLAGS} up -d
.PHONY: dev-up

dev-down:
	docker compose ${DEV_DOCKER_COMPOSE_FLAGS} down --remove-orphans -v
.PHONY: dev-down
