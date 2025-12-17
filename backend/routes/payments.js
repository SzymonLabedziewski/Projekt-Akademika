const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');
const isAdmin = require('../middleware/isAdmin'); // Middleware sprawdzający uprawnienia administratora

router.get('/payments', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    try {
        // Pobranie numeru albumu dla zalogowanego użytkownika
        const studentQuery = `SELECT nr_albumu FROM projekt.studenci WHERE uzytkownik_id = $1`;
        const studentResult = await pool.query(studentQuery, [req.session.userId]);

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Brak przypisanego numeru albumu.' });
        }

        const nrAlbumu = studentResult.rows[0].nr_albumu;

        // Pobranie płatności dla tego numeru albumu
        const paymentsQuery = `
            SELECT 
                transakcja_nr, 
                nr_albumu, 
                kwota, 
                TO_CHAR(data_platnosci, 'YYYY-MM-DD') AS data_platnosci, 
                TO_CHAR(godzina_platnosci, 'HH24:MI:SS') AS godzina_platnosci
            FROM projekt.oplaty
            WHERE nr_albumu = $1
            ORDER BY data_platnosci DESC, godzina_platnosci DESC
        `;
        const paymentsResult = await pool.query(paymentsQuery, [nrAlbumu]);

        // Pobranie sumy płatności dla tego numeru albumu
        const totalQuery = `
            SELECT COALESCE(SUM(kwota), 0) AS suma
            FROM projekt.oplaty
            WHERE nr_albumu = $1
        `;
        const totalResult = await pool.query(totalQuery, [nrAlbumu]);

        res.status(200).json({
            payments: paymentsResult.rows,
            total: totalResult.rows[0].suma
        });

    } catch (error) {
        console.error('Błąd podczas pobierania płatności użytkownika:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});


// Endpoint: Pobierz wszystkie płatności (dostęp tylko dla administratora)
router.get('/payments/all', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    try {
        // Weryfikacja, czy użytkownik jest administratorem
        const adminQuery = `SELECT rola FROM projekt.uzytkownicy WHERE uzytkownik_id = $1`;
        const adminResult = await pool.query(adminQuery, [req.session.userId]);

        if (adminResult.rows.length === 0 || adminResult.rows[0].rola !== 'admin') {
            return res.status(403).json({ message: 'Brak uprawnień.' });
        }

        // Pobierz dane płatności
        const query = `
            SELECT 
                transakcja_nr, 
                nr_albumu, 
                kwota, 
                TO_CHAR(data_platnosci, 'YYYY-MM-DD') AS data_platnosci, 
                TO_CHAR(godzina_platnosci, 'HH24:MI:SS') AS godzina_platnosci
            FROM projekt.oplaty
            ORDER BY data_platnosci DESC, godzina_platnosci DESC
        `;

        const result = await pool.query(query);

        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Błąd podczas pobierania danych o płatnościach:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

// Endpoint: Pobierz raport o wpłatach studentów
router.get('/students/report/payments', isAdmin, async (req, res) => {
    try {
        const query = 'SELECT * FROM projekt.raport_oplaty_studentow;';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error('Błąd podczas pobierania raportu:', err);
        res.status(500).send('Błąd serwera');
    }
});

// Endpoint: Dodaj nową płatność
router.post('/payments', async (req, res) => {
    const { amount } = req.body;
    const { userId } = req.session;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Niepoprawne dane wejściowe.' });
    }

    try {
        // Pobranie numeru albumu na podstawie uzytkownik_id
        const studentResult = await pool.query(
            `SELECT nr_albumu FROM projekt.studenci WHERE uzytkownik_id = $1`,
            [userId]
        );

        if (studentResult.rows.length === 0) {
            return res.status(404).json({ message: 'Student nie został znaleziony.' });
        }

        const nrAlbumu = studentResult.rows[0].nr_albumu;

        const now = new Date();
        const date = now.toISOString().split('T')[0].replace(/-/g, ''); // yyyyMMdd
        const time = now.toTimeString().split(' ')[0].replace(/:/g, ''); // hhmmss
        const transactionId = `${date}${time.replace(/:/g, '')}${nrAlbumu}`; // unikalny id transakcji

        // Zapisanie opłaty do bazy danych
        await pool.query(
            `INSERT INTO projekt.oplaty (transakcja_nr, nr_albumu, kwota, data_platnosci, godzina_platnosci)
            VALUES ($1, $2, $3, $4, $5)`,
            [transactionId, nrAlbumu, amount, date, time]
        );

        res.status(201).json({ message: 'Opłata została zarejestrowana.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Wystąpił błąd serwera.' });
    }
});

// Endpoint: Usuń płatność
router.delete('/payments/:id', isAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const deleteQuery = `DELETE FROM projekt.oplaty WHERE transakcja_nr = $1`;
        const result = await pool.query(deleteQuery, [id]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Płatność o podanym ID nie istnieje.' });
        }

        res.status(200).json({ message: 'Płatność została usunięta.' });
    } catch (error) {
        console.error('Błąd podczas usuwania płatności:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

module.exports = router;
