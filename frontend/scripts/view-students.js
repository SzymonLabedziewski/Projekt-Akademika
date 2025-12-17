async function loadStudents() {
    try {
        const response = await fetch('/api/students/all', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const students = await response.json();
            const tableBody = document.querySelector('#students-table tbody');
            tableBody.innerHTML = students.map(student => `
                <tr>
                    <td>${student.nr_albumu}</td>
                    <td>${student.imie}</td>
                    <td>${student.nazwisko}</td>
                    <td>${student.plec}</td>
                    <td>${student.rok_studiow}</td>
                    <td>${student.kierunki ? student.kierunki.join(', ') : 'Brak'}</td>
                    <td>${student.odleglosc_miejsca_zamieszkania}</td>
                </tr>
            `).join('');
        } else {
            alert('Nie udało się pobrać danych studentów.');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania studentów:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
    }
}

function sortTable(column, order) {
        const table = document.getElementById('students-table');
    const rows = Array.from(table.querySelectorAll('tbody tr'));

    rows.sort((a, b) => {
        const aText = a.querySelector(`td:nth-child(${column})`).textContent.trim();
        const bText = b.querySelector(`td:nth-child(${column})`).textContent.trim();

        // Sprawdzenie czy wartości to liczby czy tekst
        const aValue = isNaN(aText) ? aText.toLowerCase() : parseFloat(aText);
        const bValue = isNaN(bText) ? bText.toLowerCase() : parseFloat(bText);

        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return order === 'asc' ? aValue - bValue : bValue - aValue;
        } else if (typeof aValue === 'string' && typeof bValue === 'string') {
            return order === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        } else {
            return 0;
        }
    });

    const tbody = table.querySelector('tbody');
    tbody.innerHTML = '';
    rows.forEach(row => tbody.appendChild(row));
}


let originalRows = [];

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            alert('Nie jesteś zalogowany.');
            window.location.href = 'index.html';
            return; // Zakończ dalsze przetwarzanie
        }

        const sessionData = await response.json();

        // Sprawdzenie, czy użytkownik jest administratorem
        if (sessionData.role !== 'admin') {
            alert('Brak uprawnień. Dostęp tylko dla administratora.');
            window.location.href = 'dashboard.html';
            return; // Zakończ dalsze przetwarzanie
        }

        // Jeśli użytkownik jest zalogowany i jest administratorem
        document.body.classList.remove('hidden'); // Usuń klasę `hidden`
        await loadStudents(); // Wczytaj dane studentów

        // Zapisanie oryginalnej kolejności wierszy w tabeli
        const tableBody = document.querySelector('#students-table tbody');
        originalRows = Array.from(tableBody.querySelectorAll('tr'));
    } catch (error) {
        console.error('Błąd podczas sprawdzania sesji:', error);
        alert('Wystąpił problem z połączeniem. Spróbuj ponownie.');
        window.location.href = 'index.html';
    }
});


document.querySelectorAll('th').forEach((header, index) => {
    // Dodaj strzałkę sortowania do nagłówka
    const arrow = document.createElement('span');
    arrow.className = 'sort-arrow hidden';
    header.appendChild(arrow);

    // Ustaw indeks kolumny jako atrybut
    header.dataset.index = index + 1;

    header.addEventListener('click', () => {
        const column = parseInt(header.dataset.index, 10);
        const currentOrder = header.dataset.order || null;

        // Zmiana kolejności: asc -> desc -> brak
        const newOrder = currentOrder === 'asc' ? 'desc' : currentOrder === 'desc' ? null : 'asc';

        // Ukrycie wszystkich strzałek i resetowanie stanu sortowania
        document.querySelectorAll('.sort-arrow').forEach(a => a.classList.add('hidden'));
        document.querySelectorAll('th').forEach(th => delete th.dataset.order);

        if (newOrder) {
            header.dataset.order = newOrder;
            arrow.classList.remove('hidden', 'asc', 'desc');
            arrow.classList.add(newOrder);
            sortTable(column, newOrder);
        } else {
            // Przywrócenie oryginalnej kolejności tabeli
            const tbody = document.querySelector('#students-table tbody');
            if (originalRows.length > 0) {
                tbody.innerHTML = '';
                originalRows.forEach(row => tbody.appendChild(row));
            }
            arrow.classList.add('hidden');
        }
    });
});


document.getElementById('search-input').addEventListener('input', function () {
    const query = this.value.toLowerCase(); // Wprowadzone zapytanie (małe litery)
    const rows = document.querySelectorAll('#students-table tbody tr'); // Wszystkie wiersze tabeli

    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')); // Wszystkie komórki w wierszu
        const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query)); // Sprawdza, czy któraś komórka zawiera zapytanie

        if (matches) {
            row.style.display = ''; // Pokaż wiersz
        } else {
            row.style.display = 'none'; // Ukryj wiersz
        }
    });
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