/* Durable-storage request is made from the wrong place.
 *
 * `requestPersistence` (src/lib/backup.jsx:183) is the app's only call to
 * `navigator.storage.persist()`. It is real, it works, and it is invoked from
 * exactly one place in the shipped app:
 *
 *     // src/components/Setup.jsx:37
 *     useEffect(() => { (async () => {
 *       const p = await requestPersistence();
 *       ...
 *     })(); }, []);
 *
 * That is a mount effect on `Setup`, and `Setup` is rendered conditionally:
 *
 *     // src/App.jsx
 *     {tab === "setup" && ( <Setup ... /> )}
 *
 * The default tab is "dashboard". So the request fires only when the user
 * first taps Setup in a given page load — a screen they may never need. Log
 * readings from the Dashboard for six months without opening Setup and the
 * browser has never once been asked to keep the data, while Safari's
 * seven-day eviction rule (documented at src/lib/backup.jsx:180-182 and
 * src/components/Setup.jsx:15-18) applies in full.
 *
 * These tests drive the real app the way a user does: mount it, leave it on
 * the tab it opens on, and ask whether the browser was told to keep the data.
 */
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import React from 'react'

let persist, persisted;

/* A fresh module graph per test. `requestPersistence` memoises its answer for
   the life of the page — that is the point of the fix — so a test that wants
   to observe the request being made must start from an unloaded module. */
async function mountApp() {
  vi.resetModules();
  const { ReefConsole } = await import('../../App.jsx');
  const utils = render(React.createElement(ReefConsole));
  await settle();
  return utils;
}

const settle = () => new Promise((r) => setTimeout(r, 250));

/* The app draws its navigation twice — a sidebar for wide screens and a bar
   along the bottom for narrow ones — so every tab control has two matches.
   Either one is the same control to a user; take the first. */
const tab = (name) => screen.getAllByRole('button', { name })[0];

beforeEach(() => {
  window.localStorage.clear();
  persist = vi.fn(async () => true);
  persisted = vi.fn(async () => false);
  Object.defineProperty(navigator, 'storage', {
    configurable: true,
    value: { persist, persisted },
  });
  /* recharts measures its container; jsdom has no ResizeObserver. */
  if (!global.ResizeObserver) {
    global.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  }
});

afterEach(() => { cleanup(); });

describe('durable storage is requested at launch, not on the Setup tab', () => {
  it('DEFECT: the app opens on the Dashboard and never asks the browser to keep the data', async () => {
    await mountApp();

    // The app is on its default tab. Nobody has touched Setup.
    expect(tab(/Dashboard/i)).toBeInTheDocument();

    // FAILS before the fix: 0 calls. The one call site is behind a tab the
    // user has not opened and may never open.
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('DEFECT: re-entering Setup fires a second request — the ask is not idempotent', async () => {
    await mountApp();

    // Open Setup, leave, open it again. Setup unmounts when its tab is
    // deselected, so its mount effect runs afresh on every visit.
    fireEvent.click(tab(/Setup/i));
    await settle();
    fireEvent.click(tab(/Dashboard/i));
    await settle();
    fireEvent.click(tab(/Setup/i));
    await settle();

    // FAILS before the fix: 2 calls, one per Setup mount. On Firefox, where
    // persist() shows a permission prompt, that is a prompt per visit.
    expect(persist).toHaveBeenCalledTimes(1);
  });

  it('GUARD: Setup still has an answer to show, so moving the ask does not blank its explanation', async () => {
    await mountApp();
    fireEvent.click(tab(/Setup/i));
    await settle();

    // persisted() resolves true in this stub after a granted request, so the
    // panel should say the browser has agreed to keep the data. This passes
    // before and after the move — it exists to catch the move silently
    // costing Setup the state it renders.
    expect(document.body.textContent).toMatch(
      /agreed to keep your data|wouldn't guarantee|can't guarantee/i);
  });
});
