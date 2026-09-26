import { request } from '@umijs/max';

/**
 * Get LDAP configuration
 */
export async function getLdapConfig() {
  return request<API.LdapConfig>('/api/settings/ldap', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

/**
 * Create or update LDAP configuration
 */
export async function updateLdapConfig(data: API.UpdateLdapConfigParams) {
  return request<API.LdapConfig>('/api/settings/ldap', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

/**
 * Test LDAP connection
 */
export async function testLdapConfig(data?: API.TestLdapConfigParams) {
  return request<API.TestLdapResult>('/api/settings/ldap/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}
