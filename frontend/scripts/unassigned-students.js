document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Sesja nieaktywna');
        }

        const user = await response.json();

        // Sprawdzenie, czy użytkownik ma rolę administratora
        if (user.role !== 'admin') {
            alert('Brak uprawnień do przeglądania tej strony.');
            window.location.href = 'dashboard.html';
            return;
        }

        // Usunięcie klasy hidden, jeśli użytkownik jest adminem
        document.body.classList.remove('hidden');

        // Pobranie listy studentów
        const studentsResponse = await fetch('/api/unassigned-students', {
            method: 'GET',
            credentials: 'include'
        });

        if (studentsResponse.ok) {
            const students = await studentsResponse.json();
            const tableBody = document.querySelector('#students-table tbody');

            tableBody.innerHTML = students.map(student => `
                <tr>
                    <td>${student.nr_albumu}</td>
                    <td>${student.imie}</td>
                    <td>${student.nazwisko}</td>
                    <td>${student.plec}</td>
                    <td>${student.rok_studiow}</td>
                    <td>${student.kierunki || 'Brak kierunku'}</td>
                    <td>${student.odleglosc_miejsca_zamieszkania} km</td>
                    <td>
                        <button class="assign-room-btn" data-nr_albumu="${student.nr_albumu}">
                            Przydziel pokój
                        </button>
                    </td>
                </tr>
            `).join('');

            document.querySelectorAll('.assign-room-btn').forEach(button => {
                button.addEventListener('click', (event) => {
                    const nr_albumu = event.target.getAttribute('data-nr_albumu');
                    window.location.href = `assign-room.html?nr_albumu=${nr_albumu}`;
                });
            });
        } else {
            alert('Nie udało się pobrać listy studentów.');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania studentów:', error);
        alert('Nie jesteś zalogowany lub nie masz dostępu.');
        window.location.href = 'index.html';
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
