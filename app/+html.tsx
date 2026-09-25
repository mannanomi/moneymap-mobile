import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>MoneyMap</title>
        <meta name="description" content="Personal finance tracker" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="MoneyMap" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#0A0E16" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: `
          html, body { height: 100%; margin: 0; overflow: hidden; overscroll-behavior: none; -webkit-text-size-adjust: 100%; touch-action: manipulation; }
          body { background: #F2F4F8; }
          /* Pin the app to the full screen (including the areas under the iPhone status bar and home indicator). */
          #root { position: fixed; top: 0; right: 0; left: 0; height: 100vh; height: 100dvh; display: flex; }
          @media (prefers-color-scheme: dark) { body { background: #0A0E16; } }
        ` }} />
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function () { navigator.serviceWorker.register('/sw.js').catch(function () {}); });
          }
        ` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
