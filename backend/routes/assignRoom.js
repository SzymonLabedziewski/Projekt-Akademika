const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');
const isAdmin = require('../middleware/isAdmin');

// Pobranie danych studenta
router.get('/student/:nr_albumu', isAdmin, async (req, res) => {
    const { nr_albumu } = req.params;
    try {
        const query = `
            SELECT 
                s.nr_albumu, 
                s.imie, 
                s.nazwisko, 
                s.plec, 
                s.rok_studiow, 
                COALESCE(STRING_AGG(k.nazwa_kierunku, ', '), 'Brak kierunku') AS kierunki
            FROM projekt.studenci s
            LEFT JOIN projekt.studenci_kierunki sk ON s.nr_albumu = sk.nr_albumu
            LEFT JOIN projekt.kierunki k ON sk.kierunek_id = k.kierunek_id
            WHERE s.nr_albumu = $1
            GROUP BY s.nr_albumu, s.imie, s.nazwisko, s.plec, s.rok_studiow;
        `;
        const result = await pool.query(query, [nr_albumu]);
        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd pobierania danych studenta:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Pobranie listy dostępnych pokoi
router.get('/available-rooms', async (req, res) => {
    try {
        const query = `
            SELECT p.pokoj_id, p.mieszkanie_id, p.ilosc_miejsc, p.lozka_pojedyncze, p.lozka_pietrowe, 
                   (p.ilosc_miejsc - COUNT(r.rezerwacja_id)) AS wolne_miejsca
            FROM projekt.pokoje p
            LEFT JOIN projekt.rezerwacje r ON p.pokoj_id = r.pokoj_id
            GROUP BY p.pokoj_id, p.mieszkanie_id, p.ilosc_miejsc, p.lozka_pojedyncze, p.lozka_pietrowe
            HAVING (p.ilosc_miejsc - COUNT(r.rezerwacja_id)) > 0
            ORDER BY p.mieszkanie_id, p.pokoj_id;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania dostępnych pokoi:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

// Pobranie rezerwacji dla wybranego pokoju
router.get('/room-residents/:pokoj_id', isAdmin, async (req, res) => {
    const { pokoj_id } = req.params;
    try {
        const query = `
            SELECT 
                s.nr_albumu, 
                s.imie, 
                s.nazwisko, 
                s.plec, 
                s.rok_studiow, 
                COALESCE(STRING_AGG(k.nazwa_kierunku, ', '), 'Brak kierunku') AS kierunki
            FROM projekt.rezerwacje r
            JOIN projekt.studenci s ON r.nr_albumu = s.nr_albumu
            LEFT JOIN projekt.studenci_kierunki sk ON s.nr_albumu = sk.nr_albumu
            LEFT JOIN projekt.kierunki k ON sk.kierunek_id = k.kierunek_id
            WHERE r.pokoj_id = $1
            GROUP BY s.nr_albumu, s.imie, s.nazwisko, s.plec, s.rok_studiow;
        `;
        const result = await pool.query(query, [pokoj_id]);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd pobierania mieszkańców pokoju:', error);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});


// Przypisanie studenta do pokoju
router.post('/assign-room', isAdmin, async (req, res) => {
    const { nr_albumu, pokoj_id } = req.body;

    if (!nr_albumu || !pokoj_id) {
        return res.status(400).json({ message: 'Brak wymaganych danych.' });
    }

    try {
        // Sprawdzenie, czy student już ma przypisany pokój
        const checkQuery = `SELECT * FROM projekt.rezerwacje WHERE nr_albumu = $1`;
        const checkResult = await pool.query(checkQuery, [nr_albumu]);

        if (checkResult.rows.length > 0) {
            return res.status(409).json({ message: 'Student już ma przypisany pokój.' });
        }

        // Dodanie nowej rezerwacji do bazy danych
        const insertQuery = `
            INSERT INTO projekt.rezerwacje (nr_albumu, pokoj_id, data_od)
            VALUES ($1, $2, CURRENT_DATE)
            RETURNING rezerwacja_id;
        `;
        const insertResult = await pool.query(insertQuery, [nr_albumu, pokoj_id]);

        if (insertResult.rowCount === 0) {
            throw new Error('Nie udało się dodać rezerwacji.');
        }

        console.log(`Rezerwacja dodana dla nr_albumu: ${nr_albumu}, pokoj_id: ${pokoj_id}`);

        // Aktualizacja statusu studenta na "zamieszkaly"
        const updateStatusQuery = `
            UPDATE projekt.studenci
            SET status_zamieszkania = 'zamieszkaly'
            WHERE nr_albumu = $1;
        `;
        const updateResult = await pool.query(updateStatusQuery, [nr_albumu]);

        if (updateResult.rowCount === 0) {
            throw new Error('Nie udało się zaktualizować statusu studenta.');
        }

        console.log(`Status studenta nr_albumu: ${nr_albumu} zmieniony na "zamieszkaly".`);

        res.status(200).json({ 
            message: 'Pokój został przypisany, student zamieszkał.', 
            rezerwacja_id: insertResult.rows[0].rezerwacja_id 
        });

    } catch (error) {
        console.error('Błąd przypisywania pokoju:', error);
        res.status(500).json({ message: 'Błąd serwera', error: error.message });
    }
});



module.exports = router;
