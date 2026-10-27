# Our Ground backend starter package

Prepared for Jasurbek Elmuratov, 15 October 2026. **Team discussion draft.**

Our Ground helps residents find local support and helps donors find organizations to support. Your backend stores the information, searches it, checks who can change it, and keeps a record of human reviews.

## Start here

1. Read [MVP scope](01-mvp-scope.md): the first complete experience we want to build.
2. Open [sample data](examples/fixtures.json): five entirely fictional food-support listings.
3. Review [architecture](02-architecture.md): how the website, accounts, API and database connect.
4. Read [data schema](03-data-schema.md) alongside the [SQL draft](schema.sql).
5. Share the [API outline](04-api-outline.md) and [OpenAPI contract](openapi.json) with the frontend team.
6. Review [access and verification rules](05-access-and-verification.md) with Penuel before implementation.
7. Use [the implementation checklist](06-implementation-checklist.md) to turn the design into small tasks.

This package contains design documents, a draft schema and an API contract. It does not implement a backend, create cloud accounts, connect real services, or change the deployed website. The SQL has not been executed against PostgreSQL. The included examples are suitable for a local mock, not a real service directory.

## Current repository

The existing site uses Vite and TypeScript. `src/resources.ts` holds 12 illustrative resources. `/support` and `/resources/:id` demonstrate search and detail pages; the main route is a marketing landing page. There is no connected account system or live service database.

Existing map points are illustration coordinates, not latitude/longitude. Existing ZIP-prefix matching is a demo convention, not geocoding. Do not migrate either as real location evidence. Existing examples must never be marked verified automatically.

## Proposed technology choices

| Component | Starting proposal | Why / decision still needed |
| --- | --- | --- |
| Frontend | Keep the current Vite + TypeScript project | Avoid a frontend rewrite to start the backend |
| Backend | A small TypeScript HTTP API | Share field definitions and language with the frontend; framework and hosting remain open |
| Database | PostgreSQL | Organizations, memberships, services and reviews have explicit relationships |
| Accounts | Managed identity provider | Use provider login and recovery; do not build password storage; provider remains open |
| API description | OpenAPI 3.1.1 | A shared, machine-readable request/response contract |
| Location search | Exact pilot-area identifier initially | A small scope without pretending to offer distance or live ZIP lookup |
| AI | Deferred, read-only integration | First make the checked directory and ordinary search work |

These are proposals, not approved team decisions. No paid services or subscriptions have been selected.

## Decisions and open questions

| Question | Draft assumption | Who to discuss with |
| --- | --- | --- |
| Pilot region | Pennsylvania (`us-pa`), chosen by Jasurbek | Selected |
| First real-record collection area? | County/city within PA still open | Whole team |
| First category? | Food assistance | Michael and whole team |
| First resident journey? | Search, read eligibility/hours, contact provider | Michael and Adam |
| Who reviews listings? | A separately authorized reviewer; no self-approval | Penuel and whole team |
| When does verification expire? | 30 days; hide expired listings until rechecked | Whole team; validate operational capacity |
| Who proves organization ownership? | Admin verifies representative and creates membership manually | Penuel |
| Identity provider / backend host? | Not chosen | Jasurbek and Penuel |
| Are donor payments required? | No; show a reviewed way to contact/support the organization | Whole team |
| What should AI return? | Existing service IDs, evidence dates and a short explanation | Penuel |
| What name is used in the app? | Documents say Our Ground; existing site says Access | Whole team |

## Suggested ownership

- **Jasurbek:** schema, backend endpoints, access enforcement, validation and update rules.
- **Penuel:** integration planning, architecture review, and proposed AI integration.
- **Adam:** frontend layouts and implementation coordination for API-driven screens.
- **Michael:** user journeys, accessibility requirements, and MVP priorities.

These reflect the supplied proposal and are for team confirmation. No message has been sent to teammates.

## First review meeting

Walk through one fictional listing from draft to approval to public search. Agree the first PA collection area, reviewer responsibility, API fields and expiration policy. Record decisions here before provisioning infrastructure.

## Technical references

These references informed the draft mechanics; they are not evidence that our implementation exists:

- [PostgreSQL constraints](https://www.postgresql.org/docs/current/ddl-constraints.html): keys, required fields and relationships.
- [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html): API contract format.
- [OWASP REST security guidance](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html): server-side authorization, validation and token checks.

## Local consistency check

Run `node docs/backend/check-package.mjs`. It checks cross-file example consistency, local API references, intended visibility cases and request field boundaries. It is not a full OpenAPI validator or an execution test of the SQL or backend.
