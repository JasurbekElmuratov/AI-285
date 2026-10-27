import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import type { Place, ResourceCard } from '../shared/contracts';

export function mountResourceMap(container: HTMLElement, onFailure: () => void) {
  const token = import.meta.env.VITE_MAPBOX_PUBLIC_TOKEN;
  if (!token || !token.startsWith('pk.')) { onFailure(); return null; }
  const map = new mapboxgl.Map({ container, accessToken: token, style: 'mapbox://styles/mapbox/dark-v11', center: [-77.6,40.7], zoom: 6, attributionControl: true });
  map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
  let markers: mapboxgl.Marker[] = [];
  map.on('error', onFailure);
  return {
    update(items: ResourceCard[], center: Place | null, href: (id: string) => string) {
      markers.forEach((marker) => marker.remove()); markers = [];
      const bounds = new mapboxgl.LngLatBounds();
      if (center) bounds.extend([center.longitude,center.latitude]);
      for (const r of items) {
        const button = document.createElement('a');
        button.className = 'api-map-marker' + (r.category_slugs.includes('healthcare') ? ' api-map-marker--blue' : '');
        button.href = href(r.id); button.setAttribute('aria-label', 'View ' + r.title); button.title = r.title;
        markers.push(new mapboxgl.Marker({ element: button }).setLngLat([r.location.longitude,r.location.latitude]).addTo(map));
        bounds.extend([r.location.longitude,r.location.latitude]);
      }
      map.resize();
      if (!bounds.isEmpty()) map.fitBounds(bounds, { padding: 65, maxZoom: 12, duration: 0 });
    },
    resize() { map.resize(); },
    remove() { map.remove(); }
  };
}
