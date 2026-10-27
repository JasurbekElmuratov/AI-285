export const requiredTables = ['app_users','organizations','organization_memberships','service_locations','services','categories','service_categories','opening_hours','correction_reports','campaigns'];
export async function inspectDatabase(sql) {
  const tables = await sql`select tablename from pg_tables where schemaname='app_private' order by tablename`;
  const relations = await sql`select conrelid::regclass::text as table_name,pg_get_constraintdef(oid) as definition from pg_constraint where connamespace='app_private'::regnamespace and contype='f'`;
  const roles = await sql`select rolname,rolsuper,rolcreaterole,rolcreatedb,rolbypassrls from pg_roles where rolname in ('our_ground_api','anon','authenticated')`;
  const problems = [];
  for (const table of requiredTables) if (!tables.some(t=>t.tablename===table)) problems.push('Missing table: '+table);
  if (!relations.some(r=>r.table_name==='app_private.services' && r.definition.includes('FOREIGN KEY (location_id, organization_id)'))) problems.push('Missing service/location organization foreign key');
  for (const [table,target] of [['organization_memberships','organizations'],['organization_memberships','app_users'],['service_locations','organizations'],['services','organizations'],['service_categories','services'],['service_categories','categories'],['opening_hours','services'],['correction_reports','services'],['campaigns','organizations']]) {
    if (!relations.some(r=>r.table_name==='app_private.'+table && r.definition.includes('REFERENCES app_private.'+target+'('))) problems.push('Missing relationship: '+table+' → '+target);
  }
  const role = roles.find(r=>r.rolname==='our_ground_api');
  if (!role || role.rolsuper || role.rolcreaterole || role.rolcreatedb || role.rolbypassrls) problems.push('API role missing or has elevated role attributes');
  if (role) {
    const [p] = await sql`select has_schema_privilege('our_ground_api','app_private','USAGE') as schema_usage,has_schema_privilege('our_ground_api','app_private','CREATE') as schema_create,has_column_privilege('our_ground_api','app_private.app_users','role','UPDATE') as role_update,has_table_privilege('our_ground_api','app_private.organization_memberships','INSERT') as membership_insert,has_column_privilege('our_ground_api','app_private.services','title','UPDATE') as service_update,has_column_privilege('our_ground_api','app_private.services','organization_id','UPDATE') as ownership_update`;
    if (!p.schema_usage || p.schema_create || p.role_update || p.membership_insert || !p.service_update || p.ownership_update) problems.push('Unexpected API role privileges');
    const inherited = await sql`select 1 from pg_auth_members where member=(select oid from pg_roles where rolname='our_ground_api')`;
    if (inherited.length) problems.push('API role inherits another role; inspect before use');
  }
  for (const role of roles.filter(r=>r.rolname!=='our_ground_api')) {
    const [p] = await sql`select has_schema_privilege(${role.rolname},'app_private','USAGE') as allowed`;
    if (p.allowed) problems.push('Browser role has private-schema access: '+role.rolname);
  }
  const indexes = await sql`select indexname,indexdef from pg_indexes where schemaname='app_private'`;
  if (!indexes.some(i=>i.indexdef.includes('USING gist (point)'))) problems.push('Missing geographic search index');
  return { tables:tables.map(t=>t.tablename),foreign_keys:relations.length,indexes:indexes.length,problems };
}
