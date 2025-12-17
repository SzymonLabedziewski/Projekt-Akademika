const express = require('express');
const app = express();
const PORT = 6006;
const cors = require('cors');
const session = require('express-session');
const isAuthenticated = require('./middleware/auth');


// Middleware do obsługi JSON
app.use(express.json()); // Obsługa danych w formacie JSON
app.use(express.urlencoded({ extended: true })); // Obsługa danych z formularzy HTML

// Middleware CORS
app.use(cors({
    origin: 'http://149.156.109.180', // Adres frontendowej aplikacji
    credentials: true // Zezwala na przesyłanie ciasteczek
}));


app.use('/client', express.static('../frontend'))
app.use('/TI', express.static('../../projekt'))

// Middleware sesji
app.use(session({
    secret: 'twoj_klucz_sesji', // Zmień na losowy ciąg znaków w wersji produkcyjnej
    resave: false,
    saveUninitialized: false, // Sesje nie będą tworzone, jeśli nic nie zapiszesz w req.session
    name: 'node_session_id', // Unikalna nazwa ciasteczka
    cookie: {
        path: '/', // Ciasteczko dostępne w całej aplikacji
        httpOnly: true, // Zapobiega dostępowi do ciasteczka z poziomu JavaScript
        secure: false, // Ustaw na true, jeśli używasz HTTPS
        sameSite: 'lax', // Zapobiega przesyłaniu ciasteczek w nieautoryzowanych żądaniach
        maxAge: 3600000 // 1 godzina
    }
}));


// Import innych tras (np. rejestracja)
const registerRoute = require('./routes/register');
app.use('/api', registerRoute);

// Dodanie endpointu testowego
app.get('/', (req, res) => {
    res.send(`
        <h2>Serwer działa na porcie 6006!</h2>
        <a href="/client" style="text-decoration: none; color: blue; font-size: 20px;">
            Projekt z "Bazy Danych I"
        </a>
        </br></br>
        <a href="/TI" style="text-decoration: none; color: blue; font-size: 20px;">
            Projekt z "Techniki Internetowe"
        </a>
    `);
});

// Uruchomienie serwera
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serwer działa na porcie ${PORT}`);
});

const loginRoute = require('./routes/login'); // Import trasy logowania
app.use('/api', loginRoute); // Podłączenie trasy pod /api/login


const studentRoutes = require('./routes/students');
app.use('/api', isAuthenticated, studentRoutes);

const kierunkiRoutes = require('./routes/kierunki');
app.use('/api', isAuthenticated, kierunkiRoutes);

app.use('/api/students', isAuthenticated, require('./routes/students'));

const paymentsRoutes = require('./routes/payments');
app.use('/api', isAuthenticated, paymentsRoutes);

const unassignedStudentsRoute = require('./routes/unassignedStudents');
app.use('/api', isAuthenticated, unassignedStudentsRoute);

const assignRoomRoute = require('./routes/assignRoom');
app.use('/api', isAuthenticated, assignRoomRoute);

const reservationsRoute = require('./routes/reservations');
app.use('/api', isAuthenticated, reservationsRoute);

const residentsRoute = require('./routes/residents');
app.use('/api', isAuthenticated, residentsRoute);

const studentsCoursesRoute = require('./routes/studentsCourses');
app.use('/api', studentsCoursesRoute);
































// --- Projekt z Technik Internetowych ---

// const express = require('express');
// const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require('path');

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'secret_key', // Change this to a secure random key in production
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set secure to true when using HTTPS
}));

// Ustawienie statycznego folderu z prefiksem /TI/
const projectPath = path.resolve(__dirname, '../../projekt');
app.use('/TI', express.static(projectPath));

// Database setup
const dbPath = path.join(__dirname, '../../projekt/backend/database.db');
console.log("Baza danych znajduje się w:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) return console.error("Błąd połączenia z bazą danych:", err.message);
    console.log('Połączono z bazą danych SQLite.');
});

// Create users table
db.run(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL
    )
`, (err) => {
    if (err) console.error(err.message);
});

// Routes
app.get('/TI', (req, res) => {
    res.sendFile(path.join(projectPath, 'index.html'));
});

// Register user
app.post('/TI/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).send('Username and password are required.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(
            `INSERT INTO users (username, password) VALUES (?, ?)`,
            [username, hashedPassword],
            function (err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        console.log(`Użytkownik "${username}" już istnieje.`);
                        return res.status(409).send('Username already exists.');
                    }
                    console.error("Błąd zapytania INSERT:", err.message);
                    return res.status(500).send('Error registering user.');
                }
                console.log("Użytkownik zarejestrowany z ID:", this.lastID);
                res.status(201).send('User registered successfully.');
            }
        );
    } catch (error) {
        console.error("Nieoczekiwany błąd:", error.message);
        res.status(500).send('Internal Server Error.');
    }
});


// Login user
app.post('/TI/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).send('Username and password are required.');
    }

    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err) {
            console.error("Błąd podczas wyszukiwania użytkownika:", err.message);
            return res.status(500).send('Internal Server Error.');
        }
        if (!user) {
            return res.status(401).send('Invalid username or password.');
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).send('Invalid username or password.');
        }

        // Zapisz sesję użytkownika
        req.session.user = { id: user.id, username: user.username };
        console.log(`Użytkownik ${user.username} zalogowany.`);
        res.send('Login successful.');
    });
});


app.get('/TI/userStatus', (req, res) => {
    if (req.session.user) {
        return res.json({ loggedIn: true, username: req.session.user.username });
    }
    res.json({ loggedIn: false });
});


// Logout user
app.get('/TI/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Błąd podczas wylogowywania:", err.message);
            return res.status(500).send("Błąd podczas wylogowywania.");
        }
        res.sendStatus(200);
    });
});

// Protected route example
app.get('/TI/protected', (req, res) => {
    if (!req.session.user) return res.status(401).send('Unauthorized access.');
    res.send(`Welcome ${req.session.user.username}, you are logged in.`);
});


app.post('/TI/saveParams', (req, res) => {
    const { angle, velocity } = req.body;

    if (!req.session.user) {
        return res.status(401).send('User not logged in.');
    }

    const userId = req.session.user.id;

    // Aktualizujemy dane użytkownika w bazie
    db.run(
        `UPDATE users SET angle = ?, velocity = ? WHERE id = ?`,
        [angle, velocity, userId],
        function (err) {
            if (err) {
                console.error("Błąd aktualizacji danych użytkownika:", err.message);
                return res.status(500).send('Error saving parameters.');
            }
            res.send('Parameters saved successfully.');
        }
    );
});

app.get('/TI/getParams', (req, res) => {
    if (!req.session.user) {
        return res.status(401).send('User not logged in.');
    }

    const userId = req.session.user.id;

    db.get(
        `SELECT angle, velocity FROM users WHERE id = ?`,
        [userId],
        (err, row) => {
            if (err) {
                console.error("Błąd podczas pobierania danych użytkownika:", err.message);
                return res.status(500).send('Error retrieving parameters.');
            }

            if (!row || row.angle === null || row.velocity === null) {
                return res.status(404).send('No saved parameters found.');
            }

            res.json(row);
        }
    );
});

