#!/usr/bin/env python3
"""
eventbrite_hubspot_merge.py

Purpose:
  Merge Eventbrite attendee export with HubSpot contacts export to produce a normalized
  CSV compatible with csv_loader.py (ordine,nome,cognome,email,sala,tipo,agency,id).

Logic:
  - Read Eventbrite CSV and extract required fields mapping:
       Eventbrite -> Output
       "Ordine n."        -> ordine
       "Nome"             -> nome
       "Cognome"          -> cognome
       "E-mail"           -> email
       "Scegli la Sala di Approfondimento" or fallback "Seleziona la sala di tuo interesse" -> sala
       "Azienda"          -> agency (if empty fallback to "Nome azienda" from HubSpot when available)
       "Partecipante n."  -> id  (if empty it tries to use tax-like field or composed surrogate)
  - HubSpot CSV used only to determine type ("tipo") and optionally fill missing agency:
       If email (case-insensitive) exists in HubSpot rows and hubspot property "Tipo Lead AC" equals "Prospect" (case-insensitive), set tipo = "Prospect" else "Partner".
       If email exists in HubSpot and Eventbrite agency empty, try HubSpot "Nome azienda".
  - If HubSpot email not present at all, default tipo = "Partner".

CLI:
  python eventbrite_hubspot_merge.py --eventbrite eb.csv --hubspot hs.csv --out merged.csv

Defaults:
  Output file defaults to eventbrite filename with suffix _merged.csv if --out not provided.

Assumptions:
  - Input CSVs are UTF-8 (with ignore errors fallback) and have headers.
  - Eventbrite export header names as provided in the example (Italian localization).
  - HubSpot export header names align with given example quotes.

Exit Codes:
  0 success
  1 validation / usage error

"""
from __future__ import annotations
import csv
import os
import sys
import argparse
import logging
from typing import Dict, List, Tuple, Optional

REQUIRED_EVENTBRITE_FIELDS = ["Ordine n.", "Nome", "Cognome", "E-mail", "Partecipante n."]
HUBSPOT_EMAIL_FIELD = "E-mail"
HUBSPOT_TYPE_FIELD = "Tipo Lead AC"
HUBSPOT_COMPANY_FIELD = "Nome azienda"

OUTPUT_COLUMNS = ["ordine","nome","cognome","email","sala","tipo","agency","id"]

EVENTBRITE_SALA_FIELDS = [
    "Scegli la Sala di Approfondimento",
    "Seleziona la sala di tuo interesse",
]

# Mapping of verbose schedule descriptions to standardized room labels
SALA_REMAP = {
    # Exact strings provided by user -> normalized names
    "Sala B (ore 14.30 NethSecurity8, ore 15.30 NS8+NethService, ore 16.30 NethVoice)": "Sala Castello 1",
    "Sala C (ore 14.30 NS8+NethService, ore 15.30 NethVoice, ore 16.30 NethSecurity8)": "Sala Castello 2",
    "Sala D (ore 14.30 NethVoice, ore 15.30 NethSecurity8, ore 16.30 NS8+NethService)": "Sala Arco",
}


def parse_args(argv: List[str]) -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Merge Eventbrite and HubSpot CSVs into normalized attendees CSV.")
    p.add_argument("--eventbrite", default="eventbrite.csv", help="Eventbrite export CSV path (default: eventbrite.csv)")
    p.add_argument("--hubspot", default="hubspot.csv", help="HubSpot contacts export CSV path (default: hubspot.csv)")
    p.add_argument("--out", help="Output CSV path (default: <eventbrite_basename>_merged.csv)")
    p.add_argument("--verbose", action="store_true", help="Verbose logging")
    return p.parse_args(argv)


def setup_logging(verbose: bool):
    logging.basicConfig(level=logging.DEBUG if verbose else logging.INFO, format='[%(levelname)s] %(message)s')


def load_hubspot(path: str) -> Dict[str, Dict[str,str]]:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"HubSpot CSV not found: {path}")
    hs: Dict[str, Dict[str,str]] = {}
    with open(path, newline='', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        for row in reader:
            email = (row.get(HUBSPOT_EMAIL_FIELD) or '').strip().lower()
            if not email:
                continue
            hs[email] = row
    logging.info("Loaded %d HubSpot contacts", len(hs))
    return hs


def choose_sala(row: Dict[str,str]) -> str:
    for field in EVENTBRITE_SALA_FIELDS:
        val = (row.get(field) or '').strip()
        if val:
            return val
    return ''


def derive_tipo(hs_row: Optional[Dict[str,str]]) -> str:
    if not hs_row:
        return "Partner"
    tipo_lead = (hs_row.get(HUBSPOT_TYPE_FIELD) or '').strip().lower()
    if tipo_lead == 'prospect':
        return "Prospect"
    # treat other types as Partner (could extend logic)
    return "Partner"


def load_eventbrite(path: str) -> Tuple[List[Dict[str,str]], List[str]]:
    if not os.path.isfile(path):
        raise FileNotFoundError(f"Eventbrite CSV not found: {path}")
    with open(path, newline='', encoding='utf-8', errors='ignore') as f:
        reader = csv.DictReader(f)
        headers = reader.fieldnames or []
        missing = [f for f in REQUIRED_EVENTBRITE_FIELDS if f not in headers]
        if missing:
            logging.warning("Missing expected Eventbrite fields: %s (continuing)", missing)
        rows = list(reader)
    logging.info("Loaded %d Eventbrite rows", len(rows))
    return rows, headers


def build_output_rows(eb_rows: List[Dict[str,str]], hs_index: Dict[str,Dict[str,str]]) -> Tuple[List[Dict[str,str]], int]:
    out: List[Dict[str,str]] = []
    missing_sala = 0
    for r in eb_rows:
        ordine = (r.get("Ordine n.") or '').strip()
        nome = (r.get("Nome") or '').strip()
        cognome = (r.get("Cognome") or '').strip()
        email = (r.get("E-mail") or '').strip()
        sala_raw = choose_sala(r)
        sala = SALA_REMAP.get(sala_raw, sala_raw)
        # Additional rule: if attendee indicated participation in afternoon session set sala to Sala Piazza
        afternoon_field = "Parteciperò alla sessione pomeridiana | 10 ottobre"
        afternoon_value = (r.get(afternoon_field) or '').strip()
        if afternoon_value == afternoon_field:
            sala = "Sala Piazza"
        if sala == '':
            missing_sala += 1
            if not sala_raw:
                logging.debug("Attendee '%s %s' (%s) has empty 'sala' field", nome, cognome, email)
            else:
                logging.warning("Attendee '%s %s' (%s) has empty 'sala' field. Original sala was: %s", nome, cognome, email, sala_raw)
        agency = (r.get("Azienda") or '').strip()
        eid = (r.get("Partecipante n.") or '').strip()
        hs_row = hs_index.get(email.lower()) if email else None
        tipo = derive_tipo(hs_row)
        if not agency and hs_row:
            agency = (hs_row.get(HUBSPOT_COMPANY_FIELD) or '').strip()
        if not eid:
            # fallback: compose surrogate id if missing
            eid = f"{ordine}-{email}" if ordine and email else ordine or email or ''
        out.append({
            'ordine': ordine,
            'nome': nome,
            'cognome': cognome,
            'email': email,
            'sala': sala,
            'tipo': tipo,
            'agency': agency,
            'id': eid,
        })
    return out, missing_sala


def write_output(rows: List[Dict[str,str]], path: str):
    with open(path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_COLUMNS)
        writer.writeheader()
        for row in rows:
            writer.writerow(row)
    logging.info("Wrote %d rows to %s", len(rows), path)


def main(argv: List[str]) -> int:
    args = parse_args(argv)
    setup_logging(args.verbose)

    try:
        hs_index = load_hubspot(args.hubspot)
        eb_rows, _ = load_eventbrite(args.eventbrite)
    except Exception as e:
        logging.error(e)
        return 1

    out_rows, missing_sala = build_output_rows(eb_rows, hs_index)
    out_path = args.out
    if not out_path:
        out_path = "nethcheckin.csv"

    logging.info("Attendees without sala: %d", missing_sala)
    try:
        write_output(out_rows, out_path)
    except Exception as e:
        logging.error("Failed writing output: %s", e)
        return 1

    return 0


if __name__ == '__main__':  # pragma: no cover
    sys.exit(main(sys.argv[1:]))
