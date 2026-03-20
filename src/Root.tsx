import React, { useEffect, useMemo, useState } from 'react';
import Landing from './Landing';
import TimerApp from './App';

type Route = 'landing' | 'app';

function getRouteFromLocation(): Route {
  const params = new URLSearchParams(window.location.search);
  if (params.get('display') === 'true') return 'app';

  const raw = window.location.hash || '';
  const h = raw.replace(/^#/, '');
  const normalized = h.startsWith('/') ? h : `/${h}`;
  if (normalized.startsWith('/app')) return 'app';
  return 'landing';
}

export default function Root() {
  const [route, setRoute] = useState<Route>(() => getRouteFromLocation());

  useEffect(() => {
    const onChange = () => setRoute(getRouteFromLocation());
    window.addEventListener('hashchange', onChange);
    window.addEventListener('popstate', onChange);
    return () => {
      window.removeEventListener('hashchange', onChange);
      window.removeEventListener('popstate', onChange);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('app-mode', route === 'app');
    if (route === 'landing') document.title = 'Presenta Pro';
  }, [route]);

  const openApp = useMemo(() => {
    return () => {
      if (window.location.hash === '#/app') return;
      window.location.hash = '#/app';
    };
  }, []);

  if (route === 'app') return <TimerApp />;

  return <Landing onOpenApp={openApp} />;
}

