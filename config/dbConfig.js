const { Pool } = require('pg');

// Konfiguracja bazy danych
const pool = new Pool({
    host: 'pascal.fis.agh.edu.pl',
    user: 'u2labedziewski',
    password: '',
    database: 'u2labedziewski',
    port: 5432
});

module.exports = pool;
