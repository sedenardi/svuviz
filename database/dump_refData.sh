#!/bin/bash

if [ $# -lt 3 ];
then
  echo "Usage: $(basename $0) <DB_HOST> <DB_USER> <DB_NAME> [<DB_PASS>]" && exit 1
fi

if [ $# -eq 3 ];
then
  echo -n "DB password: "
  read -s DB_pass
else
  DB_pass=$4
fi

DB_host=$1
DB_user=$2
DB=$3

echo
echo "Dumping ref data tables for database '$DB'"

> $DB/RefData.sql

while read t
do
  echo "Dumping table data: $t"
  mysqldump --compact --no-create-info --extended-insert -h $DB_host -u $DB_user -p$DB_pass $DB $t |
    sed $'s/INSERT/INSERT IGNORE/g' |
    sed $'s/VALUES/\\\nVALUES\\\n /g' |
    sed $'s/),(/),\\\n  (/g' >> $DB/RefData.sql
  cat <(echo "") >> $DB/RefData.sql
done < $DB/RefDataTables.txt
