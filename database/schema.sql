-- Schemat bazy danych
CREATE TABLE IF NOT EXISTS projekt.studenci (
    id SERIAL PRIMARY KEY,
    imie VARCHAR(255) NOT NULL
);

-- bazie danych, aby przechowywać dane użytkowników.
CREATE TABLE IF NOT EXISTS projekt.uzytkownicy (
    uzytkownik_id SERIAL PRIMARY KEY,
    nazwa_uzytkownika VARCHAR(50) NOT NULL UNIQUE,
    haslo VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    data_rejestracji TIMESTAMP DEFAULT NOW()
);

-- Aktualizacja tabeli studenci
-- Dodanie relacji między tabelą studenci a tabelą uzytkownicy.
ALTER TABLE projekt.studenci
ADD COLUMN uzytkownik_id INT,
ADD CONSTRAINT fk_uzytkownik_id FOREIGN KEY (uzytkownik_id) REFERENCES projekt.uzytkownicy(uzytkownik_id) ON DELETE SET NULL;


-- Tabela rezerwacji powiązana z użytkownikami oraz pokojami.
CREATE TABLE IF NOT EXISTS projekt.rezerwacje (
    rezerwacja_id SERIAL PRIMARY KEY,
    uzytkownik_id INT NOT NULL,
    pokoj_id INT NOT NULL,
    data_od DATE NOT NULL,
    data_do DATE NOT NULL,
    FOREIGN KEY (uzytkownik_id) REFERENCES projekt.uzytkownicy(uzytkownik_id) ON DELETE CASCADE,
    FOREIGN KEY (pokoj_id) REFERENCES projekt.pokoje(pokoj_id) ON DELETE CASCADE
);

-- 5. Procedury i wyzwalacze
-- Automatyczne przypisywanie użytkownika do studenta, jeśli istnieje relacja między nazwą użytkownika a numerem albumu.
CREATE OR REPLACE FUNCTION projekt.przypisz_uzytkownika_do_studenta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.nazwa_uzytkownika IS NOT NULL THEN
        UPDATE projekt.studenci
        SET uzytkownik_id = NEW.uzytkownik_id
        WHERE projekt.studenci.nr_albumu::TEXT = NEW.nazwa_uzytkownika;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER po_dodaniu_uzytkownika
AFTER INSERT ON projekt.uzytkownicy
FOR EACH ROW
EXECUTE FUNCTION projekt.przypisz_uzytkownika_do_studenta();


-- 6. Tworzenie całej struktury
-- Połącz wszystko w jeden plik SQL:
    -- Tworzenie schematu
    CREATE SCHEMA IF NOT EXISTS projekt;

    -- Ustawienie domyślnego schematu
    SET search_path TO projekt;

    -- Tabela użytkowników
    CREATE TABLE IF NOT EXISTS projekt.uzytkownicy (
        uzytkownik_id SERIAL PRIMARY KEY,
        nazwa_uzytkownika VARCHAR(50) NOT NULL UNIQUE,
        haslo VARCHAR(255) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        data_rejestracji TIMESTAMP DEFAULT NOW()
    );

    -- Aktualizacja tabeli studenci
    ALTER TABLE projekt.studenci
    ADD COLUMN uzytkownik_id INT,
    ADD CONSTRAINT fk_uzytkownik_id FOREIGN KEY (uzytkownik_id) REFERENCES projekt.uzytkownicy(uzytkownik_id) ON DELETE SET NULL;

    -- Tabela rezerwacje
    CREATE TABLE IF NOT EXISTS projekt.rezerwacje (
        rezerwacja_id SERIAL PRIMARY KEY,
        uzytkownik_id INT NOT NULL,
        pokoj_id INT NOT NULL,
        data_od DATE NOT NULL,
        data_do DATE NOT NULL,
        FOREIGN KEY (uzytkownik_id) REFERENCES projekt.uzytkownicy(uzytkownik_id) ON DELETE CASCADE,
        FOREIGN KEY (pokoj_id) REFERENCES projekt.pokoje(pokoj_id) ON DELETE CASCADE
    );

    -- Procedura przypisująca użytkownika do studenta
    CREATE OR REPLACE FUNCTION projekt.przypisz_uzytkownika_do_studenta()
    RETURNS TRIGGER AS $$
    BEGIN
        IF NEW.nazwa_uzytkownika IS NOT NULL THEN
            UPDATE projekt.studenci
            SET uzytkownik_id = NEW.uzytkownik_id
            WHERE projekt.studenci.nr_albumu::TEXT = NEW.nazwa_uzytkownika;
        END IF;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Wyzwalacz dla procedury
    CREATE TRIGGER po_dodaniu_uzytkownika
    AFTER INSERT ON projekt.uzytkownicy
    FOR EACH ROW
    EXECUTE FUNCTION projekt.przypisz_uzytkownika_do_studenta();


UPDATE projekt.uzytkownicy SET rola = 'admin' WHERE nazwa_uzytkownika = 'admin';