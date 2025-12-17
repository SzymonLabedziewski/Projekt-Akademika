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

        const data = await response.json();

        // Sprawdzenie, czy użytkownik ma uprawnienia administratora
        if (data.role !== 'admin') {
            alert('Nie masz uprawnień dostępu do tej strony.');
            return window.location.href = 'dashboard.html'; // Przekierowanie do panelu użytkownika
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