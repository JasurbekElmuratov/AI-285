import { defineConfig, loadEnv } from 'vite';
import { publicEnvironmentProblems } from './backend/env-boundary.mjs';

export default defineConfig(({mode}) => {
  const env = {...loadEnv(mode,process.cwd(),''),...process.env};
  const issues = publicEnvironmentProblems(env);
  if (issues.length) throw new Error(issues.join('\n'));
  const port = Number(env.API_PORT ?? 8787);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('API_PORT must be a valid local port.');
  return { server: { proxy: { '/api/v1': 'http://127.0.0.1:'+port } } };
});
