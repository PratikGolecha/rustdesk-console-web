import { PlusOutlined } from '@ant-design/icons';
import { FormattedMessage, useIntl } from '@umijs/max';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  Select,
  Space,
  Switch,
  Tabs,
  Tooltip,
  message,
} from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getStrategyOptionsCatalog } from '@/services/rustdesk-console/strategy';

interface ConfigOptionsFormProps {
  value?: Record<string, string>;
  onChange?: (value: Record<string, string>) => void;
  disabled?: boolean;
  /** Reports whether the value holds keys outside the catalog. */
  onHasCustomChange?: (hasCustom: boolean) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  permissions: 'Permissions',
  security: 'Security',
  network: 'Network',
  ui: 'UI & behavior',
};

/** One option row generated from a catalog definition. */
const OptionRow: React.FC<{
  def: API.StrategyOptionDef;
  value?: string;
  disabled?: boolean;
  onChange: (value: string | undefined) => void;
}> = ({ def, value, disabled, onChange }) => {
  const intl = useIntl();
  const isSet = value !== undefined;
  const yesNo = (v: string) =>
    intl.formatMessage({
      id: `pages.strategies.value.${v}`,
      defaultMessage: v === 'Y' ? 'Yes' : 'No',
    });

  let control: React.ReactNode;
  if (def.type === 'bool') {
    control = (
      <Switch
        disabled={disabled}
        checked={(value ?? def.default) === 'Y'}
        checkedChildren={yesNo('Y')}
        unCheckedChildren={yesNo('N')}
        onChange={(checked) => onChange(checked ? 'Y' : 'N')}
      />
    );
  } else if (def.type === 'enum') {
    control = (
      <Select
        disabled={disabled}
        style={{ width: '100%' }}
        allowClear
        value={value}
        placeholder={intl.formatMessage(
          {
            id: 'pages.strategies.unsetHint',
            defaultMessage: 'Not set (client default: {value})',
          },
          { value: def.default },
        )}
        options={def.values?.map((v) => ({ value: v, label: v }))}
        onChange={(v) => onChange(v ?? undefined)}
      />
    );
  } else if (def.type === 'int') {
    control = (
      <InputNumber
        disabled={disabled}
        style={{ width: '100%' }}
        min={def.min}
        max={def.max}
        precision={0}
        value={value !== undefined && value !== '' ? Number(value) : null}
        placeholder={def.default}
        onChange={(v) =>
          onChange(v === null || v === undefined ? undefined : String(v))
        }
      />
    );
  } else {
    control = (
      <Input
        disabled={disabled}
        value={value ?? ''}
        placeholder={def.default || def.key}
        onChange={(e) => onChange(e.target.value || undefined)}
      />
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '8px 0',
        borderBottom: '1px solid rgba(128,128,128,0.15)',
      }}
    >
      <div style={{ flex: '0 0 300px' }}>
        <Tooltip title={`${def.description} [${def.key}]`}>
          <span>{def.label}</span>
        </Tooltip>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{def.feature}</div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{control}</div>
      {!disabled && (
        <Button
          size="small"
          type="link"
          disabled={!isSet}
          onClick={() => onChange(undefined)}
        >
          <FormattedMessage
            id="pages.strategies.unsetValue"
            defaultMessage="Unset"
          />
        </Button>
      )}
    </div>
  );
};

const ConfigOptionsForm: React.FC<ConfigOptionsFormProps> = ({
  value = {},
  onChange,
  disabled = false,
  onHasCustomChange,
}) => {
  const intl = useIntl();
  const [catalog, setCatalog] = useState<API.StrategyOptionsCatalog | null>(
    null,
  );
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    let alive = true;
    getStrategyOptionsCatalog()
      .then((c) => alive && setCatalog(c))
      .catch(() => alive && setCatalogFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  const knownKeys = useMemo(
    () => new Set(catalog?.options.map((o) => o.key) ?? []),
    [catalog],
  );
  // Until the catalog loads (or if it fails) every key counts as custom.
  const customKeys = Object.keys(value).filter((k) => !knownKeys.has(k));
  const hasCustom = customKeys.length > 0;
  useEffect(() => {
    onHasCustomChange?.(hasCustom);
  }, [hasCustom, onHasCustomChange]);

  const setOption = useCallback(
    (key: string, val: string | undefined) => {
      const next = { ...value };
      if (val === undefined) delete next[key];
      else next[key] = val;
      onChange?.(next);
    },
    [value, onChange],
  );

  const applyPreset = (id: string) => {
    const preset = catalog?.presets.find((p) => p.id === id);
    if (!preset) return;
    // A preset replaces the catalog options but keeps custom keys.
    const next: Record<string, string> = {};
    for (const k of customKeys) next[k] = value[k];
    Object.assign(next, preset.options);
    onChange?.(next);
    message.success(
      intl.formatMessage(
        {
          id: 'pages.strategies.preset.applied',
          defaultMessage: 'Preset applied: {name}',
        },
        {
          name: intl.formatMessage({
            id: `pages.strategies.preset.${preset.id}`,
            defaultMessage: preset.label,
          }),
        },
      ),
    );
  };

  const customTab = (
    <div>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 12 }}
        message={intl.formatMessage({
          id: 'pages.strategies.customHint',
          defaultMessage:
            'Custom keys are pushed to clients as-is and are not validated against the catalog. Unknown keys have no effect on the client.',
        })}
      />
      {customKeys.map((k) => (
        <Space key={k} style={{ display: 'flex', marginBottom: 8 }}>
          <Input value={k} disabled style={{ width: 240 }} />
          <Input
            value={value[k]}
            disabled={disabled}
            style={{ width: 260 }}
            onChange={(e) => setOption(k, e.target.value)}
          />
          {!disabled && (
            <Button type="link" onClick={() => setOption(k, undefined)}>
              <FormattedMessage
                id="pages.common.delete"
                defaultMessage="Delete"
              />
            </Button>
          )}
        </Space>
      ))}
      {!disabled && (
        <Space>
          <Input
            value={newKey}
            style={{ width: 240 }}
            placeholder={intl.formatMessage({
              id: 'pages.strategies.customKey',
              defaultMessage: 'Option key',
            })}
            onChange={(e) => setNewKey(e.target.value.trim())}
          />
          <Input
            value={newValue}
            style={{ width: 260 }}
            placeholder={intl.formatMessage({
              id: 'pages.strategies.customValue',
              defaultMessage: 'Value',
            })}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <Button
            icon={<PlusOutlined />}
            disabled={!newKey}
            onClick={() => {
              setOption(newKey, newValue);
              setNewKey('');
              setNewValue('');
            }}
          >
            <FormattedMessage
              id="pages.strategies.addCustom"
              defaultMessage="Add custom option"
            />
          </Button>
        </Space>
      )}
    </div>
  );

  const items = [
    ...(catalog?.categories ?? []).map((cat) => {
      const defs = catalog?.options.filter((o) => o.category === cat) ?? [];
      const setCount = defs.filter((d) => value[d.key] !== undefined).length;
      return {
        key: cat,
        label: (
          <span>
            {intl.formatMessage({
              id: `pages.strategies.catalogCategory.${cat}`,
              defaultMessage: CATEGORY_LABELS[cat] ?? cat,
            })}
            {setCount > 0 && ` (${setCount})`}
          </span>
        ),
        children: (
          <div>
            {defs.map((def) => (
              <OptionRow
                key={def.key}
                def={def}
                value={value[def.key]}
                disabled={disabled}
                onChange={(v) => setOption(def.key, v)}
              />
            ))}
          </div>
        ),
      };
    }),
    {
      key: 'custom',
      label: (
        <span>
          {intl.formatMessage({
            id: 'pages.strategies.catalogCategory.custom',
            defaultMessage: 'Advanced (custom)',
          })}
          {customKeys.length > 0 && ` (${customKeys.length})`}
        </span>
      ),
      children: customTab,
    },
  ];

  return (
    <div>
      {catalogFailed && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={intl.formatMessage({
            id: 'pages.strategies.catalogUnavailable',
            defaultMessage:
              'The options catalog could not be loaded; only custom key/value options are available.',
          })}
        />
      )}
      {!disabled && catalog && catalog.presets.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Select
            style={{ width: 320 }}
            value={null as unknown as string}
            placeholder={intl.formatMessage({
              id: 'pages.strategies.preset.placeholder',
              defaultMessage: 'Choose a preset to fill the options',
            })}
            options={catalog.presets.map((p) => ({
              value: p.id,
              label: (
                <Tooltip title={p.description} placement="right">
                  <span>
                    {intl.formatMessage({
                      id: `pages.strategies.preset.${p.id}`,
                      defaultMessage: p.label,
                    })}
                  </span>
                </Tooltip>
              ),
            }))}
            onChange={applyPreset}
          />
        </div>
      )}
      <Tabs
        size="small"
        items={
          catalog || catalogFailed
            ? items.filter((i) => catalog || i.key === 'custom')
            : []
        }
      />
    </div>
  );
};

export default ConfigOptionsForm;
