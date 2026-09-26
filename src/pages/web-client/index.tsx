import { ExportOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useIntl, useLocation } from "@umijs/max";
import { Alert, Button, Card, Descriptions, Space, Spin } from "antd";
import React, { useEffect, useState } from "react";
import { getWebClientConfig } from "@/services/rustdesk-console/webClient";

/** Base path the browser client is served from (see docs/WEB-CLIENT.md). */
const WEB_CLIENT_PATH = "/webclient/";

type Status = "loading" | "ready" | "missing" | "disabled";

/**
 * Browser-based remote desktop. The RustDesk web client is a separate static
 * app (fetched by scripts/fetch-web-client.sh) served next to the console; it
 * is pre-configured with this server's ID server / key through
 * /webclient-config/index.js. Optional `?id=<peer id>` pre-fills the target.
 */
const WebClientPage: React.FC = () => {
  const intl = useIntl();
  const location = useLocation();
  const [status, setStatus] = useState<Status>("loading");
  const [config, setConfig] = useState<API.WebClientConfig | null>(null);

  const peerId = new URLSearchParams(location.search).get("id") ?? "";
  const src = peerId
    ? `${WEB_CLIENT_PATH}#/?id=${encodeURIComponent(peerId)}`
    : WEB_CLIENT_PATH;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cfg = await getWebClientConfig();
        if (cancelled) return;
        setConfig(cfg);
        if (!cfg.enabled) return setStatus("disabled");
        // The static client ships a version.json; a missing folder must not fall through
        // to the console's SPA index.html, so require a JSON response.
        const res = await fetch(`${WEB_CLIENT_PATH}version.json`, {
          cache: "no-store",
        });
        const ok =
          res.ok && (res.headers.get("content-type") ?? "").includes("json");
        if (!cancelled) setStatus(ok ? "ready" : "missing");
      } catch {
        if (!cancelled) setStatus("missing");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageContainer
      extra={
        status === "ready" ? (
          <Button
            icon={<ExportOutlined />}
            href={src}
            target="_blank"
            rel="noopener"
          >
            {intl.formatMessage({
              id: "pages.webClient.openNewTab",
              defaultMessage: "Open in new tab",
            })}
          </Button>
        ) : undefined
      }
    >
      {status === "loading" && <Spin />}
      {status === "disabled" && (
        <Alert
          type="warning"
          showIcon
          message={intl.formatMessage({
            id: "pages.webClient.disabled",
            defaultMessage: "The web client is disabled on this server.",
          })}
        />
      )}
      {status === "missing" && (
        <Alert
          type="warning"
          showIcon
          message={intl.formatMessage({
            id: "pages.webClient.missing",
            defaultMessage: "The web client is not installed on this server.",
          })}
          description={intl.formatMessage({
            id: "pages.webClient.missingDesc",
            defaultMessage:
              "Run scripts/fetch-web-client.sh when building the web UI (see docs/WEB-CLIENT.md).",
          })}
        />
      )}
      {status === "ready" && (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Alert
            type="info"
            showIcon
            message={intl.formatMessage({
              id: "pages.webClient.hint",
              defaultMessage:
                "Enter the device ID and the permanent password of the target device. The browser connects through this server (WebSocket ports 21118/21119).",
            })}
          />
          {config && !config.key && (
            <Alert
              type="warning"
              showIcon
              message={intl.formatMessage({
                id: "pages.webClient.noKey",
                defaultMessage:
                  "No server key is configured (WEB_CLIENT_KEY or RUSTDESK_KEY_FILE); connections to a server that enforces a key will fail.",
              })}
            />
          )}
          <Card styles={{ body: { padding: 0 } }}>
            <iframe
              title="RustDesk web client"
              src={src}
              allow="clipboard-read; clipboard-write; fullscreen"
              style={{
                width: "100%",
                height: "calc(100vh - 300px)",
                minHeight: 480,
                border: 0,
                display: "block",
              }}
            />
          </Card>
          {config && (
            <Descriptions size="small" column={1}>
              <Descriptions.Item
                label={intl.formatMessage({
                  id: "pages.webClient.idServer",
                  defaultMessage: "ID server",
                })}
              >
                {config.id_server || "-"}
              </Descriptions.Item>
            </Descriptions>
          )}
        </Space>
      )}
    </PageContainer>
  );
};

export default WebClientPage;
