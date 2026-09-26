import { request } from '@umijs/max';

/**
 * Get SMTP configuration
 */
export async function getSMTPConfig() {
  return request<API.SMTPConfig>('/api/settings/smtp', {
    method: 'GET',
    skipErrorHandler: true,
  });
}

/**
 * Update SMTP configuration
 */
export async function updateSMTPConfig(data: API.UpdateSMTPConfigParams) {
  return request<API.SMTPConfig>('/api/settings/smtp', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}

/**
 * Test SMTP connection
 */
export async function testSMTPConfig(data?: API.TestSMTPConfigParams) {
  return request<API.TestSMTPResult>('/api/settings/smtp/test', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    data,
  });
}
