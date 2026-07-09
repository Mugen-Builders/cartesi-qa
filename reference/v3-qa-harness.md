# Contracts v3 — QA Harness Setup

How to stand up an environment capable of running v3 lifecycle tests (staging, foreclosure, emergency withdrawal, operator CLI, machine tool). For *what* to test, see [v3-lifecycle.md](v3-lifecycle.md) and the [catalog](../catalog/).

This repo does **not** ship a test application. Use an app from the Cartesi CLI templates or the rollups-node repo (see below).

---

## Two harness modes

| Mode | Good for | Cannot do |
|------|----------|-----------|
| **`cartesi run`** + a scaffolded app | CLI misuse, JSON-RPC/inspect boundaries, basic claimer auth scenarios | Emergency withdrawal, `cartesi-rollups-cli`, per-service restart, quorum deploy |
| **Compose** (Mugen-Builders `compose.local.yaml`) | Full v3 lifecycle, FOR/ILC/MTL catalog, SMK-005, operator-day-two | Quick iteration on a single monolithic stack |

**Rule of thumb:** if the test mentions `cartesi-rollups-cli`, `cartesi-rollups-machine-tool`, `foreclose`, `prove-drive-root`, `withdraw`, or quorum deploy — use **compose**.

---

## Choosing a test application

Pick the app based on what you need to exercise — not every catalog entry uses the same template.

| Need | Suggested app | Source |
|------|---------------|--------|
| Fast local smoke (inputs, notices, basic claimer) | Any minimal JS/Python template | `cartesi create <name> -t javascript` (or `python`) |
| Emergency withdrawal + foreclosure (SMK-005, FOR-006–012) | **`erc20-withdrawal-dapp`** | rollups-node repo / presentation demo path |
| Quorum lifecycle (QUO-*) | App deployed against a v3 Quorum consensus | compose + `deploy quorum` |

### `erc20-withdrawal-dapp` (full v3 path)

Use for foreclosure and emergency withdrawal catalog work. It exercises:

- Deposits and normal voucher flow
- Accounts-drive layout required for emergency withdrawal proofs
- Output builder integration for post-foreclosure payouts

### Lightweight template (quick devnet)

For CLI, JSON-RPC, and inspect tests that do not need emergency withdrawal:

```sh
cartesi create <app-name> -t javascript
cd <app-name>
cartesi build
cartesi run --epoch-length 10 -p <port>
```

Replace `<app-name>`, `<port>`, and payload format with whatever your template defines.

---

## Tooling: three different CLIs

Do not assume one install gives you everything. These are separate binaries with different run contexts.

| Tool | Purpose | Where it runs |
|------|---------|---------------|
| **`cartesi`** | Developer workflow: `create`, `build`, `run`, `send`, `doctor` | **Host** — install via Cartesi CLI package |
| **`cartesi-rollups-cli`** | Operator workflow: `deploy`, `foreclose`, `prove-drive-root`, `withdraw`, `read …`, `app …` | **Inside the advancer container** when using compose — **not** on the host and **not** available with `cartesi run` |
| **`cartesi-rollups-machine-tool`** | `replay`, `prove accounts-drive` — produces proof JSON for emergency withdrawal | **Host** — build from the [rollups-node](https://github.com/cartesi/rollups-node) repo (`make build`) at the **same version** as the node under test; needs DB/env config (see rollups-node `make env`) |

Prefix every operator CLI invocation in compose:

```sh
export COMPOSE_FILE=compose.local.yaml
export EXEC="docker compose -f $COMPOSE_FILE exec advancer cartesi-rollups-cli"

# Examples
$EXEC app list
$EXEC read epochs <app>
$EXEC foreclose <app>
```

Optional host tools: **`cast`** (Foundry) for direct L1 calls when not going through the operator CLI.

---

## Prerequisites

Record versions in every session note.

### Host

```sh
cartesi --version
docker --version
docker compose version
cartesi-rollups-machine-tool --help   # after rollups-node build; skip if not running MTL/FOR emergency path
```

| Requirement | Notes |
|-------------|-------|
| **Cartesi CLI (`cartesi`)** | On the host; used to scaffold apps and `cartesi build` |
| **Docker Desktop** | Running before compose or `cartesi run` |
| **`cartesi-rollups-machine-tool`** | Required for MTL-* and emergency proof generation; build from rollups-node matching the node image under test |
| **Foundry `cast`** (optional) | Direct L1 transactions when debugging outside operator CLI |

### Compose stack (provides `cartesi-rollups-cli`)

| Requirement | Notes |
|-------------|-------|
| **Mugen-Builders `compose.local.yaml`** | Self-hosted node; see [cartesi-deploy skill](../.agents/skills/cartesi-deploy/SKILL.md) |
| **Node runtime image** | Must match v3 contract suite (verify tag in compose file) |
| **Contracts v3 suite** | `rollups-contracts 3.0.0-alpha.6` per [v3-lifecycle.md](v3-lifecycle.md) |
| **v3 factory addresses** | InputBox, AuthorityFactory, QuorumFactory, ApplicationFactory, SelfHosted, DaveAppFactory |
| **Funded deployer key** | In `.env` for compose / Anvil or testnet |
| **Guardian key** | Must match `withdrawal_config` guardian address (foreclose) |
| **Gas payer** | For `prove-drive-root` and `withdraw` (can differ from recipient) |

After `docker compose up`, confirm operator CLI is reachable:

```sh
docker compose -f compose.local.yaml exec advancer cartesi-rollups-cli --help
```

---

## Compose setup (canonical v3 harness)

### 1. Build the application machine image

```sh
cd <app-directory>
cartesi build
```

Confirm snapshot exists:

```sh
ls .cartesi/image/
```

### 2. Obtain and configure Mugen-Builders deployment

Follow the [cartesi-deploy skill](../.agents/skills/cartesi-deploy/SKILL.md) for full detail. Summary:

1. Clone or download [deployment-setup-v2.0](https://github.com/Mugen-Builders/deployment-setup-v2.0)
2. Copy `compose.local.yaml` and configure `.env` for your chain
3. **Verify runtime image tag** matches the v3 contract suite under test
4. Point factory addresses at the **v3** deployment (InputBox, AuthorityFactory, QuorumFactory, ApplicationFactory, SelfHosted, DaveAppFactory)

### 3. Start services

```sh
docker compose -f compose.local.yaml up -d
```

Confirm all services healthy: advancer, validator, claimer, evm-reader, jsonrpc-api, postgres.

Set the operator CLI helper (use in all following steps):

```sh
export COMPOSE_FILE=compose.local.yaml
export EXEC="docker compose -f $COMPOSE_FILE exec advancer cartesi-rollups-cli"
```

### 4. Deploy application with v3 flags

```sh
$EXEC deploy application <name> \
  --claim-staging-period <N> \
  --withdrawal-config-file <valid-config.json>
```

Verify partial/invalid withdrawal config is rejected before any on-chain tx (ILC-008).

For quorum tests:

```sh
$EXEC deploy quorum ...
```

### 5. Register and confirm v3 fields

```sh
$EXEC contract <app>
$EXEC read epochs <app>
```

Expect `enabled`, `status`, `claim_staging_period`, `withdrawal_config`, foreclosure markers — not the old single `state` field (ILC-010).

---

## Preflight checklist (run before charters or v3 catalog blocks)

Complete in ~5–10 minutes. Stop and fix before proceeding if any step fails.

### Host and toolchain

- [ ] `docker info` succeeds
- [ ] `cartesi doctor` all green (when using `cartesi run`)
- [ ] `docker compose -f compose.local.yaml exec advancer cartesi-rollups-cli --help` succeeds (compose path)
- [ ] No zombie compose state: `docker ps` and `cartesi status` agree
- [ ] If prior session ended badly: `docker compose -p <project> down` and clean restart

### Stack health (compose)

- [ ] All node services running
- [ ] JSON-RPC responds:

```sh
curl -s -X POST http://localhost:<jsonrpc-port>/rpc \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"cartesi_getVersion","params":[],"id":1}'
```

- [ ] Application registered with v3 fields visible via `$EXEC contract <app>`

### Minimal roundtrip

- [ ] Send one advance input (`cartesi send` on host, or `$EXEC send` inside advancer)
- [ ] Input appears in `cartesi_listInputs` / `read inputs`
- [ ] After epoch close: claim progresses through staging states (Authority) or submitted → staged (Quorum)
- [ ] At least one notice or expected output for the app template

### Charter-specific gates

| Charter / lane | Extra preflight |
|----------------|-----------------|
| break-the-claimer | Compose with isolatable `claimer` service; short `claim-staging-period` for timing tests |
| stress-evm-reader | Configurable RPC/WS; ability to swap endpoints |
| misuse-the-cli | **Clean slate** — no stack running (or document intentional dirty state) |
| operator-day-two | Compose + funded testnet; guardian key ready |
| Foreclosure / withdrawal (FOR-*, SMK-005) | `erc20-withdrawal-dapp` (or equivalent); guardian + gas payer funded |

---

## End-to-end v3 demo path (smoke reference)

Canonical sequence from the contracts v3 presentation. Use as SMK-005 / FOR happy-path rehearsal.

Requires compose running and `EXEC` set (see compose setup §3). Machine-tool commands run on the **host** with rollups-node `make env` (or equivalent DB connection).

```sh
# Host: build operator + machine-tool binaries (rollups-node checkout)
make build
eval $(make env)

# Operator CLI — inside advancer container
$EXEC deploy quorum ...
$EXEC deploy application <app> \
  --claim-staging-period <N> \
  --withdrawal-config-file <config.json>

# Normal lifecycle — observe staging
$EXEC read epochs <app>
# Watch: CLAIM_SUBMITTED → CLAIM_STAGED → CLAIM_ACCEPTED

# Emergency path
$EXEC foreclose <app>          # guardian signer

# Machine tool — host (needs DB/env from eval $(make env))
cartesi-rollups-machine-tool replay \
  --template <path> \
  --application <app> \
  --to-epoch <N> \
  --store snapshots/accepted-epoch-<N>

cartesi-rollups-machine-tool prove accounts-drive \
  --snapshot snapshots/accepted-epoch-<N> \
  --account <addr> \
  --accounts-drive-start-index <hex> \
  --out-drive-root-proof drive-root-proof.json \
  --out-withdraw-proof account-proof.json

# Operator CLI again — proof files must be visible inside advancer or copied in
$EXEC prove-drive-root <app> --proof-file drive-root-proof.json
$EXEC withdraw <app> --proof-file account-proof.json
$EXEC read withdrawals <app>
```

**What to watch:**

1. Application shows `enabled`, `status`, foreclosure markers after foreclose
2. Epochs move through staged states before acceptance
3. Foreclosure stops normal claims but **not** L1 observation
4. Withdrawal rows appear only after drive root is proved
5. Second withdrawal for same account fails (single-use)

---

## Quick devnet harness (`cartesi run`)

For fast iteration on tests that do not need emergency withdrawal or the operator CLI:

```sh
cartesi create <app-name> -t javascript   # or python, etc.
cd <app-name>
cartesi build
cartesi run --epoch-length 10 -p <port>
```

| Service | URL pattern |
|---------|----------------|
| Proxy | `http://127.0.0.1:<port>` |
| Anvil RPC | `http://127.0.0.1:<port>/anvil` |
| Inspect | `http://127.0.0.1:<port>/inspect/<app-name>` |
| JSON-RPC | `http://127.0.0.1:<port>/rpc` |

Send inputs with `cartesi send` (payload format depends on your app) and confirm processing via JSON-RPC or inspect routes.

**Limitation:** all services run in one `rollups_node` container. Restarting only the claimer requires compose.

---

## Which catalog areas need which harness

| Catalog area | Harness | Notes |
|--------------|---------|-------|
| `track-a` SMK-001–004 (devnet) | `cartesi run` or compose | Any scaffolded template |
| `track-a` SMK-005–006 | Compose + testnet | Withdrawal dapp + emergency path |
| `foreclose.md` FOR-* | Compose + withdrawal dapp | Timing-sensitive; real block progression |
| `internal-cli.md` ILC-* | Compose | `$EXEC` inside advancer; not on host |
| `machine-tool.md` MTL-* | Compose + rollups-node build on host | DB access via `make env`; proofs fed back to `$EXEC` |
| `quorum.md` QUO-* | Compose + multi-validator quorum deploy | Testnet |
| `jsonrpc-api.md` JRP-* | Either | Lightweight template sufficient for many entries |
| `cli.md`, `misuse-the-cli` charter | `cartesi run` or compose | Prefer clean slate for misuse |

---

## Teardown

```sh
docker compose -p <project> down
```

For `cartesi run` stacks:

```sh
docker compose -p <app-name> down
```

For v3 alpha: prefer a **fresh database** over reusing a v2-alpha DB against the new migration. See [v3-lifecycle.md — Ops checklist](v3-lifecycle.md#ops-checklist-before-v3-deploy).

---

## Troubleshooting

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `cartesi run` prints URL then fails at compose | No machine snapshot | Run `cartesi build` first |
| `cartesi status` says down but `docker ps` shows containers | Partial compose rollback after failed run | `docker compose down`; full restart |
| Internal CLI not found on host | `cartesi-rollups-cli` is not a host binary | Run via `$EXEC …` inside advancer, or build rollups-node for local dev |
| `cartesi-rollups-cli: command not found` in advancer | Stack not up or wrong service | `docker compose ps`; exec into `advancer`, not `rollups_node` from `cartesi run` |
| Foreclose succeeds but no withdrawal rows | Drive root not proved yet | Run prove → withdraw sequence |
| `enabled`/`status` missing in API | Old node or wrong contract suite | Verify image tag and bindings version |
| Tests pass on Anvil, fail on testnet | Staging period / block timing | Increase waits; use shorter period in dev |

For deeper diagnosis, use the [cartesi-debug skill](../.agents/skills/cartesi-debug/SKILL.md).

---

## Related artifacts

| Artifact | Purpose |
|----------|---------|
| [v3-lifecycle.md](v3-lifecycle.md) | Mental model, epoch states, QA focus lanes |
| [catalog/track-b/foreclose.md](../catalog/track-b/foreclose.md) | Executable foreclosure tests |
| [catalog/track-a.md](../catalog/track-a.md) | Release smoke including SMK-005 |
| [charters/README.md](../charters/README.md) | Exploratory session guide |
