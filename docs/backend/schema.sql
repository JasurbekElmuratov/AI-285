-- Our Ground: PostgreSQL design draft, not an applied or execution-tested migration.
-- API authorization and workflow transactions are required; see 05-access-and-verification.md.
-- No credentials, grants, real personal data, or production fixture inserts are included.
BEGIN;
CREATE SCHEMA our_ground;

CREATE TABLE our_ground.app_users (
  id uuid PRIMARY KEY,
  auth_issuer text NOT NULL,
  auth_subject text NOT NULL,
  display_name varchar(120) NOT NULL,
  platform_role text NOT NULL DEFAULT 'member'
    CHECK (platform_role IN ('member', 'reviewer', 'admin')),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (auth_issuer, auth_subject)
);

CREATE TABLE our_ground.organizations (
  id uuid PRIMARY KEY,
  name varchar(160) NOT NULL CHECK (length(trim(name)) > 0),
  description varchar(2000) NOT NULL,
  contact_url varchar(2048) NOT NULL CHECK (contact_url LIKE 'https://%'),
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Effective, manually approved memberships only. No self-service membership grants.
CREATE TABLE our_ground.organization_memberships (
  user_id uuid NOT NULL REFERENCES our_ground.app_users(id),
  organization_id uuid NOT NULL REFERENCES our_ground.organizations(id),
  granted_by uuid NOT NULL REFERENCES our_ground.app_users(id),
  granted_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, organization_id)
);

CREATE TABLE our_ground.services (
  id uuid PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES our_ground.organizations(id),
  created_by uuid NOT NULL REFERENCES our_ground.app_users(id),
  title varchar(160) NOT NULL CHECK (length(trim(title)) > 0),
  category text NOT NULL CHECK (category = 'food'),
  area_slug text NOT NULL CHECK (area_slug = 'us-pa'),
  description varchar(2000) NOT NULL CHECK (length(trim(description)) > 0),
  offers text[] NOT NULL CHECK (cardinality(offers) BETWEEN 1 AND 10),
  eligibility varchar(1000) NOT NULL CHECK (length(trim(eligibility)) > 0),
  schedule varchar(1000) NOT NULL CHECK (length(trim(schedule)) > 0),
  cost varchar(500) NOT NULL CHECK (length(trim(cost)) > 0),
  preparation varchar(1000) NOT NULL CHECK (length(trim(preparation)) > 0),
  contact_url varchar(2048) NOT NULL CHECK (contact_url LIKE 'https://%'),
  source_url varchar(2048) NOT NULL CHECK (source_url LIKE 'https://%'),
  address varchar(500),
  latitude double precision CHECK (latitude BETWEEN -90 AND 90),
  longitude double precision CHECK (longitude BETWEEN -180 AND 180),
  support_instructions varchar(1000),
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','pending_review','approved','changes_requested','archived')),
  version integer NOT NULL DEFAULT 1 CHECK (version >= 1),
  approved_version integer,
  last_verified_at timestamptz,
  verification_expires_at timestamptz,
  is_demo boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ((latitude IS NULL) = (longitude IS NULL)),
  CHECK (
    (status = 'approved'
      AND approved_version IS NOT NULL AND approved_version = version
      AND last_verified_at IS NOT NULL AND verification_expires_at IS NOT NULL
      AND verification_expires_at > last_verified_at)
    OR
    (status <> 'approved' AND approved_version IS NULL
      AND last_verified_at IS NULL AND verification_expires_at IS NULL)
  )
);

CREATE TABLE our_ground.service_reviews (
  id uuid PRIMARY KEY,
  service_id uuid NOT NULL REFERENCES our_ground.services(id),
  reviewer_id uuid NOT NULL REFERENCES our_ground.app_users(id),
  reviewed_version integer NOT NULL CHECK (reviewed_version >= 1),
  decision text NOT NULL CHECK (decision IN ('approve','request_changes')),
  note varchar(2000) NOT NULL CHECK (length(trim(note)) > 0),
  snapshot jsonb NOT NULL CHECK (jsonb_typeof(snapshot) = 'object'),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX services_public_lookup
  ON our_ground.services (area_slug, category, lower(title), id)
  WHERE status = 'approved' AND is_demo = false;
CREATE INDEX services_by_organization ON our_ground.services (organization_id);
CREATE INDEX reviews_by_service ON our_ground.service_reviews (service_id, created_at);
CREATE INDEX memberships_by_organization ON our_ground.organization_memberships (organization_id);

-- Public projection: explicit fields, no creator/reviewer/account identifiers or notes.
-- The API must also prevent direct table access. This view alone is not access control.
CREATE VIEW our_ground.public_services AS
SELECT s.id, s.organization_id, s.title, s.category, s.area_slug,
       s.description, s.offers, s.eligibility, s.schedule, s.cost, s.preparation,
       s.contact_url, s.source_url, s.address, s.latitude, s.longitude,
       s.support_instructions, s.last_verified_at, s.verification_expires_at
FROM our_ground.services s
JOIN our_ground.organizations o ON o.id = s.organization_id
WHERE s.status = 'approved'
  AND s.approved_version = s.version
  AND s.last_verified_at <= CURRENT_TIMESTAMP
  AND s.verification_expires_at > CURRENT_TIMESTAMP
  AND s.is_demo = false AND o.is_demo = false;

-- API obligations: real URL parsing, whitespace/offer item validation, PA service-area
-- verification, token/membership checks, independent review, row locking, workflow
-- changes, version increments, updated_at maintenance and append-only review writes.
-- Never use a clock-dependent CHECK constraint for expiry; the view evaluates time.
COMMIT;
