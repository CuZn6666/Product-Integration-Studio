# Product Integration Studio

A full-stack product management prototype that demonstrates a PLM-to-ERP workflow using Java, Spring Boot, React, and TypeScript. Designed as a small, explainable software development interview project.

**ERP integration is simulated.** No requests are sent to SAP, Microsoft Dynamics, or company systems. A successful sync means local validation passed and the product status was saved; no external export occurs.

## Features

- Create, edit, and delete products, with a named confirmation before deletion.
- Search by name or SKU and combine search with Draft, Synced, or Failed status filters.
- Validate required fields, unique SKUs, and nonnegative prices.
- Persist products and sync status in a local H2 database.
- Display simulated sync results in a three-stage React Flow diagram.
- Handle loading, empty results, validation failures, and network errors.

## Technology and architecture

| Layer | Technologies |
| --- | --- |
| Backend | Java 21, Spring Boot 3.5.7, Spring Web, Jakarta Validation, Maven Wrapper |
| Persistence | Spring Data JPA / Hibernate, file-based H2, Java `BigDecimal` prices |
| Frontend | React 18, TypeScript 5.9, Vite 6, PrimeReact 10, React Flow 12, HTML/CSS |
| Tests | JUnit / Spring Boot Test / MockMvc; Vitest / Testing Library / jsdom |

```text
React components → typed fetch client → Vite /api proxy
  → ProductController → ProductService → ProductRepository → H2
```

The controller defines HTTP endpoints, request/response DTOs define the data contract, and the transactional service owns validation and status changes. The repository handles persistence. React keeps the loaded products and UI state in components; search and filtering operate on that local list.

```text
Product-Integration-Studio/
├── Front/
│   ├── src/
│   │   ├── App.tsx                 # Product table, filters, and application state
│   │   ├── ProductDialog.tsx       # Create/edit form
│   │   ├── DeleteProductDialog.tsx # Confirmation and deletion errors
│   │   ├── IntegrationFlow.tsx     # Three-stage sync visualization
│   │   ├── api.ts                 # Typed HTTP client
│   │   ├── productFilters.ts      # Combined search and status filtering
│   │   ├── main.tsx
│   │   └── styles.css
│   ├── tests/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.ts
├── Backend/
│   ├── src/main/java/com/innoface/studio/
│   │   └── ...                    # Controller, service, entities, DTOs, repositories
│   ├── src/main/resources/application.properties
│   ├── src/test/java/com/innoface/studio/ProductApiTest.java
│   ├── .mvn/
│   ├── mvnw / mvnw.cmd
│   └── pom.xml
├── AGENTS.md
├── WORKPACKAGE.md
├── TOKEN_EFFICIENCY.md
└── README.md
```

## Local setup

Install **Java 21**, **Node.js 22.12+** and npm. The Maven Wrapper downloads Maven 3.9.11; a global Maven installation is unnecessary. Initial dependency installation requires internet access.

```sh
git clone https://github.com/CuZn6666/Product-Integration-Studio.git
cd Product-Integration-Studio
```

Run the backend in one terminal, from the project root:

```sh
cd Backend
./mvnw spring-boot:run
```

On macOS, the wrapper selects an installed JDK 21 automatically. On Linux, set `JAVA_HOME` to your JDK 21 installation. Run backend commands inside `Backend/` so the database uses the intended relative path.

Run the frontend in a second terminal, from the project root:

```sh
cd Front
npm ci
npm run dev
```

Open **http://127.0.0.1:5173/**. The API is at **http://127.0.0.1:8080/api/products**. Both services bind to loopback; Vite proxies `/api` to port 8080. Stop each service with `Ctrl+C`.

H2 stores local records in `Backend/data/products.mv.db`, excluded from Git. Initial startup seeds three synthetic products: a gear assembly, a temperature sensor, and a bracket without an ERP category. A persistent initialization marker prevents reseeding after products are deleted, including when all products are deleted. Existing nonempty databases are preserved.

## REST API

| Method | Endpoint | Response |
| --- | --- | --- |
| GET | `/api/products` | `200`: all products, ordered by ID |
| POST | `/api/products` | `201`: created product and a Location header |
| PUT | `/api/products/{id}` | `200`: updated product, reset to `DRAFT` |
| DELETE | `/api/products/{id}` | `204`: empty body; `404` if missing |
| POST | `/api/products/{id}/sync` | `200`: simulated success or business-failure result |

Create/update request:

```json
{"name":"Drive Module","sku":"DEMO-DRIVE-001","price":129.95,"erpCategory":"Drive Systems"}
```

Products contain `id`, `name`, `sku`, `price`, `erpCategory`, and `status`. Name and SKU are required and trimmed; SKU uniqueness is case-sensitive. Prices allow up to 12 integer digits and two decimal places. ERP category may be blank when saving. Invalid input returns `400`, duplicate SKU `409`, and missing IDs `404`; errors include `message` and `fieldErrors`.

Search is a case-insensitive substring match on name **OR** SKU; status combines with search using **AND**. Surrounding search whitespace is ignored. There are no server-side search or pagination parameters.

## Simulated ERP synchronization

1. Create or edit a product; its status is `DRAFT`.
2. Click **Sync to ERP** to call the sync endpoint.
3. The service validates the saved fields and requires a nonblank ERP category.
4. It persists `SYNCED` on success or `FAILED` on business validation failure.
5. The UI displays the result and updates `PLM Input → Validate & Map → ERP Output`.

```json
{"productId":1,"outcome":"SUCCESS","message":"Product validated and exported to the simulated ERP.","status":"SYNCED"}
```

Business failure deliberately returns HTTP `200` with `outcome: "FAILURE"`, a readable message, and `status: "FAILED"`. Unexpected server errors return `500`. A network error leaves the result unconfirmed. The diagram summarizes the request outcome; it does not stream real integration stages or transform data into an ERP-specific payload.

## Tests and production builds

From the project root:

```sh
cd Backend
./mvnw test
./mvnw -DskipTests package
cd ../Front
npm ci
npm test
npm run build
```

Publication verification (22 November 2026): **13 backend tests and 17 frontend tests passed**, the Maven package build succeeded, and the TypeScript/Vite production build succeeded.

Backend integration tests use an isolated in-memory H2 database, covering CRUD, validation, unique SKUs, sync outcomes, and initialization behavior. Frontend tests cover filtering, API error handling, and UI interactions; the React Flow component is mocked in application tests. The production build runs TypeScript checking and Vite bundling.

For a local packaged demo, first complete the builds above. With Java 21 selected, run in separate terminals:

```sh
cd Backend
java -jar target/product-integration-studio-0.0.1-SNAPSHOT.jar
```

```sh
cd Front
npm run preview -- --port 5173 --strictPort
```

The preview proxies `/api` to the local backend. After dependencies and builds are available, this demo needs no external service. To use another backend port for isolated checks, set `STUDIO_API_TARGET` when starting Vite; it defaults to `http://127.0.0.1:8080`.

## Two-minute demonstration

| Time | Action and explanation |
| --- | --- |
| 0–20 s | Introduce the product table and state clearly that ERP integration is simulated. |
| 20–50 s | Add a product with a unique SKU, price, and category; explain React, DTO validation, and persistence. |
| 50–75 s | Sync it and show the successful three-stage flow. |
| 75–100 s | Sync a product without a category, explain the failure, and show how editing enables a retry. |
| 100–120 s | Search/filter, refresh, and briefly show the REST API and H2 persistence. |

## Known limitations

- Local, single-operator prototype: no authentication, authorization, audit history, or conflict resolution.
- Search loads and filters the full dataset; no server-side pagination.
- Deletion is permanent within the app; no undo or soft deletion.
- Only the most recent sync result is visualized; the flow message clears on page reload, while saved statuses persist.
- Fixed React Flow diagram, not an editable workflow engine.
- No real PLM/ERP connection, SAP integration, AWS deployment, or production hosting configuration.

The repository includes source, tests, dependency lockfile, Maven Wrapper, and project documentation. Dependencies, build output, local databases, editor settings, and environment files are excluded. Implementation progress and previous manual verification are recorded in [WORKPACKAGE.md](WORKPACKAGE.md).
