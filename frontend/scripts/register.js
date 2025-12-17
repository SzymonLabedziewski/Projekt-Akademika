document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include' // Wysyła ciasteczko sesji
        });

        if (response.ok) {
            // Jeśli użytkownik jest zalogowany, przekieruj na stronę informacyjną
            window.location.href = 'already_logged_in.html';
        } else {
            // Jeśli użytkownik nie jest zalogowany, pokaż zawartość strony
            document.body.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Błąd podczas sprawdzania sesji:', error);
        // Jeśli wystąpił błąd, pokaż zawartość strony
        document.body.classList.remove('hidden');
    }
});

const form = document.getElementById('register-form');

form.addEventListener('submit', async (event) => {
    event.preventDefault(); // Zapobiega przeładowaniu strony

    // Pobierz dane z formularza
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            const result = await response.json();
            alert('Rejestracja zakończona sukcesem! Możesz się teraz zalogować.');
            window.location.href = 'index.html'; // Przekierowanie na stronę logowania
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000); // Przekierowanie po 2 sekundach
        } else {
            const result = await response.json();
            alert(`Błąd: ${result.message}`);
        }
    } catch (error) {
        console.error('Błąd podczas rejestracji:', error);
        alert('Wystąpił problem z połączeniem z serwerem. Spróbuj ponownie później.');
    }
});