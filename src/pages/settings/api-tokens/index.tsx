import { CopyOutlined, KeyOutlined, PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { FormattedMessage, useAccess, useIntl } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  Card,
  Collapse,
  Modal,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from 'antd';
import React, { useRef, useState } from 'react';
import {
  createApiToken,
  getApiTokenList,
  revokeApiToken,
} from '@/services/rustdesk-console';
import AssignCommandBuilder from './components/AssignCommandBuilder';
import CreateTokenModal from './components/CreateTokenModal';

const { Paragraph } = Typography;

const STATUS_COLOR: Record<API.ApiToken['status'], string> = {
  active: 'green',
  expired: 'orange',
  revoked: 'red',
};

const ApiTokens: React.FC = () => {
  const intl = useIntl();
  const access = useAccess();
  const { message: msgApi } = App.useApp();
  const actionRef = useRef<ActionType>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [created, setCreated] = useState<API.CreatedApiToken | null>(null);

  const handleCreate = async (values: API.CreateApiTokenParams) => {
    try {
      const result = await createApiToken(values);
      setCreateOpen(false);
      setCreated(result);
      actionRef.current?.reload();
    } catch (error) {
      // Keep the dialog open so the input is not lost; the global handler
      // has already shown the server's reason.
      console.error('Failed to create API token', error);
      throw error;
    }
  };

  const handleRevoke = async (record: API.ApiToken) => {
    await revokeApiToken(record.guid);
    msgApi.success(
      intl.formatMessage({
        id: 'pages.apiTokens.revokeSuccess',
        defaultMessage: 'API token revoked',
      }),
    );
    actionRef.current?.reload();
  };

  const scopeLabel = (scope: API.ApiTokenScope) =>
    ({
      assign: intl.formatMessage({
        id: 'pages.apiTokens.scope.assign.short',
        defaultMessage: 'Assign',
      }),
      read: intl.formatMessage({
        id: 'pages.apiTokens.scope.read.short',
        defaultMessage: 'Read',
      }),
      manage: intl.formatMessage({
        id: 'pages.apiTokens.scope.manage.short',
        defaultMessage: 'Manage',
      }),
    })[scope] ?? scope;

  const statusLabel = (status: API.ApiToken['status']) =>
    ({
      active: intl.formatMessage({
        id: 'pages.apiTokens.status.active',
        defaultMessage: 'Active',
      }),
      expired: intl.formatMessage({
        id: 'pages.apiTokens.status.expired',
        defaultMessage: 'Expired',
      }),
      revoked: intl.formatMessage({
        id: 'pages.apiTokens.status.revoked',
        defaultMessage: 'Revoked',
      }),
    })[status];

  const never = intl.formatMessage({
    id: 'pages.apiTokens.never',
    defaultMessage: 'Never',
  });

  const columns: ProColumns<API.ApiToken>[] = [
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.name',
        defaultMessage: 'Name',
      }),
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.token',
        defaultMessage: 'Token',
      }),
      dataIndex: 'token_prefix',
      render: (_, record) => (
        <Typography.Text code>{record.token_prefix}…</Typography.Text>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.scopes',
        defaultMessage: 'Permissions',
      }),
      dataIndex: 'scopes',
      render: (_, record) => (
        <Space size={4} wrap>
          {record.scopes.map((scope) => (
            <Tag key={scope}>{scopeLabel(scope)}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.owner',
        defaultMessage: 'Owner',
      }),
      dataIndex: 'owner_name',
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.status',
        defaultMessage: 'Status',
      }),
      dataIndex: 'status',
      render: (_, record) => (
        <Tag color={STATUS_COLOR[record.status]}>
          {statusLabel(record.status)}
        </Tag>
      ),
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.expiresAt.column',
        defaultMessage: 'Expires',
      }),
      dataIndex: 'expires_at',
      render: (_, record) =>
        record.expires_at
          ? new Date(record.expires_at).toLocaleString()
          : never,
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.lastUsed',
        defaultMessage: 'Last used',
      }),
      dataIndex: 'last_used_at',
      renderText: (_, record) =>
        record.last_used_at
          ? `${new Date(record.last_used_at).toLocaleString()}${
              record.last_used_ip ? ` (${record.last_used_ip})` : ''
            }`
          : never,
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.createdAt',
        defaultMessage: 'Created',
      }),
      dataIndex: 'created_at',
      valueType: 'dateTime',
    },
    {
      title: intl.formatMessage({
        id: 'pages.apiTokens.actions',
        defaultMessage: 'Actions',
      }),
      valueType: 'option',
      render: (_, record) =>
        access.canApiTokensRevoke && record.status === 'active'
          ? [
              <Popconfirm
                key="revoke"
                title={intl.formatMessage({
                  id: 'pages.apiTokens.revokeConfirm',
                  defaultMessage:
                    'Revoke this token? Anything using it stops working immediately.',
                })}
                okButtonProps={{ danger: true }}
                onConfirm={() => handleRevoke(record)}
              >
                <a>
                  <FormattedMessage
                    id="pages.apiTokens.revoke"
                    defaultMessage="Revoke"
                  />
                </a>
              </Popconfirm>,
            ]
          : [],
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ApiToken>
        rowKey="guid"
        actionRef={actionRef}
        columns={columns}
        search={false}
        pagination={false}
        scroll={{ x: 1000 }}
        headerTitle={
          <FormattedMessage
            id="pages.apiTokens.list"
            defaultMessage="API tokens"
          />
        }
        request={async () => {
          const result = await getApiTokenList();
          return { data: result.data, total: result.total, success: true };
        }}
        toolBarRender={() => [
          access.canApiTokensCreate ? (
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              <FormattedMessage
                id="pages.apiTokens.create"
                defaultMessage="Create API token"
              />
            </Button>
          ) : null,
        ]}
      />

      <Card
        style={{ marginTop: 16 }}
        title={
          <Space>
            <KeyOutlined />
            <FormattedMessage
              id="pages.apiTokens.commandTitle"
              defaultMessage="Assign a device from the command line"
            />
          </Space>
        }
      >
        <Collapse
          ghost
          items={[
            {
              key: 'builder',
              label: intl.formatMessage({
                id: 'pages.apiTokens.commandBuilder',
                defaultMessage: 'Build a rustdesk --assign command',
              }),
              children: <AssignCommandBuilder />,
            },
          ]}
        />
      </Card>

      <CreateTokenModal
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <Modal
        open={!!created}
        width={760}
        maskClosable={false}
        keyboard={false}
        title={intl.formatMessage({
          id: 'pages.apiTokens.createdTitle',
          defaultMessage: 'Copy your new API token',
        })}
        footer={
          <Button type="primary" onClick={() => setCreated(null)}>
            <FormattedMessage
              id="pages.apiTokens.createdDone"
              defaultMessage="I have copied it"
            />
          </Button>
        }
        onCancel={() => setCreated(null)}
        destroyOnHidden
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={intl.formatMessage({
            id: 'pages.apiTokens.createdWarning',
            defaultMessage:
              'This is the only time the token is shown. Store it somewhere safe; if you lose it, revoke it and create a new one.',
          })}
        />
        <Paragraph
          copyable={{
            icon: <CopyOutlined />,
            text: created?.token,
          }}
          code
          style={{ wordBreak: 'break-all' }}
        >
          {created?.token}
        </Paragraph>
        {created?.scopes.includes('assign') ||
        created?.scopes.includes('manage') ? (
          <AssignCommandBuilder token={created?.token} />
        ) : null}
      </Modal>
    </PageContainer>
  );
};

export default ApiTokens;
