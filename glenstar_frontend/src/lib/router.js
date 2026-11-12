// Minimal path-based routing (no extra dependency). Each page gets its own URL,
// so refresh, bookmarks, links and the browser back button all work.
// vercel.json rewrites every path to index.html, so deep links load the app.
import { useState, useEffect, useCallback } from 'react';

// Match a pathname against routes like { id, path: '/reports/:id' }.
// Returns { id, params } — unknown paths fall back to the first route.
export function matchRoute(pathname, routes) {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  const parts = clean.split('/').filter(Boolean);
  for (const route of routes) {
    const pattern = route.path.split('/').filter(Boolean);
    if (pattern.length !== parts.length) continue;
    const params = {};
    const ok = pattern.every((seg, i) => {
      if (seg.startsWith(':')) { params[seg.slice(1)] = decodeURIComponent(parts[i]); return true; }
      return seg === parts[i];
    });
    if (ok) return { id: route.id, params };
  }
  return { id: routes[0].id, params: {} };
}

export function useRoute(routes) {
  const read = () => ({ ...matchRoute(window.location.pathname, routes), search: window.location.search });
  const [route, setRoute] = useState(read);

  useEffect(() => {
    const onPop = () => setRoute(read());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [routes]);

  const navigate = useCallback(to => {
    if (to !== window.location.pathname + window.location.search) {
      window.history.pushState({}, '', to);
    }
    setRoute({ ...matchRoute(window.location.pathname, routes), search: window.location.search });
    const main = document.querySelector('.content');
    if (main) main.scrollTop = 0;
  }, [routes]);

  return [route, navigate];
}

// Lets plain <a href> links navigate without a page reload, while still allowing
// open-in-new-tab with modifier keys.
export function linkHandler(navigate, to) {
  return e => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(to);
  };
}
