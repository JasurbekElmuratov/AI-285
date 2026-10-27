# Simplified REST API contract

**Draft base:** `/api/v1`. JSON uses `snake_case`, UUID IDs and UTC ISO 8601 timestamps. This is for frontend coordination; these routes do not yet exist. Examples are fictional demonstration data.

## Screen-to-endpoint map

| Screen or action | Proposed endpoint | Access |
| --- | --- | --- |
| ZIP/city input | `GET /places/resolve?q=...` | Anyone |
| Food/healthcare chips | `GET /categories` | Anyone |
| Resident map/list | `GET /resources?lat=...&lng=...&radius_miles=...&category=...` | Anyone |
| Resource popup/detail | `GET /resources/{id}` | Anyone |
| Donor organization map/profile | `GET /organizations?...`, `GET /organizations/{id}` | Anyone |
| Demo giving cards/detail | `GET /campaigns?...`, `GET /campaigns/{id}` | Anyone; fictional demo data |
| “Report incorrect information” | `POST /correction-reports` | Anyone, rate-limited |
| Signed-in account | `GET /me` | Google-signed-in user |
| Staff organization/location/service editor | `PATCH /organizations/{id}`, `GET /organizations/{id}/locations`, `GET /organizations/{id}/services`, `POST /organizations/{id}/locations`, `PATCH /locations/{id}`, `POST /organizations/{id}/services`, `PATCH /services/{id}` | Assigned organization editor or admin |
| Simple report inbox | `GET /admin/correction-reports`, `PATCH /admin/correction-reports/{id}` | Admin |

Google OAuth sign-in/callback is handled by Supabase Auth, not a custom password endpoint. A Google account is created on first sign-in; its Our Ground role defaults to `user`. [Supabase Google sign-in](https://supabase.com/docs/guides/auth/social-sign-in/auth-google).

## Location and resource search

`GET /places/resolve?q=17101` accepts a 2–80 character ZIP or city. Return a Pennsylvania choice with coordinates, an ambiguity list, or `422 LOCATION_NOT_FOUND` / `422 OUTSIDE_PENNSYLVANIA`. Restrict by the returned state, not just the typed text. Mapbox's Geocoding API returns place/postcode coordinates and context. [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/).

```json
{"query":"17101","place":{"label":"Harrisburg, PA 17101","city":"Harrisburg","state":"PA","latitude":40.27,"longitude":-76.88},"choices":[]}
```

`GET /resources?lat=40.27&lng=-76.88&radius_miles=25&category=food&page=1&page_size=20` returns published services within the radius. Both coordinates are required and must be in Pennsylvania; radius defaults to 25 miles, valid 1–50. `category` is `food` or `healthcare`; omit for all. An optional `q` searches title and description. Pages start at 1; `page_size` defaults to 20 and cannot exceed 50. Sort by straight-line distance, then ID. The map uses the same current-page items as the list.

Illustrative response from a **demo environment**:

```json
{
  "search_center":{"latitude":40.27,"longitude":-76.88},
  "items":[{
    "id":"11111111-1111-4111-8111-111111111111",
    "title":"Demo Community Pantry — fictional",
    "category_slugs":["food"],
    "organization":{"id":"22222222-2222-4222-8222-222222222222","name":"Demo Community Organization"},
    "location":{"city":"Harrisburg","state":"PA","address_label":"DEMO POINT — NOT A VISITABLE ADDRESS","latitude":40.271,"longitude":-76.879},
    "distance_miles":0.1,
    "data_kind":"fictional_demo",
    "source_recorded_at":null
  }],
  "page":1,"page_size":20,"total":1,"has_next":false
}
```

`GET /resources/{id}` adds opening hours, eligibility, cost, contact, source and directions fields. For a demo record, all actionable contact/directions fields are null:

```json
{
  "id":"11111111-1111-4111-8111-111111111111",
  "title":"Demo Community Pantry — fictional",
  "organization":{"id":"22222222-2222-4222-8222-222222222222","name":"Demo Community Organization"},
  "location":{"address_label":"DEMO POINT — NOT A VISITABLE ADDRESS","city":"Harrisburg","state":"PA"},
  "hours":[{"weekday":1,"opens_at":"09:00","closes_at":"16:00"}],
  "eligibility_text":"Fictional example; no eligibility claim.",
  "cost_summary":"Fictional example",
  "contact":{"phone":null,"website_url":null,"directions_url":null},
  "source":{"url":null,"recorded_at":null},
  "data_kind":"fictional_demo"
}
```

For a later sourced real record, `data_kind` is `"sourced_unverified"`; contact/directions come only from documented source fields, and the UI says “Confirm details with the provider before visiting.” Neither response contains a verification badge or last-verified date. Unknown fields are null or explicitly unknown.

`GET /organizations` and `GET /campaigns` use the same coordinates, radius, category and pagination pattern. Organization cards return a primary site, name and campaign count. Campaign cards return `goal_cents`, `demo_raised_cents`, currency and `data_kind:"fictional_demo"`. Their detail routes add descriptions and impact text. There is **no donation POST endpoint** in the MVP.

## Google account and staff writes

The browser sends `Authorization: Bearer <Supabase access token>` for protected API routes. `GET /me` returns `{"id":"...","role":"user","organizations":[]}` for a newly signed-in account. The API validates the token with Supabase Auth; it never accepts a role or organization claim from a request body. [Supabase server-side getUser](https://supabase.com/docs/reference/javascript/auth-getuser).

An admin manually grants editor membership for the prototype. An editor can manage only their organization. Example:

```http
POST /api/v1/organizations/22222222-2222-4222-8222-222222222222/services
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{"location_id":"33333333-3333-4333-8333-333333333333","title":"Demo pantry pickup","summary":"Fictional demonstration service","category_slugs":["food"],"eligibility_text":"Demo only","cost_summary":"Demo only","status":"draft"}
```

Response: `201 Created` with `{"id":"...","status":"draft","version":1}`. The server assigns `is_demo` from the owning demo organization/location; the client cannot change it. `PATCH /services/{id}` accepts changed content, `status` (`draft`, `published`, `hidden`) and `expected_version`; the API checks organization ownership and increments the version. The same pattern applies to `PATCH /locations/{id}` and `PATCH /organizations/{id}`. Unknown fields, forged organization IDs, payment totals and any verification fields are rejected. In this prototype there is **no submit/review/approve route**.

`POST /correction-reports` accepts `{"service_id":"...","reason_code":"wrong_hours","description":"Hours may be outdated."}` and returns `202 Accepted` with a report ID. No name or email is required. Admins can list open reports and mark one resolved. Report text is never returned in a public API response.

## Validation and errors

- IDs are UUIDs; ZIP is five digits; coordinates and radius are range-checked; category must be known; text, array lengths and URLs are bounded. Reject malformed JSON and unexpected fields.
- Published real records need an organization, Pennsylvania site/point, title, category and at least one usable contact route. Demo records may omit contact routes but must carry `is_demo=true` and visible fictional wording.
- Collections return `items`, `page`, `page_size`, `total` and `has_next`. No matches is HTTP 200 with `items:[]`.
- Error shape: `{"error":{"code":"VALIDATION_ERROR","message":"Check the submitted fields.","fields":{"category":"Unknown category."},"request_id":"req_123"}}`.
- Use 400 for malformed JSON, 401 for missing/invalid token, 403 for insufficient role, 404 for absent/private object, 409 for stale `expected_version`, 422 for invalid fields/location, 429 for rate limit, and 500/503 for generic server/provider failures.

No endpoint returns private account email, correction-report text, database secrets or Google tokens to an anonymous visitor.
