import { test } from "node:test";
import assert from "node:assert/strict";
import {
  AGENT_ROLES,
  TASK_TEMPLATES,
  QUICK_ASSIGNMENTS,
  getRole,
  getRoleNames,
  getRolesByCategory,
  getTaskTemplate,
  formatTaskFromTemplate,
  getQuickAssignment,
} from "../role-templates.js";

const EXPECTED = [
  "COMPANION",
  "COORDINATOR",
  "MU_PM",
  "WYLDING_PM",
  "PLATFORM_PM",
  "BUSINESS_PM",
  "STEWARD",
  "SCRIBE",
];

test("the 8 Aeonia roles exist (and only those)", () => {
  assert.deepEqual(getRoleNames().sort(), [...EXPECTED].sort());
});

test("every role is well-formed", () => {
  for (const key of EXPECTED) {
    const r = getRole(key);
    assert.ok(r, `${key} missing`);
    for (const field of ["name", "category", "description", "prompt", "capabilities", "defaultTasks", "priority"]) {
      assert.ok(r[field] !== undefined, `${key}.${field} missing`);
    }
    assert.ok(Array.isArray(r.capabilities) && r.capabilities.length > 0);
    assert.ok(Array.isArray(r.defaultTasks) && r.defaultTasks.length > 0);
  }
});

test("each role prompt boots from its KOS thread", () => {
  const path = {
    COMPANION: "role/companion",
    COORDINATOR: "role/coordinator",
    MU_PM: "domains/mu/mu-pm",
    WYLDING_PM: "domains/wylding/wylding-pm",
    PLATFORM_PM: "domains/platform/platform-pm",
    BUSINESS_PM: "domains/business/business-pm",
    STEWARD: "role/steward",
    SCRIBE: "role/scribe",
  };
  for (const [key, frag] of Object.entries(path)) {
    assert.ok(getRole(key).prompt.includes(frag), `${key} prompt should reference ${frag}`);
  }
});

test("categories cover the org shape", () => {
  assert.equal(Object.keys(getRolesByCategory("Executive")).length, 1);
  assert.equal(Object.keys(getRolesByCategory("Coordination")).length, 1);
  assert.equal(Object.keys(getRolesByCategory("Domain PM")).length, 4);
  assert.equal(Object.keys(getRolesByCategory("Function Agent")).length, 2);
});

test("no task template references a non-existent role (dangling-ref guard)", () => {
  for (const [k, t] of Object.entries(TASK_TEMPLATES)) {
    if (t.assignedRole !== null && t.assignedRole !== undefined) {
      assert.ok(AGENT_ROLES[t.assignedRole], `TASK_TEMPLATES.${k}.assignedRole '${t.assignedRole}' is not a real role`);
    }
  }
});

test("no quick assignment references a non-existent role or template", () => {
  for (const [k, q] of Object.entries(QUICK_ASSIGNMENTS)) {
    for (const r of q.suggestedRoles || []) {
      assert.ok(AGENT_ROLES[r], `QUICK_ASSIGNMENTS.${k} suggests non-existent role '${r}'`);
    }
    assert.ok(getTaskTemplate(q.template), `QUICK_ASSIGNMENTS.${k}.template '${q.template}' is not a real template`);
  }
});

test("formatTaskFromTemplate substitutes variables", () => {
  const t = formatTaskFromTemplate("DOMAIN_DIGEST", { domain: "Mission Unpossible" });
  assert.ok(t.title.includes("Mission Unpossible"));
  assert.ok(!t.title.includes("{domain}"));
});

test("getQuickAssignment resolves", () => {
  assert.ok(getQuickAssignment("CROSS_DOMAIN_PRIORITY"));
});
