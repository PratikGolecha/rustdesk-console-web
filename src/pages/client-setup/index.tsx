import { CopyOutlined, SaveOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { FormattedMessage, useAccess, useIntl } from "@umijs/max";
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Typography,
} from "antd";
import React, { useCallback, useEffect, useState } from "react";
import {
  type ClientConfigSettings,
  type ClientSetup,
  getClientConfigSettings,
  getClientSetup,
  updateClientConfigSettings,
} from "@/services/rustdesk-console/clientConfig";

const { Text, Paragraph } = Typography;

const codeStyle: React.CSSProperties = {
  margin: 0,
  padding: "8px 12px",
  borderRadius: 6,
  background: "rgba(128,128,128,0.12)",
  wordBreak: "break-all",
  whiteSpace: "pre-wrap",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
  fontSize: 12,
};

const CopyBlock: React.FC<{ value: string }> = ({ value }) => {
  const intl = useIntl();
  const { message } = App.useApp();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      message.success(
        intl.formatMessage({
          id: "pages.clientSetup.copied",
          defaultMessage: "Copied to clipboard",
        })
      );
    } catch {
      message.error(
        intl.formatMessage({
          id: "pages.clientSetup.copyFailed",
          defaultMessage: "Copy failed, select the text and copy manually",
        })
      );
    }
  };
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
      <pre style={{ ...codeStyle, flex: 1 }}>{value}</pre>
      <Button icon={<CopyOutlined />} onClick={copy}>
        <FormattedMessage id="pages.clientSetup.copy" defaultMessage="Copy" />
      </Button>
    </div>
  );
};

type FormValues = {
  idServer: string;
  relayServers: string[];
  pinRelay: boolean;
  apiServer: string;
  publicKey: string;
};

const SettingsCard: React.FC<{ onSaved: () => void }> = ({ onSaved }) => {
  const intl = useIntl();
  const { message } = App.useApp();
  const [form] = Form.useForm<FormValues>();
  const [meta, setMeta] = useState<ClientConfigSettings>();
  const [saving, setSaving] = useState(false);

  const apply = useCallback(
    (s: ClientConfigSettings) => {
      setMeta(s);
      form.setFieldsValue({
        idServer: s.idServer,
        relayServers: s.relayServers,
        pinRelay: s.pinRelay,
        apiServer: s.apiServer,
        publicKey: s.publicKey,
      });
    },
    [form]
  );

  useEffect(() => {
    void getClientConfigSettings()
      .then(apply)
      .catch(() => undefined);
  }, [apply]);

  const save = async (values: FormValues) => {
    setSaving(true);
    try {
      apply(await updateClientConfigSettings(values));
      message.success(
        intl.formatMessage({
          id: "pages.clientSetup.settings.saveSuccess",
          defaultMessage: "Client setup saved",
        })
      );
      onSaved();
    } catch (e) {
      const detail = (e as { response?: { data?: { message?: unknown } } })
        ?.response?.data?.message;
      message.error(
        Array.isArray(detail)
          ? detail.join("; ")
          : intl.formatMessage({
              id: "pages.clientSetup.settings.saveFailed",
              defaultMessage: "Failed to save client setup",
            })
      );
    } finally {
      setSaving(false);
    }
  };

  const relays: string[] = Form.useWatch("relayServers", form) ?? [];

  return (
    <Card
      title={
        <FormattedMessage
          id="pages.clientSetup.settings.title"
          defaultMessage="Server connection settings (administrators)"
        />
      }
      style={{ marginBottom: 16 }}
    >
      <Form form={form} layout="vertical" onFinish={save}>
        <Form.Item
          name="idServer"
          label={
            <FormattedMessage
              id="pages.clientSetup.settings.idServer"
              defaultMessage="ID / rendezvous server"
            />
          }
          extra={
            <FormattedMessage
              id="pages.clientSetup.settings.idServerExtra"
              defaultMessage="host or host:port of hbbs, for example id.example.com"
            />
          }
        >
          <Input placeholder="id.example.com" />
        </Form.Item>
        <Form.Item
          name="relayServers"
          label={
            <FormattedMessage
              id="pages.clientSetup.settings.relayServers"
              defaultMessage="Relay servers"
            />
          }
          extra={
            <FormattedMessage
              id="pages.clientSetup.settings.relayServersExtra"
              defaultMessage="One host[:port] per entry (hbbr, default port 21117). Several are allowed: list them in the hbbs -r option."
            />
          }
        >
          <Select
            mode="tags"
            tokenSeparators={[",", " "]}
            placeholder="relay1.example.com:21117"
          />
        </Form.Item>
        <Form.Item
          name="pinRelay"
          valuePropName="checked"
          label={
            <FormattedMessage
              id="pages.clientSetup.settings.pinRelay"
              defaultMessage="Put the relay into the client config"
            />
          }
          extra={
            <FormattedMessage
              id="pages.clientSetup.settings.pinRelayExtra"
              defaultMessage="Only possible with exactly one relay. Leave off to let hbbs choose (recommended)."
            />
          }
        >
          <Switch disabled={relays.length !== 1} />
        </Form.Item>
        <Form.Item
          name="apiServer"
          label={
            <FormattedMessage
              id="pages.clientSetup.settings.apiServer"
              defaultMessage="API server URL"
            />
          }
          extra={
            <FormattedMessage
              id="pages.clientSetup.settings.apiServerExtra"
              defaultMessage="The URL of this console as seen from client machines. Empty uses the site backend URL from General settings."
            />
          }
        >
          <Input placeholder="https://console.example.com" />
        </Form.Item>
        <Form.Item
          name="publicKey"
          label={
            <FormattedMessage
              id="pages.clientSetup.settings.publicKey"
              defaultMessage="Public key override"
            />
          }
          extra={
            <FormattedMessage
              id="pages.clientSetup.settings.publicKeyExtra"
              defaultMessage="Normally read from the file set in RUSTDESK_KEY_FILE. Enter the id_ed25519.pub value here only to override it."
            />
          }
        >
          <Input allowClear />
        </Form.Item>
        {meta && (
          <Paragraph type="secondary">
            <FormattedMessage
              id={`pages.clientSetup.settings.keySource.${meta.keySource}`}
              defaultMessage={meta.keySource}
            />
            {meta.effectiveKey ? `: ${meta.effectiveKey}` : ""}
            {meta.keyFile.error ? ` (${meta.keyFile.error})` : ""}
          </Paragraph>
        )}
        <Button
          type="primary"
          htmlType="submit"
          icon={<SaveOutlined />}
          loading={saving}
        >
          <FormattedMessage
            id="pages.clientSetup.settings.save"
            defaultMessage="Save"
          />
        </Button>
      </Form>
    </Card>
  );
};

const ClientSetupPage: React.FC = () => {
  const intl = useIntl();
  const { message } = App.useApp();
  const access = useAccess();
  const [setup, setSetup] = useState<ClientSetup>();
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    void getClientSetup()
      .then(setSetup)
      .catch(() =>
        message.error(
          intl.formatMessage({
            id: "pages.clientSetup.loadFailed",
            defaultMessage: "Failed to load client setup",
          })
        )
      )
      .finally(() => setLoading(false));
  }, [intl, message]);

  useEffect(load, [load]);

  const cfg = setup?.config;
  const commandTabs = cfg
    ? [
        ["windowsPowerShell", "Windows PowerShell (Run as administrator)"],
        ["windowsCmd", "Windows Command Prompt (Run as administrator)"],
        ["macos", "macOS Terminal"],
        ["linux", "Linux shell"],
      ].map(([k, def]) => ({
        key: k,
        label: intl.formatMessage({
          id: `pages.clientSetup.os.${k}`,
          defaultMessage: def,
        }),
        children: (
          <CopyBlock value={cfg.commands[k as keyof typeof cfg.commands]} />
        ),
      }))
    : [];

  const fileName = (
    r: { filename: string; verified: boolean; reason?: string },
    titleId: string,
    titleDefault: string
  ) => (
    <div style={{ marginBottom: 12 }}>
      <Text strong>
        <FormattedMessage id={titleId} defaultMessage={titleDefault} />
      </Text>
      {r.verified ? (
        <CopyBlock value={r.filename} />
      ) : (
        <Alert
          type="warning"
          showIcon
          message={
            <FormattedMessage
              id="pages.clientSetup.fileName.unusable"
              defaultMessage="Not usable: {reason}"
              values={{ reason: r.reason }}
            />
          }
        />
      )}
    </div>
  );

  return (
    <PageContainer
      title={
        <FormattedMessage
          id="pages.clientSetup.title"
          defaultMessage="Client Setup"
        />
      }
      subTitle={
        <FormattedMessage
          id="pages.clientSetup.subtitle"
          defaultMessage="Give staff the server settings for their RustDesk clients so nobody has to type them."
        />
      }
    >
      {access.canAdmin && <SettingsCard onSaved={load} />}
      <Spin spinning={loading}>
        {setup && !setup.ready && (
          <Alert
            type="info"
            showIcon
            message={
              <FormattedMessage
                id="pages.clientSetup.notReady"
                defaultMessage="Client setup is not ready yet. An administrator has to set: {missing}."
                values={{ missing: setup.missing.join(", ") }}
              />
            }
          />
        )}
        {setup?.warnings?.map((w) => (
          <Alert
            key={w}
            type="warning"
            showIcon
            message={w}
            style={{ marginBottom: 12 }}
          />
        ))}
        {cfg && (
          <Space direction="vertical" size={16} style={{ width: "100%" }}>
            <Card
              title={
                <FormattedMessage
                  id="pages.clientSetup.config.title"
                  defaultMessage="Config string"
                />
              }
            >
              <Paragraph type="secondary">
                <FormattedMessage
                  id="pages.clientSetup.config.desc"
                  defaultMessage="Paste into RustDesk: Settings > Network > ID/Relay Server > Import server config, or use one of the commands below."
                />
              </Paragraph>
              <CopyBlock value={cfg.string} />
              <Text type="secondary">
                <FormattedMessage
                  id="pages.clientSetup.decoded"
                  defaultMessage="Decoded contents"
                />
              </Text>
              <pre style={codeStyle}>{JSON.stringify(cfg.json, null, 2)}</pre>
            </Card>
            <Card
              title={
                <FormattedMessage
                  id="pages.clientSetup.commands.title"
                  defaultMessage="One-line setup per operating system"
                />
              }
            >
              <Paragraph type="secondary">
                <FormattedMessage
                  id="pages.clientSetup.commands.desc"
                  defaultMessage="RustDesk must already be installed. Run as administrator (Windows) or with sudo (macOS/Linux). This overwrites the client server settings."
                />
              </Paragraph>
              <Tabs items={commandTabs} />
            </Card>
            <Card
              title={
                <FormattedMessage
                  id="pages.clientSetup.fileName.title"
                  defaultMessage="Windows installer file name"
                />
              }
            >
              <Paragraph type="secondary">
                <FormattedMessage
                  id="pages.clientSetup.fileName.desc"
                  defaultMessage="Download the official RustDesk installer and rename it to this name. The client reads its server settings from its own file name."
                />
              </Paragraph>
              {fileName(
                cfg.fileNames.licensed,
                "pages.clientSetup.fileName.licensed",
                "Licensed form (works for any values)"
              )}
              {fileName(
                cfg.fileNames.plain,
                "pages.clientSetup.fileName.plain",
                "Readable form"
              )}
            </Card>
            <Card
              title={
                <FormattedMessage
                  id="pages.clientSetup.deepLink.title"
                  defaultMessage="Mobile deep link"
                />
              }
            >
              <Paragraph type="secondary">{cfg.deepLink.note}</Paragraph>
              <CopyBlock value={cfg.deepLink.url} />
            </Card>
          </Space>
        )}
        {setup && (
          <Card
            style={{ marginTop: 16 }}
            title={
              <FormattedMessage
                id="pages.clientSetup.hbbs.title"
                defaultMessage="Relay servers (for the hbbs command)"
              />
            }
          >
            {setup.hbbs.relayArgument ? (
              <>
                <Paragraph type="secondary">
                  <FormattedMessage
                    id="pages.clientSetup.hbbs.desc"
                    defaultMessage="hbbs chooses a relay per connection, rotating through the healthy servers of this list (no geographic routing). Start hbbs with:"
                  />
                </Paragraph>
                <CopyBlock value={`hbbs ${setup.hbbs.relayArgument}`} />
              </>
            ) : (
              <Text type="secondary">
                <FormattedMessage
                  id="pages.clientSetup.hbbs.none"
                  defaultMessage="No relay servers configured; hbbs uses its own default."
                />
              </Text>
            )}
          </Card>
        )}
      </Spin>
    </PageContainer>
  );
};

export default ClientSetupPage;
