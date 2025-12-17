document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Pobranie sesji użytkownika
        const sessionResponse = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!sessionResponse.ok) {
            throw new Error('Sesja nieaktywna');
        }

        const user = await sessionResponse.json();

        if (user.role !== 'admin') {
            alert('Brak uprawnień do przeglądania tej strony.');
            window.location.href = 'dashboard.html';
            return;
        }

        document.body.classList.remove('hidden');

        // Pobranie danych mieszkańców
        const response = await fetch('/api/residents', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const residents = await response.json();
            const tableBody = document.querySelector('#residents-table tbody');

            // Posortowanie danych dla bezpieczeństwa (gdyby baza danych nie zwróciła posortowanych)
            residents.sort((a, b) => a.pokoj_id.localeCompare(b.pokoj_id) || a.nazwisko.localeCompare(b.nazwisko));

            let currentRoom = null;
            let isAlternate = false;

            tableBody.innerHTML = residents.map(resident => {
                if (resident.pokoj_id !== currentRoom) {
                    isAlternate = !isAlternate; // Zmiana koloru dla kolejnego pokoju
                    currentRoom = resident.pokoj_id;
                }
                return `
                    <tr class="${isAlternate ? 'row-even' : 'row-odd'}">
                        <td>${resident.nr_albumu}</td>
                        <td>${resident.imie}</td>
                        <td>${resident.nazwisko}</td>
                        <td>${resident.pokoj_id}</td>
                        <td>${new Date(resident.data_od).toISOString().split('T')[0]}</td>
                    </tr>
                `;
            }).join('');
        } else {
            alert('Nie udało się pobrać danych mieszkańców.');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania danych mieszkańców:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
    }

    // Obsługa wylogowania
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
        }
    });
});
