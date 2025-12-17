document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Sprawdzenie sesji użytkownika
        const sessionResponse = await fetch('/api/session', {
            method: 'GET',
            credentials: 'include'
        });

        if (!sessionResponse.ok) {
            throw new Error('Sesja nieaktywna');
        }

        const user = await sessionResponse.json();

        // Sprawdzenie, czy użytkownik jest administratorem
        if (user.role !== 'admin') {
            alert('Brak uprawnień do przeglądania tej strony.');
            window.location.href = 'dashboard.html';
            return;
        }

        // Usunięcie klasy hidden, aby pokazać zawartość strony
        document.body.classList.remove('hidden');

        // Pobranie danych studenta
        const params = new URLSearchParams(window.location.search);
        const nr_albumu = params.get('nr_albumu');

        const studentResponse = await fetch(`/api/student/${nr_albumu}`);
        const student = await studentResponse.json();

        document.getElementById('student-info').innerText =
            `${student.imie} ${student.nazwisko} (${student.nr_albumu})\n- ${student.kierunki}`;


        document.getElementById('student-plec').innerText = student.plec === 'M' ? 'Mężczyzna' : 'Kobieta';

        // Pobranie listy mieszkańców pokoju
        const residentsResponse = await fetch(`/api/room-residents/${student.nr_albumu}`);
        const residents = await residentsResponse.json();

        const residentList = document.getElementById('room-residents');
        let genderMismatch = false;

        residentList.innerHTML = residents.map(resident => {
            let warning = '';
            if (resident.plec !== student.plec) {
                warning = '<span style="color: red; font-weight: bold;">(Inna płeć!)</span>';
                genderMismatch = true;
            }
            return `<li>${resident.imie} ${resident.nazwisko} (${resident.nr_albumu}) - ${resident.nazwa_kierunku} ${warning}</li>`;
        }).join('');

        // Wyświetlenie ostrzeżenia o różnicy płci
        if (genderMismatch) {
            const warningDiv = document.createElement('div');
            warningDiv.style.color = 'red';
            warningDiv.style.fontWeight = 'bold';
            warningDiv.innerText = 'Uwaga: Płeć studenta różni się od obecnych mieszkańców pokoju!';
            document.querySelector('.room-details').appendChild(warningDiv);
        }

    } catch (error) {
        console.error('Błąd podczas ładowania strony:', error);
        alert('Nie jesteś zalogowany lub nie masz dostępu.');
        window.location.href = 'index.html';
    }

    // Pobranie dostępnych pokoi
    try {
        const roomsResponse = await fetch('/api/available-rooms');
        const rooms = await roomsResponse.json();
        const select = document.getElementById('room-select');

        rooms.forEach(room => {
            const option = document.createElement('option');
            option.value = room.pokoj_id;
            option.textContent = `Mieszkanie ${room.mieszkanie_id}, Pokój ${room.pokoj_id} (Wolne miejsca: ${room.wolne_miejsca})`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Błąd pobierania pokoi:', error);
    }

    // Obsługa wyboru pokoju
    document.getElementById('room-select').addEventListener('change', async (event) => {
        const roomId = event.target.value;

        if (!roomId) {
            document.getElementById('room-details').style.display = 'none';
            return;
        }

        try {
            // Pobranie szczegółów pokoju
            const roomDetailsResponse = await fetch(`/api/available-rooms`);
            const rooms = await roomDetailsResponse.json();
            const selectedRoom = rooms.find(room => room.pokoj_id == roomId);

            document.getElementById('room-mieszkanie').innerText = selectedRoom.mieszkanie_id;
            document.getElementById('room-number').innerText = selectedRoom.pokoj_id;
            document.getElementById('room-places').innerText = selectedRoom.wolne_miejsca;
            document.getElementById('room-lozka-pojedyncze').innerText = selectedRoom.lozka_pojedyncze;
            document.getElementById('room-lozka-pietrowe').innerText = selectedRoom.lozka_pietrowe;
            document.getElementById('room-details').style.display = 'block';
            document.getElementById('assign-button').style.display = 'block';

            // Pobranie mieszkańców pokoju
            const residentsResponse = await fetch(`/api/room-residents/${roomId}`);
            const residents = await residentsResponse.json();
            const residentList = document.getElementById('room-residents');

            residentList.innerHTML = residents.map(resident =>
                `<li>${resident.imie} ${resident.nazwisko} (${resident.nr_albumu}) - ${resident.kierunki}</li>`
            ).join('');
        } catch (error) {
            console.error('Błąd pobierania danych pokoju:', error);
        }
    });

    // Obsługa przycisku przypisania pokoju
    document.getElementById('assign-button').addEventListener('click', async () => {
        const selectedRoomId = document.getElementById('room-select').value;
        const nr_albumu = new URLSearchParams(window.location.search).get('nr_albumu');
    
        if (!selectedRoomId) {
            alert('Proszę wybrać pokój przed zapisaniem.');
            return;
        }
    
        const data = { nr_albumu, pokoj_id: selectedRoomId };
    
        try {
            const response = await fetch('/api/assign-room', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });
    
            const result = await response.json();
    
            if (response.ok) {
                alert(`Pokój został przypisany pomyślnie! ID rezerwacji: ${result.rezerwacja_id}`);
                window.location.href = 'unassigned-students.html';
            } else {
                alert(`Nie udało się przypisać pokoju: ${result.message}`);
            }
        } catch (error) {
            console.error('Błąd podczas przypisywania pokoju:', error);
            alert('Wystąpił problem z połączeniem z serwerem.');
        }
    });    
});
