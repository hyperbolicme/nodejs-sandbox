echo off

echo Use the relevant command

echo "mongoimport --db studentdb --collection students --jsonArray --file <path to json file>"

echo "mongoimport --db studentdb --collection students --type csv --headerline --ignoreBlanks --mode merge --file <path to csv file>"

echo "mongoimport --host ClusterMaverick-shard-0/clustermaverick-shard-00-00-idrtx.mongodb.net:27017,clustermaverick-shard-00-01-idrtx.mongodb.net:27017,clustermaverick-shard-00-02-idrtx.mongodb.net:27017 --ssl --username akira --authenticationDatabase admin --db studentdb --collection students2 --type csv --headerline --file <FILE>"

echo "mongoimport --host ClusterMaverick-shard-0/clustermaverick-shard-00-00-idrtx.mongodb.net:27017,clustermaverick-shard-00-01-idrtx.mongodb.net:27017,clustermaverick-shard-00-02-idrtx.mongodb.net:27017 --ssl --username akira --authenticationDatabase admin --db studentdb --drop --collection fa_testdata_circuitmembers --type tsv --headerline --file mongo_circuitmemberlist.tsv"

echo "mongoimport --host ClusterMaverick-shard-0/clustermaverick-shard-00-00-idrtx.mongodb.net:27017,clustermaverick-shard-00-01-idrtx.mongodb.net:27017,clustermaverick-shard-00-02-idrtx.mongodb.net:27017 --ssl --username akira --authenticationDatabase admin --db studentdb --drop --collection fa_testdata_users --type tsv --headerline --file mongo_userlist.tsv"

