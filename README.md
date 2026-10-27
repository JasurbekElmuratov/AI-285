# Our Ground prototype

Our Ground connects people with local food assistance, healthcare, and community support. It brings residents, donors, and organizations together through map-based resource discovery, with planned AI-assisted matching to make finding help and giving back easier.

The existing visual design retains the Access branding. The working backend scope is Pennsylvania food/healthcare discovery, optional Google sign-in, assigned staff editing, and anonymous correction reports. AI and payments remain future work.

A four-part marketing landing page based on the supplied Access design. Natural scrolling moves from Earth to an illustrated neighborhood, reveals barriers to support, brings community map layers together, and explains the proposed approach from public information to human review and a clearer map. One fixed palette combines a night Earth hero, warm paper sections, charcoal map sheets, and a dark closing panel. The header adapts to the section underneath it; appearance stays consistent across system preferences and visits.

## Pages

- `/`: Four-section marketing landing page with an orbital zoom, a pinned neighborhood story, a warm map-layer illustration, and a process timeline. Section and chapter links support keyboard navigation. Reduced-motion preferences and very short viewports use a normal vertical layout; mobile map layers move during ordinary scrolling.
- `/support`: API-backed Pennsylvania search by city or ZIP code, category, radius and keyword, with pagination, map/list views and loading/empty/error states. Filters are preserved in the URL.
- `/resources/:id`: API-backed resource details, listed eligibility/hours, safe contact/directions, a correction-report form and a link back to the previous search.
- `/account`: Google PKCE sign-in and the caller's assigned organization/service records; requires the team's Supabase configuration.
- `/staff/services/:id`: Authorized service editing with version-conflict protection.
- `/about`: The purpose of Access, the exploration flow, and the scope of the prototype.
- `/demo`: The original interactive globe, pilot community, and community-needs layers.

The resident and account screens call the Our Ground API. Demo mode uses two fictional Pennsylvania records with contact/directions disabled. PostgreSQL mode requires the team's database credentials and never falls back to static listings. Real Supabase/Google verification is pending that configuration. The older `/demo` globe remains illustrative.

## Run locally

```sh
npm install
npm run dev
```

Use `npm run build` to check TypeScript and create a production build.
Use `npm test` (Node 22.13 or later) to check API permissions, conflict protection, filters, safe contact links and search URL preservation. Follow [real database and Google setup](backend/SETUP.md) for persistent data and login, and see [verification status](backend/VERIFICATION.md) for passed and blocked checks.

## Hosting configuration

No deployment is part of this handoff. `vercel.json` disables automatic Git deployments and configures API routes before the SPA fallback. Re-enable deployments deliberately after the team completes configuration and testing. [Vercel Git deployment configuration](https://vercel.com/docs/project-configuration/git-configuration).

`.vercelignore` excludes local previews, dependencies, environment files and build output. `.gitignore` excludes credentials, temporary presentation files and local verification artifacts.

The main landing page uses section anchors and keyboard-accessible story links. Scroll listeners are passive and visual updates use requestAnimationFrame; wheel and touch scrolling are not intercepted. Animations respect reduced-motion preferences. The earlier support, detail, about, and demo prototypes remain directly accessible at their routes but are not linked from the marketing page.

The landing-page network and neighborhood illustration, pilot location, regional view, and needs overlays are illustrative. They do not show measured community conditions or verified services. The landing-page background is generated from the supplied design reference; its generation prompt is saved in `public/assets/access-earth-network.prompt.txt`. Demo Earth texture: [NASA/GSFC Scientific Visualization Studio, Blue Marble](https://svs.gsfc.nasa.gov/2915). The regional image is a generated concept asset.

## Our Ground backend

Start the API immediately with `npm run dev:api:demo`. It serves fictional Pennsylvania resources at `http://127.0.0.1:8787/api/v1`; run `npm run dev` separately for the connected frontend and local API proxy. See [backend endpoints and implementation](backend/README.md) and [exact setup steps](backend/SETUP.md). No cloud database changes or deployment have been made without credentials.

The [current architecture proposal](our-ground-backend-proposal/README.md) records the simplified team-review scope. The [earlier planning package](docs/backend/README.md) remains as reference.
