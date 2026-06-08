# Kalendarz Webowy w Architekturze Mikrousług z Zautomatyzowanym Potokiem CI/CD

* **Autor:** Wojciech Brzozowski
* **Przedmiot:** Technologie chmurowe
* **Sekcja:** Jednoosobowa

---

* **Repozytorium GitHub:** [https://github.com/woj1634/projekt-TC](https://github.com/woj1634/projekt-TC)
* **Aplikacja Frontend (React):** [https://kalendarz-app-front-e0b2esdxgkfrergn.polandcentral-01.azurewebsites.net/](https://kalendarz-app-front-e0b2esdxgkfrergn.polandcentral-01.azurewebsites.net/)
* **Publiczne API Backend (Node.js):** [https://kalendarz-app-web-d8g2cge8b2dcaac9.polandcentral-01.azurewebsites.net/api/events](https://kalendarz-app-web-d8g2cge8b2dcaac9.polandcentral-01.azurewebsites.net/api/events)

---

## Stack technologiczny i architektura

Projekt zrealizowano w architekturze mikrousługowej z podziałem na dwa niezależne komponenty sieciowe:

* **Frontend:** Aplikacja React.js z biblioteką FullCalendar (widok dwumiesięczny). Komunikaty dla użytkownika są obsługiwane przez SweetAlert2.
* **Backend:** Serwer Node.js z frameworkiem Express.js, udostępniający REST API do zarządzania danymi kalendarza.
* **Baza danych:** Azure Cosmos DB ze skonfigurowanym interfejsem zgodnym z API dla MongoDB.
* **Konteneryzacja:** Docker – frontend i backend posiadają oddzielne pliki Dockerfile i działają jako autonomiczne kontenery.
* **Infrastruktura chmurowa:** Platforma Microsoft Azure (usługi Azure App Services oraz rejestr Azure Container Registry).
* **Automatyzacja:** GitHub Actions (potok CI/CD).

---

## Realizacja wymagań projektowych

### 1. Operacje CRUD i wykorzystanie chmury
Aplikacja umożliwia wykonywanie pełnego zestawu operacji CRUD (dodawanie, wyświetlanie, edycja oraz usuwanie wydarzeń). Dane są trwale zapisywane w bazie Cosmos DB, przez co stan kalendarza zostaje zachowany po odświeżeniu strony czy restarcie usług. 

Frontend i backend wdrożono jako osobne usługi (App Services) w chmurze Azure, co pozwala na ich niezależne skalowanie i aktualizację kodu bez przestojów całego systemu.

### 2. Bezpieczeństwo
Zabezpieczenie aplikacji i danych zrealizowano na trzech poziomach:
* **Szyfrowanie ruchu (w transporcie):** Komunikacja z aplikacją wymusza protokół HTTPS. W panelu Azure App Service włączono regułę „HTTPS Only”, która automatycznie przekierowuje nieszyfrowane żądania HTTP.
* **Komunikacja z bazą danych:** Połączenie z Azure Cosmos DB wykorzystuje protokół TLS/SSL. Zostało to skonfigurowane w kodzie backendu za pomocą flag `ssl: true` oraz `directConnection: true` w bibliotece Mongoose.
* **Ochrona danych w spoczynku:** Dane na dyskach chmury Azure są szyfrowane automatycznie przez dostawcę usług (Encryption at Rest).
* **Kwestia uwierzytelniania:** Kalendarz działa w formie tablicy publicznej (wspólnej dla wszystkich użytkowników) i nie przechowuje kont. Ze względu na brak modułu logowania, implementacja mechanizmów haszowania haseł (np. bcrypt) była w tym projekcie bezcelowa.

### 3. Konteneryzacja i podział na usługi
Projekt został odizolowany i podzielony na dwa kontenery Dockerowe:
* **Frontend** – odpowiada za interfejs użytkownika i renderowanie kalendarza.
* **Backend** – przetwarza żądania API, realizuje logikę i komunikuje się bezpośrednio z bazą danych.

Zbudowane lokalnie lub w potoku obrazy Docker trafiają do prywatnego rejestru Azure Container Registry (ACR). Usługi App Service są powiązane z tym rejestrem i automatycznie pobierają najnowsze wersje kontenerów po każdej aktualizacji.

### 4. Potok CI/CD i testy automatyczne
Proces budowania i dostarczania kodu zautomatyzowano przy użyciu GitHub Actions. Skrypt uruchamia się samoczynnie po każdym wykonaniu komendy `git push` na gałąź `main`.

Przebieg potoku:
1. Alokacja maszyny wirtualnej z systemem Ubuntu i konfiguracja środowiska Node.js (v20).
2. Pobranie kodu źródłowego i instalacja zależności z plików `package.json`.
3. Odpalenie testów integracyjnych API (`app.test.js`) napisanych przy użyciu frameworka Jest i biblioteki Supertest (polecenie `npm test`).
4. **Brama jakości (Quality Gate):** Jeśli testy zakończą się niepowodzeniem (np. API nie zwróci statusu 200 lub poprawnej struktury tablicy), działanie potoku zostaje natychmiast przerwane. Wdrożenie wadliwego kodu na chmurę zostaje zablokowane.
5. Po pomyślnym zaliczeniu testów, GitHub Actions loguje się do rejestru ACR, buduje obrazy Dockerowe i wypycha je do chmury.
6. Potok wywołuje dedykowany webhook Azure, co wymusza na App Service przeładowanie kontenerów i uruchomienie przetestowanej wersji aplikacji.
