# Product Integration Studio — Work Packages

**Goal:** complete a small PLM-to-ERP simulation for an Innoface AG software development interview.

**Working mode:** AI agent implements the project end to end; user reviews the running demo. Follow `AGENTS.md` and `TOKEN_EFFICIENCY.md`. The folder names are **`Front/`** and **`Backend/`**.

**Execution policy:** work packages have no estimated hours, timeboxes, or individual deadlines. Finish each package according to its acceptance criteria, then continue to the next.

## Definition of Done

The project is ready when all of these are true:

- [x] React app displays products from the Java REST API.
- [x] Creating or editing a product persists through an H2 database and survives refresh.
- [x] Sync to ERP produces a successful result for a mapped product.
- [x] Sync displays a clear failure for a product missing `erpCategory`.
- [x] A three-node React Flow diagram visualizes the process.
- [x] Backend tests and frontend build pass; README explains how to run the app.
- [x] The entire demo can be delivered in 2 minutes without internet access.

## Scope and priority

**P0 mandatory:** project setup, backend CRUD, frontend CRUD, simulated sync, React Flow view, local launch instructions, verification.

**P1 after P0:** search/filter, improved validation messages, a compact sync activity history, extra unit tests.

**P2 after the interview only:** Docker, Linux deployment, AWS hosting, authentication, real ERP integrations, an editable drag-and-drop workflow designer.

## WP-00 — Inspect and scaffold the project

**Dependencies:** none  

Agent tasks:

1. Inspect `Front/`, `Backend/`, installed Java/Node/npm/Maven, Git status, and existing files; preserve anything already present.
2. Initialize `Backend/` with Java 21, Spring Boot, Maven, Spring Web, Spring Data JPA, Validation, and H2.
3. Initialize `Front/` with Vite, React, TypeScript, PrimeReact, and `@xyflow/react`.
4. Set local ports (`8080`, `5173`) and a Vite `/api` proxy; create sensible `.gitignore` files.
5. Add a minimal root `README.md` with the project purpose and initial startup commands.

Acceptance checks:

- [x] `Backend/` has `pom.xml` and runnable Spring Boot entry point.
- [x] `Front/` has `package.json` and a runnable Vite app.
- [x] Both apps can start without missing dependencies.

**Stop and report** if required installations cannot be performed safely or the existing project structure conflicts with this plan.

## WP-01 — Product model and REST API

**Dependencies:** WP-00  

Agent tasks:

1. Implement `Product` with `id`, `name`, `sku`, `price`, `erpCategory`, and `status` (`DRAFT`, `SYNCED`, `FAILED`).
2. Use JPA repository and a file-backed H2 database (Git-ignored). Seed three demo products when empty.
3. Implement `GET /api/products`, `POST /api/products`, and `PUT /api/products/{id}`.
4. Validate required fields and nonnegative price. Reject duplicate SKU and missing IDs with clear HTTP errors.
5. Add at least one backend test for a successful request and one for invalid input.

Acceptance checks:

- [x] GET returns three demo products in JSON.
- [x] POST creates a product; PUT updates it.
- [x] Restarting the backend does not erase data.
- [x] Backend test command passes.

## WP-02 — Product Management UI

**Dependencies:** WP-01  

Agent tasks:

1. Build one clean responsive page titled **Product Integration Studio**.
2. Use PrimeReact `DataTable` to display name, SKU, price, ERP category, and status.
3. Add a PrimeReact `Dialog` for creating and editing a product. The `erpCategory` field may be blank when saving.
4. Create a small typed API module for GET/POST/PUT. Use Vite proxy for requests to `/api`.
5. Show loading, empty table, validation errors, and successful save feedback.

Acceptance checks:

- [x] Product table loads data from the Java backend (not a hardcoded frontend array).
- [x] Add and edit actions work.
- [x] Refreshing the browser preserves changes.
- [x] `npm run build` succeeds.

## WP-03 — Simulated ERP sync

**Dependencies:** WP-01 and WP-02  

Agent tasks:

1. Implement `POST /api/products/{id}/sync` in a backend service.
2. Treat missing `erpCategory` as a business validation failure (`status = FAILED`); valid products become `SYNCED`.
3. Return a typed result with `productId`, `outcome`, `message`, and `status`.
4. Put a **Sync to ERP** action in the frontend. Refresh product status after the call and display the result.
5. Add backend tests for sync success and sync failure.

Acceptance checks:

- [x] A valid mapped product syncs and is marked `SYNCED`.
- [x] A product without ERP category is marked `FAILED` with a clear explanation.
- [x] No external ERP or SAP connection is required.
- [x] Backend tests pass.

## WP-04 — React Flow integration diagram

**Dependencies:** WP-03  

Agent tasks:

1. Add a visible React Flow canvas with three connected nodes: **PLM Input**, **Validate & Map**, **ERP Output**.
2. When a product is selected and Sync is clicked, show a simple progress/success/failure state in the diagram and a readable message.
3. Use a compact layout that can be demonstrated without scrolling around or editing nodes.
4. Keep the product list and flow on the same page or separated by simple tabs; choose the clearest 2-minute demo layout.

Acceptance checks:

- [x] All three nodes and connections render.
- [x] The flow reflects the latest sync outcome.
- [x] Frontend build passes, and the canvas is usable on a laptop screen.

## WP-05 — End-to-end QA and interview demo

**Dependencies:** WP-00 through WP-04  

Agent tasks:

1. Run all backend tests and the frontend production build; fix any errors.
2. Perform a manual check: list → add → edit → refresh → sync success → sync failure.
3. Ensure three sensible seed products and at least one product with a missing ERP category are easy to demo.
4. Finish root `README.md`: prerequisites, start backend/frontend, local URLs, REST endpoints, known limits, and demo script.
5. Keep the repository free of generated binaries, H2 data, credentials, and oversized dependencies.
6. Provide a concise summary of changes, verification, and remaining limitations. Do **not** commit or push unless asked.

Acceptance checks:

- [x] `cd Backend && ./mvnw test` or `mvn test` passes.
- [x] `cd Front && npm run build` passes.
- [x] End-to-end demo works locally with no external API.
- [x] README contains exact commands that match the current project.

## WP-06 — CRUD and Search Enhancement

**Dependencies:** WP-00 through WP-05. Authorized as a complete local enhancement; no commit, push, publication, or deployment.

Implementation:

- Backend `DELETE /api/products/{id}` returns 204 without a body; unknown IDs return readable 404 errors.
- Frontend confirmation names the product/SKU, supports safe cancellation, pending state, retryable failure, and updates data/counts/flow after success.
- Immediate, case-insensitive, trimmed substring search across name OR SKU, combined with status using AND.
- All statuses / Draft / Synced / Failed, clear filters, matching/total count, and distinct empty/no-match states.
- Persistent initialization marker prevents reseeding after all products are deleted.

Acceptance checks:

- [x] Backend deletion removes only the requested product; missing/malformed IDs return clear errors.
- [x] Frontend requires confirmation; cancellation sends no delete request.
- [x] Pending deletion prevents duplicate actions; failed deletion keeps the row and can be retried.
- [x] Successful deletion updates the table/statistics and clears the deleted product's latest flow result.
- [x] Name and SKU searches ignore case and surrounding spaces and treat special characters literally.
- [x] Each status filter and combined search/filter work; clear filters restores all loaded rows.
- [x] Create/edit/sync/delete reapply current filters; refresh retains filters.
- [x] Empty table and no matches have separate, readable messages.
- [x] `cd Backend && ./mvnw test`: 13 tests passed, including existing MVP regressions.
- [x] `cd Front && npm test`: 17 tests passed across filter, API client, and UI behavior tests.
- [x] `cd Front && npm run build`: production build and TypeScript check passed.
- [x] Live HTTP create/edit/sync/delete verified through the Vite proxy on isolated ports 5174/8081.
- [x] Deleted all records in the isolated QA database; after a real backend restart it remained empty.
- [x] Chrome verified search/filter/clear, confirmation/cancel, sync success/failure and React Flow, and the empty database after restart.
- [x] README documents deletion, filter semantics, verification, limitations, and restart instructions.

Verification notes: confirmed deletion, pending/retry behavior, and flow cleanup were exercised in automated UI tests; actual persistent deletion was exercised through HTTP. Browser checks used the production frontend build. Existing services on 8080/5173 and their database were preserved; QA data lives under ignored `Backend/target/enhancement-qa/`.

### Remaining optional extras — not part of this task

- [ ] Add simple sync history.
- [ ] Add a Dockerfile or Compose setup for local packaging.
- [ ] Document AWS hosting without claiming it is deployed.

## GitHub publication preparation — 22 November 2026

Publication of `CuZn6666/Product-Integration-Studio` as a public repository is explicitly authorized by the user; this supersedes the earlier task-specific no-commit/no-push restrictions for this publication task.

- [x] Inspected existing source and confirmed there was no prior Git history.
- [x] Reviewed all 47 intended files for credentials and personal information; removed the personal interview date from public documentation.
- [x] Expanded root ignore rules for databases, caches, build output, logs, temporary files, editor settings, and local credentials; local files are preserved.
- [x] Prepared README with architecture, API contract, setup, testing, demo, and simulation limitations.
- [x] Backend `./mvnw test`: 13 passed, no failures or errors.
- [x] Backend `./mvnw -DskipTests package`: succeeded after the test run.
- [x] Frontend `npm test`: 17 passed; `npm run build`: succeeded.

No application source or dependency configuration was changed for publication. Maven Wrapper and npm lockfile are included; local database records and generated artifacts are excluded. No project license was added. Backend tests emit a non-failing Mockito dynamic-agent warning on Java 21. This publication check reran automated tests/builds; earlier manual browser verification remains documented above.

## Two-minute interview demo

| Time | Demo action | Simple English description |
| --- | --- | --- |
| 0–20 s | Introduce the app | “This app simulates the transfer of product data from PLM to ERP.” |
| 20–50 s | Show product table and add a product | “I built the interface with React, TypeScript and PrimeReact.” |
| 50–90 s | Click Sync and show React Flow status | “A Java Spring Boot service validates the product and simulates the export.” |
| 90–120 s | Show API and persistence | “The backend exposes REST endpoints and stores product data in H2.” |

## Starter prompt for a coding agent

Copy this once after placing both Markdown files at the repository root:

> Read `AGENTS.md`, `WORKPACKAGE.md`, and `TOKEN_EFFICIENCY.md` completely. Inspect the existing `Front/` and `Backend/` directories and Git status. Implement WP-00 through WP-05 autonomously in the stated order. Keep the exact folder names. After each work package, run its acceptance checks, fix failures, and update the checklist. Prioritize a reliable 2-minute Innoface interview demo. Do not add real SAP integration, deployment, credentials, or extra frameworks. Preserve existing user work. Do not commit or push. At the end, give me a concise Chinese summary of the implemented functionality, commands run, test results, and how to start the app.

