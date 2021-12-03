const pool = require('pg').Pool;
const dbConfig = require("../config/db.config.js");

connection = new pool({
  user: dbConfig.USER,
  host: dbConfig.HOST,
  database: dbConfig.DBNAME,
  password: dbConfig.PASS,
  port: dbConfig.PORT
})

console.log("Connection Info:[ Host:", dbConfig.HOST, " Port:", dbConfig.PORT, " Username:", dbConfig.USER, " Password:", dbConfig.PASS, " ]");

connection.connect(error => {
  if (error) throw error;
  console.log("Successfully connected to the database.");
});


module.exports = connection;