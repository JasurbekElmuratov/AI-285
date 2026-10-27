export type Category = 'food' | 'healthcare';
export type Status = 'draft' | 'published' | 'hidden';
export type Account = { id: string; role: 'user' | 'admin'; organizations: Array<{ id: string; name: string; role: 'editor' }> };
export type ServicePatch = Partial<{ title: string; summary: string; eligibility_text: string | null; cost_summary: string | null; status: Status }>;
export interface Repository {
  search(input: { lat: number; lng: number; radiusMiles: number; category: Category | null; keyword?: string; page: number; pageSize: number; allowDemo: boolean }): Promise<{ items: unknown[]; total: number }>;
  detail(id: string, allowDemo: boolean): Promise<unknown | null>;
  createReport(input: { serviceId: string; reasonCode: string; description: string | null; allowDemo: boolean }): Promise<string | null>;
  account(userId: string): Promise<Account>;
  canEditService(id: string, account: Account): Promise<boolean>;
  editableService(id: string, account: Account): Promise<unknown | null>;
  listEditableServices(account: Account, page: number, pageSize: number): Promise<{ items: unknown[]; total: number }>;
  updateService(id: string, account: Account, version: number, patch: ServicePatch): Promise<{ id: string; status: Status; version: number } | null>;
}
export interface Dependencies {
  repo: Repository;
  verifyToken: (token: string) => Promise<string | null>;
  resolvePlace: (query: string) => Promise<{ label: string; city: string; state: 'PA'; latitude: number; longitude: number } | null>;
  allowDemo: boolean;
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const reasons = new Set(['wrong_hours','closed','wrong_contact','wrong_eligibility','wrong_location','other']);
class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string,string>;
  constructor(status: number, code: string, message: string, fields?: Record<string,string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
function fail(status: number, code: string, message: string, fields?: Record<string,string>): never { throw new ApiError(status, code, message, fields); }
function json(value: unknown, status = 200): Response { return Response.json(value, { status, headers: { 'Cache-Control': 'no-store' } }); }
function numeric(value: string | null, key: string, min: number, max: number, fallback?: number): number {
  if (value === null && fallback !== undefined) return fallback;
  const n = Number(value);
  if (value === null || !Number.isFinite(n) || n < min || n > max) fail(422, 'VALIDATION_ERROR', 'Invalid search field.', { [key]: 'Out of range.' });
  return n;
}
async function body(request: Request): Promise<Record<string,unknown>> {
  let value: unknown;
  const raw = await request.text();
  if (new TextEncoder().encode(raw).length > 16384) fail(413, 'BODY_TOO_LARGE', 'Request body is too large.');
  try { value = JSON.parse(raw); } catch { fail(400, 'MALFORMED_JSON', 'Expected valid JSON.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(422, 'VALIDATION_ERROR', 'Expected a JSON object.');
  return value as Record<string,unknown>;
}
function allowedFields(value: Record<string,unknown>, fields: string[]): void {
  const extra = Object.keys(value).find((key) => !fields.includes(key));
  if (extra) fail(422, 'VALIDATION_ERROR', 'Unexpected field.', { [extra]: 'Not accepted.' });
}
async function account(request: Request, deps: Dependencies): Promise<Account> {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get('authorization') ?? '');
  if (!match) fail(401, 'UNAUTHENTICATED', 'Sign in to continue.');
  const userId = await deps.verifyToken(match[1]);
  if (!userId) fail(401, 'UNAUTHENTICATED', 'Invalid or expired session.');
  return deps.repo.account(userId);
}
export async function handleApi(request: Request, deps: Dependencies): Promise<Response> {
  try {
    const url = new URL(request.url);
    const path = '/' + (url.searchParams.get('path') ?? url.pathname.replace(/^\/api\/v1\/?/, '')).replace(/^\/+|\/+$/g, '');
    const method = request.method.toUpperCase();
    if (method === 'GET' && path === '/health') return json({ status: 'ok' });
    if (method === 'GET' && path === '/categories') return json({ items: [{ slug: 'food', name: 'Food assistance' }, { slug: 'healthcare', name: 'Healthcare' }] });
    if (method === 'GET' && path === '/places/resolve') {
      const q = (url.searchParams.get('q') ?? '').trim();
      if (q.length < 2 || q.length > 80) fail(422, 'VALIDATION_ERROR', 'Enter a ZIP code or city.');
      const place = await deps.resolvePlace(q);
      if (!place) fail(422, 'LOCATION_NOT_FOUND', 'Enter a Pennsylvania ZIP code or city.');
      return json({ query: q, place, choices: [] });
    }
    if (method === 'GET' && path === '/resources') {
      const lat = numeric(url.searchParams.get('lat'), 'lat', 39.5, 42.6);
      const lng = numeric(url.searchParams.get('lng'), 'lng', -80.6, -74.5);
      const radiusMiles = numeric(url.searchParams.get('radius_miles'), 'radius_miles', 1, 50, 25);
      const page = numeric(url.searchParams.get('page'), 'page', 1, 100000, 1);
      const pageSize = numeric(url.searchParams.get('page_size'), 'page_size', 1, 50, 20);
      if (!Number.isInteger(page) || !Number.isInteger(pageSize)) fail(422, 'VALIDATION_ERROR', 'Page values must be integers.');
      const rawCategory = url.searchParams.get('category');
      const keyword = (url.searchParams.get('q') ?? '').trim();
      if (keyword.length > 100) fail(422, 'VALIDATION_ERROR', 'Search text is too long.');
      if (rawCategory !== null && rawCategory !== 'food' && rawCategory !== 'healthcare') fail(422, 'VALIDATION_ERROR', 'Unknown category.');
      const result = await deps.repo.search({ lat, lng, radiusMiles, category: rawCategory as Category | null, keyword, page, pageSize, allowDemo: deps.allowDemo });
      return json({ search_center: { latitude: lat, longitude: lng }, items: result.items, page, page_size: pageSize, total: result.total, has_next: page * pageSize < result.total });
    }
    const resourceId = /^\/resources\/([0-9a-f-]+)$/i.exec(path)?.[1];
    if (method === 'GET' && resourceId) {
      if (!uuid.test(resourceId)) fail(404, 'NOT_FOUND', 'Resource not found.');
      const found = await deps.repo.detail(resourceId, deps.allowDemo);
      if (!found) fail(404, 'NOT_FOUND', 'Resource not found.');
      return json(found);
    }
    if (method === 'POST' && path === '/correction-reports') {
      const input = await body(request);
      allowedFields(input, ['service_id','reason_code','description']);
      if (typeof input.service_id !== 'string' || !uuid.test(input.service_id) || typeof input.reason_code !== 'string' || !reasons.has(input.reason_code)) fail(422, 'VALIDATION_ERROR', 'Invalid report target or reason.');
      if (input.description != null && (typeof input.description !== 'string' || input.description.length > 1000)) fail(422, 'VALIDATION_ERROR', 'Description is too long.');
      const id = await deps.repo.createReport({ serviceId: input.service_id, reasonCode: input.reason_code, description: (input.description as string | null) ?? null, allowDemo: deps.allowDemo });
      if (!id) fail(404, 'NOT_FOUND', 'Resource not found.');
      return json({ id, status: 'open', message: 'Thank you. The report was received.' }, 202);
    }
    if (method === 'GET' && path === '/me') return json(await account(request, deps));
    if (method === 'GET' && path === '/services') {
      const user = await account(request, deps);
      const page = numeric(url.searchParams.get('page'), 'page', 1, 100000, 1);
      const pageSize = numeric(url.searchParams.get('page_size'), 'page_size', 1, 50, 20);
      if (!Number.isInteger(page) || !Number.isInteger(pageSize)) fail(422, 'VALIDATION_ERROR', 'Page values must be integers.');
      const result = await deps.repo.listEditableServices(user, page, pageSize);
      return json({ items: result.items, total: result.total, page, page_size: pageSize, has_next: page * pageSize < result.total });
    }
    const serviceId = /^\/services\/([0-9a-f-]+)$/i.exec(path)?.[1];
    if (method === 'GET' && serviceId) {
      if (!uuid.test(serviceId)) fail(404, 'NOT_FOUND', 'Service not found.');
      const user = await account(request, deps);
      if (!await deps.repo.canEditService(serviceId, user)) fail(404, 'NOT_FOUND', 'Service not found.');
      const service = await deps.repo.editableService(serviceId, user);
      if (!service) fail(404, 'NOT_FOUND', 'Service not found.');
      return json(service);
    }
    if (method === 'PATCH' && serviceId) {
      if (!uuid.test(serviceId)) fail(404, 'NOT_FOUND', 'Service not found.');
      const user = await account(request, deps);
      if (!await deps.repo.canEditService(serviceId, user)) fail(404, 'NOT_FOUND', 'Service not found.');
      const input = await body(request);
      allowedFields(input, ['expected_version','title','summary','eligibility_text','cost_summary','status']);
      if (!Number.isSafeInteger(input.expected_version) || Number(input.expected_version) < 1 || Number(input.expected_version) > 2147483647) fail(422, 'VALIDATION_ERROR', 'Expected version is required.');
      const patch: ServicePatch = {};
      for (const key of ['title','summary','eligibility_text','cost_summary'] as const) {
        if (Object.hasOwn(input, key)) {
          const value = input[key];
          const maxLength = key === 'title' ? 160 : 500;
          if (value !== null && (typeof value !== 'string' || value.length > maxLength || (key === 'title' && value.trim().length < 2))) fail(422, 'VALIDATION_ERROR', 'Invalid service text.', { [key]: `Use at most ${maxLength} characters.` });
          if ((key === 'title' || key === 'summary') && value === null) fail(422, 'VALIDATION_ERROR', 'Title and summary cannot be null.');
          Object.assign(patch, { [key]: typeof value === 'string' ? value.trim() : null });
        }
      }
      if (Object.hasOwn(input, 'status')) {
        if (input.status !== 'draft' && input.status !== 'published' && input.status !== 'hidden') fail(422, 'VALIDATION_ERROR', 'Invalid status.');
        patch.status = input.status;
      }
      if (!Object.keys(patch).length) fail(422, 'VALIDATION_ERROR', 'No changes supplied.');
      const updated = await deps.repo.updateService(serviceId, user, Number(input.expected_version), patch);
      if (!updated) fail(409, 'VERSION_CONFLICT', 'This record changed. Refresh it and try again.');
      return json(updated);
    }
    fail(404, 'NOT_FOUND', 'Endpoint not found.');
  } catch (error) {
    if (error instanceof UnavailableError) return json({ error: { code: error.code, message: error.message } }, 503);
    if (error instanceof ApiError) return json({ error: { code: error.code, message: error.message, ...(error.fields ? { fields: error.fields } : {}) } }, error.status);
    console.error('Our Ground API error', { name: error instanceof Error ? error.name : 'UnknownError', code: (error as { code?: string })?.code });
    return json({ error: { code: 'INTERNAL_ERROR', message: 'The request could not be completed.' } }, 500);
  }
}
import { UnavailableError } from './errors.ts';
