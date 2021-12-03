const pool = require('pg').Pool;
const format = require('pg-format');
const dbConfig = require("../config/db.config.js");
const supervillains = require('supervillains');

con = new pool({
  user: dbConfig.USER,
  host: dbConfig.HOST,
  database: dbConfig.DBNAME,
  password: dbConfig.PASS,
  port: dbConfig.PORT
})

const stmt_create_table = `CREATE SEQUENCE IF NOT EXISTS customer_id_seq; CREATE TABLE IF NOT EXISTS customers (
    id integer NOT NULL DEFAULT nextval('customer_id_seq'),
    email varchar(64),
    name varchar(64),
    active boolean
);`

console.log("Customer Table Creating ...");
con.query(stmt_create_table)
    .then(res => {
        console.log('Table is successfully created');
    })
    .catch(err => {
        console.error(err);
    });

var email, name;
var customers_array = [];
for (let i = 1; i <= 50; i++) {
    name = supervillains.random();
    email = name.replace(" ",".") + '@acme.com';
    active = i % 2 == 0 ? true : false; 
    customers_array.push([email, name, active]);
};

var query = format('INSERT INTO customers (email, name, active) VALUES  %L returning id', customers_array);

function sleep (time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

sleep(5000).then(() => {
  con.query(query)
  .then(res => {
      console.log('Table is successfully provisioned');
  })
  .catch(err => {
      console.error(err);
  })
  .finally(() => {
      con.end();
  });
});
