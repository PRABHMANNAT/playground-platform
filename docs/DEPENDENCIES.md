# Dependency compatibility

Checked 14 October 2026. npm registry metadata was read before pinning. The installed
versions were then exercised by type checks, build and local integration/browser tests.
`package-lock.json` and `services/api/requirements.txt` record exact resolved dependencies.

| Component | Tested |
|---|---|
| Node / npm | 24.18.0 / 11.16.0 |
| Python | 3.14.6 |
| Next.js | 16.4.0 |
| React / React DOM | 19.3.0 |
| TypeScript | 5.9.3 |
| Tailwind / PostCSS adapter | 4.3.3 |
| FastAPI / Pydantic | 0.143.0 / 2.14.1 |
| SQLAlchemy / Alembic | 2.0.51 (pure Python) / 1.20.0 |
| Psycopg / PostgreSQL | 3.3.6 / 18.4 |
| Playwright test | 1.64.0 (installed Chrome channel) |
| jose / PyJWT | 6.2.12 / 2.15.1 |
| Keycloak | 26.8.1, portable JDK 21 |
| UI accessibility QA | @axe-core/playwright 4.13.0 |

SQLAlchemy 2.1.4's native extension was blocked by Windows application control.
The supported pure Python 2.0.51 build was installed and tested successfully.
Starlette emits a TestClient/httpx deprecation warning, which does not fail the executed
suite. Docker images/builds and MinIO/S3 connectivity were not executed on this host.

Primary references consulted:

- [Next.js installation and requirements](https://nextjs.org/docs/app/getting-started/installation)
- Installed Next.js route-handler, cookies, client-component and search-param documentation.
- [FastAPI package requirements](https://pypi.org/project/fastapi/)
- [Embedded PostgreSQL support and API](https://github.com/leinelissen/embedded-postgres)
- [Keycloak 26.8.1 release](https://github.com/keycloak/keycloak/releases/tag/26.8.1)
- [PostgreSQL official image](https://hub.docker.com/_/postgres)
- [MinIO pinned development release](https://github.com/minio/minio/releases/tag/RELEASE.2025-09-07T16-13-09Z)

The MinIO upstream repository is archived; this optional local dependency is not a
production storage recommendation. The S3 interface is replaceable. Browser Use,
Temporal, LangGraph and customer audit dependencies are deliberately not pinned before
Phase 2 compatibility and integration tests.
