#!/usr/bin/env python3
"""
codereadr_push.py

Purpose:
  Convert an internal attendees CSV (fields: ordine,nome,cognome,email,stato,sala,tipo,agency,id)
  into a CodeREADr database CSV with 3 columns: value,response,validity and push it to CodeREADr.

Workflow:
  1. Read source CSV and validate required columns.
  2. Build a temporary CSV (or specified output) containing rows:
       id, "Contatto salvato", 1
     Header used: value,response,validity (their documented order; 'value' is the barcode/value id).
  3. (Default) Clear the remote database via API (section=databases, action=clear).
  4. Upload the CSV via multipart/form-data (section=databases, action=upload).

CLI:
  python codereadr_push.py source.csv --database-id 12345 --api-key XXXXX

Environment fallbacks:
  CODEREADR_API_KEY
  CODEREADR_DATABASE_ID

Arguments precedence: CLI > Environment. Both must be available.

Flags:
  --out FILE          Write the generated CSV to FILE (kept after run). If omitted a temp file is used.
  --no-clear          Skip clearing the database before upload.
  --dry-run           Do not call the API; only build (and optionally keep) the output CSV.
  --verbose           Extra logging to stderr.

Exit codes:
  0 success
  1 usage / validation error
  2 API failure

Dependencies: only standard library + optional 'requests' (preferred). If 'requests' is missing, fallback to urllib for upload.

References:
  Clear DB: https://secure.codereadr.com/apidocs/Databases.md#clear
  Upload CSV: https://secure.codereadr.com/apidocs/Databases.md#upload
"""
from __future__ import annotations

import argparse
import csv
import os
import sys
import tempfile
import logging
import xml.etree.ElementTree as ET
from typing import Iterable, List, Tuple

try:
    import requests  # type: ignore
except Exception:  # pragma: no cover
    requests = None  # fallback later

API_URL = "https://api.codereadr.com/api/"
REQUIRED_INPUT_COLUMNS = [
    "ordine", "nome", "cognome", "email", "sala", "tipo", "agency", "id"
]
OUTPUT_HEADER = ["value", "response", "validity"]  # CodeREADr expected
STATIC_RESPONSE = "Contatto salvato"
STATIC_VALIDITY = "1"


def parse_args(argv: List[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Push attendees CSV to CodeREADr database.")
    p.add_argument("source_csv", help="Input CSV containing attendee data.")
    p.add_argument("--api-key", dest="api_key", help="CodeREADr API key (or CODEREADR_API_KEY env).")
    p.add_argument("--database-id", dest="database_id", help="Target database id (or CODEREADR_DATABASE_ID env).")
    p.add_argument("--out", dest="out_csv", help="Write intermediate CodeREADr-ready CSV to this path.")
    p.add_argument("--no-clear", action="store_true", help="Do not clear remote database before upload.")
    p.add_argument("--dry-run", action="store_true", help="Only build CSV; skip API calls.")
    p.add_argument("--verbose", action="store_true", help="Verbose logging.")
    return p.parse_args(argv)


def setup_logging(verbose: bool):
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(level=level, format="[%(levelname)s] %(message)s")


def read_and_validate_ids(path: str) -> List[str]:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Input CSV not found: {path}")
    with open(path, newline='', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        missing = [c for c in REQUIRED_INPUT_COLUMNS if c not in (reader.fieldnames or [])]
        if missing:
            raise ValueError(f"Missing required columns: {missing}; found: {reader.fieldnames}")
        ids: List[str] = []
        for row in reader:
            val = (row.get("id") or "").strip()
            if not val:
                logging.warning("Skipping row with empty id: %s", row)
                continue
            ids.append(val)
        if not ids:
            raise ValueError("No valid ids extracted from input CSV.")
        return ids


def write_output_csv(ids: Iterable[str], out_path: str) -> str:
    with open(out_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(OUTPUT_HEADER)
        for _id in ids:
            writer.writerow([_id, STATIC_RESPONSE, STATIC_VALIDITY])
    logging.info("Wrote %s", out_path)
    return out_path


def api_clear(database_id: str, api_key: str) -> None:
    data = {
        "section": "databases",
        "action": "clear",
        "api_key": api_key,
        "database_id": database_id,
    }
    logging.info("Clearing database %s", database_id)
    resp_text = _post_form(data)
    _assert_status_ok(resp_text, context="clear")
    logging.info("Database cleared.")


def api_upload(database_id: str, api_key: str, csv_path: str) -> None:
    logging.info("Uploading %s to database %s", csv_path, database_id)
    if requests:  # preferred path
        with open(csv_path, 'rb') as fh:
            files = {"csvfile": (os.path.basename(csv_path), fh, 'text/csv')}
            data = {"section": "databases", "action": "upload", "api_key": api_key, "database_id": database_id}
            r = requests.post(API_URL, data=data, files=files, timeout=60)
            resp_text = r.text
    else:  # pragma: no cover - simple fallback
        import urllib.request
        import uuid
        boundary = f"----WebKitFormBoundary{uuid.uuid4().hex}"
        body_parts: List[bytes] = []
        def add_field(name: str, value: str):
            body_parts.append(f"--{boundary}\r\n".encode())
            body_parts.append(f"Content-Disposition: form-data; name=\"{name}\"\r\n\r\n{value}\r\n".encode())
        for k, v in [("section","databases"),("action","upload"),("api_key",api_key),("database_id",database_id)]:
            add_field(k, v)
        with open(csv_path, 'rb') as fh:
            body_parts.append(f"--{boundary}\r\n".encode())
            body_parts.append(f"Content-Disposition: form-data; name=\"csvfile\"; filename=\"{os.path.basename(csv_path)}\"\r\n".encode())
            body_parts.append(b"Content-Type: text/csv\r\n\r\n")
            body_parts.append(fh.read())
            body_parts.append(b"\r\n")
        body_parts.append(f"--{boundary}--\r\n".encode())
        body = b"".join(body_parts)
        req = urllib.request.Request(API_URL, data=body, method='POST')
        req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
        with urllib.request.urlopen(req, timeout=60) as rf:
            resp_text = rf.read().decode()
    _assert_status_ok(resp_text, context="upload")
    logging.info("Upload completed.")


def _post_form(data: dict) -> str:
    if requests:
        r = requests.post(API_URL, data=data, timeout=30)
        return r.text
    # fallback
    import urllib.request
    import urllib.parse
    encoded = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(API_URL, data=encoded, method='POST')
    with urllib.request.urlopen(req, timeout=30) as rf:
        return rf.read().decode()


def _assert_status_ok(resp_text: str, context: str):
    try:
        root = ET.fromstring(resp_text.strip())
        status_el = root.find('status')
        if status_el is None or status_el.text != '1':
            raise ValueError
    except Exception:
        logging.error("API %s failed. Raw response: %s", context, resp_text)
        raise SystemExit(2)


def main(argv: List[str]):
    args = parse_args(argv)
    setup_logging(args.verbose)

    api_key = args.api_key or os.getenv('CODEREADR_API_KEY')
    database_id = args.database_id or os.getenv('CODEREADR_DATABASE_ID')

    if not api_key or not database_id:
        logging.error("API key and database id required (args or environment).")
        return 1

    try:
        ids = read_and_validate_ids(args.source_csv)
    except Exception as e:
        logging.error(str(e))
        return 1

    # Prepare output CSV
    if args.out_csv:
        out_path = args.out_csv
    else:
        tmp_fd, out_path = tempfile.mkstemp(prefix="codereadr_", suffix=".csv")
        os.close(tmp_fd)
    try:
        write_output_csv(ids, out_path)
    except Exception as e:
        logging.error("Failed writing output CSV: %s", e)
        return 1

    if args.dry_run:
        logging.info("Dry run complete. Output CSV at %s", out_path)
        return 0

    try:
        if not args.no_clear:
            api_clear(database_id, api_key)
        api_upload(database_id, api_key, out_path)
    except SystemExit:
        return 2
    except Exception as e:  # unexpected
        logging.error("Unexpected error: %s", e)
        return 2

    logging.info("Done.")
    return 0


if __name__ == "__main__":  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
