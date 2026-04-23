'use client';

import Script from 'next/script';

export function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const umamiWebsiteId = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;
  const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;

  return (
    <>
      {/* Google Analytics 4 */}
      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="google-analytics" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `}
          </Script>
        </>
      )}

      {/* Umami Analytics — injected via inline script to guarantee data-website-id */}
      {umamiWebsiteId && umamiUrl && (
        <Script id="umami-analytics" strategy="afterInteractive">
          {`
            (function() {
              var s = document.createElement('script');
              s.defer = true;
              s.src = '${umamiUrl}/script.js';
              s.setAttribute('data-website-id', '${umamiWebsiteId}');
              document.head.appendChild(s);
            })();
          `}
        </Script>
      )}
    </>
  );
}
