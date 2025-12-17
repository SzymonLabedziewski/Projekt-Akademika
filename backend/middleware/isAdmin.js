function isAdmin(req, res, next) {
    if (req.session && req.session.role === 'admin') {
        next(); // Zezwól na dostęp
    } else {
        res.status(403).json({ message: 'Dostęp zabroniony. Tylko administratorzy mają dostęp.' });
    }
}

module.exports = isAdmin;
