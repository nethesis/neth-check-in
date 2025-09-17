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

First, setup CodeREADr credentials as environment variables:

```bash
export CODEREADR_API_KEY=your_api_key_here
export CODEREADR_DATABASE_ID=your_database_id_here
```

The script is: `script/run_pipeline.sh` and performs these steps:

1) Merge Eventbrite + HubSpot into `nethcheckin.csv` using `eventbrite_hubspot_merge.py`
2) Generate `nethcheckin.sql` from `nethcheckin.csv` using `csv_loader.py`.
3) Automatically upload IDs to CodeREADr using `codereadr_push.py`.
4) Load the generated SQL into the running database container if available, otherwise print the command to run manually.

Run the pipeline from the project root:

```bash
script/run_pipeline.sh
```

Manual steps and safety notes:

- Verify the source CSVs are present at the default paths before running: `eventbrite.csv` and `hubspot.csv`.
- The pipeline will generate `${OUT_CSV%.*}.sql` (usually `nethcheckin.sql`). The SQL includes a `TRUNCATE TABLE iscritti;` line — back up your database before importing if needed.
- After SQL generation the script will attempt to import the `.sql` into a running container named `neth-check-in_db_1` automatically. Priority for container runtimes is: `podman` (preferred), `odman`, then `docker`.
- The CodeREADr upload will clear the remote database before importing new data.


