document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Pobranie danych użytkownika z sesji
        const sessionResponse = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!sessionResponse.ok) {
            throw new Error('Nie jesteś zalogowany.');
        }

        const userData = await sessionResponse.json();

        if (userData.role !== 'student') {
            alert('Brak uprawnień.');
            window.location.href = 'index.html';
            return;
        }

        // Usunięcie klasy hidden, aby wyświetlić stronę po autoryzacji
        document.body.classList.remove('hidden');

        // Pobranie rezerwacji dla zalogowanego użytkownika
        const reservationResponse = await fetch('/api/reservations', {
            method: 'GET',
            credentials: 'include'
        });

        if (reservationResponse.ok) {
            const reservation = await reservationResponse.json();

            document.getElementById('data-od').innerText = reservation.data_od;
            document.getElementById('pokoj-id').innerText = reservation.pokoj_id;
            document.getElementById('mieszkanie-id').innerText = reservation.mieszkanie_id;

            // Wyświetlenie współlokatorów
            const roommatesList = document.getElementById('roommates-list');
            if (reservation.roommates.length > 0) {
                roommatesList.innerHTML = reservation.roommates.map(roommate => `
                    <li><strong>${roommate.imie} ${roommate.nazwisko}</strong>, Rok: ${roommate.rok_studiow}</br>
                            Kierunki: ${roommate.kierunki.join(', ')}</li>
            `).join('');
            } else {
                roommatesList.innerHTML = '<li>Nie masz współlokatorów</li>';
            }
        } else {
            document.getElementById('reservation-info').style.display = 'none';
            document.getElementById('no-reservation').style.display = 'block';
        }

    } catch (error) {
        console.error('Błąd pobierania danych:', error);
        alert('Nie jesteś zalogowany lub wystąpił problem z danymi.');
        window.location.href = 'index.html';
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
