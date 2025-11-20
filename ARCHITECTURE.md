# GitKB Architecture & Roadmap

## 1. Current Architecture (Prototype)

GitKB is currently a **Client-Side Single Page Application (SPA)** built with React, TypeScript, and Tailwind CSS. It uses a "Serverless" architecture where all backend logic is mocked within the browser.

### Tech Stack
*   **Framework**: React 19 (via Next.js patterns, currently raw CRA/Vite style structure)
*   **Routing**: Hash-based Client Side Routing (`#/find`, `#/save`)
*   **Styling**: Tailwind CSS
*   **Icons**: Lucide React
*   **Charts**: Recharts
*   **State Management**: Local React State (`useState`, `useEffect`)

### Directory Structure
```
/
├── components/       # Reusable UI components (Layout, Inputs, Modals)
├── pages/            # Page-level components
│   ├── admin/        # Admin sub-pages (Analytics, Metadata, Settings)
│   └── ...
├── services/         # API layer
│   └── mockApi.ts    # SIMULATED BACKEND (Critical)
├── constants.ts      # Static data, Schemas, Mock Asset Data
├── types.ts          # TypeScript Interfaces
└── App.tsx           # Main Router & Entry Point
```

### Data Flow (Mock)
1.  **Read**: `FindPage` calls `api.search()`. `mockApi.ts` filters an in-memory array `MOCK_ASSETS` (defined in `constants.ts`) using client-side string matching.
2.  **Write**: `SavePage` calls `api.save()`. `mockApi.ts` generates a fake ID and commits SHA, appends to the in-memory array. This data **does not persist** on reload.
3.  **Intake**: `api.getInbox()` returns static mock Slack/Email messages.

---

## 2. Roadmap to Production

To convert this prototype into a real application, the following subsystems must be implemented.

### Phase 1: Backend & Storage (The "Real" API)

**Goal**: Replace `services/mockApi.ts` with a real HTTP Client calling a backend service.

*   **API Service**: Build a service (FastAPI or Node.js/Express).
    *   **Endpoints**:
        *   `GET /api/assets?q=...` -> Queries Search Engine.
        *   `POST /api/assets` -> Commits to Git + Indexes.
        *   `POST /api/extract` -> Sends file to Apache Tika.
*   **Git Integration**:
    *   The API Service needs a Service Account (SSH Key/PAT) to push to the repo.
    *   *Decision*: Do we commit directly to `main` or create a PR per asset? (Recommendation: Direct commit for MVP, PR for "High" importance).
*   **Search Engine**:
    *   Deploy **Meilisearch** or **OpenSearch**.
    *   Create an index `kb_assets`.
    *   Sync logic: When Git commit happens -> Webhook triggers Indexer -> Update Search Engine.

### Phase 2: Authentication & Governance

*   **Auth**:
    *   Replace hardcoded "John Doe" in `Layout.tsx`.
    *   Integrate OIDC (Azure AD / Okta).
    *   Pass JWT tokens in API headers.
*   **RBAC**:
    *   Implement roles: `Contributor`, `Admin`, `Viewer`.
    *   Restrict `/admin` routes in `App.tsx` based on user role.

### Phase 3: External Integrations

*   **Slack App**:
    *   Build a Slack Bot that listens to channels/DMs.
    *   On message: Extract text -> `POST /api/inbox`.
*   **Email Hook**:
    *   SendGrid/AWS SES inbound parser -> `POST /api/inbox`.

---

## 3. Implementation TODOs & Decisions

### Frontend TODOs
- [ ] **API Client**: Create `services/apiClient.ts` using `fetch` or `axios` to replace `mockApi`.
- [ ] **Error Handling**: Add Toast notifications (Success/Error) instead of `alert()`.
- [ ] **Form Validation**: Integrate Zod or React Hook Form for robust schema validation.
- [ ] **File Upload**: Implement actual multipart/form-data upload logic.

### Backend TODOs
- [ ] **Schema Enforcement**: Server-side validation of `metadata.yaml` against JSON Schemas.
- [ ] **File Storage**:
    *   *Decision*: Store binaries (PPTX, PDF) in Git LFS or S3?
    *   *Recommendation*: S3 (or MinIO) for blobs, Git strictly for Metadata (YAML/JSON).

### DevOps TODOs
- [ ] **CI/CD**: Pipeline to build React app and deploy API container.
- [ ] **Environment Variables**:
    *   `REACT_APP_API_URL`
    *   `OIDC_CLIENT_ID`

---

## 4. Mock Data Call-outs

The following files contain fake data that must be replaced:

1.  **`constants.ts`**:
    *   `MOCK_ASSETS`: Delete this.
    *   `SCHEMAS`: Move this to the Backend. The Frontend should fetch schemas via `GET /api/schemas` to stay dynamic.
2.  **`services/mockApi.ts`**:
    *   Entire file should be deleted and replaced with real HTTP calls.
    *   `search()`: Currently does `array.filter()`. Real version calls Search API.
    *   `getFacets()`: Currently hardcoded. Real version aggregates from Search API.

