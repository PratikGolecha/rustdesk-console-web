# Golecha fork of databk/rustdesk-console-web

Maintained fork of [databk/rustdesk-console-web](https://github.com/databk/rustdesk-console-web), the web UI for the
Golecha RustDesk console. Default branch: **`golecha`**. Backend fork:
[PratikGolecha/rustdesk-console](https://github.com/PratikGolecha/rustdesk-console).

## What differs from upstream

| Change                                                                                                                | Upstream status                                                    |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Uniform 24px spacing on the login page (Passkey button no longer touches Login)                                       | PR [#335](https://github.com/databk/rustdesk-console-web/pull/335) |
| Remaining hardcoded Chinese translated (loading screen, comments, custom-client match on the English backend message) | PR [#336](https://github.com/databk/rustdesk-console-web/pull/336) |

## Keeping up with upstream

```bash
git remote add upstream https://github.com/databk/rustdesk-console-web.git   # once
git fetch upstream
git checkout golecha && git merge upstream/main
npm ci --legacy-peer-deps && npx tsc --noEmit && npm run build
```

## Build and deploy

`npm run build` outputs static files to `dist/`. Serve them with nginx (see `nginx.conf.template`, which proxies
`/api/` to the backend), e.g. bind-mount `dist/` over `/usr/share/nginx/html` in the stock `rustdesk-console-web`
container. The `Dockerfile` does the same build inside Docker.

## Notes

- `npm ci` runs `max setup` (postinstall) and takes a few minutes; the build itself is ~2 s.
- 7 tests in `src/pages/roles` and `ShareAccessModal` fail on upstream `main` as well.

## Pro-parity pages added in this fork (2026-09)

Access rules editor (User groups -> Access), Client setup page, API tokens (Settings), Control roles, categorised Strategy editor with presets,
and the browser Web client (`/web-client`, assets fetched by `scripts/fetch-web-client.sh` - run it before `npm run build`, or with a `dist/webclient`
argument for a bind-mounted `dist/`). nginx needs the `/webclient/` and `/webclient-config/index.js` rules from `nginx.conf.template`.

## Acknowledgements and licences

The web client assets are RustDesk's web client v1 (AGPL-3.0, Purslane Ltd.) as redistributed in the [lejianwen/rustdesk-api](https://github.com/lejianwen/rustdesk-api)
v2.7 release (MIT project); the script pins the version and verifies a sha256. UI structure follows the base project
[databk/rustdesk-console-web](https://github.com/databk/rustdesk-console-web). Feature behaviour was checked against RustDesk Server Pro's public docs and the
RustDesk client source.
