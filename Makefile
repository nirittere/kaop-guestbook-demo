SHELL := /bin/bash
.DEFAULT_GOAL := help

CLUSTER := kaop-demo
NAMESPACE := kaop-demo
IMAGE := kaop-guestbook-demo:local
GO_CACHE := /private/tmp/kaop-go-cache
GO_MOD_CACHE := /private/tmp/kaop-go-mod

.PHONY: help check-tools bootstrap image healthy incident recover verify test port-forward

help:
	@echo "KAOP guestbook demo"
	@echo "  make bootstrap      Start Colima, create the cluster, build the image, and deploy healthy state"
	@echo "  make healthy        Apply the healthy manifests"
	@echo "  make incident       Apply the broken Redis selector and dependency-coupled liveness probe"
	@echo "  make recover        Restore the healthy manifests"
	@echo "  make verify         Show workloads, endpoints, restarts, and events"
	@echo "  make port-forward   Serve the guestbook at http://localhost:8080"
	@echo "  make test           Run unit and manifest tests"

check-tools:
	@command -v colima >/dev/null
	@command -v docker >/dev/null
	@command -v k3d >/dev/null
	@command -v kubectl >/dev/null

bootstrap: check-tools
	@colima status >/dev/null 2>&1 || colima start --cpu 4 --memory 6 --disk 30
	@k3d cluster list | grep -q '^$(CLUSTER) ' || k3d cluster create $(CLUSTER) --agents 1 --wait
	docker build -t $(IMAGE) .
	k3d image import $(IMAGE) -c $(CLUSTER)
	kubectl apply -k deploy/overlays/healthy
	kubectl -n $(NAMESPACE) rollout status deployment/redis-master --timeout=120s
	kubectl -n $(NAMESPACE) rollout status deployment/guestbook --timeout=120s

image:
	docker build -t $(IMAGE) .
	k3d image import $(IMAGE) -c $(CLUSTER)
	kubectl -n $(NAMESPACE) rollout restart deployment/guestbook
	kubectl -n $(NAMESPACE) rollout status deployment/guestbook --timeout=120s

healthy:
	kubectl apply -k deploy/overlays/healthy
	kubectl -n $(NAMESPACE) rollout status deployment/redis-master --timeout=120s
	kubectl -n $(NAMESPACE) rollout status deployment/guestbook --timeout=120s

incident:
	kubectl apply -k deploy/overlays/incident
	@echo "Incident applied. Watch with: kubectl -n $(NAMESPACE) get pods -w"

recover:
	kubectl apply -k deploy/overlays/healthy
	kubectl -n $(NAMESPACE) rollout status deployment/guestbook --timeout=120s

verify:
	kubectl -n $(NAMESPACE) get deployments,services
	kubectl -n $(NAMESPACE) get endpoints redis-master -o wide
	kubectl -n $(NAMESPACE) get pods -o custom-columns='NAME:.metadata.name,READY:.status.containerStatuses[0].ready,RESTARTS:.status.containerStatuses[0].restartCount,STATUS:.status.phase'
	kubectl -n $(NAMESPACE) get events --sort-by=.lastTimestamp | tail -20

port-forward:
	kubectl -n $(NAMESPACE) port-forward service/guestbook 8080:80

test:
	GOCACHE=$(GO_CACHE) GOMODCACHE=$(GO_MOD_CACHE) go test ./...
	ruby tests/manifests_test.rb
	ruby tests/makefile_test.rb

