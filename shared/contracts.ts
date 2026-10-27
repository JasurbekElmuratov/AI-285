export type ServiceCategory = 'food' | 'healthcare';
export type ServiceStatus = 'draft' | 'published' | 'hidden';
export type SearchCategory = ServiceCategory | 'all';
export interface Place { label: string; city: string; state: 'PA'; latitude: number; longitude: number }
export interface ResourceCard {
  id: string; title: string; summary: string; category_slugs: ServiceCategory[];
  organization: { id: string; name: string };
  location: { city: string; state: 'PA'; address_label: string; latitude: number; longitude: number };
  distance_miles: number; data_kind: 'fictional_demo' | 'sourced_unverified'; source_recorded_at: string | null;
}
export interface ResourceDetail extends Omit<ResourceCard, 'distance_miles'> {
  description: string; eligibility_text: string | null; cost_summary: string | null;
  hours: Array<{ weekday: number; opens_at: string; closes_at: string; notes: string | null }>;
  contact: { phone: string | null; website_url: string | null; directions_url: string | null };
  source: { url: string | null; recorded_at: string | null };
}
export interface Collection<T> { items: T[]; page: number; page_size: number; total: number; has_next: boolean }
export interface SearchResults extends Collection<ResourceCard> { search_center: { latitude: number; longitude: number } }
export interface CurrentAccount {
  id: string; role: 'user' | 'admin'; organizations: Array<{ id: string; name: string; role: 'editor' }>;
}
export interface EditableService {
  id: string; organization_id: string; location_id: string; title: string; summary: string;
  eligibility_text: string | null; cost_summary: string | null; status: ServiceStatus; version: number; updated_at: string;
}
export type ServiceUpdate = Pick<EditableService, 'title' | 'summary' | 'eligibility_text' | 'cost_summary' | 'status'>;
