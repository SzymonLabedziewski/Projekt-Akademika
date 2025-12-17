async function loadKierunki() {
    try {
        const response = await fetch('/api/kierunki', { credentials: 'include' });
        if (!response.ok) {
            throw new Error(`Błąd przy pobieraniu kierunków, status: ${response.status}`);
        }

        const kierunki = await response.json();
        const container = document.getElementById('kierunki-list');
        container.innerHTML = ''; // Wyczyść wcześniejszą zawartość

        kierunki.forEach(k => {
            // Każdy kierunek w osobnym <label>, aby tworzyć nową linijkę
            // Ale używamy "display: flex" by checkbox i tekst były w tym samym wierszu
            const label = document.createElement('label');
            label.style.display = 'flex';         // układ poziomy
            label.style.alignItems = 'center';    // wyrównanie checkboxa z tekstem w pionie
            label.style.marginBottom = '5px';     // odstęp między kolejnymi wierszami

            // Tworzymy checkbox
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.name = 'kierunki';
            checkbox.value = k.kierunek_id;

            // Dodajemy tekst kierunku
            // Nazwa atrybutu może być "nazwa_kierunku" / "nazwa" / "nazwaKierunku" — w zależności od API
            const textNode = document.createTextNode(k.nazwa_kierunku || k.nazwa);

            // Układ: [checkbox] [spacja] [tekst]
            label.appendChild(checkbox);
            label.appendChild(document.createTextNode(' '));
            label.appendChild(textNode);

            // Wstawiamy gotowy element do kontenera
            container.appendChild(label);
        });

    } catch (error) {
        console.error('Błąd przy loadKierunki:', error);
    }
}




let isEditMode = false; // Flaga, czy użytkownik edytuje dane

async function loadStudentData() {
    const submitButton = document.getElementById('submit-button');
    const deleteButton = document.getElementById('delete-button');
    const nrAlbumuField = document.getElementById('nr_albumu');

    try {
        const response = await fetch('/api/students', {
            method: 'GET',
            credentials: 'include'
        });

        if (response.ok) {
            const data = await response.json();

            if (data.nr_albumu) {
                nrAlbumuField.placeholder = data.nr_albumu;
                nrAlbumuField.value = data.nr_albumu;
                nrAlbumuField.disabled = true; // Zablokowanie edycji
            }
            if (data.imie) {
                document.getElementById('imie').placeholder = data.imie;
            }
            if (data.nazwisko) {
                document.getElementById('nazwisko').placeholder = data.nazwisko;
            }
            if (data.plec) {
                const plecSelect = document.getElementById('plec');
                plecSelect.value = data.plec;
            }
            if (data.rok_studiow) {
                document.getElementById('rok_studiow').placeholder = data.rok_studiow;
            }
            if (data.odleglosc_miejsca_zamieszkania) {
                document.getElementById('odleglosc_miejsca_zamieszkania')
                    .placeholder = data.odleglosc_miejsca_zamieszkania;
            }

            // Tryb edycji (student istnieje w bazie)
            isEditMode = true;
            submitButton.textContent = 'Edytuj dane';
            deleteButton.style.display = 'inline-block';
        } else if (response.status === 404) {
            console.warn('Brak danych studenta dla tego użytkownika.');
            isEditMode = false;
            submitButton.textContent = 'Zapisz dane';
            deleteButton.style.display = 'none';
        } else {
            console.warn('Wystąpił błąd podczas pobierania danych.');
        }
    } catch (error) {
        console.error('Błąd podczas pobierania danych studenta:', error);
        isEditMode = false;
        submitButton.textContent = 'Zapisz dane';
        deleteButton.style.display = 'none';
    }
}

// 3. Ładowanie kierunków przypisanych do studenta i zaznaczenie checkboxów
async function loadAssignedKierunki() {
    try {
        const response = await fetch('/api/students/courses', {
            method: 'GET',
            credentials: 'include'
        });

        // Może zwrócić 404, jeśli student nie istnieje, lub pustą tablicę
        if (response.ok) {
            const assignedKierunki = await response.json();
            assignedKierunki.forEach(kid => {
                const checkbox = document.querySelector(`input[name="kierunki"][value="${kid}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        } else {
            console.warn('Błąd podczas pobierania przypisanych kierunków.');
        }
    } catch (error) {
        console.error('Błąd podczas wczytywania przypisanych kierunków:', error);
    }
}


const form = document.getElementById('student-form');
form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    // Usuń numer albumu z danych podczas edycji
    if (isEditMode) {
        delete data.nr_albumu; // Nie przesyłaj numeru albumu
    }

    const rokStudiow = parseInt(data.rok_studiow, 10);
    if (isNaN(rokStudiow) || rokStudiow < 1 || rokStudiow > 5) {
        alert('Rok studiów musi być wartością z przedziału 1-5.');
        return;
    }

    try {
        const method = isEditMode ? 'PUT' : 'POST'; // Wybierz metodę w zależności od trybu
        const endpoint = '/api/students';
        const response = await fetch(endpoint, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'include'
        });

        if (!response.ok) {
            const result = await response.json();
            alert(`Błąd: ${result.message}`);
            return;
        }

        // 4.2 Przypisanie kierunków:
        // Odczytanie wszystkich *zaznaczonych* checkboxów "kierunki"
        const checkedKierunki = Array.from(
            document.querySelectorAll('input[name="kierunki"]:checked')
        ).map(ch => ch.value);

        if (checkedKierunki.length > 0) {
            const coursesResponse = await fetch('/api/students/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ kierunki: checkedKierunki })
            });

            if (!coursesResponse.ok) {
                const result2 = await coursesResponse.json();
                alert(`Błąd przypisywania kierunków: ${result2.message}`);
                return;
            }
        }
        
        alert('Dane studenta zostały zapisane.');
        window.location.reload();

    } catch (error) {
        console.error('Błąd podczas zapisu danych studenta:', error);
        alert('Wystąpił problem z połączeniem z serwerem.');
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Sprawdź, czy sesja jest aktywna
        const response = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        // Jeśli sesja nieaktywna -> przenieś na logowanie
        if (!response.ok) {
            alert('Nie jesteś zalogowany. Zostaniesz przeniesiony na stronę logowania.');
            window.location.href = 'index.html';
            return;
        }

        // Jeśli jest OK -> pokaż zawartość
        document.body.classList.remove('hidden');

        // Znajdź element do klikania (toggle) i kontener listy
        const toggle = document.getElementById('kierunki-toggle');
        const list = document.getElementById('kierunki-list');

        // Początkowo (np. w CSS) #kierunki-list ma display: none;
        // Klik -> przełącza widoczność
        toggle.addEventListener('click', () => {
            if (list.style.display === 'none') {
                list.style.display = 'block';
            } else {
                list.style.display = 'none';
            }
        });

        // Teraz ładujemy kierunki, dane studenta i zaznaczamy przypisane
        await loadKierunki();          // Wypełnia #kierunki-list checkboxami
        await loadStudentData();       // Ustawia placeholdery / dane w formularzu
        await loadAssignedKierunki();  // Zaznacza checkboxy, które student ma w bazie

    } catch (error) {
        console.error('Błąd podczas sprawdzania sesji:', error);
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
            const result = await response.json();
            alert(`Błąd: ${result.message}`);
        }
    } catch (error) {
        console.error('Błąd podczas wylogowania:', error);
    }
});

document.getElementById('delete-button').addEventListener('click', async () => {
    if (!confirm('Czy na pewno chcesz usunąć swoje dane?')) {
        return;
    }

    try {
        const response = await fetch('/api/students', {
            method: 'DELETE',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Dane zostały usunięte.');
            window.location.reload(); // Odśwież stronę po usunięciu danych
        } else {
            const result = await response.json();
            alert(`Błąd: ${result.message}`);
        }
    } catch (error) {
        console.error('Błąd podczas usuwania danych studenta:', error);
        alert('Wystąpił problem z usunięciem danych.');
    }
});