import { createServer as createHttpServer } from "node:http";
import { config } from "./config.js";
import { getAllSignals, getSignalById, addSignal } from "./services/signalsStore.js";
import { buildMapHtml } from "./services/mapHtml.js";
import { calculateRemaining, updateCycle } from "./services/cycleCalculator.js";

export const createServer = (appConfig = config) => {
  const mapHtml = buildMapHtml(appConfig.naverMapsClientId ?? config.naverMapsClientId ?? "");

  return createHttpServer(async (request, response) => {
    try {
      await routeRequest(request, response, mapHtml);
    } catch (error) {
      writeJson(response, 500, {
        error: { code: "INTERNAL_SERVER_ERROR", message: error.message }
      });
    }
  });
};

const readBody = (req) => new Promise((resolve, reject) => {
  let data = "";
  req.on("data", chunk => { data += chunk; });
  req.on("end", () => { try { resolve(JSON.parse(data)); } catch { resolve({}); } });
  req.on("error", reject);
});

const routeRequest = async (request, response, mapHtml) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,POST,OPTIONS",
      "access-control-allow-headers": "content-type"
    });
    response.end();
    return;
  }

  if (request.method === "GET" && url.pathname === "/map") {
    response.writeHead(200, {
      "content-type": "text/html; charset=utf-8",
      "access-control-allow-origin": "*"
    });
    response.end(mapHtml);
    return;
  }

  if (request.method === "GET" && url.pathname === "/health") {
    writeJson(response, 200, { ok: true });
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/signals") {
    writeJson(response, 200, { signals: getAllSignals() });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/signals") {
    const body = await readBody(request);
    const { name, lat, lng } = body;
    if (!name || lat == null || lng == null) {
      writeJson(response, 400, { error: { code: "INVALID_BODY", message: "name, lat, lng 필수" } });
      return;
    }
    const signal = addSignal({ name, lat: Number(lat), lng: Number(lng) });
    writeJson(response, 201, { signal });
    return;
  }

  const remainingMatch = url.pathname.match(/^\/api\/signals\/([^/]+)\/remaining$/);
  if (request.method === "GET" && remainingMatch) {
    const itstId = remainingMatch[1];
    const result = calculateRemaining(itstId);
    if (!result) {
      writeJson(response, 404, { error: { code: "SIGNAL_NOT_FOUND", message: "등록된 신호 주기가 없습니다" } });
      return;
    }
    const sig = getSignalById(itstId);
    writeJson(response, 200, {
      itstId,
      ...(sig ? { name: sig.name, lat: sig.lat, lng: sig.lng } : {}),
      cycleInfo: { cycleSeconds: result.cycleSeconds, greenSeconds: result.greenSeconds },
      signals: [{ direction: "pedestrian", statusName: result.status, remainingSeconds: result.remainingSeconds, unavailable: false }],
      fetchedAt: new Date().toISOString()
    });
    return;
  }

  const cycleMatch = url.pathname.match(/^\/api\/signals\/([^/]+)\/cycle$/);
  if (request.method === "POST" && cycleMatch) {
    const itstId = cycleMatch[1];
    const body = await readBody(request);
    updateCycle(itstId, body);
    writeJson(response, 200, { ok: true });
    return;
  }

  writeJson(response, 404, { error: { code: "NOT_FOUND", message: "Route not found" } });
};

export const writeJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*"
  });
  response.end(JSON.stringify(body));
};
