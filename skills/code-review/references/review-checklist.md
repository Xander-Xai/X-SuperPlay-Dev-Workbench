# Review Checklist

- Diff:
- Intent source (spec / ticket):
- Base SHA:

## Pass 1 — AC correctness

| AC | Implementing code | Test encoding it | Result |
|---|---|---|---|
| AC-1 | file:line | file:line | OK / FINDING |

## Pass 2 — Security

- [ ] Authn/authz on new entry points
- [ ] Tenant or ownership boundary
- [ ] Injection points (user input, model output, tool results)
- [ ] Secrets / credentials
- [ ] Rate limiting on expensive paths

Security findings are `block-security`.

## Pass 3 — Boundaries

- [ ] Contract changes documented
- [ ] Cross-repo impact identified
- [ ] Migration downgrade path exists
- [ ] Nested AGENTS rules respected

## Pass 4 — Tests

- [ ] Tests encode behavior, not implementation
- [ ] Negative cases present
- [ ] No silently skipped tests

## Pass 5 — Simplification (suggestions)

- Dead code:
- Duplication:
- Premature abstraction:

## Verdict

- approve | block | block-security
- Objections (file:line, testable):
- Follow-ups (non-blocking):
