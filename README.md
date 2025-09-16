## Neth Check-in

Client and Server for Nethesis partner meeting badges 2017

The software can be run both with docker-compose in rootfull mode and podman-compose in rootless mode.

### Using podman-compose

Podman compose will run the containers in rootless mode, so you need to have podman and podman-compose installed.

To run with podman-compose:
```bash
podman-compose up -d
```

To stop and remove containers:
```bash
podman-compose down
```

### Using docker-compose

Docker will run the containers in rootfull mode, so you need to have docker and docker-compose installed.

To run with docker-compose:
```bash
docker-compose up -d
```

To stop and remove containers:
```bash
docker-compose down
```

If the database does not run, you may need to add the following inside the docker-composer:
```
ulimits:
  nofile: 1048576
```

Note: this will not work with podman-compose.

### Application access

The compose will expose the following service:
- Web UI: http://localhost:8888, websocket port: 35729
- Server: http://localhost:8080
- PHPMyAdmin: http://localhost:8081
- Printer driver: http://



### End-to-end: loading data (Eventbrite -> DB -> CodeREADr)

Follow these steps to import attendees exported from Eventbrite and keep both the local MySQL database and the CodeREADr database in sync for the sponsor mobile app:

1. Export CSV from Eventbrite

  - In Eventbrite, export the attendee list to CSV.
  - Open the CSV in a spreadsheet editor and remove any extra columns not required by our processing (we expect the following header names):

```
ordine,nome,cognome,email,stato,sala,tipo,agency,id
```

  - Save the cleaned file to a canonical path used for imports, e.g. `data/iscritti_import.csv`.

2. Create SQL using `csv_loader.py` and upload to phpMyAdmin

  - From the project root run:

```bash
python3 script/csv_loader.py data/iscritti_import.csv
```

  - This will create `data/iscritti_import.sql` next to the CSV file. Open phpMyAdmin (default: http://localhost:8081), select the `nethcheckin` database and import the generated `.sql` file. The script will emit a `TRUNCATE TABLE iscritti;` followed by `INSERT` statements, so the table will be replaced with the new import.

3. Push the same IDs to CodeREADr for the sponsor mobile app

  - Ensure to retrieve your CodeREADr API key and database id from your CodeREADr account.

  - Use the cleaned CSV that was used to generate the SQL and run:

```bash
python3 script/codereadr_push.py --database-id 1326835 --api-key YOUR_KEY data/iscritti_import.csv
```

  - By default the script clears the remote database and uploads the generated CSV mapping each `id` to response `Contatto salvato` and validity `1`. Use `--no-clear` to preserve existing values or `--dry-run` to preview the generated CSV only.

Notes:
 - Keep a copy of the original Eventbrite export if you need to audit fields later.
 - The import process will replace the `iscritti` table contents; make backups of your DB if needed.
 - If you manage large exports (>10k rows) consider using the `is_deferred` upload option via the CodeREADr API - the current script uses the synchronous upload endpoint.

#### csv_loader.py

To populate the database it is better to run the following Python script, located in the `script` package.
The script takes a CSV file ad builds a `.sql` file containing all the `INSERT` statements you need to later upload into phpMyAdmin.

From a terminal, go into the `script` folder and run:
```bash
python3 csv_loader.py path/to/your_file.csv
```
This will create `path/to/your_file.sql` automatically next to the source file.

Optionally specify a custom output filename:
```bash
python3 csv_loader.py path/to/your_file.csv custom_output.sql
```
Legacy shell redirection still works but is no longer required.

#### codereadr_push.py

If you need to synchronize attendee IDs to a CodeREADr database you can use `codereadr_push.py`.

Source CSV required columns (header names exactly):
```
ordine,nome,cognome,email,stato,sala,tipo,agency,id
```

The script builds a temporary (or specified) CSV with the 3 fields expected by CodeREADr (`value,response,validity`) mapping each `id` to a static response "Contatto salvato" and validity `1`, then (optionally) clears the remote database and uploads the CSV.

Environment variables (fallback if flags are omitted):
```
CODEREADR_API_KEY
CODEREADR_DATABASE_ID
```

Basic usage:
```bash
python3 codereadr_push.py attendees.csv --database-id 12345 --api-key YOUR_KEY
```

Keep generated CSV and skip clearing:
```bash
python3 codereadr_push.py attendees.csv --out export_codereadr.csv --no-clear --api-key YOUR_KEY --database-id 12345
```

Dry run (build CSV only, no API calls):
```bash
python3 codereadr_push.py attendees.csv --dry-run --out preview.csv
```

Run with environment variables:
```bash
export CODEREADR_API_KEY=YOUR_KEY
export CODEREADR_DATABASE_ID=12345
python3 codereadr_push.py attendees.csv
```

Additional flags:
- `--verbose` for extra logging
- `--no-clear` to avoid deleting existing values before upload
- `--dry-run` to generate the CSV only

### Scripts: defaults and behavior

This project includes several helper scripts in the `script/` folder. Below are the current defaults and important behaviors added recently.

- `script/csv_loader.py`
  - Purpose: convert a normalized attendees CSV into a `.sql` file of INSERTs for the `iscritti` table.
  - New default behavior: when no input filename is supplied the script will use `./nethcheckin.csv` and write `./nethcheckin.sql`.
  - Usage examples:
    - Default file: `python3 script/csv_loader.py` (reads `nethcheckin.csv`)
    - Custom input/output: `python3 script/csv_loader.py path/to/input.csv custom_output.sql`
  - Notes: The script writes `TRUNCATE TABLE iscritti;` followed by INSERTs. Back up your DB if needed.

- `script/eventbrite_hubspot_merge.py`
  - Purpose: merge an Eventbrite export and a HubSpot contacts export into the normalized CSV expected by `csv_loader.py`.
  - Defaults: `--eventbrite` defaults to `eventbrite.csv`, `--hubspot` defaults to `hubspot.csv`, and `--out` defaults to `nethcheckin.csv` when omitted.
  - Sala remapping rules applied automatically (examples from the most recent event):
    - `Sala B (ore 14.30 NethSecurity8, ore 15.30 NS8+NethService, ore 16.30 NethVoice)` -> `Sala Castello 1`
    - `Sala C (ore 14.30 NS8+NethService, ore 15.30 NethVoice, ore 16.30 NethSecurity8)` -> `Sala Castello 2`
    - `Sala D (ore 14.30 NethVoice, ore 15.30 NethSecurity8, ore 16.30 NS8+NethService)` -> `Sala Arco`
    - If the Eventbrite field `Parteciperò alla sessione pomeridiana | 10 ottobre` is set to the same string, the script maps the attendee to `Sala Piazza`.
  - The script will attempt to set `tipo` to `Prospect` when the attendee email exists in the HubSpot export and the HubSpot `Tipo Lead AC` property equals `Prospect`. Otherwise `tipo` is `Partner`.
  - The script logs and prints the number of attendees that ended up without a `sala` (useful for manual cleanup).

- `script/codereadr_push.py`
  - Purpose: convert the normalized CSV into the CodeREADr import format and upload it to a CodeREADr database.
  - Defaults and behavior: when no `--out` is provided the script writes a temp file. It clears the remote database by default (use `--no-clear`), and supports `--dry-run` and `--verbose`.
  - Provide credentials either via `--api-key` / `--database-id` or via environment variables `CODEREADR_API_KEY` and `CODEREADR_DATABASE_ID`.


### Run pipeline: one script to run the common flow

A convenience bash script is provided to run the common sequence using the default filenames (placed in the project root):

- Eventbrite export: `eventbrite.csv` (this should be exported manually from Eventbrite)
- HubSpot export: `hubspot.csv` (this should be exported manually from HubSpot)
- Merged normalized CSV produced: `nethcheckin.csv`
- SQL produced: `nethcheckin.sql`

The script is: `script/run_pipeline.sh` and performs these steps:

1) Merge Eventbrite + HubSpot into `nethcheckin.csv` using `eventbrite_hubspot_merge.py`
2) Generate `nethcheckin.sql` from `nethcheckin.csv` using `csv_loader.py`.
3) Automatically upload IDs to CodeREADr using `codereadr_push.py` (the script runs the upload non-interactively by default). You can change this behavior by calling `codereadr_push.py` manually with `--no-clear` or `--dry-run`.

Run the pipeline from the project root:

```bash
script/run_pipeline.sh
```

Manual steps and safety notes:

- Verify the source CSVs are present at the default paths before running: `eventbrite.csv` and `hubspot.csv`.
- The pipeline will generate `${OUT_CSV%.*}.sql` (usually `nethcheckin.sql`). The SQL includes a `TRUNCATE TABLE iscritti;` line — back up your database before importing if needed.
- After SQL generation the script will attempt to import the `.sql` into a running container named `neth-check-in_db_1` automatically. Priority for container runtimes is: `podman` (preferred), `odman`, then `docker`.
- If such container is running the script executes (for example via podman):

```bash
podman exec -i neth-check-in_db_1 mysql -u nethcheckin -pnethcheckin nethcheckin < nethcheckin.sql
```

- If the container is not running, the script prints the command you can run manually using the detected runtime (or a plain mysql client).
- The CodeREADr upload will clear the remote database by default. Provide credentials via environment variables or flags:

```bash
export CODEREADR_API_KEY=YOUR_KEY
export CODEREADR_DATABASE_ID=12345
```

- If you prefer to skip the interactive confirmation and run the CodeREADr upload with flags, call `codereadr_push.py` directly:

```bash
python3 script/codereadr_push.py nethcheckin.csv --database-id 12345 --api-key YOUR_KEY --no-clear
```

If you'd like, I can also add a non-interactive mode to `run_pipeline.sh` (for CI or unattended runs) that accepts a `--yes`/`--no-upload` flag — tell me if you want that.


