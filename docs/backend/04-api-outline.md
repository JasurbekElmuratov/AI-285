# API outline

An endpoint is an address the website calls to read or change information. Full request and response shapes are in [openapi.json](openapi.json). These routes are proposed and do not exist yet.

Base path: `/api/v1`. JSON field names use `snake_case`. IDs are UUID strings. Timestamps use UTC ISO 8601. Authenticated operations use a managed provider's access token; the provider is not yet chosen.

| Method and path | Purpose | Access |
| --- | --- | --- |
| `GET /services` | Search public listings with area, category, keyword and pagination | Anyone |
| `GET /services/{id}` | Public details; return 404 for hidden/expired/demo records in production | Anyone |
| `GET /organizations/{id}` | Public provider information, only when it has a visible service | Anyone |
| `GET /me/services` | All statuses for the caller's organizations | Approved organization member |
| `GET /review-queue` | Submitted listings the caller is eligible to review | Reviewer or admin |
| `POST /services` | Create a draft under an authorized organization | Organization member |
| `PATCH /services/{id}` | Edit allowed content and return it to draft | Member of that organization |
| `POST /services/{id}/submit` | Submit a complete current version | Member of that organization |
| `POST /services/{id}/archive` | Withdraw a listing from discovery | Member of that organization or admin |
| `GET /services/{id}/reviews` | Read review feedback and history | Own organization; independent reviewer/admin while pending |
| `POST /services/{id}/reviews` | Approve or request changes | Independent reviewer or admin |

Account signup, login and recovery use the chosen identity provider. Initial organization creation and membership/role grants are manual administrative setup, not unprotected API endpoints.

## Search

`area` is required and must be a supported pilot key. Unknown areas return `422 UNSUPPORTED_AREA`, not unrelated results. `category` supports only `food` for this pilot. `q` is a trimmed, case-insensitive literal substring over title, description and offers; SQL wildcard characters must be escaped and queries parameterized. No fuzzy matching or ranking promise.

Pagination uses `limit` (1-50, default 20) and `offset` (0 or greater). Sort by lowercase title and then ID. The response contains `items`, `limit`, `offset` and `total`. Offset pagination is sufficient for this small pilot; rows can move between pages if listings change during browsing. No matches returns 200 with an empty array.

Public search and detail must share the same visibility condition: approved, matching content version, verification date not in the future, unexpired verification, non-demo service and non-demo organization. A local mock may explicitly allow fictional fixtures; the production endpoint has no `include_demo` parameter.

## Writes and conflicts

Create accepts `organization_id` plus content fields. Update accepts `expected_version` plus at least one content field. Reject unknown fields, particularly role, status, organization reassignment, approval dates, creator IDs and `is_demo`. The API derives identity from the checked token and generates workflow fields.

Use a database transaction and row lock for edit, submit, archive and review. Re-read both status and version under the lock. A stale version or disallowed state returns 409. Editing a pending listing is blocked; the author must wait for the reviewer to request changes. Editing an approved listing is allowed, but immediately removes its approval. Archived records cannot be edited or resubmitted in this MVP.

The sample [requests.json](examples/requests.json) demonstrates the payloads. A valid JSON body does not imply the caller is authorized.

## Errors

```json
{"error":{"code":"VERSION_CONFLICT","message":"This listing changed. Refresh it before editing."}}
```

| Status | Meaning |
| --- | --- |
| 400 | Malformed JSON |
| 401 | Missing, invalid or expired access token |
| 403 | Authenticated caller lacks the required operation role |
| 404 | Missing record, hidden public record, or private record outside the caller's organization |
| 409 | Version conflict, invalid state transition or self-review |
| 422 | Invalid fields, unsupported area or incomplete submission |
| 429 | Request rate limit exceeded |
| 500 | Unexpected failure; generic client message, diagnostic server log |

Do not reveal stack traces, tokens, internal reviewer notes or private membership details in errors.
