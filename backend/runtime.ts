import { createClient } from '@supabase/supabase-js';
import type { Dependencies } from './app.ts';
import { PostgresRepository } from './postgres.ts';
import { DemoRepository } from './demo.ts';
import { UnavailableError } from './errors.ts';

type MapboxFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    context?: { region?: { region_code?: string }; place?: { name?: string }; country?: { country_code?: string } };
  };
};
const demoPlaces = new Map([
  ['harrisburg', { label: 'Harrisburg, PA', city: 'Harrisburg', state: 'PA' as const, latitude: 40.2732, longitude: -76.8867 }],
  ['17101', { label: 'Harrisburg, PA 17101', city: 'Harrisburg', state: 'PA' as const, latitude: 40.2732, longitude: -76.8867 }],
  ['philadelphia', { label: 'Philadelphia, PA', city: 'Philadelphia', state: 'PA' as const, latitude: 39.9526, longitude: -75.1636 }],
  ['19102', { label: 'Philadelphia, PA 19102', city: 'Philadelphia', state: 'PA' as const, latitude: 39.9526, longitude: -75.1636 }]
]);
export async function resolvePlace(query: string) {
  const normalized = query.trim().toLowerCase().replace(/,?\s+pa$/, '');
  if (process.env.BACKEND_DATA_MODE === 'demo') return demoPlaces.get(normalized) ?? null;
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    if (process.env.ALLOW_DEMO_DATA === 'true') return demoPlaces.get(normalized) ?? null;
    throw new UnavailableError('GEOCODING_NOT_CONFIGURED', 'Location search is temporarily unavailable. Please try again later.');
  }
  const params = new URLSearchParams({
    q: query, country: 'US', types: 'postcode,place', limit: '5', autocomplete: 'false', access_token: token
  });
  const response = await fetch('https://api.mapbox.com/search/geocode/v6/forward?' + params, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new UnavailableError('GEOCODING_UNAVAILABLE', 'Location search is temporarily unavailable. Please try again later.');
  const data = await response.json() as { features?: MapboxFeature[] };
  const feature = data.features?.find((item) =>
    item.properties?.context?.region?.region_code === 'PA' &&
    item.properties?.context?.country?.country_code === 'US' &&
    item.geometry?.coordinates?.length === 2);
  if (!feature?.geometry?.coordinates) return null;
  const [longitude, latitude] = feature.geometry.coordinates;
  const city = feature.properties?.context?.place?.name ?? feature.properties?.name ?? 'Pennsylvania';
  return { label: city + ', PA', city, state: 'PA' as const, latitude, longitude };
}
let authClient: ReturnType<typeof createClient> | undefined;
export async function verifyToken(token: string): Promise<string | null> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new UnavailableError('AUTH_NOT_CONFIGURED', 'Sign-in is temporarily unavailable. You can still browse resources.');
  authClient ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(10000) }) } });
  const { data, error } = await authClient.auth.getUser(token);
  if (error && (!error.status || error.status >= 500)) throw new UnavailableError('AUTH_UNAVAILABLE', 'Sign-in could not be checked. Please try again.');
  return error ? null : data.user?.id ?? null;
}
export function productionDependencies(): Dependencies {
  const mode = process.env.BACKEND_DATA_MODE ?? 'postgres';
  if (mode !== 'postgres' && mode !== 'demo') throw new Error('BACKEND_DATA_MODE must be postgres or demo');
  if (mode === 'demo' && process.env.ALLOW_DEMO_DATA !== 'true') throw new Error('Demo mode requires ALLOW_DEMO_DATA=true');
  return { repo: mode === 'demo' ? new DemoRepository(process.env.DEMO_EDITOR_USER_ID) : new PostgresRepository(), verifyToken, resolvePlace, allowDemo: process.env.ALLOW_DEMO_DATA === 'true' };
}
