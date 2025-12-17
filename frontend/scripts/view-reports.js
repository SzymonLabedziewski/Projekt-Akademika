// Funkcja do ładowania raportu wpłat studentów
async function loadPaymentsReport() {
    try {
        const response = await fetch('/api/students/report/payments', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const reportData = await response.json();
            const tableBody = document.querySelector('#payments-report-table tbody');
            tableBody.innerHTML = reportData.map(row => `
                <tr>
                    <td>${row.nr_albumu}</td>
                    <td>${row.imie}</td>
                    <td>${row.nazwisko}</td>
                    <td>${row.liczba_transakcji}</td>
                    <td>${Number(row.suma_oplat || 0).toFixed(2)}</td>
                </tr>
            `).join('');
        } else {
            alert('Nie udało się pobrać raportu wpłat.');
        }
    } catch (error) {
        console.error('Błąd podczas ładowania raportu wpłat:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
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
        if (sessionData.role !== 'admin') {
            alert('Brak uprawnień. Dostęp tylko dla administratora.');
            window.location.href = 'dashboard.html';
            return;
        }

        document.body.classList.remove('hidden');
        await loadPaymentsReport();
    } catch (error) {
        console.error('Błąd podczas sprawdzania sesji:', error);
        alert('Wystąpił problem z połączeniem.');
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