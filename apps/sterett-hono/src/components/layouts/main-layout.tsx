import type { FC } from "hono/jsx";

import { BeachScene } from "../beach-scene.tsx";
import { BoatScene } from "../boat-scene.tsx";
import { ForestScene } from "../forest-scene.tsx";

type MainLayoutProperties = {
  children?: unknown;
  description?: string;
  title?: string;
};

export const MainLayout: FC<MainLayoutProperties> = async ({
  children,
  description,
  title,
}) => {
  const pageTitle = title ?? "Sterett Creek Village Trustee";
  const pageDescription = description ?? "Sterett Creek Village Trustee Board";

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" sizes="any" href="/favicon.ico" />
        <link
          rel="icon"
          sizes="32x32"
          type="image/png"
          href="/favicon-32x32.png"
        />
        <link
          rel="icon"
          sizes="16x16"
          type="image/png"
          href="/favicon-16x16.png"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          crossorigin="anonymous"
          href="https://fonts.gstatic.com"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Source+Sans+3:wght@300;400;600&display=swap"
        />
        <link rel="stylesheet" href="/index.css" />
        <link rel="manifest" href="/manifest.json" />
        <meta content="#4a90b8" name="theme-color" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body class="relative text-white">
        <ForestScene />
        <BeachScene />
        <BoatScene />

        {/* Fish swimming underwater (all below the 63% waterline) */}
        <span
          aria-hidden="true"
          class="fish fish-right"
          style="top:67%;animation-duration:18s;animation-delay:0s;"
        >
          🐟
        </span>
        <span
          aria-hidden="true"
          class="fish fish-left"
          style="top:75%;animation-duration:24s;animation-delay:6s;"
        >
          🐠
        </span>
        <span
          aria-hidden="true"
          class="fish fish-right"
          style="top:70%;animation-duration:30s;animation-delay:12s;font-size:1rem;"
        >
          🐟
        </span>
        <span
          aria-hidden="true"
          class="fish fish-left"
          style="top:83%;animation-duration:20s;animation-delay:3s;font-size:2rem;"
        >
          🐡
        </span>
        <span
          aria-hidden="true"
          class="fish fish-right"
          style="top:91%;animation-duration:26s;animation-delay:9s;font-size:1.1rem;"
        >
          🐠
        </span>

        {/* Rising bubbles */}
        <span
          class="bubble"
          aria-hidden="true"
          style="bottom:5%;left:12%;width:10px;height:10px;animation-duration:8s;animation-delay:0s;"
        ></span>
        <span
          class="bubble"
          aria-hidden="true"
          style="bottom:5%;left:28%;width:6px;height:6px;animation-duration:11s;animation-delay:2s;"
        ></span>
        <span
          class="bubble"
          aria-hidden="true"
          style="bottom:5%;left:45%;width:14px;height:14px;animation-duration:9s;animation-delay:5s;"
        ></span>
        <span
          class="bubble"
          aria-hidden="true"
          style="bottom:5%;left:63%;width:8px;height:8px;animation-duration:13s;animation-delay:1s;"
        ></span>
        <span
          class="bubble"
          aria-hidden="true"
          style="bottom:5%;left:78%;width:10px;height:10px;animation-duration:10s;animation-delay:7s;"
        ></span>
        <span
          class="bubble"
          aria-hidden="true"
          style="bottom:5%;left:90%;width:6px;height:6px;animation-duration:12s;animation-delay:4s;"
        ></span>

        <header class="sticky top-0 z-20 border-b border-white/10 bg-black/20 px-4 py-4 backdrop-blur-sm sm:px-6">
          <div class="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
            <span class="text-center font-display text-lg font-semibold tracking-wide drop-shadow sm:text-left">
              Sterett Creek Village Trustee
            </span>
            <nav class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-white/80 sm:justify-end">
              <a href="/" class="transition-colors hover:text-white">
                Home
              </a>
              <a href="/news" class="transition-colors hover:text-white">
                News
              </a>
              <a href="/calendar" class="transition-colors hover:text-white">
                Calendar
              </a>
              <a href="/files" class="transition-colors hover:text-white">
                Files
              </a>
              <a href="/trustees" class="transition-colors hover:text-white">
                Trustees
              </a>
            </nav>
          </div>
        </header>
        <main class="relative z-10 mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <div class="rounded-2xl border border-white/10 bg-black/30 px-6 py-8 shadow-xl backdrop-blur-md sm:px-10">
            {children}
          </div>
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
(function () {
  var EPOCH_KEY = 'anim_epoch';
  var now = Date.now();
  var stored = sessionStorage.getItem(EPOCH_KEY);

  if (!stored) {
    sessionStorage.setItem(EPOCH_KEY, String(now));
    return;
  }

  var elapsed = (now - Number(stored)) / 1000;

  document.querySelectorAll('.fish, .bubble, .svg-bobber').forEach(function (el) {
    var current = parseFloat(el.style.animationDelay || '0');
    el.style.animationDelay = (current - elapsed) + 's';
  });
})();
        `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js');
  });
}
        `,
          }}
        />
      </body>
    </html>
  );
};
