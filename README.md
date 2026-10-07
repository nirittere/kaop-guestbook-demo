# KAOP guestbook demo

This repository supports a live KAOP product demonstration for platform engineering teams. A Go guestbook depends on Redis inside a local k3d cluster. The incident overlay breaks the Redis Service selector and couples frontend liveness to dependency health, producing real empty endpoints, connection failures, probe failures, and container restarts.

## Prerequisites

- Colima
- Docker CLI
- k3d
- kubectl
- Go
- Ruby

## Demo commands

```bash
make bootstrap
make healthy
make verify
make incident
make verify
make recover
make verify
```

Use `make port-forward` to serve the guestbook at `http://localhost:8080`.

## Verified live evidence

- [Grafana alert rule](https://contentcheetah182.grafana.net/alerting/grafana/fg0jdq07jv9c0e/view) completed the Normal, Pending, Firing, and recovery lifecycle.
- [KAOP RCA run](https://kaop.komodor.com/a/hire-task-9/runs/run_e15c91fc04701d47c908ec0f) identified the Redis Service selector mismatch and liveness probe regression with high confidence.
- [Open repair PR](https://github.com/nirittere/kaop-guestbook-demo/pull/1) contains a real [AgentOps review comment](https://github.com/nirittere/kaop-guestbook-demo/pull/1#issuecomment-6045140326).

## Security boundary

The `kaop-investigator` ServiceAccount is bound to a namespace scoped Role in `kaop-demo`. It can read Pods, logs, events, Services, Endpoints, ConfigMaps, Deployments, and ReplicaSets. It cannot read Secrets, access cluster scoped resources, or modify workloads.

Useful checks:

```bash
kubectl auth can-i get pods \
  --as=system:serviceaccount:kaop-demo:kaop-investigator \
  -n kaop-demo

kubectl auth can-i get secrets \
  --as=system:serviceaccount:kaop-demo:kaop-investigator \
  -n kaop-demo

kubectl auth can-i patch deployments \
  --as=system:serviceaccount:kaop-demo:kaop-investigator \
  -n kaop-demo
```

The expected answers are `yes`, `no`, and `no`.

## Repository safety

No Grafana credentials, GitHub tokens, KAOP tokens, or Kubernetes Secret values belong in Git. Configure external integrations through their own interfaces or local secret stores.
