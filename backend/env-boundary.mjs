function isSecret(value) {
  if (/^sb_secret_|^sk\.|^postgres(?:ql)?:\/\//.test(value)) return true;
  try { return JSON.parse(Buffer.from(value.split('.')[1] ?? '', 'base64url').toString()).role === 'service_role'; } catch { return false; }
}
export function publicEnvironmentProblems(env) {
  const issues=[];
  for (const [key,value] of Object.entries(env)) {
    if (key.startsWith('VITE_') && value && (/SECRET|PASSWORD|DATABASE|SERVICE_ROLE|ACCESS_TOKEN|MIGRATION/.test(key) || isSecret(value))) issues.push('Private value or name under browser prefix: '+key);
  }
  if (env.VITE_SUPABASE_URL && env.SUPABASE_URL && env.VITE_SUPABASE_URL.replace(/\/$/,'') !== env.SUPABASE_URL.replace(/\/$/,'')) issues.push('Browser and server Supabase URLs differ.');
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY && env.SUPABASE_PUBLISHABLE_KEY && env.VITE_SUPABASE_PUBLISHABLE_KEY !== env.SUPABASE_PUBLISHABLE_KEY) issues.push('Browser and server publishable keys differ.');
  return issues;
}
