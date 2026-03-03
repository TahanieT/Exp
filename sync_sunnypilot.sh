#!/usr/bin/env bash
# sync_sunnypilot.sh — keep the AT4 2021 branch current with sunnypilot
#
# Usage:
#   ./sync_sunnypilot.sh              # fetch + rebase, leave working tree
#   ./sync_sunnypilot.sh --push       # also push to origin after rebase
#   ./sync_sunnypilot.sh --check      # just show what has changed upstream
#
# Remotes expected:
#   origin       → TahanieT/Exp  (this repo)
#   sunnypilot   → https://github.com/sunnyhaibin/sunnypilot.git
#   sunnypilot-opendbc → https://github.com/sunnypilot/opendbc.git

set -euo pipefail

BRANCH="claude/add-gmc-at4-2021-1cyax"
SP_REMOTE="sunnypilot"
SP_BRANCH="master"
OPENDBC_REMOTE="sunnypilot-opendbc"
OPENDBC_BRANCH="master"

# ── helpers ────────────────────────────────────────────────────────────────
log()  { echo "[sync] $*"; }
die()  { echo "[sync] ERROR: $*" >&2; exit 1; }

# ── ensure remotes exist ───────────────────────────────────────────────────
ensure_remote() {
  local name=$1 url=$2
  if ! git remote get-url "$name" &>/dev/null; then
    log "Adding remote $name → $url"
    git remote add "$name" "$url"
  fi
}

ensure_remote sunnypilot          "https://github.com/sunnyhaibin/sunnypilot.git"
ensure_remote sunnypilot-opendbc  "https://github.com/sunnypilot/opendbc.git"

# ── check mode ────────────────────────────────────────────────────────────
if [[ "${1:-}" == "--check" ]]; then
  log "Fetching $SP_REMOTE/$SP_BRANCH …"
  git fetch "$SP_REMOTE" "$SP_BRANCH"
  log "Fetching $OPENDBC_REMOTE/$OPENDBC_BRANCH …"
  git fetch "$OPENDBC_REMOTE" "$OPENDBC_BRANCH"

  log ""
  log "── sunnypilot GM changes since last sync ──────────────────────────"
  git log "$SP_REMOTE/$SP_BRANCH" --oneline -- selfdrive/car/ | head -20 || true

  log ""
  log "── opendbc GM changes since last sync ─────────────────────────────"
  git log "$OPENDBC_REMOTE/$OPENDBC_BRANCH" --oneline -- opendbc/car/gm/ | head -20 || true
  exit 0
fi

# ── fetch upstreams ────────────────────────────────────────────────────────
log "Fetching $SP_REMOTE/$SP_BRANCH …"
git fetch "$SP_REMOTE" "$SP_BRANCH"

log "Fetching $OPENDBC_REMOTE/$OPENDBC_BRANCH …"
git fetch "$OPENDBC_REMOTE" "$OPENDBC_BRANCH"

# ── show what changed in GM files ─────────────────────────────────────────
log ""
log "── upstream GM changes (opendbc) ──────────────────────────────────"
git log "HEAD...$OPENDBC_REMOTE/$OPENDBC_BRANCH" --oneline -- opendbc/car/gm/ 2>/dev/null | head -20 || true
log ""

# ── apply the AT4 patch onto current branch ───────────────────────────────
log "Applying AT4 patch …"
if git apply --check patches/gmc_at4_2021_sunnypilot_opendbc.patch 2>/dev/null; then
  git apply patches/gmc_at4_2021_sunnypilot_opendbc.patch
  log "Patch applied cleanly."
else
  log "Patch does not apply cleanly — manual merge required."
  log "Compare opendbc/car/gm/{values,interface,fingerprints}.py against the patch."
  exit 1
fi

# ── optional push ─────────────────────────────────────────────────────────
if [[ "${1:-}" == "--push" ]]; then
  log "Pushing $BRANCH to origin …"
  git push -u origin "$BRANCH"
fi

log "Done."
