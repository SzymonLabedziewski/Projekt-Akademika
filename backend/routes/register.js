const express = require('express');
const router = express.Router();
const db = require('../../config/dbConfig'); // Import konfiguracji bazy danych
const bcrypt = require('bcrypt');

// Endpoint POST /register
router.post('/register', async (req, res) => {
    const { username, password, email } = req.body;

    try {
        // Sprawdzenie, czy użytkownik już istnieje
        const userCheck = await db.query(
            'SELECT * FROM projekt.uzytkownicy WHERE nazwa_uzytkownika = $1 OR email = $2',
            [username, email]
        );
        if (userCheck.rows.length > 0) {
            return res.status(409).json({ message: 'Użytkownik o podanej nazwie lub emailu już istnieje' });
        }

        // Hashuj hasło
        const hashedPassword = await bcrypt.hash(password, 10);

        // Dodanie użytkownika do bazy danych
        const query = 'INSERT INTO projekt.uzytkownicy (nazwa_uzytkownika, haslo, email) VALUES ($1, $2, $3)';
        await db.query(query, [username, hashedPassword, email]);

        res.status(201).json({ message: 'Rejestracja zakończona sukcesem' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Błąd serwera' });
    }
});

module.exports = router;
