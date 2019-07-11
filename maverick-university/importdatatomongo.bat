echo off

echo Use the relevant command

echo "mongoimport --db studentdb --collection students --jsonArray --file <path to json file>"

echo "mongoimport --db studentdb --collection students --type csv --headerline --ignoreBlanks --mode merge --file <path to csv file>"
