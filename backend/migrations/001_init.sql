-- Apply in Supabase SQL editor or psql as a migration owner.
-- Application tables remain outside the Supabase Data API's exposed schemas.
create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create schema if not exists app_private;

create table if not exists app_private.app_users (
  id uuid primary key,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists app_private.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 160),
  description text not null default '',
  website_url text,
  public_phone text,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  is_demo boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists app_private.organization_memberships (
  organization_id uuid not null references app_private.organizations(id) on delete cascade,
  user_id uuid not null references app_private.app_users(id) on delete cascade,
  role text not null check (role = 'editor'),
  granted_by uuid references app_private.app_users(id),
  granted_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table if not exists app_private.service_locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app_private.organizations(id),
  site_name text not null check (length(trim(site_name)) between 2 and 160),
  street_address text,
  city text not null,
  state text not null default 'PA' check (state = 'PA'),
  postal_code text check (postal_code is null or postal_code ~ '^[0-9]{5}$'),
  point extensions.geography(Point,4326) not null,
  source_url text,
  source_recorded_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  is_demo boolean not null default true,
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  check (not is_demo or street_address is null)
);

create table if not exists app_private.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app_private.organizations(id),
  location_id uuid not null,
  title text not null check (length(trim(title)) between 2 and 160),
  summary text not null default '',
  description text not null default '',
  eligibility_text text,
  cost_summary text,
  appointment_note text,
  contact_phone text,
  contact_url text,
  source_url text,
  source_recorded_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'published', 'hidden')),
  is_demo boolean not null default true,
  version integer not null default 1 check (version > 0),
  updated_by uuid references app_private.app_users(id),
  updated_at timestamptz not null default now(),
  foreign key (location_id, organization_id)
    references app_private.service_locations(id, organization_id),
  check (not is_demo or (contact_phone is null and contact_url is null)),
  check (is_demo or status <> 'published' or source_url is not null)
);

create table if not exists app_private.categories (
  id smallint generated always as identity primary key,
  slug text not null unique,
  name text not null
);

create table if not exists app_private.service_categories (
  service_id uuid not null references app_private.services(id) on delete cascade,
  category_id smallint not null references app_private.categories(id),
  primary key (service_id, category_id)
);

create table if not exists app_private.opening_hours (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references app_private.services(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),
  opens_at time not null,
  closes_at time not null,
  notes text,
  sequence smallint not null default 1,
  check (opens_at < closes_at),
  unique (service_id, weekday, sequence)
);

create table if not exists app_private.correction_reports (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references app_private.services(id),
  reason_code text not null check (reason_code in
    ('wrong_hours','closed','wrong_contact','wrong_eligibility','wrong_location','other')),
  description text check (description is null or length(description) <= 1000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create table if not exists app_private.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references app_private.organizations(id),
  title text not null,
  summary text not null default '',
  category_id smallint references app_private.categories(id),
  goal_cents bigint not null check (goal_cents > 0),
  demo_raised_cents bigint not null default 0 check (demo_raised_cents >= 0),
  currency char(3) not null default 'USD',
  impact_text text,
  status text not null default 'draft' check (status in ('draft','published','hidden')),
  is_demo boolean not null default true check (is_demo),
  updated_at timestamptz not null default now()
);

create index if not exists service_locations_point_gix on app_private.service_locations using gist(point);
create index if not exists services_location_status_idx on app_private.services(location_id,status);
create index if not exists services_org_status_idx on app_private.services(organization_id,status);
create index if not exists service_categories_category_idx on app_private.service_categories(category_id,service_id);
create index if not exists correction_reports_status_idx on app_private.correction_reports(status,created_at);
create index if not exists campaigns_org_status_idx on app_private.campaigns(organization_id,status);

insert into app_private.categories(slug,name)
values ('food','Food assistance'), ('healthcare','Healthcare')
on conflict (slug) do nothing;
