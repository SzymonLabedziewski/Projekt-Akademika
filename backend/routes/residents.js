const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');
const isAdmin = require('../middleware/isAdmin');

// Pobranie listy mieszkańców z widoku
router.get('/residents', isAdmin, async (req, res) => {
    try {
        const query = `
            SELECT nr_albumu, imie, nazwisko, pokoj_id, data_od
            FROM projekt.mieszkancy_widok;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania mieszkańców:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;
