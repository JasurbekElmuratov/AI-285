# Our Ground backend and frontend integration

One Vite/TypeScript frontend, one REST API, and Supabase PostgreSQL/Auth. The simplified scope is Pennsylvania, food/healthcare discovery, optional Google sign-in, assigned staff editing, and anonymous correction reports. Verification workflows, payments and AI remain outside this implementation.

**Real-service setup is still blocked by missing credentials/account access.** Read [SETUP.md](SETUP.md) for exact database, Google, redirect and staff-assignment steps. Read [VERIFICATION.md](VERIFICATION.md) for checks actually performed. The [architecture proposal](../our-ground-backend-proposal/README.md) remains a team-review reference.

## Run without credentials

```sh
npm install
npm run dev:api:demo
# In another terminal:
npm run dev -- --host 127.0.0.1 --port 5173 --strictPort
```

Open `/support`, enter `17101` or `Harrisburg`, select Food and a distance, then open the fictional pantry and submit a correction report. `19102` / `Philadelphia` has the healthcare example. These screens now use the API, including loading, empty and error states, pagination, keyword/category/radius filters, and links preserving search filters. No old static resource is used as a fallback.

Demo mode is in-memory. All records are labeled `fictional_demo`; contact/directions actions are disabled, and changes/reports disappear on restart. Google login always requires real Supabase configuration. Demo mode does not introduce fake authentication.

For persistent records set `BACKEND_DATA_MODE=postgres` and follow [SETUP](SETUP.md). `npm run dev:api` requires a configured database for data queries. It does not silently switch to demo records. `/health` checks the process, not database readiness.

## Routes and screens

All routes below are under `/api/v1`.

| Method/path | Screen | Access |
| --- | --- | --- |
| `GET /health` | Local diagnostics | Public |
| `GET /categories` | Category definitions | Public |
| `GET /places/resolve?q=17101` | Search location | Public |
| `GET /resources` | `/support` list and current-page map markers | Public, published records only |
| `GET /resources/:id` | `/resources/:id` | Public, published records only |
| `POST /correction-reports` | Resource detail report form | Anonymous |
| `GET /me` | `/account` | Valid Supabase session |
| `GET /services` | `/account` assigned service list | Only records the caller can edit |
| `GET /services/:id` | `/staff/services/:id` | Assigned organization editor or admin |
| `PATCH /services/:id` | Staff editing form | Same ownership check, repeated in SQL |

New Google accounts default to `role=user` and have no memberships. Staff membership is an explicit owner action. Every protected route validates the bearer token with Supabase; request-body roles/ownership fields are rejected. App records live in a private database schema. The restricted SQL role cannot change roles, memberships or service ownership.

## Requests and responses

Search requires `lat` and `lng`; optional fields are `category=food|healthcare`, `radius_miles=1..50` (default 25), `q` (up to 100 characters), `page` and `page_size=1..50` (default 20). Coordinates are checked against a Pennsylvania bounding rectangle; stored locations must say `PA`. The rectangle is not an exact state polygon. Distances are straight-line miles, not travel estimates.

```http
GET /api/v1/resources?lat=40.2732&lng=-76.8867&category=food&radius_miles=10&page=1&page_size=20
```

```json
{"search_center":{"latitude":40.2732,"longitude":-76.8867},"items":[{"id":"11111111-1111-4111-8111-111111111111","title":"Demo Community Pantry — fictional","summary":"Fictional food support example.","category_slugs":["food"],"organization":{"id":"22222222-2222-4222-8222-222222222222","name":"Demo Community Organization"},"location":{"city":"Harrisburg","state":"PA","address_label":"DEMO POINT — NOT A VISITABLE ADDRESS","latitude":40.2732,"longitude":-76.8867},"distance_miles":0,"data_kind":"fictional_demo","source_recorded_at":null}],"page":1,"page_size":20,"total":1,"has_next":false}
```

A public detail adds description, listed hours, eligibility, cost, contact and provenance. The UI escapes stored text, rejects unsafe URL schemes and suppresses all fictional contact actions. A source-recorded date is not verification or current availability. The map and list show the same API page; if map tiles fail, list results remain usable.

```http
POST /api/v1/correction-reports
Content-Type: application/json

{"service_id":"11111111-1111-4111-8111-111111111111","reason_code":"wrong_hours","description":"Example correction."}
```

HTTP 202 returns `{"id":"...","status":"open","message":"Thank you. The report was received."}`. Reasons: `wrong_hours`, `closed`, `wrong_contact`, `wrong_eligibility`, `wrong_location`, `other`. Description is optional, max 1,000 characters. No name, email or personal circumstances are requested. Reports do not automatically alter listings and report text is not public.

Staff load `GET /services/:id` to obtain the current version, then send:

```http
PATCH /api/v1/services/11111111-1111-4111-8111-111111111111
Authorization: Bearer <Supabase access token>
Content-Type: application/json

{"expected_version":1,"summary":"Updated fictional description.","status":"published"}
```

Editable fields: `title` (2–160 characters), `summary` (max 500), nullable `eligibility_text` / `cost_summary` (max 500), and `status` (`draft`, `published`, `hidden`). Each accepted edit increments the version atomically. A stale version returns 409; the form keeps unsaved text, disables resaving and offers an explicit reload. Unknown fields and bodies over 16 KiB are rejected.

Errors share `{"error":{"code":"...","message":"...","fields":{}}}` (fields optional). Statuses: 400 malformed JSON, 401 invalid/missing session, 404 missing/private record, 409 version conflict, 413 oversized body, 422 invalid fields/location, 503 unavailable configuration/provider, 500 other server errors. Internal database/provider details stay out of responses and logs.

## Code map

- `backend/app.ts`: routing, request validation and permission gates.
- `backend/postgres.ts`: parameterized SQL, repeated ownership checks and atomic version updates.
- `backend/runtime.ts`: Supabase token validation and transient Mapbox geocoding.
- `backend/demo.ts`: disposable fictional repository; no auth bypass.
- `backend/migrations/`: original migrations plus explicit browser-role denial.
- `backend/manage-db.mjs`: explicit development-target checks, transactional migration journal, schema/role verification and deliberate staff grants.
- `shared/contracts.ts`: frontend data shapes.
- `src/support.ts`, `src/resource-detail.ts`: API-backed resident screens.
- `src/account.ts`, `src/backend-client.ts`, `src/staff.ts`: Google PKCE and assigned staff editing.
- `src/resource-map.ts`: optional Mapbox display of API coordinates in the existing map panel.
- `api/index.ts`: Vercel function entry; no deployment was made.

Postgres.js uses TLS, one connection per process, disabled prepared statements and serialized queries to avoid shared-pooler pipelining. [Supabase Postgres.js guidance](https://supabase.com/docs/guides/database/postgres-js). The browser uses public Supabase project values only; Google secrets stay in Supabase and database passwords remain server/local-tool values. The SDK manages the browser session; Our Ground does not call Google data APIs or copy provider tokens into its own database.

## Checks and remaining work

```sh
npm test
npm run build
npm run check:setup
npm run db:verify
npm run test:integration
```

The first two run without account credentials. Setup/database/live checks identify missing access explicitly. See [VERIFICATION](VERIFICATION.md) for evidence and limitations. Live Supabase SQL/PostGIS, real Google consent/login and authorized browser editing have not been claimed as passed.

Organization/location creation, invitations, hours/category/contact editing, report administration, campaigns, payments and AI remain future work. Initial organizations and memberships are maintained by a project owner. Add shared rate limiting for reports/geocoding before a public deployment; this task does not deploy.
