# KAOP Home Assignment Implementation Plan

**Goal:** Deliver a working Kubernetes incident and GitHub review demo plus a customer-facing KAOP pitch deck for Nirit Terehovsky.

**Architecture:** A Go guestbook frontend and Redis run in a local k3d cluster. Grafana Cloud alerts route into a namespace-scoped, read-only KAOP investigation workflow, while a separate GitHub reviewer comments on a real repair pull request.

**Tech Stack:** Go, Redis, Kubernetes, Kustomize, k3d, Colima, Grafana Alloy, KAOP, GitHub, PowerPoint.

## Global Constraints

- Public repository name: `kaop-guestbook-demo`.
- Kubernetes cluster and namespace: `kaop-demo`.
- No credentials, tokens, or generated secrets in Git.
- Kubernetes agent is namespace-scoped and read-only.
- GitHub agent may read repository content and comment on pull requests, but may not merge or modify code.
- Presentation language is English and the title is `KAOP by Nirit Terehovsky`.
- Use ASCII hyphens, not em dashes.

## Tasks

1. Implement the demo application, Kubernetes resources, validation tests, and Make targets.
2. Validate healthy, incident, and recovery states in a local k3d cluster.
3. Connect Grafana Cloud and KAOP incident investigation.
4. Connect the KAOP GitHub reviewer and create the repair pull request.
5. Produce and validate the PPTX, PDF, pitch script, and demo runbook.
6. Run full verification and rehearsal checks.

