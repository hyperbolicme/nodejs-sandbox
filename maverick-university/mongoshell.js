

db.fa_testdata_users.aggregate([{$limit: 1}, {$project: {length: {$size: userlist}}} ])

db.fa_testdata_users.aggregate([{ $lookup: { from: "fa_testdata_circuitmembers", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }]).forEach(function (r) { print(r.display_name, JSON.stringyfy(r.all_circuits)) })
db.fa_testdata_users.aggregate([{$match: {user_id:10074} }, { $lookup: { from: "fa_testdata_circuitsplus", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }, { $out: "fa_testdata_denormalized" }])
userlist = db.fa_testdata_users.aggregate([ {$sort: {user_id: 1}}, {$match: {user_id: {$gte: 429279, $lte:399591}} },  {$limit: 5000}, { $lookup: { from: "fa_testdata_circuitsplus", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }])




db.fa_testdata_users.aggregate([ {$sort: {user_id: 1}}, {$match: {user_id: {$lte: 429278}} }, { $lookup: { from: "fa_testdata_circuitsplus", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }, { $out: "fa_testdata_denormalized" }])

userlist = db.fa_testdata_users.aggregate([ {$sort: {user_id: 1}}, {$match: {user_id: {$gte: 429279, $lte:498852}} },  {$limit: 5000}, { $lookup: { from: "fa_testdata_circuitsplus", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }]).toArray()
db.fa_testdata_denormalized.insertMany(userlist)  

userlist = db.fa_testdata_users.aggregate([ {$sort: {user_id: 1}}, {$match: {user_id: {$gte: 498853, $lte:937876}} },  { $lookup: { from: "fa_testdata_circuitsplus", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }]).toArray()
db.fa_testdata_denormalized.insertMany(userlist)  // {$limit: 5000}, 


userlist = db.fa_testdata_users.aggregate([ {$sort: {user_id: 1}}, {$match: {user_id: {$gte: 937877, $lte: 1009677}} },  { $lookup: { from: "fa_testdata_circuitsplus", localField: "user_id", foreignField: "user_id", as: "all_circuits" } }]).toArray()
db.fa_testdata_denormalized.insertMany(userlist)  // {$limit: 5000}, 



db.fa_testdata_denormalized.aggregate([ {$unwind: "$all_circuits"}, {$match: {user_id: 10342, "all_circuits.circuit_id_merged.course_id": 12061 }} ]).forEach( (r)=>{print(r.all_circuits.circuit_id_merged.circuit_id)} )


db.fa_testdata_denormalized.aggregate([{$limit: 10}, {$unwind: "$all_circuits"}, {$project: { "circuit_id": "$all_circuits.circuit_id", "college_id": "$all_circuits.circuit_id_merged.college_id", "batch": "$all_circuits.circuit_id_merged.batch", "course_id": "$all_circuits.circuit_id_merged.course_id", "specialization_id": "$all_circuits.circuit_id_merged.specialization_id",  user_id:1, individual_id:1, first_name:1, middle_name:1, last_name:1, display_name:1, email_id:1, city_id:1, display_city:1, longitude:1, latitude:1, institution_id:1, institution_name:1, current_designation:1, industry_type_id:1, job_category_id:1,  _id:0}}, {$out: "fa_testdata_denormalize2"}])
db.fa_testdata_denormalized.aggregate([ {$unwind: "$all_circuits"}, {$project: { "circuit_id": "$all_circuits.circuit_id", "college_id": "$all_circuits.circuit_id_merged.college_id", "batch": "$all_circuits.circuit_id_merged.batch", "course_id": "$all_circuits.circuit_id_merged.course_id", "specialization_id": "$all_circuits.circuit_id_merged.specialization_id",  user_id:1, individual_id:1, first_name:1, middle_name:1, last_name:1, display_name:1, email_id:1, city_id:1, display_city:1, longitude:1, latitude:1, institution_id:1, institution_name:1, current_designation:1, industry_type_id:1, job_category_id:1,  _id:0}}, {$out: "fa_testdata_denormalize2"}])

