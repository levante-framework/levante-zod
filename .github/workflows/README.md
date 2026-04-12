# levante-zod/actions

https://github.com/levante-framework/levante-zod/actions

- [Publish](#publish)

## Publish

https://github.com/levante-framework/levante-zod/actions/workflows/publish.yml

Manually triggered workflow that:

- Commits the version bump to `main` with the message `chore: release vX.Y.Z [skip ci]` and pushes a `vX.Y.Z` git tag
- Publishes the package to npm as `@levante-framework/levante-zod` with provenance attestation
- Creates a GitHub Release named `vX.Y.Z` with auto-generated release notes

**Prerequisites**

| Secret | Purpose |
|---|---|
| `GITHUB_TOKEN` | Automatically provided by GitHub — used to push the version bump commit and tag, and to create the GitHub Release; requires `contents: write` and `id-token: write` permissions (configured in the workflow) |
| `LEVANTE_NPM_TOKEN` | npm access token with publish rights for this package |

**Inputs**

| Input | Default | Description |
|---|---|---|
| `Use workflow from` | `main` | Must always be `main` |
| `release-type` | `patch` | One of `patch`, `minor`, or `major` |
| `dry-run` | `false` | If checked, runs all checks and bumps the version locally but skips pushing, publishing, and creating a release |
