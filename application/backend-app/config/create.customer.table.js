module.exports = {
    stmt_create_table = `CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    email varchar(64),
    name varchar(64),
    active boolean
  );`
  
}
