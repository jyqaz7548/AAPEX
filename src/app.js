import { createServer as createHttpServer } from "node:http";
import { config } from "./config.js";
import { CitsClient, CitsUpstreamError } from "./services/citsClient.js";
import { normalizePedestrianSignals } from "./services/citsNormalizer.js";

export const createServer = (appConfig = config) => {
  const client = new CitsClient(appConfig);

  return createHttpServer(async (request, response) => {
    try {
      await routeRequest(request, response, client);
    } catch (error) {
      writeJson(response, 500, {
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: error.message
        }
      });
    }
  });
};

const routeRequest = async (request, response, client) => {
  const url = new URL(request.url ?? "/", "http://localhost");

  if (request.method === "GET" && url.pathname === "/health") {
    writeJson(response, 200, { ok: true });
    return;
  }

  const rawMatch = url.pathname.match(/^\/api\/cits\/signals\/([^/]+)\/raw$/);
  if (request.method === "GET" && rawMatch) {
    await handleCitsRequest(response, async () => {
      const data = await client.fetchSignalPhaseTiming(rawMatch[1]);
      writeJson(response, 200, data);
    });
    return;
  }

  const remainingMatch = url.pathname.match(
    /^\/api\/cits\/signals\/([^/]+)\/remaining$/
  );
  if (request.method === "GET" && remainingMatch) {
    await handleCitsRequest(response, async () => {
      const data = await client.fetchSignalPhaseTiming(remainingMatch[1]);
      writeJson(response, 200, {
        itstId: remainingMatch[1],
        signals: normalizePedestrianSignals(data),
        fetchedAt: new Date().toISOString()
      });
    });
    return;
  }

  writeJson(response, 404, {
    error: {
      code: "NOT_FOUND",
      message: "Route not found"
    }
  });
};

const handleCitsRequest = async (response, handler) => {
  try {
    await handler();
  } catch (error) {
    if (error instanceof CitsUpstreamError) {
      writeJson(response, error.statusCode, {
        error: {
          code: error.code,
          message: error.message,
          upstreamStatus: error.upstreamStatus
        }
      });
      return;
    }

    throw error;
  }
};

export const writeJson = (response, statusCode, body) => {
  response.writeHead(statusCode, {
    "content-type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
};
