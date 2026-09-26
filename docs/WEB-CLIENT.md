# Browser (web) client

The console menu **Web Client** embeds the RustDesk browser client (`/webclient/`) so a logged-in user can start a
remote session without installing anything. Nothing is committed to git: the assets are fetched by
`scripts/fetch-web-client.sh` (pinned URL + SHA-256) into `public/webclient/` (git-ignored) and copied into `dist/`.

## How it works

1. Browser opens `/webclient/` (static Flutter-web build + TypeScript connection layer).
2. Its `index.html` loads `/webclient-config/index.js`; nginx maps that to backend `GET /api/web-client/config.js`,
   which sets localStorage `custom-rendezvous-server`, `key`, `api-server`.
3. The client opens **WebSockets** to `<id server host>:<port+2>` (hbbs, default **21118**) and `:<port+3>`
   (hbbr, default **21119**), `wss://` when the page is HTTPS, `ws://` otherwise. Deep link: `/webclient/#/?id=<peer id>`.
4. The target still asks for its permanent password (or an approve click), exactly like a native client.

Backend config (env, see be `.env.example`): `WEB_CLIENT_ENABLED`, `WEB_CLIENT_ID_SERVER` (default: request host),
`WEB_CLIENT_API_SERVER` (default: request origin), `WEB_CLIENT_KEY` or `RUSTDESK_KEY_FILE` (public key,
`id_ed25519.pub`). Public JSON view: `GET /api/web-client/config`. This is deliberately env-based and self-contained
so it can later be replaced by the settings-backed client-setup API.

## Deploy

```bash
scripts/fetch-web-client.sh            # before `npm run build` (Dockerfile does it: --build-arg WITH_WEB_CLIENT=0 skips)
scripts/fetch-web-client.sh dist/webclient   # or into an existing dist that is bind-mounted into nginx
```

`nginx.conf.template` already contains the `/webclient/` and `/webclient-config/index.js` locations.

### TLS: Caddy in front (HTTPS console => `wss://` required)

The client derives ports from the ID server (21116 -> 21118/21119) and uses the **same host name**, so 21118/21119 on
that host must speak TLS. hbbs/hbbr bind those ports themselves, so move their published ports and let Caddy own them:

```yaml
# docker-compose (hbbs/hbbr): publish WS only on loopback, on other host ports
hbbs:
  {
    ports:
      [
        "21115:21115",
        "21116:21116",
        "21116:21116/udp",
        "127.0.0.1:31118:21118",
      ],
  }
hbbr: { ports: ["21117:21117", "127.0.0.1:31119:21119"] }
```

```caddyfile
rd.example.com {                       # console (nginx container on :8080 here)
    reverse_proxy 127.0.0.1:8080
}
rd.example.com:21118 {                 # hbbs WebSocket (Caddy proxies WS upgrades automatically)
    reverse_proxy 127.0.0.1:31118
}
rd.example.com:21119 {                 # hbbr WebSocket
    reverse_proxy 127.0.0.1:31119
}
```

Firewall: allow TCP 443, 21118, 21119 (plus the usual 21115-21117 TCP and 21116 UDP for native clients). LAN-only
HTTP setups need no Caddy: `ws://host:21118/21119` are reached directly.

## Client version / limitations

Assets = RustDesk web client v1 (Flutter `1.1.10-1`) from lejianwen/rustdesk-api release v2.7 (sha in the script).
It is an older code base than RustDesk 1.4 desktop clients: video (VP9/AV1 via WebCodecs needs HTTPS),
mouse/keyboard, clipboard text, audio work; no file transfer / multi-tab / recent Pro-only features. Targets must run a
client that still accepts web sessions. The official "web client v2" of RustDesk Pro is closed source and is not used.

## Licence / attribution

The client is derived from RustDesk (AGPL-3.0, Purslane Ltd.), redistributed through lejianwen/rustdesk-api
(MIT wrapper; the web assets stay AGPL). This console is AGPL-3.0 as well, so serving them is compatible; the fetch
script writes `WEB-CLIENT-NOTICE.txt` with origin, checksum and source pointers; `assets/NOTICES` lists bundled
libraries. Under AGPL section 13 keep source links available (js/src ships in the folder; Dart source: rustdesk/rustdesk
`flutter/`).

## Privacy patches applied by the script

The stock build contacts RustDesk's public servers and Google. The script (a) removes the Firebase init in
`index.html`, (b) removes the start-up latency probe to `rs-*.rustdesk.com`, (c) adds a CSP that blocks all
cross-origin requests except WebSockets and one Roboto font file (`fonts.gstatic.com`; blocking it leaves the UI
without text) - this blocks the Dart code's own Firebase Analytics / Google Tag Manager calls (they show as CSP
errors in the browser console, expected), (d) bundles CanvasKit locally instead of loading it from unpkg.com.

## Security

- 21118/21119 become internet-facing WebSocket endpoints (same services that already listen on 21116/21117).
- The key (`-k _` / KEY_FILE) should stay enforced on hbbs/hbbr; the browser gets the _public_ key from the config script.
- A visitor needs the target's ID **and** its permanent password; use strong permanent passwords / 2FA-style approval.
- The config endpoints are public (they expose only server address + public key). The console menu entry needs `devices.view`;
  the static client itself is not behind console login (same as a native client).
