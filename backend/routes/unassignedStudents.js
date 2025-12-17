const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');

router.get('/unassigned-students', async (req, res) => {
    try {
        const query = `
            SELECT 
                s.nr_albumu, 
                s.imie, 
                s.nazwisko, 
                s.plec, 
                s.rok_studiow, 
                s.odleglosc_miejsca_zamieszkania, 
                COALESCE(
                    STRING_AGG(k.kierunek_id, ', '), 
                    'Brak kierunku'
                ) AS kierunki
            FROM projekt.studenci s
            LEFT JOIN projekt.rezerwacje r 
            ON s.nr_albumu = r.nr_albumu
            LEFT JOIN projekt.studenci_kierunki sk 
            ON s.nr_albumu = sk.nr_albumu
            LEFT JOIN projekt.kierunki k 
            ON sk.kierunek_id = k.kierunek_id
            WHERE r.nr_albumu IS NULL
            AND s.uzytkownik_id IS NOT NULL
            GROUP BY s.nr_albumu, s.imie, s.nazwisko, s.plec, s.rok_studiow, s.odleglosc_miejsca_zamieszkania
            ORDER BY s.nazwisko, s.imie;

        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd podczas pobierania studentów bez rezerwacji:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;
