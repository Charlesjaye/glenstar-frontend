// Minimal path-based routing (no extra dependency). Each page gets its own URL,
// so refresh, bookmarks, links and the browser back button all work.
// vercel.json rewrites every path to index.html, so deep links load the app.
import { useState, useEffect, useCallback } from 'react';

export function pageFromPath(pathname, routes) {
  const clean = (pathname || '/').replace(/\/+$/, '') || '/';
  const match = routes.find(r => r.path === clean);
  return match ? match.id : routes[0].id;
}

export function usePage(routes) {
  const [page, setPage] = useState(() => pageFromPath(window.location.pathname, routes));

  useEffect(() => {
    const onPop = () => setPage(pageFromPath(window.location.pathname, routes));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [routes]);

  const navigate = useCallback(id => {
    const route = routes.find(r => r.id === id);
    if (!route) return;
    if (window.location.pathname !== route.path) {
      window.history.pushState({}, '', route.path);
    }
    setPage(id);
    window.scrollTo(0, 0);
  }, [routes]);

  return [page, navigate];
}
