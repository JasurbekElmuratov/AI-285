import postgres from 'postgres';
import { UnavailableError } from './errors.ts';
import type { Account, Category, Repository, ServicePatch, Status } from './app.ts';

let client: ReturnType<typeof postgres> | undefined;
function db(): ReturnType<typeof postgres> {
  if (!process.env.DATABASE_URL) throw new UnavailableError('DATABASE_NOT_CONFIGURED', 'Resource information is temporarily unavailable.');
  client ??= postgres(process.env.DATABASE_URL, {
    max: 1, prepare: false, ssl: process.env.DB_SSL === 'disable' ? false : 'require', connect_timeout: 10, idle_timeout: 20
  });
  return client;
}
let queue: Promise<void> = Promise.resolve();
function query(text: string, args: unknown[] = []) {
  // Every SQL string below is static. Values are bound as $1, $2, ... parameters.
  // Serialize submissions: Postgres.js pipelining is incompatible with Supavisor transaction mode.
  const result = queue.then(() => db().unsafe(text, args as never[]));
  queue = result.then(() => undefined, () => undefined);
  return result;
}
function kind(isDemo: boolean) { return isDemo ? 'fictional_demo' : 'sourced_unverified'; }
function iso(value: Date | string | null | undefined) { return value ? new Date(value).toISOString() : null; }
const visible = [
  "s.status = 'published' and l.status = 'published' and o.status = 'published'",
  '($5::boolean or (not s.is_demo and not l.is_demo and not o.is_demo))',
  'extensions.ST_DWithin(l.point, extensions.ST_SetSRID(extensions.ST_MakePoint($2,$1),4326)::extensions.geography, $3)',
  '($4::text is null or exists (select 1 from app_private.service_categories sc join app_private.categories c on c.id = sc.category_id where sc.service_id = s.id and c.slug = $4))',
  "($6::text = '' or position(lower($6::text) in lower(s.title || ' ' || s.summary || ' ' || s.description)) > 0)"
].join(' and ');
const joins = [
  'from app_private.services s',
  'join app_private.service_locations l on l.id = s.location_id',
  'join app_private.organizations o on o.id = s.organization_id'
].join(' ');
const editable = '(exists (select 1 from app_private.app_users u where u.id=$1 and u.role=\'admin\') or exists (select 1 from app_private.organization_memberships m where m.organization_id=s.organization_id and m.user_id=$1 and m.role=\'editor\'))';
export async function closeDatabase() { await client?.end(); client = undefined; }
export class PostgresRepository implements Repository {
  async search(input: { lat: number; lng: number; radiusMiles: number; category: Category | null; keyword?: string; page: number; pageSize: number; allowDemo: boolean }) {
    const args = [input.lat, input.lng, input.radiusMiles * 1609.344, input.category, input.allowDemo, input.keyword ?? ''];
    const count = await query('select count(*)::int as total ' + joins + ' where ' + visible, args);
    const select = [
      'select s.id, s.title, s.summary, (s.is_demo or l.is_demo or o.is_demo) as is_demo, s.source_recorded_at, o.id as organization_id, o.name as organization_name,',
      'l.city, l.state, l.street_address,',
      'extensions.ST_Y(l.point::extensions.geometry)::float8 as latitude,',
      'extensions.ST_X(l.point::extensions.geometry)::float8 as longitude,',
      'round((extensions.ST_Distance(l.point, extensions.ST_SetSRID(extensions.ST_MakePoint($2,$1),4326)::extensions.geography) / 1609.344)::numeric,1)::float8 as distance_miles,',
      'array(select c.slug from app_private.service_categories sc join app_private.categories c on c.id = sc.category_id',
      'where sc.service_id = s.id order by c.slug) as category_slugs'
    ].join(' ');
    const rows = await query(select + ' ' + joins + ' where ' + visible +
      ' order by distance_miles, s.id limit $7 offset $8',
      [...args, input.pageSize, (input.page - 1) * input.pageSize]);
    return {
      total: count[0]?.total ?? 0,
      items: rows.map((r) => ({
        id: r.id, title: r.title, summary: r.summary, category_slugs: r.category_slugs,
        organization: { id: r.organization_id, name: r.organization_name },
        location: {
          city: r.city, state: r.state,
          address_label: r.is_demo ? 'DEMO POINT — NOT A VISITABLE ADDRESS' : (r.street_address ?? 'Address unavailable'),
          latitude: r.latitude, longitude: r.longitude
        },
        distance_miles: r.distance_miles, data_kind: kind(r.is_demo),
        source_recorded_at: iso(r.source_recorded_at)
      }))
    };
  }
  async detail(id: string, allowDemo: boolean) {
    const rows = await query([
      'select s.*, (s.is_demo or l.is_demo or o.is_demo) as aggregate_is_demo, o.id as organization_id, o.name as organization_name, l.city, l.state, l.street_address,',
      'extensions.ST_Y(l.point::extensions.geometry)::float8 as latitude,',
      'extensions.ST_X(l.point::extensions.geometry)::float8 as longitude,',
      'array(select c.slug from app_private.service_categories sc join app_private.categories c on c.id = sc.category_id',
      'where sc.service_id = s.id order by c.slug) as category_slugs',
      joins, 'where s.id = $1 and s.status = $2 and l.status = $2 and o.status = $2',
      'and ($3::boolean or (not s.is_demo and not l.is_demo and not o.is_demo))'
    ].join(' '), [id, 'published', allowDemo]);
    const r = rows[0];
    if (!r) return null;
    const hours = await query(
      'select weekday, opens_at::text, closes_at::text, notes from app_private.opening_hours where service_id = $1 order by weekday, opens_at',
      [id]);
    const directions = r.aggregate_is_demo ? null : 'https://www.google.com/maps/dir/?api=1&destination=' + r.latitude + ',' + r.longitude;
    return {
      id: r.id, title: r.title, summary: r.summary, description: r.description,
      category_slugs: r.category_slugs,
      organization: { id: r.organization_id, name: r.organization_name },
      location: {
        city: r.city, state: r.state,
        address_label: r.aggregate_is_demo ? 'DEMO POINT — NOT A VISITABLE ADDRESS' : (r.street_address ?? 'Address unavailable'),
        latitude: r.latitude, longitude: r.longitude
      },
      hours, eligibility_text: r.eligibility_text, cost_summary: r.cost_summary,
      contact: { phone: r.aggregate_is_demo ? null : r.contact_phone, website_url: r.aggregate_is_demo ? null : r.contact_url, directions_url: directions },
      source: { url: r.aggregate_is_demo ? null : r.source_url, recorded_at: iso(r.source_recorded_at) },
      data_kind: kind(r.aggregate_is_demo), source_recorded_at: iso(r.source_recorded_at)
    };
  }
  async createReport(input: { serviceId: string; reasonCode: string; description: string | null; allowDemo: boolean }) {
    const rows = await query([
      'insert into app_private.correction_reports(service_id,reason_code,description)',
      'select s.id,$2,$3 ' + joins,
      "where s.id=$1 and s.status='published' and l.status='published' and o.status='published'",
      'and ($4::boolean or (not s.is_demo and not l.is_demo and not o.is_demo)) returning id'
    ].join(' '), [input.serviceId, input.reasonCode, input.description, input.allowDemo]);
    return rows[0]?.id ?? null;
  }
  async account(userId: string): Promise<Account> {
    await query('insert into app_private.app_users(id) values ($1) on conflict (id) do nothing', [userId]);
    const users = await query('select id,role from app_private.app_users where id=$1', [userId]);
    const memberships = await query([
      'select o.id,o.name,m.role from app_private.organization_memberships m',
      'join app_private.organizations o on o.id=m.organization_id where m.user_id=$1 order by o.name'
    ].join(' '), [userId]);
    return {
      id: users[0].id,
      role: users[0].role,
      organizations: memberships.map((r) => ({ id: r.id, name: r.name, role: 'editor' as const }))
    };
  }
  async canEditService(id: string, account: Account) {
    const rows = await query('select 1 from app_private.services s where s.id=$2 and ' + editable, [account.id, id]);
    return rows.length > 0;
  }
  async editableService(id: string, account: Account) {
    const rows = await query('select id,organization_id,location_id,title,summary,eligibility_text,cost_summary,status,version,updated_at from app_private.services s where s.id=$2 and ' + editable, [account.id, id]);
    return rows[0] ? { ...rows[0], updated_at: iso(rows[0].updated_at) } : null;
  }
  async listEditableServices(account: Account, page: number, pageSize: number) {
    const count = await query('select count(*)::int as total from app_private.services s where ' + editable, [account.id]);
    const items = await query('select s.id,s.title,s.status,s.version,s.organization_id from app_private.services s where ' + editable + ' order by s.updated_at desc,s.id limit $2 offset $3', [account.id, pageSize, (page-1)*pageSize]);
    return { items, total: count[0].total as number };
  }
  async updateService(id: string, account: Account, version: number, patch: ServicePatch) {
    const rows = await query([
      'update app_private.services s set',
      'title=coalesce($4::text,s.title), summary=coalesce($5::text,s.summary),',
      'eligibility_text=case when $6::boolean then $7::text else s.eligibility_text end,',
      'cost_summary=case when $8::boolean then $9::text else s.cost_summary end,',
      'status=coalesce($10::text,s.status),version=s.version+1,updated_by=$3,updated_at=now()',
      'where s.id=$1 and s.version=$2 and ((exists (select 1 from app_private.app_users u where u.id=$3 and u.role=$11)) or exists',
      '(select 1 from app_private.organization_memberships m where m.organization_id=s.organization_id and m.user_id=$3 and m.role=$12))',
      'and ($10::text is distinct from $13::text or exists',
      '(select 1 from app_private.organizations o join app_private.service_locations l on l.organization_id=o.id',
      "where o.id=s.organization_id and l.id=s.location_id and o.status='published' and l.status='published'))",
      'returning id,status,version'
    ].join(' '), [
      id, version, account.id, patch.title ?? null, patch.summary ?? null,
      Object.hasOwn(patch, 'eligibility_text'), patch.eligibility_text ?? null,
      Object.hasOwn(patch, 'cost_summary'), patch.cost_summary ?? null,
      patch.status ?? null, 'admin', 'editor', 'published'
    ]);
    return rows[0] ? { id: rows[0].id as string, status: rows[0].status as Status, version: rows[0].version as number } : null;
  }
}
