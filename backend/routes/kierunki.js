const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');

// Endpoint: Pobierz listę kierunków
router.get('/kierunki', async (req, res) => {
    try {
        const result = await pool.query('SELECT kierunek_id, nazwa_kierunku FROM projekt.kierunki_posortowane');
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania kierunków:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

module.exports = router;
