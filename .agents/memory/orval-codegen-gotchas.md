---
name: Orval codegen import/naming gotchas
description: Naming and import-path pitfalls when consuming generated api-zod/api-client-react code in this monorepo.
---

- Generated Zod response schemas in `@workspace/api-zod` are named after the `operationId`, not the response schema name in the OpenAPI spec. E.g. an operation `getGrades` returning schema `GradesResponse` generates a Zod const `GetGradesResponse`, not `GradesResponse`. Grep the generated file for the exact export name before importing/using `.parse()` on the server.
- Frontend code must import generated types/hooks from the package root (`@workspace/api-client-react`), never from internal paths like `@workspace/api-client-react/src/generated/api.schemas` — the package doesn't expose that subpath and Vite's dependency scanner fails with "Missing specifier" errors. A design/build subagent produced this mistake across many files in one pass; grep for `/src/generated/` imports after subagent-authored frontend work that consumes generated API types.
