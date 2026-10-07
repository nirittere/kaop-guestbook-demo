# KAOP by Nirit Terehovsky - pitch script

## Timing

- Slides: 10 to 12 minutes
- Live platform tour: 10 to 12 minutes
- Discussion: remaining time in the 30 to 45 minute session

## Opening

Platform teams are already past the question of whether engineers will use agents. The operational question is how to scale that adoption without losing control of permissions, evidence, cost, or accountability.

Today I will show how KAOP gives platform engineering one control plane for agent inventory, workflows, permissions, and run evidence. Then I will run two connected examples: an incident investigation triggered by Grafana Cloud and a GitHub review of the proposed fix.

## Slide 1 - KAOP by Nirit Terehovsky

This is a platform tour for an organization where teams already deploy independent agents. The focus is the operating model around those agents: how the platform team can see them, constrain them, and connect them to repeatable workflows.

## Slide 2 - The agent sprawl problem

Independent agents can deliver value quickly, but every team tends to choose its own runtime, credentials, prompts, and review process. That creates fragmented ownership and makes simple questions hard to answer: what is running, what can it access, what did it do, and what did the run cost?

## Slide 3 - Why isolated agents fail in production

A useful local agent still lacks the surrounding production controls. It needs scoped access, dependable triggers, a defined workflow, evidence, and an approval path for risky actions. Without those controls, every team rebuilds the same infrastructure with different gaps.

## Slide 4 - The KAOP control plane

KAOP provides shared infrastructure around both Komodor agents and custom agents. The public product material describes a fleet inventory, shared context, workflow orchestration, evaluations, guardrails, and scoped governance. This lets teams keep their preferred frameworks while the platform team applies one operating model.

## Slide 5 - Workflow orchestration

The outcome comes from the workflow, not from one prompt. A trigger starts an investigation. The workflow routes evidence to an agent with a defined permission boundary. The result follows a contract that makes the finding usable by people and by later steps. The run record preserves the path from signal to outcome.

## Slide 6 - Governance boundaries

For this demo the Kubernetes agent is intentionally read only and limited to one namespace. It can inspect Pods, logs, events, Deployments, Services, Endpoints, and ConfigMaps. It cannot read Secrets or modify the cluster. The GitHub reviewer can read repository content and write review comments, but it cannot push, merge, or change code.

## Slide 7 - Fleet visibility and auditability

Central inventory changes the platform conversation. Instead of asking every team for screenshots or local logs, the platform team can inspect ownership, run history, permissions, actions, and cost from one place. That evidence supports troubleshooting, governance reviews, and gradual expansion of autonomy.

## Slide 8 - Live platform tour

I will start in KAOP with inventory, workflow structure, permission scope, and run history. Then I will apply a real Kubernetes fault. Grafana Cloud will fire the alert and the RCA workflow will investigate. Finally, GitHub will show the open repair PR and the automated KAOP review.

## Slide 9 - A governed adoption path

The practical adoption path starts with read only workflows and explicit outcomes. Teams can prove value on repeatable scenarios, inspect the evidence, and add approvals before any write capability. Autonomy expands only when the organization has evidence that the workflow is reliable.

## Appendix

Use the appendix when the customer asks how the demo works, exactly which permissions are granted, or how the incident can be recovered safely.

## Transition to demo

The architecture is intentionally small so the platform behavior stays visible. The frontend and Redis are healthy now. I will first show the controls, then trigger the same configuration fault that the repair PR addresses.

## Closing

The value of KAOP is the operating layer around agents. Platform engineering gets one place to run workflows, enforce boundaries, and retain evidence. Product teams can keep adopting agents without forcing the organization to accept invisible access or untraceable actions.

## Discussion prompts

- Which agent workflows are already spreading across your teams?
- Where do credentials and approvals live today?
- Which first workflow has a clear trigger, measurable outcome, and acceptable read only boundary?

## Sources

- Product assignment: `Product Architect Home Assignment.pdf`
- Komodor platform: https://komodor.com/platform/
- Run agents: https://komodor.com/platform/run-agents/
- Govern agents: https://komodor.com/platform/govern-agents/

