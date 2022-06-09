var mysql = require('mysql');
const db_host = process.env.DB_HOST ?? '127.0.0.1';
const db_port = process.env.DB_PORT ?? 3360;
const db_user = process.env.DB_USER ?? 'root';
const db_pass = process.env.DB_PASSWORD ?? 'abc.123';
const database = process.env.DB_DATABASE ?? 'ecol';

var conn = mysql.createConnection({
  host: db_host,
  user: db_user,
  password: db_pass,
  port: db_port,
  database: database
});

conn.connect(function (err) {
  if (err) throw err;
  console.log('Database is connected successfully !');
});
module.exports = conn;