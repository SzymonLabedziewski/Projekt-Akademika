function formatDate(isoString) {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Miesiące od 0 do 11
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}
async function loadPayments() {
    try {
        const response = await fetch('/api/payments/all', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const payments = await response.json();
            const tableBody = document.querySelector('#payments-table tbody');
            tableBody.innerHTML = payments.map(payment => `
                <tr>
                    <td>${payment.transakcja_nr}</td>
                    <td>${payment.nr_albumu}</td>
                    <td>${payment.kwota}</td>
                    <td>${payment.data_platnosci}</td>
                    <td>${payment.godzina_platnosci}</td>
                </tr>
            `).join('');
        } else {
            alert('Nie udało się pobrać danych o płatnościach.');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania płatności:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Sprawdź sesję użytkownika
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            alert('Nie jesteś zalogowany. Zostaniesz przeniesiony na stronę logowania.');
            window.location.href = 'index.html';
            return;
        }

        const sessionData = await response.json();

        // Sprawdź, czy użytkownik jest administratorem
        if (sessionData.role !== 'admin') {
            alert('Brak uprawnień. Dostęp tylko dla administratora.');
            window.location.href = 'dashboard.html'; // Przekieruj do dashboardu
            return;
        }

        document.body.classList.remove('hidden'); // Pokaż stronę, jeśli użytkownik jest adminem
        await loadPayments(); // Załaduj dane płatności
    } catch (error) {
        console.error('Błąd podczas sprawdzania sesji:', error);
        alert('Wystąpił problem z połączeniem. Spróbuj ponownie.');
        window.location.href = 'index.html';
    }
});

document.getElementById('search-input').addEventListener('input', function () {
    const query = this.value.toLowerCase(); // Wprowadzone zapytanie
    const rows = document.querySelectorAll('#payments-table tbody tr'); // Wszystkie wiersze tabeli

    rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td')); // Komórki w wierszu
        const matches = cells.some(cell => cell.textContent.toLowerCase().includes(query)); // Czy któraś komórka zawiera zapytanie

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