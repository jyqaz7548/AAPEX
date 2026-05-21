export class CitsUpstreamError extends Error {
  constructor(statusCode, code, message, upstreamStatus) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.upstreamStatus = upstreamStatus;
  }
}

export class CitsClient {
  constructor(config) {
    this.config = config;
  }

  async fetchSignalPhaseTiming(itstId) {
    if (!this.config.citsApiKey) {
      throw new CitsUpstreamError(
        500,
        "CITS_API_KEY_MISSING",
        "CITS_API_KEY is not configured"
      );
    }

    const url = new URL(this.config.citsBaseUrl);
    url.searchParams.set("apiKey", this.config.citsApiKey);
    url.searchParams.set("type", "json");
    url.searchParams.set("pageNo", "1");
    url.searchParams.set("numOfRows", "10");
    url.searchParams.set("itstId", itstId);

    let upstreamResponse;
    try {
      upstreamResponse = await fetch(url);
    } catch {
      throw new CitsUpstreamError(
        502,
        "CITS_NETWORK_ERROR",
        "Failed to reach C-ITS upstream API"
      );
    }

    if (!upstreamResponse.ok) {
      throw new CitsUpstreamError(
        502,
        "CITS_UPSTREAM_ERROR",
        "C-ITS upstream API returned an error",
        upstreamResponse.status
      );
    }

    try {
      return await upstreamResponse.json();
    } catch {
      throw new CitsUpstreamError(
        502,
        "CITS_PARSE_ERROR",
        "C-ITS upstream API returned invalid JSON",
        upstreamResponse.status
      );
    }
  }
}
