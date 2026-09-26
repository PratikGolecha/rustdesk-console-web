import { request } from '@umijs/max';

export type ControlPermissionValue = 'default' | 'allow' | 'deny';

export type ControlRoleItem = {
  guid: string;
  name: string;
  note: string;
  permissions: Record<string, 'allow' | 'deny'>;
  is_default: boolean;
  user_count?: number;
};

export type ControlRoleBody = {
  name?: string;
  note?: string;
  permissions?: Record<string, ControlPermissionValue>;
  is_default?: boolean;
};

export async function getControlRoles() {
  return request<{ permission_keys: string[]; data: ControlRoleItem[] }>(
    '/api/control-roles',
    { method: 'GET' },
  );
}

export async function createControlRole(data: ControlRoleBody) {
  return request<ControlRoleItem>('/api/control-roles', {
    method: 'POST',
    data,
  });
}

export async function updateControlRole(guid: string, data: ControlRoleBody) {
  return request<ControlRoleItem>(`/api/control-roles/${guid}`, {
    method: 'PATCH',
    data,
  });
}

export async function deleteControlRole(guid: string) {
  return request(`/api/control-roles/${guid}`, { method: 'DELETE' });
}

export async function getControlRoleUsers(guid: string) {
  return request<{ guid: string; username: string; email: string }[]>(
    `/api/control-roles/${guid}/users`,
    { method: 'GET' },
  );
}

export async function assignControlRole(guid: string, user_guids: string[]) {
  return request(`/api/control-roles/${guid}/assign`, {
    method: 'POST',
    data: { user_guids },
  });
}

export async function unassignControlRole(guid: string, user_guids: string[]) {
  return request(`/api/control-roles/${guid}/unassign`, {
    method: 'POST',
    data: { user_guids },
  });
}
