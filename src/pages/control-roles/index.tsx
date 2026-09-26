import { PlusOutlined } from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { useAccess, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Switch,
  Table,
  Tag,
} from 'antd';
import React, { useCallback, useEffect, useState } from 'react';
import {
  assignControlRole,
  type ControlPermissionValue,
  type ControlRoleItem,
  createControlRole,
  deleteControlRole,
  getAdminUserList,
  getControlRoles,
  getControlRoleUsers,
  unassignControlRole,
  updateControlRole,
} from '@/services/rustdesk-console';

/**
 * Control roles: the permission bundle the RELAY attaches to a connection for
 * the assigned controlling user. Enforced by the controlled device's client.
 */
const ControlRoles: React.FC = () => {
  const intl = useIntl();
  const access = useAccess();
  const { message: msgApi } = App.useApp();
  const [roles, setRoles] = useState<ControlRoleItem[]>([]);
  const [keys, setKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<ControlRoleItem | 'new' | null>(null);
  const [usersFor, setUsersFor] = useState<ControlRoleItem | null>(null);
  const [form] = Form.useForm();

  const t = (id: string, defaultMessage: string) =>
    intl.formatMessage({ id, defaultMessage });

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getControlRoles();
      setRoles(res.data);
      setKeys(res.permission_keys);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const openEditor = (role: ControlRoleItem | 'new') => {
    setEditing(role);
    const perms = role === 'new' ? {} : role.permissions;
    form.setFieldsValue({
      name: role === 'new' ? '' : role.name,
      note: role === 'new' ? '' : role.note,
      is_default: role === 'new' ? false : role.is_default,
      permissions: Object.fromEntries(
        keys.map((k) => [k, (perms as any)[k] ?? 'default']),
      ),
    });
  };

  const save = async () => {
    const v = await form.validateFields();
    const body = {
      name: v.name,
      note: v.note,
      is_default: v.is_default,
      permissions: v.permissions as Record<string, ControlPermissionValue>,
    };
    if (editing === 'new') await createControlRole(body);
    else if (editing) await updateControlRole(editing.guid, body);
    msgApi.success(t('pages.controlRoles.saved', 'Control role saved'));
    setEditing(null);
    reload();
  };

  return (
    <PageContainer>
      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message={t(
          'pages.controlRoles.notice',
          'Control roles are attached to a connection by the relay server and enforced by the device being controlled. They require the Golecha relay build with CONSOLE_URL and RELAY_SHARED_SECRET configured; the controlling user must be logged in to the RustDesk client. "Allow" overrides that device\'s own local setting for this connection - prefer "Deny".',
        )}
      />
      <Space style={{ marginBottom: 16 }}>
        {access.canControlRolesEdit && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openEditor('new')}
          >
            {t('pages.controlRoles.create', 'New control role')}
          </Button>
        )}
      </Space>
      <Table<ControlRoleItem>
        rowKey="guid"
        loading={loading}
        dataSource={roles}
        pagination={false}
        columns={[
          { title: t('pages.controlRoles.name', 'Name'), dataIndex: 'name' },
          {
            title: t('pages.controlRoles.restrictions', 'Restrictions'),
            render: (_, r) =>
              Object.entries(r.permissions).map(([k, v]) => (
                <Tag key={k} color={v === 'deny' ? 'red' : 'green'}>
                  {v === 'deny' ? '-' : '+'} {k}
                </Tag>
              )),
          },
          {
            title: t('pages.controlRoles.default', 'Default'),
            render: (_, r) => (r.is_default ? <Tag>default</Tag> : null),
          },
          {
            title: t('pages.controlRoles.users', 'Users'),
            dataIndex: 'user_count',
          },
          {
            title: t('pages.controlRoles.actions', 'Actions'),
            render: (_, r) => (
              <Space>
                <a onClick={() => setUsersFor(r)}>
                  {t('pages.controlRoles.assignedUsers', 'Users')}
                </a>
                {access.canControlRolesEdit && (
                  <>
                    <a onClick={() => openEditor(r)}>
                      {t('pages.controlRoles.edit', 'Edit')}
                    </a>
                    <Popconfirm
                      title={t(
                        'pages.controlRoles.confirmDelete',
                        'Delete this control role?',
                      )}
                      onConfirm={async () => {
                        await deleteControlRole(r.guid);
                        reload();
                      }}
                    >
                      <a>{t('pages.controlRoles.delete', 'Delete')}</a>
                    </Popconfirm>
                  </>
                )}
              </Space>
            ),
          },
        ]}
      />
      <Modal
        open={!!editing}
        title={t('pages.controlRoles.editor', 'Control role')}
        onCancel={() => setEditing(null)}
        onOk={save}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label={t('pages.controlRoles.name', 'Name')}
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="note" label={t('pages.controlRoles.note', 'Note')}>
            <Input />
          </Form.Item>
          <Form.Item
            name="is_default"
            valuePropName="checked"
            label={t(
              'pages.controlRoles.defaultHelp',
              'Default role (users without a role and users not logged in)',
            )}
          >
            <Switch />
          </Form.Item>
          {keys.map((k) => (
            <Form.Item
              key={k}
              name={['permissions', k]}
              label={k}
              style={{ marginBottom: 8 }}
            >
              <Radio.Group optionType="button" size="small">
                <Radio.Button value="default">
                  {t('pages.controlRoles.valueDefault', 'Device default')}
                </Radio.Button>
                <Radio.Button value="deny">
                  {t('pages.controlRoles.valueDeny', 'Deny')}
                </Radio.Button>
                <Radio.Button value="allow">
                  {t('pages.controlRoles.valueAllow', 'Allow')}
                </Radio.Button>
              </Radio.Group>
            </Form.Item>
          ))}
        </Form>
      </Modal>
      {usersFor && (
        <RoleUsers
          role={usersFor}
          canEdit={!!access.canControlRolesEdit}
          onClose={() => {
            setUsersFor(null);
            reload();
          }}
        />
      )}
    </PageContainer>
  );
};

const RoleUsers: React.FC<{
  role: ControlRoleItem;
  canEdit: boolean;
  onClose: () => void;
}> = ({ role, canEdit, onClose }) => {
  const intl = useIntl();
  const [assigned, setAssigned] = useState<
    { guid: string; username: string }[]
  >([]);
  const [options, setOptions] = useState<{ label: string; value: string }[]>(
    [],
  );
  const [picked, setPicked] = useState<string[]>([]);

  const load = useCallback(async () => {
    setAssigned(await getControlRoleUsers(role.guid));
  }, [role.guid]);

  useEffect(() => {
    load();
    getAdminUserList({ current: 1, pageSize: 200 } as any)
      .then((r) =>
        setOptions(
          (r.data ?? []).map((u: any) => ({
            label: u.display_name || u.name,
            value: u.guid,
          })),
        ),
      )
      .catch(() => undefined);
  }, [load]);

  return (
    <Modal
      open
      footer={null}
      onCancel={onClose}
      title={intl.formatMessage(
        {
          id: 'pages.controlRoles.usersOf',
          defaultMessage: 'Users with "{name}"',
        },
        { name: role.name },
      )}
    >
      {canEdit && (
        <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
          <Select
            mode="multiple"
            style={{ flex: 1 }}
            showSearch
            optionFilterProp="label"
            options={options}
            value={picked}
            onChange={setPicked}
          />
          <Button
            type="primary"
            disabled={!picked.length}
            onClick={async () => {
              await assignControlRole(role.guid, picked);
              setPicked([]);
              load();
            }}
          >
            {intl.formatMessage({
              id: 'pages.controlRoles.assign',
              defaultMessage: 'Assign',
            })}
          </Button>
        </Space.Compact>
      )}
      {assigned.map((u) => (
        <Tag
          key={u.guid}
          closable={canEdit}
          onClose={async (e) => {
            e.preventDefault();
            await unassignControlRole(role.guid, [u.guid]);
            load();
          }}
        >
          {u.username}
        </Tag>
      ))}
    </Modal>
  );
};

export default ControlRoles;
