# Build order and acceptance checks

This is a proposed sequence, not a claim that any backend functionality is implemented.

## 1. Agree the scope

- [ ] Confirm the first PA county/city for collecting real records and the food-support journey with Michael.
- [ ] Confirm public detail/search fields with Adam using the API examples.
- [ ] Confirm identity provider, API hosting, reviewer and ownership onboarding with Penuel.
- [ ] Confirm verification expiry, edits removing approval, and donor contact-only scope.

## 2. Establish the data layer

- [ ] Select PostgreSQL version and local development setup.
- [ ] Turn `schema.sql` into a versioned migration and execute it in a disposable database.
- [ ] Test required values, foreign keys, duplicate memberships, URL validation and coordinate pairs.
- [ ] Load fictional fixtures only into a clearly marked development environment.
- [ ] Restrict runtime database privileges; no direct browser access.

## 3. Build one vertical workflow

- [ ] Set up identity verification and manually provision two organizations and an independent reviewer.
- [ ] Implement draft creation, edit, submit and review transactions.
- [ ] Implement public service search/details and organization details using one shared visibility predicate.
- [ ] Connect the existing frontend through an adapter and show loading, empty and error states.
- [ ] Show last verified date, eligibility, hours, contact and optional donor support instructions.

## 4. Test meaningful failure cases

| Scenario | Expected result |
| --- | --- |
| No credentials on create | 401 |
| Member A tries to edit organization B's listing | 404; no mutation |
| Caller injects `status`, `is_demo` or `approved_version` into an update | 422; no mutation |
| Reviewer belongs to the subject organization | 409; no review written |
| Two edits use the same version | First succeeds; second receives 409 |
| Two reviewers decide concurrently | One transaction succeeds; the other sees changed state and receives 409 |
| Review history insert fails | Service status update rolls back |
| Approved listing is edited | New version becomes draft; public detail immediately returns 404 |
| Approval expires exactly now | Search excludes it and detail returns 404 |
| Approved fixture reaches a production query | Hidden because `is_demo` is true |
| Unknown pilot area | 422; no unrelated results |
| Public record is serialized | No creator ID, reviewer identity, auth details or private notes |
| No checked geographic coordinates | No fabricated map pin or directions |

## 5. Demonstrate and review

Show draft creation, independent approval, resident discovery and donor contact. Then change the hours and show why a new review is needed. Review the result as a team before expanding into real data imports, additional categories or AI.

## Your immediate next action

Bring the starter README and the five fictional listings to a short team review. Ask: “Does this one workflow represent the MVP we want, and are these the fields the frontend needs?” Then use the answers to finalize the first migration and API implementation tasks.
