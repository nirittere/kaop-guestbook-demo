# KAOP demo recovery

## Fast recovery

```bash
make recover
kubectl -n kaop-demo rollout status deployment/guestbook --timeout=120s
make verify
```

Expected result: Redis has an endpoint, the frontend returns to `2/2`, and no new restart loop continues.

## If the cluster is unavailable

```bash
colima status
colima start --cpu 4 --memory 6 --disk 30
k3d cluster list
make bootstrap
```

If a restored k3d node returns a kubelet certificate error while reading logs, rebuild only the local demo cluster:

```bash
k3d cluster delete kaop-demo
make bootstrap
```

This removes only the disposable local `kaop-demo` cluster.

## If Grafana does not fire

- Show the alert rule and its last evaluation.
- Confirm Alloy and kube-state-metrics are running.
- Use the saved KAOP incident run as evidence.
- Continue with live Kubernetes evidence and recovery.

## If KAOP cannot reach the cluster

- Show the saved run and the configured permission scope.
- Run the three `kubectl auth can-i` checks from the runbook.
- Show live endpoints, events, restarts, and logs in the terminal.

## If the GitHub reviewer does not comment

- Show the existing KAOP review comment on the open PR.
- Show the connected repository and reviewer workflow run history.
- Do not create a second PR during the interview.

## If browser services are slow

- Keep direct links open before the session.
- Use the appendix architecture and permission matrix while the page loads.
- Never expose credentials while navigating.

## Final reset

```bash
make recover
kubectl -n kaop-demo get pods
kubectl -n kaop-demo get endpoints redis-master
```

