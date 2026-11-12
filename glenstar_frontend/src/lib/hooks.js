import { useState, useEffect, useRef, useCallback } from 'react';

// Load data with loading/error state. `reload()` refetches; when `interval` is
// set the data is refreshed quietly in the background.
export function useLoad(loader, deps = [], { interval = 0 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const alive = useRef(true);
  const seq = useRef(0);

  const reload = useCallback(async ({ quiet = false } = {}) => {
    const mine = ++seq.current;
    if (!quiet) setState(s => ({ ...s, loading: true }));
    try {
      const data = await loaderRef.current();
      if (alive.current && mine === seq.current) setState({ data, error: null, loading: false });
      return data;
    } catch (err) {
      if (alive.current && mine === seq.current) {
        setState(s => (quiet && s.data ? { ...s, loading: false } : { data: null, error: err.message, loading: false }));
      }
      return null;
    }
  }, []);

  useEffect(() => {
    alive.current = true;
    reload();
    return () => { alive.current = false; };
  }, deps);

  useEffect(() => {
    if (!interval) return undefined;
    const id = setInterval(() => reload({ quiet: true }), interval);
    return () => clearInterval(id);
  }, [interval, reload]);

  return { ...state, reload };
}
