function isAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
        next(); // Kontynuuj jeśli użytkownik jest zalogowany
    } else {
        res.status(401).json({ message: 'Dostęp zabroniony. Zaloguj się, aby uzyskać dostęp.' });
    }
}

module.exports = isAuthenticated;
