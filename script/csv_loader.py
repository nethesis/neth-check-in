#!/usr/bin/env python3

# Description:
#  This script reads a CSV file containing data for the `iscritti` table
#  and automatically generates SQL INSERT statements to populate the table
#  in the `nethcheckin` database.
#
# How it works:
#  - The script outputs a series of INSERT statements compatible with the table.
#  - Numeric values are inserted without quotes, while text values are wrapped
#    in single quotes and any internal single quotes are automatically escaped.
#
# How to Run:
#  Basic (auto input/output):
#    python csv_loader.py              # reads ./nethcheckin.csv by default and writes ./nethcheckin.sql
#  Provide a custom input file (and optional output):
#    python csv_loader.py <origin_file.csv> [destination_file.sql]
#
#  Previous shell redirection still works but is no longer required.


import csv
import sys
import os

sql_columns = [
    "ordine",
    "nome",
    "cognome",
    "email",
    "sala",
    "tipo",
    "agency",
    "cod_partecipante"
]

csv_columns = [
    "ordine",       
    "nome",
    "cognome",
    "email",
    "sala",
    "tipo",
    "agency",
    "id"         
]

class CSVFetcher:
    def __init__(self):
        # Default input filename when none provided
        default_csv = 'nethcheckin.csv'
        if len(sys.argv) < 2:
            self.csv_file = default_csv
            print(f"No input file specified, using default: {self.csv_file}")
        else:
            self.csv_file = sys.argv[1]

        if not os.path.isfile(self.csv_file):
            print(f"Input file not found: {self.csv_file}")
            sys.exit(1)

        # Determine output path
        if len(sys.argv) >= 3:
            self.out_file = sys.argv[2]
        else:
            base, ext = os.path.splitext(self.csv_file)
            if ext.lower() == '.csv':
                self.out_file = base + '.sql'
            else:
                self.out_file = self.csv_file + '.sql'

    def get_csv_file(self):
        return self.csv_file

    def get_out_file(self):
        return self.out_file

class Translator:
    def __init__(self, table_name="iscritti"):
        self.table_name = table_name

    def do_translate(self, csv_file, out_file):
        with open(csv_file, newline='', encoding='utf-8', errors='ignore') as f, \
             open(out_file, 'w', encoding='utf-8') as out:
            reader = csv.DictReader(f)
            out.write(f'TRUNCATE TABLE {self.table_name};\n')

            for row in reader:
                values = []
                for col in csv_columns:
                    value = row.get(col, "")
                    if value is None:
                        value = ""
                    if col == "id":
                        if value.isdigit():
                            values.append(value)
                        else:
                            value = value.replace("'", "''")
                            values.append(f"'{value}'")
                    else:
                        value = value.replace("'", "''")
                        values.append(f"'{value}'")

                sql = f"INSERT INTO {self.table_name} ({', '.join(sql_columns)}) VALUES ({', '.join(values)});"
                out.write(sql + '\n')

        print(f"Written SQL statements to {out_file}")

def main():
    f = CSVFetcher()
    t = Translator(table_name="iscritti")
    t.do_translate(f.get_csv_file(), f.get_out_file())

if __name__ == '__main__':
    main()