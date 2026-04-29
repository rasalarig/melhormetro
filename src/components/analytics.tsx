'use client';

import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

function loadScript(src: string, attrs: Record<string, string> = {}) {
  if (document.querySelector(`script[src="${src}"]`)) return;
  const script = document.createElement('script');
  script.src = src;
  Object.entries(attrs).forEach(([k, v]) => script.setAttribute(k, v));
  document.head.appendChild(script);
}

function injectGA4(measurementId: string) {
  loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, { async: '' });

  if (!(window as any).gtag) {
    (window as any).dataLayer = (window as any).dataLayer || [];
    function gtag(...args: unknown[]) {
      (window as any).dataLayer.push(args);
    }
    (window as any).gtag = gtag;
    gtag('js', new Date());
    gtag('config', measurementId);
  }
}

function injectUmami(umamiUrl: string, websiteId: string) {
  loadScript(`${umamiUrl}/script.js`, { defer: '', 'data-website-id': websiteId });
}

function AnalyticsInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // On mount: load analytics scripts if consent is "accepted"
  useEffect(() => {
    const consent = typeof window !== 'undefined' ? localStorage.getItem('cookie-consent') : null;
    if (consent !== 'accepted') return;

    const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
    const umamiId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

    if (gaId) injectGA4(gaId);
    if (umamiUrl && umamiId) injectUmami(umamiUrl, umamiId);
  }, []);

  // On route change: track SPA navigation
  useEffect(() => {
    const url = pathname + (searchParams?.toString() ? `?${searchParams}` : '');

    if (typeof window === 'undefined') return;

    if ((window as any).umami) {
      (window as any).umami.track((props: any) => ({
        ...props,
        url,
        referrer: document.referrer,
      }));
    }

    if ((window as any).gtag) {
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null;
}

export function AnalyticsProvider() {
  return (
    <Suspense fallback={null}>
      <AnalyticsInner />
    </Suspense>
  );
}

// Keep backward-compatible export
export { AnalyticsProvider as RouteTracker };
