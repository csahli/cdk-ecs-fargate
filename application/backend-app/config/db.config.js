module.exports = {
    PORT: process.env.DBPORT || 5432,
    HOST: process.env.DBHOST || "localhost",
    USER: process.env.DBUSER || "postgres",
    PASS: process.env.DBPASS || "nicepass",
    DBNAME: process.env.DBNAME || "postgres"
};