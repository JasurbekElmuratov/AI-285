const path = window.location.pathname.replace(/\/$/, '') || '/';

if (path === '/demo') {
  void import('./demo');
} else if (path === '/') {
  void import('./landing');
} else if (path === '/support') {
  void import('./support');
} else if (path === '/account') {
  void import('./account');
} else if (path.startsWith('/staff/services/')) {
  void import('./staff');
} else if (path.startsWith('/resources/')) {
  void import('./resource-detail');
} else {
  void import('./info');
}

export {};
