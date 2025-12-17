document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include' // Wysyła ciasteczko sesji
        });

        if (!response.ok) {
            alert('Nie jesteś zalogowany. Zaloguj się ponownie.');
            return window.location.href = 'index.html'; // Przekierowanie na logowanie
        }

        // Jeśli autoryzacja się powiedzie, pokaż stronę
        document.body.classList.remove('hidden');
    } catch (error) {
        console.error('Błąd podczas weryfikacji sesji:', error);
        alert('Wystąpił problem z uwierzytelnieniem. Zaloguj się ponownie.');
        window.location.href = 'index.html'; // Przekierowanie na logowanie w razie błędu
    }
});


document.getElementById('logout-button').addEventListener('click', async () => {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Wylogowano pomyślnie.');
            window.location.href = 'index.html';
        } else {
            alert('Błąd podczas wylogowania.');
        }
    } catch (error) {
        console.error('Błąd podczas wylogowania:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
    }
});