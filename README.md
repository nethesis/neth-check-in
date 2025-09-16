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