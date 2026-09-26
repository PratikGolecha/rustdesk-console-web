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
