import { request } from '@umijs/max';

export type AccessOptions = {
  user_groups: { guid: string; name: string }[];
  device_groups: { guid: string; name: string }[];
  users: { guid: string; name: string; user_group_guid: string | null }[];
};

export type UserGroupAccess = {
  guid: string;
  members_see_each_other: boolean;
  user_group_guids: string[];
  device_group_guids: string[];
};

export type UserAccess = {
  guid: string;
  user_guids: string[];
  device_group_guids: string[];
};

export async function getAccessOptions() {
  return request<AccessOptions>('/api/access-control/options', {
    method: 'GET',
  });
}

export async function getUserGroupAccess(guid: string) {
  return request<UserGroupAccess>(`/api/access-control/user-groups/${guid}`, {
    method: 'GET',
  });
}

export async function updateUserGroupAccess(
  guid: string,
  data: Partial<Omit<UserGroupAccess, 'guid'>>,
) {
  return request<UserGroupAccess>(`/api/access-control/user-groups/${guid}`, {
    method: 'PUT',
    data,
  });
}

export async function getUserAccess(guid: string) {
  return request<UserAccess>(`/api/access-control/users/${guid}`, {
    method: 'GET',
  });
}

export async function updateUserAccess(
  guid: string,
  data: Partial<Omit<UserAccess, 'guid'>>,
) {
  return request<UserAccess>(`/api/access-control/users/${guid}`, {
    method: 'PUT',
    data,
  });
}
