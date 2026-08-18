#!/usr/bin/env bash
#
# Convert an old game.db (SQLite file from the Express/VPS version) into a
# column-named SQL file that can be loaded into Cloudflare D1.
#
#   ./scripts/export-to-d1.sh /path/to/game.db > d1-data.sql
#
# Then load it (run the schema first so the tables exist):
#   npm run db:migrate:remote                                  # creates tables
#   npx wrangler d1 execute flappy-cat-db --remote --file=./d1-data.sql
#
# Why column-named INSERTs: the old player_inventory grew via ALTER TABLE, so
# its physical column order differs from schema.sql (updated_at is mid-table).
# Naming every column (and using quote() for escaping) makes the import
# order-independent and safe. Sessions are intentionally skipped (ephemeral).

set -euo pipefail

DB="${1:?usage: export-to-d1.sh <path-to-game.db>}"

emit() {
  local table="$1" cols="$2"
  # Turn "a,b,c" into "quote(a)||','||quote(b)||','||quote(c)".
  local sel
  sel="quote(${cols//,/)||','||quote(})"
  sqlite3 "$DB" \
    "SELECT 'INSERT OR REPLACE INTO $table ($cols) VALUES ('||$sel||');' FROM $table;"
}

emit users              "id,username,password_hash,salt,created_at"
emit players            "id,name,wallet,created_at"
emit leaderboard        "id,player_name,score,created_at"
emit high_scores        "id,score_type,score,updated_at"
emit player_inventory   "id,player_name,magnet_rounds_left,mini_nuke_count,nuke_count,gold_nuke_count,gold_magnet_rounds_left,ghost_shroom_count,energy_cape_rounds_left"
emit player_high_scores "id,player_name,high_score,updated_at"
emit player_colors      "id,player_name,selected_color,updated_at"
