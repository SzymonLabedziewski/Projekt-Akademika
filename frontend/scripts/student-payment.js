async function loadStudentPayments() {
    try {
        const response = await fetch('/api/payments', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const { payments, total } = await response.json(); // Odbieramy płatności i sumę
            const tableBody = document.querySelector('#payments-table tbody');
            const header = document.querySelector('.container-table h1');

             // Konwersja total na liczbę i zaokrąglenie do dwóch miejsc po przecinku
            const totalAmount = parseFloat(total) || 0; // Obsługuje przypadek, gdy total jest null

            // Aktualizacja nagłówka z sumą
            header.textContent = `Twoje Płatności, SUMA: ${totalAmount.toFixed(2)} zł`;

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

document.getElementById('payment-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const amount = parseFloat(document.getElementById('amount').value);

    if (!amount || amount <= 0) {
        alert('Proszę wypełnić poprawnie wszystkie pola lub zalogować się ponownie.');
        return;
    }

    try {
        const response = await fetch('/api/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({amount }),
        });

        if (response.ok) {
            alert('Płatność została zapisana.');
            await loadStudentPayments(); // Odśwież tabelę
        } else {
            const result = await response.json();
            alert(`Błąd: ${result.message}`);
        }

    } catch (error) {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas przesyłania opłaty.');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!response.ok) {
            alert('Nie jesteś zalogowany. Zaloguj się ponownie.');
            return window.location.href = 'index.html';
        }

        document.body.classList.remove('hidden');
        await loadStudentPayments();
    } catch (error) {
        console.error('Błąd podczas weryfikacji sesji:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
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