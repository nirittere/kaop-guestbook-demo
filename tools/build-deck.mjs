import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = process.cwd();
const SKILL_DIR = "/Users/alexterehovsky/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const RUNTIME_PYTHON = "/Users/alexterehovsky/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const buildDir = path.join(workspaceDir, ".deck-build");
const outputDir = path.join(workspaceDir, "deliverables");
const finalPath = path.join(outputDir, "KAOP-by-Nirit-Terehovsky.pptx");
const backgroundPath = path.join(workspaceDir, "assets", "kaop-control-plane-background.png");
const buildStamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");

const { finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools", "artifact_tool_utils.mjs")).href,
);

await fs.mkdir(buildDir, { recursive: true });
await fs.mkdir(outputDir, { recursive: true });

const fontFamily = "Liberation Sans";
const presentation = Presentation.create({ slideSize: { width: 1280, height: 720 } });

const C = {
  bg: "#07111C",
  bg2: "#0B1726",
  panel: "#102338",
  panel2: "#142B42",
  white: "#F4F8FC",
  muted: "#A6B7C8",
  cyan: "#54D6FF",
  violet: "#9A7BFF",
  mint: "#68E1C4",
  danger: "#FF7285",
  amber: "#FFCA6B",
  line: "#29445D",
};

function shape(slide, geometry, left, top, width, height, fill = "none", line = "none", radius) {
  const result = slide.shapes.add({
    geometry,
    position: { left, top, width, height },
    fill: fill === "none" ? "none" : { type: "solid", color: fill },
    line: line === "none" ? { fill: "none", width: 0 } : { style: "solid", fill: line, width: 1.5 },
  });
  if (radius !== undefined) result.borderRadius = radius;
  return result;
}

function textBox(slide, text, left, top, width, height, options = {}) {
  const box = shape(slide, "textbox", left, top, width, height, "none", "none");
  box.text = text;
  box.text.style = {
    typeface: fontFamily,
    fontSize: options.fontSize ?? 24,
    bold: options.bold ?? false,
    color: options.color ?? C.white,
    autoFit: options.autoFit ?? "shrinkText",
    horizontalAlignment: options.align ?? "left",
    verticalAlignment: options.valign ?? "middle",
  };
  return box;
}

function baseSlide(number, title, subtitle) {
  const slide = presentation.slides.add();
  slide.background.fill = C.bg;
  shape(slide, "rect", 0, 0, 14, 720, C.cyan, "none");
  textBox(slide, title, 62, 42, 1110, 54, { fontSize: 34, bold: true });
  if (subtitle) textBox(slide, subtitle, 64, 98, 1100, 34, { fontSize: 17, color: C.muted });
  textBox(slide, String(number).padStart(2, "0"), 1182, 654, 48, 24, { fontSize: 12, color: C.muted, align: "right" });
  textBox(slide, "KAOP by Nirit Terehovsky", 62, 654, 300, 24, { fontSize: 12, color: C.muted });
  return slide;
}

function label(slide, text, left, top, width, color = C.cyan) {
  textBox(slide, text.toUpperCase(), left, top, width, 24, { fontSize: 12, bold: true, color });
}

function addNotes(slide, body, sources = []) {
  const sourceText = sources.length ? `\n\nSources:\n${sources.map((source) => `- ${source}`).join("\n")}` : "";
  slide.speakerNotes.textFrame.setText(`${body}${sourceText}`);
  slide.speakerNotes.setVisible(true);
}

function connector(slide, left, top, width, height, color = C.line) {
  return shape(slide, "line", left, top, width, height, "none", color);
}

function metric(slide, value, caption, left, top, color = C.cyan) {
  textBox(slide, value, left, top, 170, 54, { fontSize: 36, bold: true, color });
  textBox(slide, caption, left, top + 54, 190, 42, { fontSize: 15, color: C.muted, valign: "top" });
}

// Slide 1
{
  const slide = presentation.slides.add();
  slide.background.fill = C.bg;
  const bytes = new Uint8Array(await fs.readFile(backgroundPath));
  slide.images.add({
    blob: bytes,
    contentType: "image/png",
    alt: "Abstract network converging on a governed control point",
    fit: "cover",
    position: { left: 0, top: 0, width: 1280, height: 720 },
  });
  label(slide, "Platform engineering customer pitch", 76, 92, 420, C.cyan);
  textBox(slide, "KAOP", 72, 144, 520, 96, { fontSize: 72, bold: true });
  textBox(slide, "by Nirit Terehovsky", 76, 238, 520, 52, { fontSize: 30, color: C.white });
  textBox(slide, "A governed operating layer for production agents", 76, 330, 520, 76, { fontSize: 24, color: C.muted, valign: "top" });
  textBox(slide, "Customer presentation and live platform tour", 76, 612, 480, 28, { fontSize: 15, color: C.muted });
  addNotes(slide, "Open with the customer problem. Platform teams already have agents. Their challenge is scaling adoption while keeping permissions, evidence, cost, and accountability visible.", [
    "https://komodor.com/platform/",
  ]);
}

// Slide 2
{
  const slide = baseSlide(2, "The agent sprawl problem", "Independent adoption creates an operating problem for the platform team");
  const teams = [
    ["App team", "Coding agent", C.cyan],
    ["SRE", "Incident agent", C.violet],
    ["FinOps", "Cost agent", C.mint],
    ["Security", "Policy agent", C.amber],
  ];
  teams.forEach(([team, agent, color], index) => {
    const y = 164 + index * 108;
    shape(slide, "ellipse", 82, y, 54, 54, color, "none");
    textBox(slide, team, 158, y - 2, 170, 28, { fontSize: 19, bold: true });
    textBox(slide, agent, 158, y + 28, 190, 24, { fontSize: 15, color: C.muted });
    connector(slide, 350, y + 27, 166, 0, color);
  });
  shape(slide, "roundRect", 530, 162, 650, 430, C.panel, C.line, 24);
  label(slide, "Platform questions", 574, 196, 240, C.danger);
  const questions = [
    "What is running across the organization?",
    "Which systems and credentials can each agent reach?",
    "Who approved the action and what evidence remains?",
    "How do we stop unsafe behavior without stopping adoption?",
  ];
  questions.forEach((question, index) => {
    textBox(slide, question, 574, 244 + index * 76, 540, 48, { fontSize: 22, color: index === 3 ? C.white : C.muted });
    if (index < questions.length - 1) connector(slide, 574, 304 + index * 76, 520, 0, C.line);
  });
  addNotes(slide, "Independent agents deliver value quickly, but each team tends to choose its own runtime, credentials, prompts, and review process. The platform team loses a reliable view of access, ownership, evidence, and cost.", [
    "https://komodor.com/platform/run-agents/",
    "Product Architect Home Assignment.pdf, pages 1-2",
  ]);
}

// Slide 3
{
  const slide = baseSlide(3, "Why isolated agents fail in production", "A useful local agent still needs production controls around it");
  shape(slide, "ellipse", 515, 238, 250, 250, C.panel2, C.cyan);
  textBox(slide, "Local\nagent", 552, 288, 176, 110, { fontSize: 36, bold: true, align: "center" });
  const obligations = [
    ["Scoped access", 112, 170, C.cyan],
    ["Reliable triggers", 112, 430, C.violet],
    ["Run evidence", 894, 170, C.mint],
    ["Approval gates", 894, 430, C.amber],
  ];
  obligations.forEach(([title, x, y, color]) => {
    label(slide, title, x, y, 250, color);
    shape(slide, "rect", x, y + 38, 260, 4, color, "none");
    textBox(slide, title === "Scoped access" ? "Who can read or write, in which environment" : title === "Reliable triggers" ? "Alerts, schedules, pull requests, or chat" : title === "Run evidence" ? "Inputs, tool calls, decisions, outcomes, and cost" : "Human review before higher risk actions", x, y + 56, 270, 76, { fontSize: 18, color: C.muted, valign: "top" });
  });
  connector(slide, 372, 305, 143, 0, C.line);
  connector(slide, 372, 407, 143, 48, C.line);
  connector(slide, 765, 305, 129, 0, C.line);
  connector(slide, 765, 407, 129, 48, C.line);
  addNotes(slide, "The core model may be capable, but production reliability comes from the infrastructure around it: permission scope, triggers, orchestration, evidence, approvals, and cost controls.", [
    "https://komodor.com/platform/run-agents/",
    "https://komodor.com/platform/govern-agents/",
  ]);
}

// Slide 4
{
  const slide = baseSlide(4, "The KAOP control plane", "Shared infrastructure surrounds both Komodor agents and custom agents");
  const layers = [
    ["Fleet", "Inventory, ownership, health, versions", C.cyan],
    ["Run", "Triggers, workflows, agent handoffs, run history", C.violet],
    ["Context", "Memory, knowledge graph, integrations", C.mint],
    ["Govern", "RBAC, credentials, guardrails, approvals, audit", C.amber],
  ];
  layers.forEach(([name, description, color], index) => {
    const y = 154 + index * 104;
    shape(slide, "roundRect", 120, y, 1040, 78, index === 0 ? C.panel2 : C.panel, C.line, 16);
    shape(slide, "rect", 120, y, 12, 78, color, "none");
    textBox(slide, name, 164, y + 12, 190, 50, { fontSize: 27, bold: true, color });
    textBox(slide, description, 360, y + 12, 730, 50, { fontSize: 21, color: C.white });
  });
  textBox(slide, "One operating model across runtimes, models, and teams", 188, 586, 900, 42, { fontSize: 22, bold: true, align: "center" });
  addNotes(slide, "KAOP provides shared infrastructure around agents: fleet management, workflow orchestration, shared context, evaluations, and governance. Teams can keep existing frameworks while the platform team applies one operating model.", [
    "https://komodor.com/platform/",
    "https://komodor.com/platform/run-agents/",
  ]);
}

// Slide 5
{
  const slide = baseSlide(5, "Workflow orchestration from trigger to outcome", "A defined workflow turns agent capability into a repeatable operational process");
  const stages = [
    ["1", "Trigger", "Grafana alert", C.cyan],
    ["2", "Investigate", "Kubernetes evidence", C.violet],
    ["3", "Conclude", "Structured RCA", C.mint],
    ["4", "Review", "Human decision", C.amber],
    ["5", "Record", "Audit and cost", C.cyan],
  ];
  stages.forEach(([number, name, detail, color], index) => {
    const x = 74 + index * 238;
    shape(slide, "ellipse", x + 58, 202, 74, 74, color, "none");
    textBox(slide, number, x + 58, 202, 74, 74, { fontSize: 28, bold: true, color: C.bg, align: "center" });
    textBox(slide, name, x, 302, 190, 34, { fontSize: 23, bold: true, align: "center" });
    textBox(slide, detail, x, 344, 190, 52, { fontSize: 16, color: C.muted, align: "center", valign: "top" });
    if (index < stages.length - 1) connector(slide, x + 146, 239, 92, 0, C.line);
  });
  shape(slide, "roundRect", 184, 462, 912, 112, C.panel, C.line, 16);
  textBox(slide, "Output contract", 220, 482, 190, 32, { fontSize: 18, bold: true, color: C.cyan });
  textBox(slide, "root cause  •  evidence  •  confidence  •  affected resources  •  suggested fix".replaceAll("•", "  /  "), 220, 520, 830, 34, { fontSize: 18, color: C.white, align: "center" });
  addNotes(slide, "The workflow matters more than one prompt. A trigger starts a bounded investigation. The agent returns a structured finding. A person reviews risky action, and KAOP keeps the run record.", [
    "https://komodor.com/platform/run-agents/",
    "Product Architect Home Assignment.pdf, pages 2-4",
  ]);
}

// Slide 6
{
  const slide = baseSlide(6, "Governance boundaries", "The demo proves control through enforced permissions, not through instructions alone");
  const columns = [
    { x: 74, title: "Kubernetes investigator", color: C.cyan, allowed: ["Pods and logs", "Events and workloads", "Services and endpoints"], denied: ["Secrets", "Cluster scope", "Any write"] },
    { x: 654, title: "GitHub reviewer", color: C.violet, allowed: ["Repository content", "Pull request diff", "Review comments"], denied: ["Push", "Merge", "Code changes"] },
  ];
  columns.forEach((column) => {
    shape(slide, "roundRect", column.x, 158, 540, 432, C.panel, C.line, 20);
    textBox(slide, column.title, column.x + 36, 186, 460, 40, { fontSize: 25, bold: true, color: column.color });
    label(slide, "Allowed", column.x + 36, 248, 140, C.mint);
    column.allowed.forEach((item, index) => textBox(slide, `+  ${item}`, column.x + 48, 286 + index * 48, 420, 34, { fontSize: 19, color: C.white }));
    label(slide, "Denied", column.x + 36, 438, 140, C.danger);
    column.denied.forEach((item, index) => textBox(slide, `-  ${item}`, column.x + 48, 474 + index * 34, 420, 28, { fontSize: 17, color: C.muted }));
  });
  addNotes(slide, "The Kubernetes ServiceAccount is namespace scoped and read only. Live kubectl authorization checks return yes for Pods and no for Secrets and patching Deployments. The GitHub integration is intentionally comment only.", [
    "https://komodor.com/platform/govern-agents/",
    "deploy/base/rbac.yaml in the demo repository",
  ]);
}

// Slide 7
{
  const slide = baseSlide(7, "Fleet visibility and auditability", "Central evidence replaces reconstruction from local terminals and team-specific logs");
  shape(slide, "roundRect", 82, 166, 1110, 134, C.panel, C.line, 18);
  const events = [
    ["14:03", "Alert received", C.cyan],
    ["14:04", "Agent invoked", C.violet],
    ["14:05", "Evidence collected", C.mint],
    ["14:06", "Finding produced", C.amber],
    ["14:07", "Decision recorded", C.cyan],
  ];
  events.forEach(([time, title, color], index) => {
    const x = 112 + index * 212;
    shape(slide, "ellipse", x, 204, 18, 18, color, "none");
    if (index < events.length - 1) connector(slide, x + 18, 213, 194, 0, C.line);
    textBox(slide, time, x, 232, 84, 22, { fontSize: 12, color });
    textBox(slide, title, x, 254, 176, 28, { fontSize: 15, bold: true });
  });
  const questions = [
    ["Ownership", "Who owns this agent and workflow?"],
    ["Access", "What could the agent read or change?"],
    ["Evidence", "Which inputs and tool calls support the result?"],
    ["Economics", "How much did the run consume?"],
  ];
  questions.forEach(([name, detail], index) => {
    const x = 82 + index * 278;
    label(slide, name, x, 362, 220, [C.cyan, C.violet, C.mint, C.amber][index]);
    textBox(slide, detail, x, 402, 240, 80, { fontSize: 20, color: C.white, valign: "top" });
  });
  textBox(slide, "The run record makes every action attributable", 180, 552, 910, 46, { fontSize: 25, bold: true, align: "center" });
  addNotes(slide, "A central fleet view and run history let platform teams inspect ownership, permissions, tool calls, policy decisions, and cost without asking every team to reconstruct the run.", [
    "https://komodor.com/platform/run-agents/",
    "https://komodor.com/platform/govern-agents/",
  ]);
}

// Slide 8
{
  const slide = baseSlide(8, "Live platform tour", "The demo starts with controls, then follows live evidence across three systems");
  const systems = [
    ["KAOP", "Verified RCA run\nHigh confidence finding", C.violet],
    ["Grafana", "Normal / Pending / Firing / Normal", C.amber],
    ["GitHub", "Open PR #1 with AgentOps review", C.cyan],
  ];
  systems.forEach(([name, detail, color], index) => {
    const x = 76 + index * 390;
    shape(slide, "roundRect", x, 166, 350, 282, C.panel, color, 20);
    label(slide, name, x + 28, 194, 250, color);
    textBox(slide, detail, x + 28, 246, 292, 86, { fontSize: 21, color: C.white, valign: "top" });
    shape(slide, "rect", x + 28, 358, 294, 2, C.line, "none");
    textBox(slide, index === 0 ? "Show the boundary before the run" : index === 1 ? "Prove the trigger was automatic" : "Prove the reviewer stayed comment only", x + 28, 378, 292, 54, { fontSize: 15, color: C.muted, valign: "top" });
  });
  shape(slide, "roundRect", 200, 492, 880, 96, C.panel2, C.line, 16);
  textBox(slide, "Live trigger", 234, 516, 150, 30, { fontSize: 18, bold: true, color: C.danger });
  textBox(slide, "make incident", 420, 510, 240, 40, { fontSize: 24, bold: true, color: C.white });
  textBox(slide, "Redis endpoints disappear, probes fail, and restarts rise", 680, 510, 350, 44, { fontSize: 17, color: C.muted });
  addNotes(slide, "Start the demo in KAOP. Show inventory, workflow structure, permission scope, and run history before triggering the fault. The verified live run identified the Service selector mismatch, the dependency-coupled liveness probe, and the exact recovery. Then move to Grafana and the open GitHub PR.", [
    "Product Architect Home Assignment.pdf, page 2",
    "https://kaop.komodor.com/a/hire-task-9/runs/run_e15c91fc04701d47c908ec0f",
    "https://contentcheetah182.grafana.net/alerting/grafana/fg0jdq07jv9c0e/view",
    "https://github.com/nirittere/kaop-guestbook-demo/pull/1#issuecomment-6045140326",
  ]);
}

// Slide 9
{
  const slide = baseSlide(9, "A governed path to agent adoption", "Autonomy expands only after the organization has evidence that the workflow is reliable");
  const phases = [
    ["1", "Observe", "Read only access\nStructured findings", 126, 420, C.cyan],
    ["2", "Assist", "Recommendations\nHuman execution", 356, 342, C.violet],
    ["3", "Approve", "Proposed writes\nRequired approval", 586, 264, C.mint],
    ["4", "Automate", "Narrow writes\nMeasured outcomes", 816, 186, C.amber],
  ];
  phases.forEach(([number, title, detail, x, y, color]) => {
    shape(slide, "roundRect", x, y, 224, 152, C.panel, color, 18);
    textBox(slide, number, x + 20, y + 16, 40, 36, { fontSize: 24, bold: true, color });
    textBox(slide, title, x + 66, y + 16, 130, 36, { fontSize: 22, bold: true });
    textBox(slide, detail, x + 20, y + 64, 180, 64, { fontSize: 16, color: C.muted, valign: "top" });
  });
  textBox(slide, "Start where the blast radius is clear and the outcome is measurable", 160, 598, 950, 34, { fontSize: 23, bold: true, align: "center" });
  addNotes(slide, "A practical adoption path starts with read only workflows and explicit outcomes. Add approvals before any write capability. Expand autonomy only when run evidence shows that the workflow behaves reliably.", [
    "https://komodor.com/platform/govern-agents/",
  ]);
}

// Slide 10
{
  const slide = baseSlide(10, "Demo architecture", "One application and one fault connect the incident and code review workflows");
  const nodes = [
    ["Grafana Cloud", "Metrics and alert", 80, 170, C.amber],
    ["KAOP", "Webhook and RCA workflow", 470, 170, C.violet],
    ["k3d cluster", "Go frontend and Redis", 860, 170, C.cyan],
    ["GitHub", "Open repair PR", 470, 430, C.mint],
  ];
  nodes.forEach(([title, detail, x, y, color]) => {
    shape(slide, "roundRect", x, y, 300, 126, C.panel, color, 20);
    textBox(slide, title, x + 28, y + 20, 244, 34, { fontSize: 24, bold: true, color });
    textBox(slide, detail, x + 28, y + 64, 244, 38, { fontSize: 16, color: C.muted });
  });
  connector(slide, 380, 233, 90, 0, C.line);
  connector(slide, 770, 233, 90, 0, C.line);
  connector(slide, 620, 296, 0, 134, C.line);
  textBox(slide, "alert", 394, 200, 62, 24, { fontSize: 12, color: C.muted, align: "center" });
  textBox(slide, "read only", 784, 200, 62, 24, { fontSize: 12, color: C.muted, align: "center" });
  textBox(slide, "review", 638, 350, 62, 24, { fontSize: 12, color: C.muted });
  textBox(slide, "Fault: Redis Service selector matches no Pods", 220, 590, 840, 34, { fontSize: 22, bold: true, color: C.danger, align: "center" });
  addNotes(slide, "The architecture is intentionally small. Grafana Cloud watches the local cluster and sends an alert to KAOP. The RCA agent reads namespace evidence. GitHub hosts the open repair PR and KAOP reviewer comment.", [
    "Product Architect Home Assignment.pdf, pages 3-4",
  ]);
}

// Slide 11
{
  const slide = baseSlide(11, "Permission matrix", "The demo uses the minimum access required for investigation and review");
  const table = slide.tables.add({
    rows: 6,
    columns: 4,
    left: 72,
    top: 160,
    width: 1136,
    height: 410,
    values: [
      ["Integration", "Capability", "Allowed", "Enforcement"],
      ["Kubernetes", "Pods, logs, events", "Read", "Namespace Role"],
      ["Kubernetes", "Services, endpoints, workloads", "Read", "Namespace Role"],
      ["Kubernetes", "Secrets and writes", "Denied", "RBAC"],
      ["GitHub", "Repository and PR diff", "Read", "App permission"],
      ["GitHub", "Review comments only", "Write comment", "App permission"],
    ],
  });
  table.styleOptions = { headerRow: true, bandedRows: false };
  table.borders.assign({ style: "solid", fill: C.line, width: 1 });
  table.cells.block({ row: 0, column: 0, rowCount: 1, columnCount: 4 }).assign({
    fill: C.panel2,
    textStyle: { typeface: fontFamily, fontSize: 17, bold: true, color: C.white },
    margins: { left: 14, right: 14, top: 8, bottom: 8 },
  });
  table.cells.block({ row: 1, column: 0, rowCount: 5, columnCount: 4 }).assign({
    fill: C.panel,
    textStyle: { typeface: fontFamily, fontSize: 16, color: C.white },
    margins: { left: 14, right: 14, top: 8, bottom: 8 },
  });
  table.cells.block({ row: 3, column: 2, rowCount: 1, columnCount: 1 }).assign({ fill: "#3A1B29", textStyle: { typeface: fontFamily, fontSize: 16, bold: true, color: C.danger } });
  textBox(slide, "No credentials or Secret values are stored in Git", 220, 598, 840, 34, { fontSize: 21, bold: true, color: C.mint, align: "center" });
  addNotes(slide, "Use this slide when the customer asks what enforces the boundary. Kubernetes RBAC denies Secret access and writes. The GitHub application is configured for repository read and pull request comments only.", [
    "deploy/base/rbac.yaml in the demo repository",
    "https://komodor.com/platform/govern-agents/",
  ]);
}

// Slide 12
{
  const slide = baseSlide(12, "Incident evidence and recovery", "Kubernetes, Grafana, and KAOP expose the fault and the recovery");
  const states = [
    ["Healthy", "1 endpoint", "2/2 Ready", "0 restarts", C.mint],
    ["Incident", "0 endpoints", "new Pod not Ready", "7 restarts observed", C.danger],
    ["Recovered", "1 endpoint", "2/2 Ready", "alert resolved", C.cyan],
  ];
  states.forEach(([title, endpoint, ready, restart, color], index) => {
    const x = 76 + index * 390;
    shape(slide, "roundRect", x, 168, 350, 328, C.panel, color, 20);
    textBox(slide, title, x + 28, 194, 294, 42, { fontSize: 27, bold: true, color });
    metric(slide, endpoint.split(" ")[0], endpoint.includes("0") ? "Redis endpoints" : "Redis endpoint", x + 30, 260, color);
    textBox(slide, ready, x + 28, 366, 294, 34, { fontSize: 19, bold: true });
    textBox(slide, restart, x + 28, 414, 294, 34, { fontSize: 17, color: C.muted });
  });
  textBox(slide, "Recovery command", 220, 548, 210, 34, { fontSize: 18, bold: true, color: C.cyan });
  shape(slide, "roundRect", 440, 536, 430, 54, C.panel2, C.line, 12);
  textBox(slide, "make recover && make verify", 458, 544, 394, 38, { fontSize: 21, bold: true, align: "center" });
  addNotes(slide, "The live workflow produced a real Redis Service with no endpoints, connection failures, failed readiness and liveness probes, and seven restarts on the new frontend Pod. KAOP returned high confidence, named the mismatched role selector, identified the liveness regression, and recommended the exact repair. Recovery restored the endpoint and Grafana returned to Normal.", [
    "Live verification from the kaop-demo cluster on 2026-10-07",
    "https://kaop.komodor.com/a/hire-task-9/runs/run_e15c91fc04701d47c908ec0f",
    "https://contentcheetah182.grafana.net/alerting/grafana/fg0jdq07jv9c0e/view",
  ]);
}

const candidatePath = path.join(buildDir, "candidate.pptx");
await (await PresentationFile.exportPptx(presentation)).save(candidatePath);

for (let index = 0; index < presentation.slides.items.length; index += 1) {
  const slide = presentation.slides.items[index];
  const preview = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(buildDir, `slide-${String(index + 1).padStart(2, "0")}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const requirements = {
  explicitTotalSlideCount: 12,
  requiredNativeTableOwnerSlides: [11],
  requiredNativeChartOwnerSlides: [],
  workspaceDir,
};

const fontPolicy = { basis: "design", families: [fontFamily] };
const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir, { recursive: true });

const result = await finalizePresentation({
  ...requirements,
  candidatePath,
  finalPath,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools", "inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
    "--require-native-table-slide", "11",
  ],
  requiredNativeTableOwnerSlides: [11],
  requiredNativeChartOwnerSlides: [],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, `KAOP-by-Nirit-Terehovsky.${buildStamp}.validation.json`),
});

console.log(JSON.stringify({ finalPath, fontFamily, result }, null, 2));
