const mysql = require("mysql");

const db = mysql.createPool({
    connectionLimit: 10,
    host: 'localhost',
    port: '3306',
    user: 'root',
    password: '',
    database: 'iris'
});

module.exports = db;