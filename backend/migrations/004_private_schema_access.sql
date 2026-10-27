-- Explicitly deny browser roles even if dashboard exposure is changed accidentally.
-- Keep the existing API ownership model: trusted server SQL role + per-request checks.
do $$
declare browser_role text;
begin
  foreach browser_role in array array['anon','authenticated'] loop
    if exists (select 1 from pg_roles where rolname = browser_role) then
      execute format('revoke all on schema app_private from %I', browser_role);
      execute format('revoke all on all tables in schema app_private from %I', browser_role);
      execute format('revoke all on all sequences in schema app_private from %I', browser_role);
      execute format('alter default privileges in schema app_private revoke all on tables from %I', browser_role);
    end if;
  end loop;
end $$;
revoke all on schema app_private from public;
revoke all on all tables in schema app_private from public;
revoke create on schema app_private from our_ground_api;
