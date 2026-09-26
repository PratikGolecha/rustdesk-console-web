import { request } from '@umijs/max';

export async function getApiTokenList(options?: { [key: string]: any }) {
  return request<{ data: API.ApiToken[]; total: number }>('/api/api-tokens', {
    method: 'GET',
    ...(options || {}),
  });
}

/** The response contains the plaintext token exactly once. */
export async function createApiToken(data: API.CreateApiTokenParams) {
  return request<API.CreatedApiToken>('/api/api-tokens', {
    method: 'POST',
    data,
  });
}

export async function revokeApiToken(guid: string) {
  return request(`/api/api-tokens/${guid}`, { method: 'DELETE' });
}
