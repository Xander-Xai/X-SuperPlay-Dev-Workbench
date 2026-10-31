// Shared project identity for every generated artifact.
// Spec, Tickets, ADR and Agent handoff must agree on project id, type and base SHA.
import { RUNTIME, OWNER, PROVENANCE } from "./catalog.mjs";

const clean = (value, max = 200) =>
  String(value ?? "").replace(/\r?\n/g, " ").replace(/-->/g, "-- >").trim().slice(0, max);

export function projectIdentity(plan) {
  if (!plan || !plan.config || !plan.slug) throw new TypeError("Invalid plan");
  return Object.freeze({
    projectId: plan.slug,
    projectName: plan.config.name,
    projectType: plan.config.type,
    task: plan.task?.id ?? plan.config.task,
    mode: plan.config.mode,
    tier: plan.tier?.id ?? plan.config.tier,
    profiles: [...plan.profiles],
    baseSha: plan.config.baseline?.headSha ?? "UNKNOWN",
    runtime: RUNTIME.name + " " + RUNTIME.version,
    currentOwner: OWNER.repository,
    historicalSource: PROVENANCE.repository + "@" + PROVENANCE.commit,
    status: "DRAFT_NOT_EXECUTED"
  });
}

export function identityBlock(plan) {
  const id = projectIdentity(plan);
  return [
    "<!-- WORKBENCH_PROJECT_IDENTITY",
    "project_id: " + clean(id.projectId),
    "project_name: " + JSON.stringify(clean(id.projectName)),
    "project_type: " + clean(id.projectType),
    "task: " + clean(id.task),
    "mode: " + clean(id.mode),
    "tier: " + clean(id.tier),
    "profiles: [" + id.profiles.map(x => clean(x, 40)).join(", ") + "]",
    "base_sha: " + clean(id.baseSha, 40),
    "runtime: " + clean(id.runtime),
    "current_owner: " + clean(id.currentOwner),
    "historical_source: " + clean(id.historicalSource),
    "status: " + id.status,
    "-->"
  ].join("\n");
}
