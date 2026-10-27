export function developmentTarget(connection, env = process.env) {
  const ref = env.SUPABASE_DEV_PROJECT_REF;
  if (!connection) throw new Error('BLOCKED: set MIGRATION_DATABASE_URL for the intended development project in .env.local.');
  if (!ref || !/^[a-z0-9]{10,30}$/.test(ref)) throw new Error('BLOCKED: set SUPABASE_DEV_PROJECT_REF to explicitly identify the development project.');
  let auth, db;
  try { auth = new URL(env.SUPABASE_URL ?? 'https://missing.invalid'); db = new URL(connection); } catch { throw new Error('Invalid database or Supabase URL. Check local configuration.'); }
  if (auth.hostname !== ref+'.supabase.co') throw new Error('SUPABASE_URL does not match SUPABASE_DEV_PROJECT_REF.');
  const direct = db.hostname === 'db.'+ref+'.supabase.co';
  const pooler = db.hostname.endsWith('.pooler.supabase.com') && decodeURIComponent(db.username).endsWith('.'+ref);
  if (!['postgres:','postgresql:'].includes(db.protocol) || (!direct && !pooler)) throw new Error('Database connection does not match the intended development project.');
  return {ref,hostname:db.hostname};
}
