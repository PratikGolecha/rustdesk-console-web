import { useIntl } from '@umijs/max';
import { Alert, Col, Input, Row, Tabs, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import {
  ASSIGN_OPTION_KEYS,
  type AssignOptions,
  type AssignOs,
  buildAssignCommand,
} from '../assignCommand';

const { Paragraph, Text } = Typography;

type Props = {
  /** Plaintext token; a placeholder is shown when it is not available. */
  token?: string;
};

const AssignCommandBuilder: React.FC<Props> = ({ token }) => {
  const intl = useIntl();
  const [options, setOptions] = useState<AssignOptions>({});

  const labels: Record<keyof AssignOptions, string> = {
    user_name: intl.formatMessage({
      id: 'pages.apiTokens.assign.user_name',
      defaultMessage: 'User name',
    }),
    strategy_name: intl.formatMessage({
      id: 'pages.apiTokens.assign.strategy_name',
      defaultMessage: 'Strategy name',
    }),
    device_group_name: intl.formatMessage({
      id: 'pages.apiTokens.assign.device_group_name',
      defaultMessage: 'Device group name',
    }),
    address_book_name: intl.formatMessage({
      id: 'pages.apiTokens.assign.address_book_name',
      defaultMessage: 'Address book name',
    }),
    address_book_tag: intl.formatMessage({
      id: 'pages.apiTokens.assign.address_book_tag',
      defaultMessage: 'Address book tag',
    }),
    address_book_alias: intl.formatMessage({
      id: 'pages.apiTokens.assign.address_book_alias',
      defaultMessage: 'Address book alias',
    }),
    address_book_password: intl.formatMessage({
      id: 'pages.apiTokens.assign.address_book_password',
      defaultMessage: 'Address book password',
    }),
    address_book_note: intl.formatMessage({
      id: 'pages.apiTokens.assign.address_book_note',
      defaultMessage: 'Address book note',
    }),
    note: intl.formatMessage({
      id: 'pages.apiTokens.assign.note',
      defaultMessage: 'Device note',
    }),
    device_username: intl.formatMessage({
      id: 'pages.apiTokens.assign.device_username',
      defaultMessage: 'Device username',
    }),
    device_name: intl.formatMessage({
      id: 'pages.apiTokens.assign.device_name',
      defaultMessage: 'Device name',
    }),
  };

  const shownToken =
    token ||
    intl.formatMessage({
      id: 'pages.apiTokens.assign.tokenPlaceholder',
      defaultMessage: '<YOUR_TOKEN>',
    });

  const commands = useMemo(
    () => ({
      windows: buildAssignCommand('windows', shownToken, options),
      macos: buildAssignCommand('macos', shownToken, options),
      linux: buildAssignCommand('linux', shownToken, options),
    }),
    [shownToken, options],
  );

  const osTabs: { key: AssignOs; label: string }[] = [
    { key: 'windows', label: 'Windows' },
    { key: 'macos', label: 'macOS' },
    { key: 'linux', label: 'Linux' },
  ];

  const hasOption = ASSIGN_OPTION_KEYS.some((key) => options[key]?.trim());

  return (
    <div>
      <Paragraph type="secondary">
        {intl.formatMessage({
          id: 'pages.apiTokens.assign.intro',
          defaultMessage:
            'Run this on a device that already has RustDesk installed and configured for this server, from an elevated (administrator / root) shell. At least one option is required.',
        })}
      </Paragraph>
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        {ASSIGN_OPTION_KEYS.map((key) => (
          <Col xs={24} md={12} key={key}>
            <Input
              allowClear
              addonBefore={<Text code>{`--${key}`}</Text>}
              placeholder={labels[key]}
              aria-label={labels[key]}
              value={options[key] ?? ''}
              onChange={(event) =>
                setOptions((prev) => ({ ...prev, [key]: event.target.value }))
              }
            />
          </Col>
        ))}
      </Row>
      {!hasOption && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={intl.formatMessage({
            id: 'pages.apiTokens.assign.needOption',
            defaultMessage:
              'Fill in at least one option above; the client refuses to run without one.',
          })}
        />
      )}
      <Tabs
        items={osTabs.map(({ key, label }) => ({
          key,
          label,
          children: (
            <Paragraph
              copyable
              code
              style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}
            >
              {commands[key]}
            </Paragraph>
          ),
        }))}
      />
    </div>
  );
};

export default AssignCommandBuilder;
