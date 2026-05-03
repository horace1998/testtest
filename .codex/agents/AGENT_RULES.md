# SYNKIFY Global Agent Rules

These rules apply to every SYNKIFY agent.

## Scope

- Work only on the files assigned or directly relevant.
- Do not index the entire repository.
- Do not perform broad refactors.
- Do not touch unrelated files.
- Keep changes small, reviewable, and reversible.

## React Rules

- Use functional components.
- Use hooks instead of class components.
- Preserve existing app patterns.
- Keep state as local as possible.
- Avoid unnecessary global state.

## Firebase Rules

- Treat schema changes as high-risk.
- Avoid broad collection reads.
- Preserve auth safety.
- Validate assumptions before writing data logic.

## Performance Rules

- Avoid unnecessary dependencies.
- Avoid large generated files.
- Avoid expensive animations.
- Avoid repeated Firestore reads in render paths.
- Avoid full-codebase scanning unless explicitly approved.

## Review Rules

Before finalizing any change, the responsible agent should confirm:

- What files were changed
- Why they were changed
- Whether tests/build were run
- Any remaining risks
