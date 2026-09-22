SHELL := /bin/sh
DEV_IMAGE := quality-reference-dev

.PHONY: tool install dev down format format-check lint typecheck test-unit test-component test-meta integration e2e contracts security build-images docs-build check-fast check

tool:
	docker build -q -f containers/dev.Dockerfile -t $(DEV_IMAGE) . >/dev/null
	docker run --rm --user "$$(id -u):$$(id -g)" -e HOME=/tmp/dev-home \
		-v "$(CURDIR):/workspace" -w /workspace $(DEV_IMAGE) \
		sh -lc 'pnpm install --frozen-lockfile && $(CMD)'

install:
	pnpm install --frozen-lockfile

dev:
	docker compose up --build --detach --wait

down:
	docker compose down --volumes --remove-orphans

format:
	pnpm format

format-check:
	pnpm format:check

lint:
	pnpm lint

typecheck:
	pnpm typecheck

test-meta:
	pnpm test:meta

test-unit:
	pnpm test:unit

test-component:
	pnpm test:component

integration:
	./scripts/quality/integration integration

e2e:
	./scripts/quality/integration e2e

contracts:
	./scripts/quality/contracts

security:
	./scripts/quality/security

build-images:
	./scripts/quality/build-images

docs-build:
	$(MAKE) tool CMD='pnpm docs:build'

check-fast:
	$(MAKE) tool CMD='pnpm format:check && pnpm lint && pnpm typecheck && pnpm test:unit'

check:
	$(MAKE) tool CMD='pnpm format:check && pnpm lint && pnpm typecheck && pnpm test'
	$(MAKE) contracts
