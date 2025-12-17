const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');

// [POST] Dodaj dane studenta
router.post('/students', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    const {
        nr_albumu,
        imie,
        nazwisko,
        plec,
        rok_studiow,
        odleglosc_miejsca_zamieszkania
        // Brak kierunek_id, bo relacja n-m będzie w studenci_kierunki
    } = req.body;

    try {
        // Walidacja formatu numeru albumu (np. 6 cyfr, brak zera na początku)
        const regex = /^[1-9][0-9]{5}$/;
        if (!regex.test(nr_albumu)) {
            return res.status(400).json({
                message: 'Numer albumu musi mieć dokładnie 6 cyfr i nie może zaczynać się od zera.'
            });
        }

        // Walidacja roku studiów (1-5)
        if (rok_studiow < 1 || rok_studiow > 5) {
            return res.status(400).json({
                message: 'Rok studiów musi być wartością z przedziału 1-5.'
            });
        }

        // Sprawdzenie, czy numer albumu już istnieje w bazie
        const checkNrAlbumuQuery = `
            SELECT nr_albumu FROM projekt.studenci
            WHERE nr_albumu = $1
        `;
        const checkNrAlbumuResult = await pool.query(checkNrAlbumuQuery, [nr_albumu]);
        if (checkNrAlbumuResult.rows.length > 0) {
            return res.status(409).json({
                message: 'Numer albumu już istnieje. Podaj inny numer.'
            });
        }

        // Sprawdzenie, czy użytkownik już ma rekord w studenci
        const checkQuery = `
            SELECT nr_albumu FROM projekt.studenci
            WHERE uzytkownik_id = $1
        `;
        const checkResult = await pool.query(checkQuery, [req.session.userId]);
        if (checkResult.rows.length > 0) {
            return res.status(409).json({
                message: 'Dane dla tego użytkownika już istnieją. Edytuj dane zamiast je ponownie dodawać.'
            });
        }

        // INSERT nowego studenta (bez kierunek_id)
        const insertQuery = `
            INSERT INTO projekt.studenci (
                nr_albumu, imie, nazwisko, plec, rok_studiow,
                odleglosc_miejsca_zamieszkania, uzytkownik_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        const values = [
            nr_albumu,
            imie,
            nazwisko,
            plec,
            rok_studiow,
            odleglosc_miejsca_zamieszkania,
            req.session.userId
        ];
        await pool.query(insertQuery, values);

        res.status(201).json({ message: 'Dane studenta zostały zapisane.' });
    } catch (error) {
        console.error('Błąd podczas zapisu danych studenta:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

// [GET] Pobierz dane studenta zalogowanego
router.get('/students', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    try {
        const query = `
            SELECT
                nr_albumu,
                imie,
                nazwisko,
                plec,
                rok_studiow,
                odleglosc_miejsca_zamieszkania
            FROM projekt.studenci
            WHERE uzytkownik_id = $1
        `;
        const result = await pool.query(query, [req.session.userId]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Brak danych dla tego użytkownika.' });
        }

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Błąd podczas pobierania danych studenta:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

// [PUT] Edytuj dane studenta
router.put('/students', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    const {
        imie,
        nazwisko,
        plec,
        rok_studiow,
        odleglosc_miejsca_zamieszkania
        // Brak kierunek_id, bo relacja n-m będzie w studenci_kierunki
    } = req.body;

    try {
        // Sprawdzenie, czy dane użytkownika istnieją
        const checkQuery = `
            SELECT nr_albumu FROM projekt.studenci
            WHERE uzytkownik_id = $1
        `;
        const checkResult = await pool.query(checkQuery, [req.session.userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({
                message: 'Brak danych do edycji dla tego użytkownika.'
            });
        }

        // Walidacja roku studiów
        if (rok_studiow < 1 || rok_studiow > 5) {
            return res.status(400).json({
                message: 'Rok studiów musi być wartością z przedziału 1-5.'
            });
        }

        // UPDATE - usuwamy kierunek_id z setu, bo przenosimy relacje do studenci_kierunki
        const updateQuery = `
            UPDATE projekt.studenci
            SET
                imie = $1,
                nazwisko = $2,
                plec = $3,
                rok_studiow = $4,
                odleglosc_miejsca_zamieszkania = $5
            WHERE uzytkownik_id = $6
        `;
        const values = [
            imie,
            nazwisko,
            plec,
            rok_studiow,
            odleglosc_miejsca_zamieszkania,
            req.session.userId
        ];

        await pool.query(updateQuery, values);
        res.status(200).json({ message: 'Dane studenta zostały zaktualizowane.' });
    } catch (error) {
        console.error('Błąd podczas aktualizacji danych studenta:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

// [DELETE] Usuń dane studenta
router.delete('/students', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    try {
        const deleteQuery = `
            DELETE FROM projekt.studenci
            WHERE uzytkownik_id = $1
        `;
        const result = await pool.query(deleteQuery, [req.session.userId]);
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Brak danych do usunięcia.' });
        }

        res.status(200).json({ message: 'Dane studenta zostały usunięte.' });
    } catch (error) {
        console.error('Błąd podczas usuwania danych studenta:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

// [GET] Pobierz wszystkich studentów (dla admina)
router.get('/students/all', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    try {
        // Sprawdź, czy zalogowany user ma rolę admin
        const adminQuery = `
            SELECT rola
            FROM projekt.uzytkownicy
            WHERE uzytkownik_id = $1
        `;
        const adminResult = await pool.query(adminQuery, [req.session.userId]);
        if (adminResult.rows.length === 0 || adminResult.rows[0].rola !== 'admin') {
            return res.status(403).json({ message: 'Brak uprawnień.' });
        }

        const query = `
            SELECT 
                s.nr_albumu,
                s.imie,
                s.nazwisko,
                s.plec,
                s.rok_studiow,
                s.odleglosc_miejsca_zamieszkania,
                ARRAY_AGG(sk.kierunek_id) AS kierunki
            FROM projekt.studenci s
            LEFT JOIN projekt.studenci_kierunki sk ON s.nr_albumu = sk.nr_albumu
            GROUP BY s.nr_albumu, s.imie, s.nazwisko, s.plec, s.rok_studiow, s.odleglosc_miejsca_zamieszkania
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd podczas pobierania studentów:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

router.get('/students/report/gender', async (req, res) => {
    try {
        const query = `
            SELECT 
                plec AS gender, 
                COUNT(*) AS total_count,
                ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM projekt.studenci), 2) AS percentage
            FROM projekt.studenci
            GROUP BY plec;
        `;

        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd podczas generowania raportu płci:', error);
        res.status(500).json({ message: 'Błąd serwera podczas generowania raportu.' });
    }
});


module.exports = router;
