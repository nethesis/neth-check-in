
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
# python csv_loader.py <origin_file.csv> > <destination_file.sql>


import csv
import sys

sql_columns = [
    "ordine",
    "nome",
    "cognome",
    "email",
    "stato",
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
    "stato",
    "sala",
    "tipo",
    "agency",
    "id"         
]

class CSVFetcher:
    def __init__(self):
        if len(sys.argv) < 2:
            print("Fail: something wrong during the start-up phase!")
            sys.exit(1)
        self.csv_file = sys.argv[1]

    def get_csv_file(self):
        return self.csv_file

class Translator:
    def __init__(self, table_name="iscritti"):
        self.table_name = table_name

    def do_translate(self, csv_file):
        with open(csv_file, newline='', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            print(f'TRUNCATE TABLE {self.table_name};')

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
                print(sql)

f = CSVFetcher()
t = Translator(table_name="iscritti") 
t.do_translate(f.get_csv_file())