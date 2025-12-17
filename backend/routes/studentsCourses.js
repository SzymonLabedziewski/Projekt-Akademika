const express = require('express');
const router = express.Router();
const pool = require('../../config/dbConfig');

// Pomocnicza funkcja: na podstawie userId z sesji zwraca nr_albumu studenta
async function findNrAlbumByUserId(userId) {
    const sql = `
        SELECT nr_albumu
        FROM projekt.studenci
        WHERE uzytkownik_id = $1
        LIMIT 1
    `;
    const result = await pool.query(sql, [userId]);
    if (result.rows.length === 0) {
        return null; // Brak studenta powiązanego z tym userId
    }
    return result.rows[0].nr_albumu;
}


router.post('/students/courses', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    // Wyciągamy tablicę kierunków z body
    const { kierunki } = req.body;
    if (!Array.isArray(kierunki) || kierunki.length === 0) {
        return res.status(400).json({ message: 'Brak wymaganych danych (kierunki).' });
    }

    try {
        // Znajdź nr_albumu w tabeli studenci
        const nrAlbumu = await findNrAlbumByUserId(req.session.userId);
        if (!nrAlbumu) {
            return res.status(404).json({ message: 'Brak studenta w bazie.' });
        }

        // Wstaw do tabeli n-m: studenci_kierunki
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const insertQuery = `
                INSERT INTO projekt.studenci_kierunki (nr_albumu, kierunek_id)
                VALUES ($1, $2)
                ON CONFLICT DO NOTHING
            `;
            for (const kid of kierunki) {
                await client.query(insertQuery, [nrAlbumu, kid]);
            }

            await client.query('COMMIT');
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }

        return res.status(201).json({
            message: 'Pomyślnie przypisano kierunki do studenta.'
        });
    } catch (error) {
        console.error('Błąd przypisywania kierunków:', error);
        return res.status(500).json({ message: 'Błąd serwera.' });
    }
});


router.get('/students/courses', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    try {
        const nrAlbumu = await findNrAlbumByUserId(req.session.userId);
        if (!nrAlbumu) {
            return res.status(404).json({ message: 'Brak studenta w bazie.' });
        }

        const sql = `
            SELECT kierunek_id
            FROM projekt.studenci_kierunki
            WHERE nr_albumu = $1
        `;
        const result = await pool.query(sql, [nrAlbumu]);
        const assignedKierunki = result.rows.map(r => r.kierunek_id);

        return res.status(200).json(assignedKierunki);
    } catch (error) {
        console.error('Błąd pobierania przypisanych kierunków:', error);
        return res.status(500).json({ message: 'Błąd serwera.' });
    }
});


router.delete('/students/courses', async (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ message: 'Brak aktywnej sesji. Zaloguj się.' });
    }

    const { kierunki } = req.body;
    if (!Array.isArray(kierunki) || kierunki.length === 0) {
        return res.status(400).json({ message: 'Brak listy kierunków do usunięcia.' });
    }

    try {
        const nrAlbumu = await findNrAlbumByUserId(req.session.userId);
        if (!nrAlbumu) {
            return res.status(404).json({ message: 'Brak studenta w bazie.' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            for (const kid of kierunki) {
                await client.query(`
                    DELETE FROM projekt.studenci_kierunki
                    WHERE nr_albumu = $1 AND kierunek_id = $2
                `, [nrAlbumu, kid]);
            }
            await client.query('COMMIT');
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

        return res.status(200).json({ message: 'Usunięto wybrane przypisania kierunków.' });
    } catch (error) {
        console.error('Błąd usuwania przypisań kierunków:', error);
        return res.status(500).json({ message: 'Błąd serwera.' });
    }
});

module.exports = router;