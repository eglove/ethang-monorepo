import { defineRule } from "../../define.ts";

export const codeVerification = defineRule({
  content: `# Code Verification & Transition Handoff

Use this rule to perform software quality gates verification, SonarCloud integration, OWASP Top 10 code reviews, and utilization/transition planning (SWEBOK Ch 10, Ch 12, Ch 13).

## Verification & Validation Quality Gates

With tests passing, commit the changes to a PR branch, push, and verify remote CI checks before auditing SonarCloud issues.

### 1. Test Coverage Verification
- Unit & integration test coverage must be **100%** on all new and changed code lines/branches.

### 2. SonarCloud Quality Gate
Query the SonarCloud API for the PR branch:
- Status check: \`/api/qualitygates/project_status\`
- Measures check: \`/api/measures/component\` for \`bugs, vulnerabilities, code_smells, coverage, cognitive_complexity, sqale_rating\`.
- **Hard Gate:** A SonarCloud quality gate status of **FAIL** blocks release. All new smells, bugs, or vulnerability findings must be remediated.

### 3. Web Performance Audit (Frontend)
For React/frontend routes, measure Core Web Vitals (LCP, INP, CLS) impact. Surface any regressions as HIGH severity.

## OWASP Top 10 Review

Verify every changed file against the OWASP Top 10:
- **A01 Broken Access Control**: Validate authorization scopes and guards in Hono routes.
- **A02 Cryptographic Failures**: Check for hardcoded secrets, weak hashes, or unencrypted storage.
- **A03 Injection**: Ensure no raw SQL string concatenation in Drizzle; no unsanitized \`dangerouslySetInnerHTML\`.
- **A04 Insecure Design**: Check route authentication/validation limits; prevent bypasses.
- **A05 Security Misconfiguration**: Check CORS permissive origins; ensure error responses strip internals.
- **A06 Vulnerable Components**: Check for outdated packages or known CVE dependencies.
- **A07 Auth Failures**: Verify token session/cookie storage configurations (\`httpOnly\` cookies).
- **A08 Integrity Failures**: Verify data serialized/deserialized conforms to strict schemas.
- **A09 Logging Failures**: Verify PII, credentials, or tokens are not leaked in logs.
- **A10 SSRF**: Ensure Server-side \`fetch\` target URLs are validated and restricted.

Verify all high/critical threat mitigations identified in the STRIDE threat model are implemented.

## Utilization & Transition Handoff

Generate stubs for deployment:
1. **Cloudflare Deployment**: wrangler.jsonc stubs and GitHub Actions workflow YAML configurations.
2. **Transition Report**: Provide this summary report inline to the user.

### Report Template

\`\`\`
TRANSITION_REPORT:

## Stakeholder Needs Satisfaction (Validation)
For each STAKEHOLDER_NEED: [need] → satisfied by [FR-N] → verified by [test name] ✅/❌

## Requirements Traceability (Verification)
For each FR-N: [requirement] → implemented in [file] → covered by [test] → SonarCloud: [pass/fail] ✅/❌

## Security Summary
STRIDE threats identified: [N] | Mitigated: [N] | Deferred: [N]
OWASP findings: [N] CRITICAL | [N] HIGH | [N] MEDIUM | [N] LOW resolved

## Quality Gate Summary
SonarCloud: PASSED | Coverage: [X%] | Bugs: [N] | Vulnerabilities: [N] | Tech Debt Rating: [A-E]

## Deployment Artifacts Generated
- wrangler.jsonc stub: [inline or path]
- GitHub Actions workflow: [inline or path]

## Maintenance Handoff
Maintenance class: Corrective | Adaptive | Perfective | Preventive
Technical debt deferred: [list or "None"]
Recommended next actions: [list]
\`\`\``,
  description:
    "code verification, PR checks, SonarCloud analysis, security review, Web performance audit, or preparing transition reports",
  filename: "code-verification",
  trigger: "model_decision"
});
