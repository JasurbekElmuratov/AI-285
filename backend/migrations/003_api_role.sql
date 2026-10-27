-- Run as migration owner after 001. This role intentionally starts without a password.
-- Set its password privately in the database console before using DATABASE_URL.
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'our_ground_api') then
    create role our_ground_api login;
  end if;
end $$;

revoke all on schema app_private from public;
grant usage on schema app_private, extensions to our_ground_api;
grant select on all tables in schema app_private to our_ground_api;
grant insert (id) on app_private.app_users to our_ground_api;
grant insert (service_id,reason_code,description) on app_private.correction_reports to our_ground_api;
grant update (title,summary,eligibility_text,cost_summary,status,version,updated_by,updated_at)
  on app_private.services to our_ground_api;

-- No grants to change users' roles, memberships, ownership, locations or sources.
