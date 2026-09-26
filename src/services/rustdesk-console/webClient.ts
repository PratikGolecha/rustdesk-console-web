import { request } from "@umijs/max";

/** Public bootstrap config for the browser client (see backend GET /api/web-client/config). */
export async function getWebClientConfig() {
  return request<API.WebClientConfig>("/api/web-client/config", {
    method: "GET",
    skipErrorHandler: true,
  });
}
