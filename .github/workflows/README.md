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
| `LEVANTE_BOT_APP_ID` | App ID of the Levante Bot GitHub App; used with [`actions/create-github-app-token`](https://github.com/actions/create-github-app-token) to mint an installation token that can push directly to `main` (the default `GITHUB_TOKEN` is blocked by the repository ruleset that requires PRs) |
| `LEVANTE_BOT_APP_PRIVATE_KEY` | Private key (PEM) for the Levante Bot GitHub App |
| `LEVANTE_NPM_TOKEN` | npm access token with publish rights for this package |

The Levante Bot GitHub App must:

- Be installed on this repository with `Contents: write` permission
- Be listed as a bypass actor on any ruleset targeting `main` that requires pull requests, so the version bump commit and tag can be pushed directly

**Inputs**

| Input | Default | Description |
|---|---|---|
| `Use workflow from` | `main` | Must always be `main` |
| `release-type` | `patch` | One of `patch`, `minor`, or `major` |
| `dry-run` | `false` | If checked, runs all checks and bumps the version locally but skips pushing, publishing, and creating a release |
