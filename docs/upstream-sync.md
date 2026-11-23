# Upstream sync

This repository is a fork of [`medusajs/dtc-starter`](https://github.com/medusajs/dtc-starter)
with heavy local customization (creator-profile module, notification providers,
locale-first storefront, own deploy pipeline).

```
origin    git@github.com:ai-shady/chicya-commerce-medusa.git   # ours, push here
upstream  git@github.com:medusajs/dtc-starter.git              # read-only reference
```

## Why there is no `git merge upstream/main`

Local history and upstream history **share no common ancestor**
(`git merge-base main upstream/main` exits non-zero). The first commit,
`c164c3f Initial commit: Medusa DTC Starter`, was imported as a squashed
snapshot of upstream at `756b4bd chore: update to v2.19.0` (Medusa 2.19.0).

Consequences:

- `git merge` / `git rebase` against `upstream/main` would need
  `--allow-unrelated-histories` and bury us in meaningless conflicts.
- Sync is done **commit by commit**: read the upstream diff, port what applies,
  re-implement what does not, skip what is already superseded by our rewrite.
- Never push to `upstream`. It is configured with `pushurl = no_push` to make
  an accidental `git push upstream` fail immediately.

## Procedure

```bash
./scripts/upstream-gap.sh          # fetch + list commits not yet reviewed
git show <sha>                     # read the diff
# port it, build, then record it in the table below
```

Porting rules:

1. Storefront files were rewritten (`[locale]` routing, own UI kit, i18n), so
   upstream storefront diffs are **intent, not patches**. Re-implement the fix
   in our structure and note the divergence.
2. Never import upstream's `pnpm-workspace.yaml` changes; we use npm workspaces.
3. Keep dependency versions aligned across `apps/backend` and `apps/storefront`
   (`@medusajs/*` must be the same version in both, otherwise npm hoists two
   copies of `@medusajs/types` and backend typecheck breaks).
4. After porting, bump `SYNCED` in `scripts/upstream-gap.sh` and update the
   table below in the same commit.

## Status

Last reviewed upstream commit: `edd0c1c chore: update to 2.23.0 (#104)`

Base of our snapshot: `756b4bd chore: update to v2.19.0`

| Upstream commit | What it does | Status |
| --- | --- | --- |
| `db562d2` | fix 500 on product page from another sales channel (`images` computed before `notFound()`) | ported |
| `7d0d476` | `Text` shim uses `txt-medium` instead of `text-base` | n/a — our `Text` comes from `@medusajs/ui`, no local shim |
| `1d897a2` | don't label an unselected product "Out of stock" | ported (`product-actions`) |
| `9b93e68` | order details crashes without a shipping method | ported (`shipping-details`) |
| `cb75d8d`, `cb603df` | lockfile refresh | n/a — npm, regenerated locally |
| `b08e6d9` | Stripe authorize + redirect flow fixes (`/api/payment-return`, Payment Element, `sameSite: lax` cookies) | ported — route takes `locale` instead of `country_code`, checkout labels localized via i18n |
| `19e8a6f`, `bd2441a`, `211454a` | bump `@medusajs/*` 2.20.1 / 2.21.0 / 2.21.2 | ported — we are on 2.21.2 in both apps |
| `22c4513` | Next.js 15.5.24 (storefront) | ported |
| `638b7b6` | pin react 18.3.1 at root (pnpm workaround) | n/a — we pin react 19.0.5 via `overrides` |
| `d871b32` | pnpm allow-builds config | n/a — npm |
| `a97e644` | `feat: search` — backend product index, `/store/search` middleware, demo-product seed, storefront InstantSearch UI | ported — nav drawer, `/search` page and demo seed; the store listing stays on the REST list (see follow-ups) |
| `e3a237c` | drop the `status === "published"` filter from the search index source | ported |
| `00d905f`, `eca4c51`, `15ef93d` | engines `node >= 22.22.0` | **skipped on purpose** — we build on node 24 (CI) / node 26 (Docker), keeping the wider `^20.19.0 \|\| >=22.12.0` range |
| `8d414f2` | remove `generateStaticParams` from category / collection / product pages | ported (build-time fetch of backend data made builds fragile) |

Older commits (`756b4bd` and below) are part of the imported snapshot and are
not tracked here.

## Reviewed, not ported (`f677db4..edd0c1c`)

Upstream moved fast after the search release: agents, Medusa Payments and
Next.js 16 all landed. Everything below was read and deliberately left out or
adapted; nothing in this range is silently missing.

| Upstream commit | What it does | Status |
| --- | --- | --- |
| `a106938`, `6965d8a`, `d4e4dae`, `4a1d53d`, `6834ac6`, `6440e85`, `44f2979`, `edd0c1c` | `@medusajs/*` 2.22.0 → 2.23.0 | ported — we jump straight from 2.21.2 to 2.23.0 (2.23.0 also brings React 19 in the backend admin, `react-i18next` 18, TypeScript 6, vite 8, zod 4.6.7) |
| `0a84b2a` | `private: true` in the root manifest | ported |
| `d661229` | AGENTS.md / README cleanup for AI agents | n/a — our AGENTS.md is rewritten around this project |
| `6b95717` | migrate storefront to Next.js 16 | **skipped on purpose** — we stay on Next 15.5.24; Next 16 removes `next lint` and needs its own migration |
| `0f30155`, `1f633b5`, `59b2881` | Medusa Payments provider, then Adyen support (and its removal from the default config) | **skipped** — production checkout runs on Stripe; revisit if we switch providers |
| `204130a` | "agent-friendly" storefront: UCP/MCP endpoints (`src/lib/ucp/*`), policy pages, structured data, `src/lib/region-store-policies.ts` + migration script | **not ported** — additive product decision, see follow-ups |
| `6f68b7f` | avoid storefront `fields` queries blocked by Medusa Cloud's firewall | n/a — self-hosted on EC2, no Cloud firewall; the change only touched `lib/data/adyen.ts` |
| `c460b9a` | GitHub workflow that opens Medusa update PRs | n/a — we sync by hand, see the procedure above |

Older commits (`756b4bd` and below) are part of the imported snapshot and are
not tracked here.

### Follow-ups

- **Store listing uses the plain product list, not InstantSearch** (`a97e644`):
  the nav drawer and `/search` page run on the search index, but
  `modules/store/templates` still renders the paginated REST list with facet
  filters instead of upstream's `store-search-box` + `useHits` rewrite. That
  keeps the listing working without the index but means sorting/facets and the
  search box do not share state like upstream.
- **Agent-friendly storefront** (`204130a`): UCP/MCP endpoints, policy pages,
  structured data and the backend `region-store-policies` module are not
  ported. Pure product decision.
- **Next.js 16** (`6b95717`): skipped; would also need `next lint` → `eslint .`
  and `--turbopack` default changes.
- **Node engine floor**: upstream is on `>=22.23.4`; we keep the wider range
  (`^20.19.0 || >=22.12.0` in the root, same in the apps) because CI runs
  node 24 and the Docker image node 26. Bump it if a dependency starts
  requiring `node:fs` APIs we do not have.
