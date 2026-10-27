import { randomUUID } from 'node:crypto';
import type { Account, Category, Repository, ServicePatch, Status } from './app.ts';

const fixtures = [
  { id: '11111111-1111-4111-8111-111111111111', organization_id: '22222222-2222-4222-8222-222222222222', location_id: '33333333-3333-4333-8333-333333333333', organization_name: 'Demo Community Organization', title: 'Demo Community Pantry — fictional', summary: 'Fictional food support example.', city: 'Harrisburg', latitude: 40.2732, longitude: -76.8867, category: 'food' as Category, weekday: 1, opens_at: '09:00:00', closes_at: '16:00:00' },
  { id: '77777777-7777-4777-8777-777777777777', organization_id: '55555555-5555-4555-8555-555555555555', location_id: '66666666-6666-4666-8666-666666666666', organization_name: 'Demo Neighborhood Clinic', title: 'Demo Neighborhood Health Desk — fictional', summary: 'Fictional healthcare navigation example.', city: 'Philadelphia', latitude: 39.9526, longitude: -75.1636, category: 'healthcare' as Category, weekday: 2, opens_at: '10:00:00', closes_at: '15:00:00' }
];
function miles(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2 + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lng2 - lng1) * rad / 2) ** 2;
  return 3958.7613 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
export class DemoRepository implements Repository {
  private records = fixtures.map((item) => ({ ...item, eligibility_text: 'Fictional example; no eligibility claim.' as string | null, cost_summary: 'Fictional example' as string | null, status: 'published' as Status, version: 1, updated_at: new Date().toISOString() }));
  private reports: Array<{ id: string; service_id: string; reason_code: string; description: string | null }> = [];
  private editorUserId: string | undefined;
  constructor(editorUserId?: string) { this.editorUserId = editorUserId; }
  private card(record: typeof this.records[number]) {
    return {
      id: record.id, title: record.title, summary: record.summary, category_slugs: [record.category],
      organization: { id: record.organization_id, name: record.organization_name },
      location: { city: record.city, state: 'PA', address_label: 'DEMO POINT — NOT A VISITABLE ADDRESS', latitude: record.latitude, longitude: record.longitude },
      data_kind: 'fictional_demo', source_recorded_at: null
    };
  }
  async search(input: { lat: number; lng: number; radiusMiles: number; category: Category | null; keyword?: string; page: number; pageSize: number; allowDemo: boolean }) {
    const matches = this.records.filter((r) => input.allowDemo && r.status === 'published' && (!input.category || r.category === input.category) && (!input.keyword || (r.title + ' ' + r.summary + ' No real service is offered at this map point.').toLowerCase().includes(input.keyword.toLowerCase())))
      .map((r) => ({ record: r, distance: miles(input.lat, input.lng, r.latitude, r.longitude) }))
      .filter((r) => r.distance <= input.radiusMiles).sort((a, b) => a.distance - b.distance || a.record.id.localeCompare(b.record.id));
    return { total: matches.length, items: matches.slice((input.page - 1) * input.pageSize, input.page * input.pageSize).map(({ record, distance }) => ({ ...this.card(record), distance_miles: Math.round(distance * 10) / 10 })) };
  }
  async detail(id: string, allowDemo: boolean) {
    const r = this.records.find((r) => r.id === id && r.status === 'published');
    if (!r || !allowDemo) return null;
    return { ...this.card(r), summary: r.summary, description: 'No real service is offered at this map point.', eligibility_text: r.eligibility_text, cost_summary: r.cost_summary,
      hours: [{ weekday: r.weekday, opens_at: r.opens_at, closes_at: r.closes_at, notes: 'Fictional hours' }],
      contact: { phone: null, website_url: null, directions_url: null }, source: { url: null, recorded_at: null } };
  }
  async createReport(input: { serviceId: string; reasonCode: string; description: string | null; allowDemo: boolean }) {
    if (!await this.detail(input.serviceId, input.allowDemo)) return null;
    const id = randomUUID();
    this.reports.push({ id, service_id: input.serviceId, reason_code: input.reasonCode, description: input.description });
    return id;
  }
  async account(userId: string): Promise<Account> {
    return { id: userId, role: 'user', organizations: userId === this.editorUserId ? [{ id: fixtures[0].organization_id, name: fixtures[0].organization_name, role: 'editor' }] : [] };
  }
  async canEditService(id: string, account: Account) {
    return this.records.some((r) => r.id === id && account.organizations.some((o) => o.id === r.organization_id));
  }
  async editableService(id: string, account: Account) {
    if (!await this.canEditService(id, account)) return null;
    const r = this.records.find((r) => r.id === id);
    return r ? { id: r.id, organization_id: r.organization_id, location_id: r.location_id, title: r.title, summary: r.summary, eligibility_text: r.eligibility_text, cost_summary: r.cost_summary, status: r.status, version: r.version, updated_at: r.updated_at } : null;
  }
  async listEditableServices(account: Account, page: number, pageSize: number) {
    const records = this.records.filter((r) => account.organizations.some((o) => o.id === r.organization_id));
    return { total: records.length, items: records.slice((page-1)*pageSize,page*pageSize).map((r) => ({ id:r.id,title:r.title,status:r.status,version:r.version,organization_id:r.organization_id })) };
  }
  async updateService(id: string, account: Account, version: number, patch: ServicePatch) {
    if (!await this.canEditService(id, account)) return null;
    const r = this.records.find((r) => r.id === id && r.version === version);
    if (!r) return null;
    Object.assign(r, patch, { version: version + 1, updated_at: new Date().toISOString() });
    return { id: r.id, status: r.status, version: r.version };
  }
}
