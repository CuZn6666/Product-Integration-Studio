# Product Integration Studio — Agent Instructions

> Scope: this file applies to the entire `Product-Integration-Studio/` repository.
> Read `WORKPACKAGE.md` and `TOKEN_EFFICIENCY.md` before writing code. This project is built primarily through AI-assisted vibe coding.

## 1. Mission

Build a small, working full-stack prototype for an Innoface AG working-student software development interview. The app simulates transferring product data from a PLM system to an ERP system.

**Primary outcome:** a reliable local demo that can be explained in **2 minutes**. Prefer a small working vertical slice over feature breadth.

This is a **simulation**, not a connection to real SAP, Microsoft Dynamics, or company systems. Do not imply otherwise in the UI, README, or interview notes.

## 2. Fixed repository layout

```text
Product-Integration-Studio/
├── AGENTS.md             # Instructions for AI coding agents
├── WORKPACKAGE.md        # Work packages, order, and acceptance checks
├── TOKEN_EFFICIENCY.md   # Concise execution and communication protocol
├── README.md             # Created by the agent: setup and demo guide
├── Front/                # React / TypeScript / Vite application
└── Backend/              # Java / Spring Boot / Maven application
```

- Keep the exact directory names `Front` and `Backend`, including capitalization.
- Place frontend dependencies and source files only inside `Front/`.
- Place backend Maven source and configuration only inside `Backend/`.
- Place shared documentation at the repository root. Avoid extra services or a monorepo framework.
- If either directory already contains user work, inspect it before editing and preserve unrelated changes.

## 3. Required technology

| Area | Use |
| --- | --- |
| Backend | Java 21, Spring Boot 3.x compatible with Java 21, Maven |
| Data | Spring Data JPA, H2 file-based database for data persistence |
| Frontend | React, TypeScript, Vite |
| UI | PrimeReact, HTML, CSS |
| Flow visualization | React Flow (`@xyflow/react`) |
| Local development | macOS Apple Silicon compatible; Git; optional Linux explanation |

Do not introduce Next.js, Redux, Docker, PostgreSQL, authentication, or AWS deployment as hard requirements. Docker, AWS, and Linux deployment instructions are optional stretch goals after the MVP passes.

## 4. Product scenario and MVP

An operator sees PLM products, adds or edits a product, and clicks **Sync to ERP**. The backend validates a small set of mapping rules and returns a simulated result. The frontend displays the state and the React Flow diagram shows the three stages:

`PLM Input → Validate & Map → ERP Output`

### Data contract

Product fields:

| Field | Type / rule |
| --- | --- |
| `id` | `Long`, assigned by backend |
| `name` | string, required |
| `sku` | string, required and unique |
| `price` | decimal (`BigDecimal` in Java), must be nonnegative |
| `erpCategory` | optional string when saving; **required to sync** |
| `status` | enum: `DRAFT`, `SYNCED`, `FAILED` |

Recommended REST contract (JSON, `/api` prefix):

| Method | Path | Behavior |
| --- | --- | --- |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/{id}` | Edit a product |
| POST | `/api/products/{id}/sync` | Simulate validation and ERP export |

Sync success: `erpCategory` exists and product fields are valid; set `status = SYNCED` and show a success message. Sync failure: missing `erpCategory` or invalid required data; set `status = FAILED` and return a clear result. A failed business validation should have a readable JSON result the frontend can display; distinguish it from unexpected server errors. No external ERP request is sent.

Suggested response for the sync endpoint:

```json
{
  "productId": 1,
  "outcome": "SUCCESS",
  "message": "Product validated and exported to the simulated ERP",
  "status": "SYNCED"
}
```

Prefer simple request/response DTOs, a service for business logic, and a repository for persistence. Do not expose a complicated enterprise architecture.

## 5. Vibe coding execution rules

1. **Read first:** inspect the existing tree, `AGENTS.md`, `WORKPACKAGE.md`, `TOKEN_EFFICIENCY.md`, and current Git status before any change. Never overwrite user files blindly.
2. **Execute autonomously:** implement work packages in ascending order. When the user asks to build the full MVP, continue from one verified package to the next without requiring approval after every file.
3. **Stay scoped:** complete only the specified MVP and necessary setup. Ask the user only for material choices, credentials, or actions requiring permissions.
4. **Verify constantly:** after each work package, run relevant build/test commands and fix errors before moving on. Do not mark a package complete based only on generated code.
5. **No per-package time limits:** do not impose estimated hours, timeboxes, or stage-specific deadlines. Work toward the acceptance checks and report actual progress.
6. **Prefer clarity:** readable names, ordinary Spring service/controller/repository separation, typed frontend API client, simple components, and minimal dependencies.
7. **No fabricated success:** never claim that a build, test, UI flow, or Git operation passed without running it. Report failed checks and next steps.
8. **Preserve history:** do not delete user code, replace Git history, force-push, commit, or push unless authorized. Never create or check in real credentials, tokens, secrets, or `.env` values.
9. **Update progress:** check off completed acceptance items in `WORKPACKAGE.md` and give a concise Chinese progress report including files changed, commands run, observed results, and the next work package.
10. **Explain only what matters:** the user prefers vibe coding. Implement rather than providing a long tutorial; include a short explanation of architectural decisions and how to launch the app.
11. **Use English in code:** identifiers and user-visible demo labels may be in English. Communicate progress with the user in Chinese unless asked otherwise.

## 6. Local development conventions

- Backend default port: `8080`; frontend Vite default port: `5173`.
- Use Vite dev-server proxy for `/api` to `http://localhost:8080` to avoid local cross-origin configuration problems.
- Enable persistent H2 file storage under a backend-local, Git-ignored data directory; seed three demo products only when the database is empty.
- Handle loading, empty, success, and error UI states. Display validation failures without crashing the app.
- Prefer controlled form inputs and TypeScript interfaces that match backend DTOs.
- Keep React Flow initially to three connected nodes, with clear state changes. A drag-and-drop workflow editor is out of scope.
- Maintain a `.gitignore` for `node_modules/`, `dist/`, `target/`, generated H2 data, OS/editor artifacts, and local secrets.
- Keep scripts and commands reproducible; do not depend on globally installed CLI packages when Maven/npm project scripts suffice.

## 7. Quality gates and completion

Minimum checks before claiming the MVP is ready:

- `cd Backend && ./mvnw test` (or `mvn test` if no wrapper exists): passing backend tests.
- `cd Front && npm run build`: successful TypeScript check and frontend build.
- Backend local GET returns the three demo products.
- Frontend can create/edit a product and retains it after refresh.
- A product with `erpCategory` syncs successfully; one without it displays a readable failure.
- React Flow shows PLM, validation/mapping, and ERP stages.
- Root `README.md` includes startup commands, local URLs, the simulated nature of the ERP, and a 2-minute demo sequence.

If time is short, prioritize **working API → working UI → sync → flow visualization → demo polish**. Do not attempt optional AWS deployment until all checks pass.

## 8. Completion report format

After each package, reply briefly in Chinese:

```text
完成：WP-0X — <name>
实现：<2–4 concise points>
验证：<commands and actual results>
修改文件：<key paths>
下一步：WP-0Y
阻塞（如有）：<specific issue>
```

