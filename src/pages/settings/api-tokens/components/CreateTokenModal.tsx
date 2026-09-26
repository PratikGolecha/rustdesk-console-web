import { useIntl } from '@umijs/max';
import { Checkbox, DatePicker, Form, Input, Modal } from 'antd';
import type { Dayjs } from 'dayjs';
import React from 'react';

type Props = {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: API.CreateApiTokenParams) => Promise<void>;
};

const CreateTokenModal: React.FC<Props> = ({ open, onCancel, onSubmit }) => {
  const intl = useIntl();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = React.useState(false);

  const scopeOptions = [
    {
      value: 'assign',
      label: intl.formatMessage({
        id: 'pages.apiTokens.scope.assign',
        defaultMessage:
          'Assign devices (rustdesk --assign, POST /api/devices/cli)',
      }),
    },
    {
      value: 'read',
      label: intl.formatMessage({
        id: 'pages.apiTokens.scope.read',
        defaultMessage: 'Read-only API access (lists and audit export)',
      }),
    },
    {
      value: 'manage',
      label: intl.formatMessage({
        id: 'pages.apiTokens.scope.manage',
        defaultMessage:
          'Manage (includes read and assign, plus user/device administration used by the CLI)',
      }),
    },
  ];

  const handleOk = async () => {
    const values = await form.validateFields();
    const expires = values.expires_at as Dayjs | undefined;
    setSubmitting(true);
    try {
      await onSubmit({
        name: values.name.trim(),
        scopes: values.scopes,
        ...(expires ? { expires_at: expires.toISOString() } : {}),
      });
      form.resetFields();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title={intl.formatMessage({
        id: 'pages.apiTokens.create',
        defaultMessage: 'Create API token',
      })}
      okText={intl.formatMessage({
        id: 'pages.apiTokens.createConfirm',
        defaultMessage: 'Create',
      })}
      confirmLoading={submitting}
      onOk={handleOk}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ scopes: ['assign'] }}
      >
        <Form.Item
          name="name"
          label={intl.formatMessage({
            id: 'pages.apiTokens.name',
            defaultMessage: 'Name',
          })}
          rules={[{ required: true, whitespace: true, max: 100 }]}
        >
          <Input
            maxLength={100}
            placeholder={intl.formatMessage({
              id: 'pages.apiTokens.namePlaceholder',
              defaultMessage: 'e.g. Deployment script',
            })}
          />
        </Form.Item>
        <Form.Item
          name="scopes"
          label={intl.formatMessage({
            id: 'pages.apiTokens.scopes',
            defaultMessage: 'Permissions',
          })}
          extra={intl.formatMessage({
            id: 'pages.apiTokens.scopesHelp',
            defaultMessage:
              'A token acts as you: it can never do more than your own role allows, only less.',
          })}
          rules={[{ required: true, type: 'array', min: 1 }]}
        >
          <Checkbox.Group
            options={scopeOptions}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          />
        </Form.Item>
        <Form.Item
          name="expires_at"
          label={intl.formatMessage({
            id: 'pages.apiTokens.expiresAt',
            defaultMessage: 'Expires (optional)',
          })}
        >
          <DatePicker
            showTime
            style={{ width: '100%' }}
            disabledDate={(date) => date.isBefore(new Date(), 'day')}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateTokenModal;
