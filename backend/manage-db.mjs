import postgres from 'postgres';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {inspectDatabase} from './db-checks.mjs';
import {developmentTarget} from './db-target.mjs';

const mode = process.argv[2] ?? 'status';
const args = process.argv.slice(3);
const connection = process.env.MIGRATION_DATABASE_URL;
let sql;
function assertTarget() {
  const target = developmentTarget(connection);
  console.log('Target: development project '+target.ref+' at '+target.hostname+' (no credentials displayed)');
}
async function checkDemoIds(tx) {
  const conflicts = await tx`select id from app_private.organizations where id in ('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555') and not is_demo
    union all select id from app_private.service_locations where id in ('33333333-3333-4333-8333-333333333333','66666666-6666-4666-8666-666666666666') and (not is_demo or organization_id not in ('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555'))
    union all select id from app_private.services where id in ('11111111-1111-4111-8111-111111111111','77777777-7777-4777-8777-777777777777') and (not is_demo or organization_id not in ('22222222-2222-4222-8222-222222222222','55555555-5555-4555-8555-555555555555'))`;
  if (conflicts.length) throw new Error('Reserved demo IDs overlap with existing records. Seed was not applied.');
}
try {
  assertTarget();
  sql = postgres(connection,{max:1,prepare:false,ssl:'require',connect_timeout:10,onnotice:()=>{}});
  const [extension] = await sql`select n.nspname as schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='postgis'`;
  if (extension && extension.schema!=='extensions') throw new Error('PostGIS already uses a different schema. Review schema references; no extension was moved.');
  if (mode === 'migrate') {
    if (!args.includes('--apply')) throw new Error('Use --apply after reviewing backend/migrations. Demo seeds also require --include-demo.');
    const files = ['001_init.sql',...(args.includes('--include-demo')?['002_demo_seed.sql']:[]),'003_api_role.sql','004_private_schema_access.sql'];
    await sql.begin(async tx => {
      await tx`select pg_advisory_xact_lock(hashtext('our-ground-migrations'))`;
      await tx`create schema if not exists our_ground_meta`;
      await tx`revoke all on schema our_ground_meta from public`;
      await tx`create table if not exists our_ground_meta.migrations(name text primary key,sha256 text not null,applied_at timestamptz not null default now())`;
      for (const file of files) {
        const source = await readFile(new URL('./migrations/'+file,import.meta.url),'utf8');
        const hash = createHash('sha256').update(source).digest('hex');
        const [prior] = await tx`select sha256 from our_ground_meta.migrations where name=${file}`;
        if (prior) { if (prior.sha256!==hash) throw new Error('Previously applied migration changed: '+file); console.log('Already applied: '+file); continue; }
        if (file==='002_demo_seed.sql') await checkDemoIds(tx);
        await tx.unsafe(source);
        await tx`insert into our_ground_meta.migrations(name,sha256) values (${file},${hash})`;
        console.log('Applied in transaction: '+file);
      }
      const result = await inspectDatabase(tx);
      if (result.problems.length) throw new Error(result.problems.join('; '));
    });
    console.log('Migration transaction committed. Existing records were not replaced.');
  } else if (mode === 'grant-editor') {
    const user = args[args.indexOf('--user')+1], organization = args[args.indexOf('--organization')+1];
    const uuid = /^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
    if (!args.includes('--user') || !args.includes('--organization') || !uuid.test(user??'') || !uuid.test(organization??'')) throw new Error('Use --user <Auth UUID> --organization <organization UUID>.');
    await sql.begin(async tx => {
      const [authUser] = await tx`select id from auth.users where id=${user}`;
      const [org] = await tx`select id from app_private.organizations where id=${organization}`;
      if (!authUser || !org) throw new Error('Auth user or organization does not exist; no membership granted.');
      await tx`insert into app_private.app_users(id) values (${user}) on conflict(id) do nothing`;
      await tx`insert into app_private.organization_memberships(organization_id,user_id,role) values (${organization},${user},'editor') on conflict do nothing`;
    });
    console.log('Editor membership granted only to the explicitly selected user and organization.');
  } else if (mode === 'status' || mode === 'verify') {
    const [exists] = await sql`select to_regclass('app_private.services') is not null as present`;
    if (!exists.present) throw new Error('Application schema is not installed. Review and run db:migrate.');
    const result = await inspectDatabase(sql); console.log(JSON.stringify(result,null,2));
    if (result.problems.length) throw new Error('Database checks failed. See the listed problems.');
    if (mode === 'verify') {
      if (!process.env.DATABASE_URL) throw new Error('BLOCKED: DATABASE_URL is required to verify the runtime role connection.');
      developmentTarget(process.env.DATABASE_URL);
      const runtime = postgres(process.env.DATABASE_URL,{max:1,prepare:false,ssl:'require',connect_timeout:10});
      try {
        const [user] = await runtime`select current_user as name`;
        if (user.name!=='our_ground_api') throw new Error('DATABASE_URL must use the restricted our_ground_api role.');
        await runtime`select id from app_private.services limit 1`;
        console.log('Runtime database connection and restricted role passed.');
      } finally { await runtime.end(); }
    }
    console.log('Database schema and role checks passed. This does not test Google sign-in.');
  } else throw new Error('Unknown command. Use status, migrate, verify, or grant-editor.');
} catch (error) {
  if (mode==='migrate') console.error('No migration transaction was committed by this run.');
  // Database driver messages can contain connection details: only show deliberate setup messages.
  console.error(error instanceof Error && !('severity' in error) && !('syscall' in error) ? error.message : 'Database operation failed. Check development credentials, network access and schema permissions.');
  process.exitCode=1;
} finally { await sql?.end(); }
