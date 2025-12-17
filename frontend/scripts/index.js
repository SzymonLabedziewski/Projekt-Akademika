const form = document.getElementById('login-form');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include' // Dodaj przesyłanie ciasteczek sesji
        });

        // Ukryj poprzednie komunikaty
        errorMessage.style.display = 'none';
        successMessage.style.display = 'none';

        if (response.ok) {
            const result = await response.json();
            console.log('Zalogowany użytkownik ID:', result.uzytkownik_id);
            localStorage.setItem('rola', result.rola); // Przechowaj rolę w localStorage

            if (result.rola === 'admin') {
                window.location.href = 'admin.html'; // Przekierowanie do panelu admina
            } else {
                window.location.href = 'dashboard.html'; // Przekierowanie do panelu użytkownika
            }

            // Przechowaj uzytkownik_id w localStorage (opcjonalnie)
            localStorage.setItem('uzytkownik_id', result.uzytkownik_id);

            // Pokaż komunikat sukcesu
            successMessage.textContent = result.message;
            successMessage.style.display = 'block';
        } else {
            const result = await response.json();
            errorMessage.textContent = `Błąd: ${result.message}`;
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Błąd podczas logowania:', error);
        errorMessage.textContent = 'Wystąpił problem z połączeniem z serwerem.';
        errorMessage.style.display = 'block';
    }
});

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

