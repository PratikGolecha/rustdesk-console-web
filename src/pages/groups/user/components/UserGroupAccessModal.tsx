import { FormattedMessage, useIntl } from '@umijs/max';
import { Alert, App, Divider, Modal, Select, Spin, Switch, Tabs } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  type AccessOptions,
  getAccessOptions,
  getUserAccess,
  getUserGroupAccess,
  type UserAccess,
  type UserGroupAccess,
  updateUserAccess,
  updateUserGroupAccess,
} from '@/services/rustdesk-console/accessControl';

interface Props {
  open: boolean;
  group: API.UserGroupItem | null;
  canEdit: boolean;
  onOpenChange: (open: boolean) => void;
}

const row: React.CSSProperties = { marginBottom: 20 };
const label: React.CSSProperties = { fontWeight: 500, marginBottom: 6 };

/**
 * "Access with other groups" editor (RustDesk Pro "User Group Access
 * Settings"). Every change is applied immediately.
 */
const UserGroupAccessModal: React.FC<Props> = ({
  open,
  group,
  canEdit,
  onOpenChange,
}) => {
  const intl = useIntl();
  const { message: msgApi } = App.useApp();
  const [options, setOptions] = useState<AccessOptions | null>(null);
  const [access, setAccess] = useState<UserGroupAccess | null>(null);
  const [userGuid, setUserGuid] = useState<string | undefined>();
  const [userAccess, setUserAccess] = useState<UserAccess | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !group) return;
    setAccess(null);
    setUserGuid(undefined);
    setUserAccess(null);
    Promise.all([getAccessOptions(), getUserGroupAccess(group.guid)])
      .then(([opts, acc]) => {
        setOptions(opts);
        setAccess(acc);
      })
      .catch(() =>
        msgApi.error(
          intl.formatMessage({
            id: 'pages.accessControl.loadFailed',
            defaultMessage: 'Failed to load access rules',
          }),
        ),
      );
  }, [open, group, intl, msgApi]);

  useEffect(() => {
    if (!userGuid) {
      setUserAccess(null);
      return;
    }
    getUserAccess(userGuid)
      .then(setUserAccess)
      .catch(() => setUserAccess(null));
  }, [userGuid]);

  const apply = useCallback(
    async (patch: Partial<Omit<UserGroupAccess, 'guid'>>) => {
      if (!group) return;
      setSaving(true);
      try {
        setAccess(await updateUserGroupAccess(group.guid, patch));
        msgApi.success(
          intl.formatMessage({
            id: 'pages.accessControl.saved',
            defaultMessage: 'Access rules saved',
          }),
        );
      } catch {
        msgApi.error(
          intl.formatMessage({
            id: 'pages.accessControl.saveFailed',
            defaultMessage: 'Failed to save access rules',
          }),
        );
      } finally {
        setSaving(false);
      }
    },
    [group, intl, msgApi],
  );

  const applyUser = async (
    patch: Partial<Omit<UserAccess, 'guid'>>,
  ): Promise<void> => {
    if (!userGuid) return;
    setSaving(true);
    try {
      setUserAccess(await updateUserAccess(userGuid, patch));
      msgApi.success(
        intl.formatMessage({
          id: 'pages.accessControl.saved',
          defaultMessage: 'Access rules saved',
        }),
      );
    } catch {
      msgApi.error(
        intl.formatMessage({
          id: 'pages.accessControl.saveFailed',
          defaultMessage: 'Failed to save access rules',
        }),
      );
    } finally {
      setSaving(false);
    }
  };

  const toOptions = (items: { guid: string; name: string }[]) =>
    items.map((i) => ({ value: i.guid, label: i.name }));
  const disabled = !canEdit || saving;

  const groupTab = access && options && (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={intl.formatMessage({
          id: 'pages.accessControl.hint',
          defaultMessage:
            'Rules apply to the members of this group, including users added later.',
        })}
      />
      <div style={row}>
        <div style={label}>
          <FormattedMessage
            id="pages.accessControl.membersSeeEachOther"
            defaultMessage="Members can access each other"
          />
        </div>
        <Switch
          checked={access.members_see_each_other}
          disabled={disabled}
          onChange={(v) => apply({ members_see_each_other: v })}
        />
      </div>
      <div style={row}>
        <div style={label}>
          <FormattedMessage
            id="pages.accessControl.userGroups"
            defaultMessage="Can access users of these user groups"
          />
        </div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          disabled={disabled}
          value={access.user_group_guids}
          options={toOptions(
            options.user_groups.filter((g) => g.guid !== group?.guid),
          )}
          optionFilterProp="label"
          onChange={(v) => apply({ user_group_guids: v })}
        />
      </div>
      <div style={row}>
        <div style={label}>
          <FormattedMessage
            id="pages.accessControl.deviceGroups"
            defaultMessage="Can access these device groups"
          />
        </div>
        <Select
          mode="multiple"
          style={{ width: '100%' }}
          disabled={disabled}
          value={access.device_group_guids}
          options={toOptions(options.device_groups)}
          optionFilterProp="label"
          onChange={(v) => apply({ device_group_guids: v })}
        />
      </div>
    </div>
  );

  const userTab = options && (
    <div>
      <div style={row}>
        <div style={label}>
          <FormattedMessage
            id="pages.accessControl.pickUser"
            defaultMessage="User"
          />
        </div>
        <Select
          showSearch
          allowClear
          style={{ width: '100%' }}
          value={userGuid}
          options={options.users.map((u) => ({
            value: u.guid,
            label: u.name,
          }))}
          optionFilterProp="label"
          onChange={setUserGuid}
        />
      </div>
      {userAccess && (
        <>
          <Divider />
          <div style={row}>
            <div style={label}>
              <FormattedMessage
                id="pages.accessControl.userCanAccessUsers"
                defaultMessage="Can access these users"
              />
            </div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              disabled={disabled}
              value={userAccess.user_guids}
              options={options.users
                .filter((u) => u.guid !== userGuid)
                .map((u) => ({ value: u.guid, label: u.name }))}
              optionFilterProp="label"
              onChange={(v) => applyUser({ user_guids: v })}
            />
          </div>
          <div style={row}>
            <div style={label}>
              <FormattedMessage
                id="pages.accessControl.deviceGroups"
                defaultMessage="Can access these device groups"
              />
            </div>
            <Select
              mode="multiple"
              style={{ width: '100%' }}
              disabled={disabled}
              value={userAccess.device_group_guids}
              options={toOptions(options.device_groups)}
              optionFilterProp="label"
              onChange={(v) => applyUser({ device_group_guids: v })}
            />
          </div>
        </>
      )}
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={() => onOpenChange(false)}
      footer={null}
      width={640}
      destroyOnHidden
      title={
        <FormattedMessage
          id="pages.accessControl.title"
          defaultMessage="Access with other groups: {name}"
          values={{ name: group?.name }}
        />
      }
    >
      {!access || !options ? (
        <Spin />
      ) : (
        <Tabs
          items={[
            {
              key: 'group',
              label: intl.formatMessage({
                id: 'pages.accessControl.tabGroup',
                defaultMessage: 'Group rules',
              }),
              children: groupTab,
            },
            {
              key: 'user',
              label: intl.formatMessage({
                id: 'pages.accessControl.tabUser',
                defaultMessage: 'Per-user rules',
              }),
              children: userTab,
            },
          ]}
        />
      )}
    </Modal>
  );
};

export default UserGroupAccessModal;
