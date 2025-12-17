const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../../config/dbConfig'); // Import konfiguracji bazy danych

// Logowanie użytkownika
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Walidacja danych wejściowych
    if (!username || !password) {
        return res.status(400).json({ message: 'Wszystkie pola są wymagane.' });
    }

    try {
        // Pobierz dane użytkownika na podstawie nazwy użytkownika
        const query = `
            SELECT uzytkownik_id, haslo, rola
            FROM projekt.uzytkownicy 
            WHERE nazwa_uzytkownika = $1
        `;
        const result = await pool.query(query, [username]);

        // Jeśli użytkownik nie istnieje
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
        }

        const { haslo: hashedPassword, uzytkownik_id, rola } = result.rows[0];
        // Sprawdź poprawność hasła
        const isValid = await bcrypt.compare(password, hashedPassword);

        if (!isValid) {
            return res.status(401).json({ message: 'Nieprawidłowy login lub hasło.' });
        }

        // Zapisz dane do sesji
        req.session.userId = uzytkownik_id;
        req.session.role = rola; // Dodaj rolę do sesji

        console.log('Sesja po zalogowaniu:', req.session); // Debugging

        // Zwróć sukces logowania
        res.status(200).json({
            message: 'Logowanie zakończone sukcesem!',
            uzytkownik_id,
            rola // Zwróć rolę użytkownika
        });
    } catch (error) {
        console.error('Błąd logowania:', error);
        res.status(500).json({ message: 'Wewnętrzny błąd serwera.' });
    }
});

// Sprawdzanie sesji użytkownika
router.get('/session', (req, res) => {
    console.log('Nagłówki żądania:', req.headers);
    console.log('Ciasteczka z żądania:', req.headers.cookie);
    console.log('Sesja na backendzie:', req.session);

    if (req.session && req.session.userId) {
        console.log('Użytkownik jest zalogowany:', req.session.userId);

        // Dodanie roli użytkownika do odpowiedzi
        return res.status(200).json({
            role: req.session.role
        });
    }

    console.log('Brak aktywnej sesji.');
    res.status(401).json({ message: 'Nie jesteś zalogowany.' });
});


// Wylogowanie użytkownika
router.post('/logout', (req, res) => {
    if (!req.session) {
        return res.status(400).json({ message: 'Brak aktywnej sesji.' });
    }

    req.session.destroy(err => {
        if (err) {
            console.error('Błąd podczas wylogowywania:', err);
            return res.status(500).json({ message: 'Wylogowanie nie powiodło się.' });
        }
        console.log('Wylogowano użytkownika.');
        res.status(200).json({ message: 'Wylogowanie zakończone sukcesem!' });
    });
});

module.exports = router;
