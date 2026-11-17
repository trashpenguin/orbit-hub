import assert from "node:assert/strict";
import test from "node:test";
import { fetchNews } from "./news.ts";

const NEWS_URL = "/news.json";

function withFetch(
  handler: (url: string) => Promise<Response>,
  fn: () => Promise<void>,
): Promise<void> {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => handler(String(input));
  return fn().finally(() => {
    globalThis.fetch = originalFetch;
  });
}

test("news is parsed from the Orbit Hub feed", async () => {
  let requested = "";
  await withFetch(async (url) => {
    requested = url;
    return Response.json({
      id: "razer",
      level: "critical",
      message: "Razer mice may not be detected.",
      url: "https://github.com/trashpenguin/orbit-hub/issues",
    });
  }, async () => {
    const item = await fetchNews();
    assert.equal(requested, NEWS_URL);
    assert.deepEqual(item, {
      id: "razer",
      level: "critical",
      message: "Razer mice may not be detected.",
      url: "https://github.com/trashpenguin/orbit-hub/issues",
    });
  });
});

test("an unavailable feed rejects so the banner can retry later", async () => {
  await withFetch(async () => new Response("Unavailable", { status: 503 }), async () => {
    await assert.rejects(() => fetchNews(), /HTTP 503/);
  });
});

test("an unknown level degrades to info instead of hiding the notice", async () => {
  await withFetch(
    async () => Response.json({ id: "x", level: "banana", message: "Hello" }),
    async () => {
      assert.equal((await fetchNews())?.level, "info");
    },
  );
});

test("a payload without a message or id produces no banner", async () => {
  await withFetch(
    async () => Response.json({ id: "x", level: "critical" }),
    async () => {
      assert.equal(await fetchNews(), null);
    },
  );
});

test("an aborted request makes only one attempt", async () => {
  const requested: string[] = [];
  const controller = new AbortController();
  controller.abort();
  await withFetch(async (url) => {
    requested.push(url);
    throw new DOMException("Aborted", "AbortError");
  }, async () => {
    await assert.rejects(() => fetchNews(controller.signal));
  });
  assert.deepEqual(requested, [NEWS_URL]);
});
