import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "../src/app.js";

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test("GET /health returns { ok: true }", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/health`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.deepEqual(body, { ok: true });
  } finally {
    await close();
  }
});

test("GET /api/signals returns signal location list", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/signals`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(body.signals));
    assert.ok(body.signals.length > 0);
    const first = body.signals[0];
    assert.ok("itstId" in first && "lat" in first && "lng" in first);
  } finally {
    await close();
  }
});

test("GET /api/signals/1537/remaining returns cycle-based signal state", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/signals/1537/remaining`);
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.itstId, "1537");
    assert.ok(Array.isArray(body.signals) && body.signals.length > 0);
    const s = body.signals[0];
    assert.ok(s.remainingSeconds > 0 && s.remainingSeconds <= 170);
    assert.ok(s.statusName === "green" || s.statusName === "red");
  } finally {
    await close();
  }
});

test("GET /api/signals/9999/remaining returns 404 for unknown signal", async () => {
  const { baseUrl, close } = await startTestServer();
  try {
    const res = await fetch(`${baseUrl}/api/signals/9999/remaining`);
    assert.equal(res.status, 404);
  } finally {
    await close();
  }
});

for (const { name, fn } of tests) {
  await fn();
  process.stdout.write(`ok - ${name}\n`);
}
process.stdout.write(`${tests.length} tests passed\n`);

async function startTestServer() {
  const server = createServer({ naverMapsClientId: "test" });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => { server.close(); await once(server, "close"); }
  };
}
