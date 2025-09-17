#!/usr/bin/env bash
# Small pipeline to run the full import flow using default filenames
# - merge Eventbrite + HubSpot -> nethcheckin.csv
# - generate SQL from nethcheckin.csv -> nethcheckin.sql
# - (optional) upload IDs to CodeREADr from nethcheckin.csv

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$ROOT_DIR/script"

EB_FILE="$ROOT_DIR/eventbrite.csv"
HS_FILE="$ROOT_DIR/hubspot.csv"
OUT_CSV="$ROOT_DIR/nethcheckin.csv"

echo "Running Eventbrite + HubSpot merge -> $OUT_CSV"
python3 "$SCRIPT_DIR/eventbrite_hubspot_merge.py" --eventbrite "$EB_FILE" --hubspot "$HS_FILE" --out "$OUT_CSV"

echo
echo "Generating SQL from $OUT_CSV"
python3 "$SCRIPT_DIR/csv_loader.py" "$OUT_CSV"

echo "Pushing IDs to CodeREADr from $OUT_CSV."
# Require environment variables for CodeREADr credentials (fail early if missing)
if [ -z "${CODEREADR_API_KEY:-}" ] || [ -z "${CODEREADR_DATABASE_ID:-}" ]; then
	echo "Upload failed: CODEREADR_API_KEY and CODEREADR_DATABASE_ID must be set in the environment to perform the upload." >&2
else
	python3 "$SCRIPT_DIR/codereadr_push.py" "$OUT_CSV"
	echo "Upload finished. Check script output for status."
fi


SQL_FILE="${OUT_CSV%.*}.sql"
# Attempt to automatically import into the running DB container named 'neth-check-in_db_1'.
# Priority: podman -> odman -> docker. If the container is running we execute the import, otherwise we print the command.
CONTAINER_NAME="neth-check-in_db_1"
RUNNER=""

if command -v podman >/dev/null 2>&1; then
	RUNNER="podman"
elif command -v docker >/dev/null 2>&1; then
	RUNNER="docker"
fi

if [ -n "$RUNNER" ]; then
	echo "Detected runtime: $RUNNER"
	# Check if the container is running
	if $RUNNER ps --format '{{.Names}}' 2>/dev/null | grep -xq "$CONTAINER_NAME"; then
		echo "Container $CONTAINER_NAME is running under $RUNNER — importing SQL now."
		# Execute the import via the detected runtime (non-interactive)
		$RUNNER exec -i "$CONTAINER_NAME" mysql --default-character-set=utf8 -u nethcheckin -pnethcheckin nethcheckin < "$SQL_FILE"
		echo "Import finished (executed with $RUNNER)."
	else
		echo "Container $CONTAINER_NAME is not running under $RUNNER. To import manually, run:" 
		echo "  $RUNNER exec -i $CONTAINER_NAME mysql --default-character-set=utf8 -u nethcheckin -pnethcheckin nethcheckin < $SQL_FILE"
	fi
    echo
    echo "Done."
else
	echo "Neither podman nor docker found. Import the SQL manually with a MySQL client or in your container runtime."
    echo "A MANUAL step is REQUIRED!"
    echo "Import the SQL file $SQL_FILE into your MySQL instance using one of the following methods:"
    echo
    echo "  1) CLI:  mysql --default-character-set=utf8 -u nethcheckin -pnethcheckin nethcheckin < $SQL_FILE"
    echo "  2) GUI: use phpMyAdmin (http://localhost:8081) to import the file $SQL_FILE"
fi

