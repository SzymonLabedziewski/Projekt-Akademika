const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');

// Pobranie rezerwacji na podstawie sesji użytkownika
router.get('/reservations', async (req, res) => {
    console.log('Sesja użytkownika:', req.session);

    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Nie jesteś zalogowany.' });
    }

    try {
        // Pobranie numeru albumu na podstawie id użytkownika (userId)
        const albumQuery = `
            SELECT nr_albumu 
            FROM projekt.studenci 
            WHERE uzytkownik_id = $1;
        `;

        const albumResult = await pool.query(albumQuery, [req.session.userId]);

        if (albumResult.rows.length === 0) {
            return res.status(404).json({ message: 'Nie masz przypisanego numeru albumu.' });
        }

        const nr_albumu = albumResult.rows[0].nr_albumu;

        // Pobranie rezerwacji studenta
        const reservationQuery = `
            SELECT 
                TO_CHAR(r.data_od, 'YYYY-MM-DD') AS data_od, 
                r.pokoj_id, 
                p.mieszkanie_id 
            FROM projekt.rezerwacje r
            JOIN projekt.pokoje p ON r.pokoj_id = p.pokoj_id
            WHERE r.nr_albumu = $1;
        `;

        const reservationResult = await pool.query(reservationQuery, [nr_albumu]);

        if (reservationResult.rows.length === 0) {
            return res.status(404).json({ message: 'Brak rezerwacji.' });
        }

        const reservationData = reservationResult.rows[0];

        // Pobranie współlokatorów z tego samego pokoju, ale wykluczanie aktualnego użytkownika
        const roommatesQuery = `
            SELECT 
                s.imie, 
                s.nazwisko, 
                s.rok_studiow, 
                ARRAY_AGG(k.nazwa_kierunku) AS kierunki
            FROM projekt.rezerwacje r
            JOIN projekt.studenci s ON r.nr_albumu = s.nr_albumu
            JOIN projekt.studenci_kierunki sk ON s.nr_albumu = sk.nr_albumu
            JOIN projekt.kierunki k ON sk.kierunek_id = k.kierunek_id
            WHERE r.pokoj_id = $1 AND r.nr_albumu != $2
            GROUP BY s.imie, s.nazwisko, s.rok_studiow;
        `;

        const roommatesResult = await pool.query(roommatesQuery, [reservationData.pokoj_id, nr_albumu]);

        res.status(200).json({
            data_od: reservationData.data_od,
            pokoj_id: reservationData.pokoj_id,
            mieszkanie_id: reservationData.mieszkanie_id,
            roommates: roommatesResult.rows.length > 0 ? roommatesResult.rows : []
        });
    } catch (error) {
        console.error('Błąd pobierania rezerwacji:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;
