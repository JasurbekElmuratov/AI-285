# Data intake and accuracy — verification deferred

The mockups show verification badges and a multi-step trust process. **Those are future design ideas, not first-version behavior.** For the two-day presentation, use fictional sample data and remove or cover the badge and “last verified” text. The prototype can demonstrate search, editing and error reporting without claiming that Our Ground has checked a provider.

## Presentation data

Create a small Pennsylvania-only seed set: a few fictional organizations, sites and food/healthcare services across several PA cities. Every record has `is_demo=true` and visible “Fictional demo” wording. Use approximate map points for layout demonstration, but no usable street address, phone, website, directions or donation link. Demo campaign goals, progress and impact figures are fictional and labeled on every card/detail view.

Keep a separate path for later sourced records. For each real organization, site and service, store the source name/URL and `source_recorded_at` (when the team copied the information). That timestamp is **not a verification date**. The public wording would be “Information from [source], recorded [date]. Confirm with the provider before visiting.” Do not fill missing hours, eligibility or cost from mockup text.

## Lightweight update and report process

1. A team admin seeds fictional records and grants one or two Google accounts editor access for the demo.
2. An editor updates a record for their assigned organization. The API records `updated_at` and a version; the change can be shown immediately. There is no submission or approval queue.
3. A visitor can report wrong hours, contact, location, eligibility or closure without an account. The report enters a simple admin inbox.
4. The admin may hide the affected record while checking it, correct it from a documented source later, or mark a mistaken report resolved. For the presentation, demonstrate this on fictional data.
5. A duplicate candidate is flagged by similar name/address/phone or nearby point. The team resolves it manually; no automatic merge.

A published status means only “visible in this prototype.” It does **not** mean verified, currently operating or accepting clients. The UI should avoid “open now,” “available today,” “verified resource” and “verified organization.” Display a short reminder to call or check a real provider before visiting.

## What formal verification would add later

Before launching a trusted real directory, the team would need an owner for intake, a source/evidence checklist, independent review of organizations, addresses and service facts, a last-verified date, recheck cadence, and a response process for reports. That would add review history and approval states to the database/API. None of those are required for the initial presentation or included in the simplified MVP contract.

The same distinction applies to giving opportunities: a fictional campaign can demonstrate the page design, but real donation totals and impact claims require source evidence or a payment integration. No payment is collected in this version.
