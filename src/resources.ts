export type Category = 'all' | 'food' | 'healthcare' | 'transportation';
export type ResourceCategory = Exclude<Category, 'all'>;
export type CityId = 'los-angeles' | 'denver' | 'new-york' | 'miami';

export const categories: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'food', label: 'Food' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'transportation', label: 'Transportation' },
];

export const cities: { id: CityId; name: string; state: string; zip: string; point: [number, number]; aliases: string[]; prefixes: string[] }[] = [
  { id: 'los-angeles', name: 'Los Angeles', state: 'CA', zip: '90012', point: [14.36, 55.22], aliases: ['los angeles', 'los angeles ca', 'la'], prefixes: ['900', '901', '902'] },
  { id: 'denver', name: 'Denver', state: 'CO', zip: '80202', point: [37.40, 50.44], aliases: ['denver', 'denver co'], prefixes: ['800', '801', '802'] },
  { id: 'new-york', name: 'New York', state: 'NY', zip: '10001', point: [79.15, 50.19], aliases: ['new york', 'new york ny', 'new york city', 'nyc'], prefixes: ['100', '101', '102', '103', '104', '111', '112', '113', '114', '116'] },
  { id: 'miami', name: 'Miami', state: 'FL', zip: '33130', point: [76.78, 80.91], aliases: ['miami', 'miami fl'], prefixes: ['330', '331', '332'] },
];

export interface Resource {
  id: string;
  title: string;
  category: ResourceCategory;
  cityId: CityId;
  description: string;
  offers: string[];
  eligibility: string;
  schedule: string;
  cost: string;
  preparation: string;
  landing?: 'food' | 'health' | 'transport' | 'pantry';
}

export const resources: Resource[] = [
  { id: 'food-access', title: 'Food Access', category: 'food', cityId: 'los-angeles', landing: 'food', description: 'A neighborhood starting point for groceries, meal programs, and everyday food support.', offers: ['Grocery assistance', 'Connections to local meal programs', 'Food-support information'], eligibility: 'Local residents looking for food support.', schedule: 'Monday–Friday, 9 am–4 pm', cost: 'No cost in this example', preparation: 'Confirm the location, opening hours, and any documents before visiting a real service.' },
  { id: 'free-health-clinic', title: 'Free Health Clinic', category: 'healthcare', cityId: 'denver', landing: 'health', description: 'An example community clinic connecting people with primary care and wellness support.', offers: ['Primary-care appointments', 'Preventive wellness support', 'Care-navigation information'], eligibility: 'Adults seeking community healthcare. Requirements would need to be checked with a real provider.', schedule: 'Monday–Thursday, 8 am–5 pm', cost: 'No cost in this example', preparation: 'A real clinic may require an appointment. Confirm availability and what to bring directly with the provider.' },
  { id: 'transportation-support', title: 'Transportation Support', category: 'transportation', cityId: 'new-york', landing: 'transport', description: 'Help getting to appointments, groceries, and other everyday essentials.', offers: ['Appointment ride support', 'Transit information', 'Travel-planning assistance'], eligibility: 'Residents who need help reaching everyday services.', schedule: 'Monday–Friday, 7 am–6 pm', cost: 'No cost in this example', preparation: 'Real ride programs may require advance booking. Confirm pickup options and eligibility before planning a trip.' },
  { id: 'community-food-pantry', title: 'Community Food Pantry', category: 'food', cityId: 'miami', landing: 'pantry', description: 'An example neighborhood pantry offering groceries and a welcoming place to find food support.', offers: ['Pantry groceries', 'Fresh-food support', 'Connections to neighborhood assistance'], eligibility: 'Local households looking for grocery support.', schedule: 'Tuesday and Thursday, 10 am–2 pm', cost: 'No cost in this example', preparation: 'Check the next distribution time and any registration requirements with a real pantry before visiting.' },
  { id: 'neighborhood-meal-program', title: 'Neighborhood Meal Program', category: 'food', cityId: 'los-angeles', description: 'A welcoming place for a prepared meal and connections to other community resources.', offers: ['Prepared meals', 'Community food information', 'Connections to nearby support'], eligibility: 'Community members seeking meal support.', schedule: 'Monday–Friday, 11 am–2 pm', cost: 'No cost in this example', preparation: 'Confirm serving times and current availability with a real meal program.' },
  { id: 'community-wellness-center', title: 'Community Wellness Center', category: 'healthcare', cityId: 'los-angeles', description: 'A local starting point for wellness information and help navigating community care.', offers: ['Wellness information', 'Care navigation', 'Connections to community clinics'], eligibility: 'Local residents looking for care information.', schedule: 'Monday–Friday, 9 am–5 pm', cost: 'No cost in this example', preparation: 'Check appointment requirements and the services offered by a real provider.' },
  { id: 'community-grocery-support', title: 'Community Grocery Support', category: 'food', cityId: 'denver', description: 'Example grocery support designed to help households find everyday essentials.', offers: ['Grocery support', 'Food-assistance information', 'Connections to meal programs'], eligibility: 'Local households seeking food assistance.', schedule: 'Wednesday and Saturday, 10 am–1 pm', cost: 'No cost in this example', preparation: 'Confirm registration, distribution hours, and what to bring with a real program.' },
  { id: 'appointment-ride-program', title: 'Appointment Ride Program', category: 'transportation', cityId: 'denver', description: 'An example ride program helping community members reach scheduled appointments.', offers: ['Appointment rides', 'Trip-planning information', 'Connections to transit assistance'], eligibility: 'Local residents with transportation needs.', schedule: 'Monday–Friday, 8 am–5 pm', cost: 'No cost in this example', preparation: 'A real program may need advance reservations. Confirm the route and booking requirements.' },
  { id: 'neighborhood-food-pantry', title: 'Neighborhood Food Pantry', category: 'food', cityId: 'new-york', description: 'A community pantry connecting households with grocery support and food information.', offers: ['Pantry groceries', 'Food-assistance information', 'Neighborhood resource connections'], eligibility: 'Local households seeking groceries.', schedule: 'Monday, Wednesday, Friday, 10 am–3 pm', cost: 'No cost in this example', preparation: 'Verify the distribution schedule and any household registration requirements.' },
  { id: 'community-care-clinic', title: 'Community Care Clinic', category: 'healthcare', cityId: 'new-york', description: 'An example clinic making it easier to learn about care options in the community.', offers: ['Community care information', 'Primary-care connections', 'Appointment navigation'], eligibility: 'Residents exploring community healthcare options.', schedule: 'Monday–Friday, 9 am–5 pm', cost: 'No cost in this example', preparation: 'Contact a real provider to check appointments, available services, and eligibility.' },
  { id: 'community-ride-support', title: 'Community Ride Support', category: 'transportation', cityId: 'miami', description: 'An example transportation resource for getting to community services and daily essentials.', offers: ['Community ride information', 'Travel-planning help', 'Transit-assistance connections'], eligibility: 'Local residents looking for transportation support.', schedule: 'Monday–Friday, 8 am–4 pm', cost: 'No cost in this example', preparation: 'Confirm booking times, coverage, and pickup arrangements with a real service.' },
  { id: 'neighborhood-health-center', title: 'Neighborhood Health Center', category: 'healthcare', cityId: 'miami', description: 'An example neighborhood center connecting residents with wellness and care information.', offers: ['Wellness information', 'Care-navigation support', 'Community clinic connections'], eligibility: 'Community members exploring healthcare support.', schedule: 'Monday–Thursday, 9 am–5 pm', cost: 'No cost in this example', preparation: 'Verify the services offered and appointment requirements with a real health center.' },
];

export function categoryLabel(category: Category): string {
  return categories.find((item) => item.id === category)?.label ?? 'All';
}

export function parseCategory(value: string | null): Category {
  return categories.some((item) => item.id === value) ? value as Category : 'all';
}

export function cityForResource(resource: Resource) {
  const city = cities.find((item) => item.id === resource.cityId);
  if (!city) throw new Error(`Unknown example city: ${resource.cityId}`);
  return city;
}

export function resolveLocation(value: string): CityId | null | 'unknown' {
  const normalized = value.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, ' ');
  if (!normalized) return null;
  const city = cities.find((item) => item.id === normalized || item.aliases.includes(normalized) ||
    (/^\d{5}$/.test(normalized) && item.prefixes.includes(normalized.slice(0, 3))));
  return city?.id ?? 'unknown';
}

export function filterResources(category: Category, location: string, keyword = ''): Resource[] {
  const cityId = resolveLocation(location);
  const query = keyword.trim().toLowerCase();
  return resources.filter((resource) => (category === 'all' || resource.category === category) &&
    (cityId === null || resource.cityId === cityId) &&
    (!query || `${resource.title} ${resource.description} ${resource.offers.join(' ')}`.toLowerCase().includes(query)));
}

export function supportUrl(category: Category = 'all', location = '', keyword = ''): string {
  const query = new URLSearchParams();
  if (category !== 'all') query.set('category', category);
  if (location.trim()) query.set('location', location.trim());
  if (keyword.trim()) query.set('q', keyword.trim());
  return `/support${query.size ? `?${query}` : ''}`;
}
