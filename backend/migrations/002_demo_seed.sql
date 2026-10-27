-- Fictional demo fixtures. Apply only in a development database.
-- No street address, phone, live URL, directions, or donation action is supplied.
insert into app_private.organizations(id,name,description,status,is_demo)
values
  ('22222222-2222-4222-8222-222222222222','Demo Community Organization','Fictional organization for interface testing.','published',true),
  ('55555555-5555-4555-8555-555555555555','Demo Neighborhood Clinic','Fictional organization for interface testing.','published',true)
on conflict (id) do nothing;

insert into app_private.service_locations
  (id,organization_id,site_name,city,state,postal_code,point,status,is_demo)
values
  ('33333333-3333-4333-8333-333333333333','22222222-2222-4222-8222-222222222222',
   'Demo Harrisburg map point','Harrisburg','PA','17101',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-76.8867,40.2732),4326)::extensions.geography,'published',true),
  ('66666666-6666-4666-8666-666666666666','55555555-5555-4555-8555-555555555555',
   'Demo Philadelphia map point','Philadelphia','PA','19102',
   extensions.ST_SetSRID(extensions.ST_MakePoint(-75.1636,39.9526),4326)::extensions.geography,'published',true)
on conflict (id) do nothing;

insert into app_private.services
  (id,organization_id,location_id,title,summary,description,eligibility_text,cost_summary,status,is_demo)
values
  ('11111111-1111-4111-8111-111111111111','22222222-2222-4222-8222-222222222222',
   '33333333-3333-4333-8333-333333333333','Demo Community Pantry — fictional',
   'Fictional food support example.','No real service is offered at this map point.',
   'Fictional example; no eligibility claim.','Fictional example','published',true),
  ('77777777-7777-4777-8777-777777777777','55555555-5555-4555-8555-555555555555',
   '66666666-6666-4666-8666-666666666666','Demo Neighborhood Health Desk — fictional',
   'Fictional healthcare navigation example.','No real clinic service is offered at this map point.',
   'Fictional example; no eligibility claim.','Fictional example','published',true)
on conflict (id) do nothing;

insert into app_private.service_categories(service_id,category_id)
select '11111111-1111-4111-8111-111111111111',id from app_private.categories where slug='food'
on conflict do nothing;
insert into app_private.service_categories(service_id,category_id)
select '77777777-7777-4777-8777-777777777777',id from app_private.categories where slug='healthcare'
on conflict do nothing;

insert into app_private.opening_hours(id,service_id,weekday,opens_at,closes_at,notes)
values
  ('88888888-8888-4888-8888-888888888888','11111111-1111-4111-8111-111111111111',1,'09:00','16:00','Fictional hours'),
  ('99999999-9999-4999-8999-999999999999','77777777-7777-4777-8777-777777777777',2,'10:00','15:00','Fictional hours')
on conflict (id) do nothing;
