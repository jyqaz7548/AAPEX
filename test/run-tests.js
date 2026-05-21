import assert from "node:assert/strict";
import { once } from "node:events";
import { createServer } from "../src/app.js";
import { normalizePedestrianSignals } from "../src/services/citsNormalizer.js";

const tests = [];

const test = (name, fn) => {
  tests.push({ name, fn });
};

test("GET /health returns health status", async () => {
  const { baseUrl, close } = await startTestServer({
    citsApiKey: "test-key",
    citsBaseUrl: "https://example.com",
    port: 0
  });

  try {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(body, { ok: true });
  } finally {
    await close();
  }
});

test("C-ITS raw route reports missing API key", async () => {
  const { baseUrl, close } = await startTestServer({
    citsBaseUrl: "https://example.com",
    port: 0
  });

  try {
    const response = await fetch(`${baseUrl}/api/cits/signals/1537/raw`);
    const body = await response.json();

    assert.equal(response.status, 500);
    assert.equal(body.error.code, "CITS_API_KEY_MISSING");
  } finally {
    await close();
  }
});

test("normalizes pedestrian remaining fields from a direct row object", () => {
  const signals = normalizePedestrianSignals({
    itstId: "1537",
    ntPdsgStatNm: "green",
    ntPdsgRmdrCs: "817",
    etPdsgStatNm: "red",
    etPdsgRmdrCs: 120
  });

  assert.deepEqual(signals, [
    {
        direction: "north",
        statusName: "green",
        remainingSeconds: 81.7,
        unavailable: false,
        rawRemainingValue: 817,
        rawRemainingCentisecondsField: "ntPdsgRmdrCs"
      },
      {
        direction: "east",
        statusName: "red",
        remainingSeconds: 12,
        unavailable: false,
        rawRemainingValue: 120,
        rawRemainingCentisecondsField: "etPdsgRmdrCs"
      }
  ]);
});

test("normalizes rows nested under response body items", () => {
  const signals = normalizePedestrianSignals({
    response: {
      body: {
        items: [
          {
            wtPdsgRmdrCs: "30"
          }
        ]
      }
    }
  });

  assert.deepEqual(signals, [
    {
      direction: "west",
      remainingSeconds: 3,
      unavailable: false,
      rawRemainingValue: 30,
      rawRemainingCentisecondsField: "wtPdsgRmdrCs"
    }
  ]);
});

test("marks C-ITS 36001 remaining value as unavailable", () => {
  const signals = normalizePedestrianSignals({
    nePdsgStatNm: "stop-And-Remain",
    nePdsgRmdrCs: 36001
  });

  assert.deepEqual(signals, [
    {
      direction: "northEast",
      statusName: "stop-And-Remain",
      remainingSeconds: null,
      unavailable: true,
      rawRemainingValue: 36001,
      rawRemainingCentisecondsField: "nePdsgRmdrCs"
    }
  ]);
});

for (const { name, fn } of tests) {
  await fn();
  process.stdout.write(`ok - ${name}\n`);
}

process.stdout.write(`${tests.length} tests passed\n`);

async function startTestServer(config) {
  const server = createServer(config);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  assert.equal(typeof address, "object");
  assert.notEqual(address, null);

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: async () => {
      server.close();
      await once(server, "close");
    }
  };
}
