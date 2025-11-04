# Dokument wymagań produktu (PRD) - 10x Cards

## 1. Przegląd produktu

Celem produktu jest stworzenie aplikacji internetowej, która usprawnia proces tworzenia fiszek edukacyjnych poprzez wykorzystanie sztucznej inteligencji. Aplikacja "10x Cards" ma być prostym i szybkim generatorem oraz menedżerem fiszek, umożliwiającym użytkownikom tworzenie kart do nauki na podstawie wklejonego tekstu, a także manualne dodawanie i zarządzanie nimi. Wersja MVP skupia się na efektywnym tworzeniu i organizowaniu fiszek, celowo pomijając na tym etapie funkcjonalności aktywnej nauki, takie jak algorytmy powtórek.

## 2. Problem użytkownika

Głównym problemem, który rozwiązuje aplikacja, jest czasochłonność i wysiłek związany z manualnym tworzeniem wysokiej jakości fiszek. Tradycyjne metody wymagają od użytkowników samodzielnego identyfikowania kluczowych pojęć, formułowania pytań i odpowiedzi, co jest barierą zniechęcającą do regularnego korzystania z metody nauki opartej na powtórkach (spaced repetition), mimo jej udowodnionej skuteczności.

## 3. Wymagania funkcjonalne

### 3.1. System Użytkowników
- Rejestracja użytkownika za pomocą adresu e-mail i hasła.
- Logowanie do systemu.
- Możliwość wylogowania się.
- Uwierzytelnianie obsługiwane przez usługę zewnętrzną (Supabase Auth).

### 3.2. Generowanie Fiszki przez AI
- Interfejs umożliwiający wklejenie tekstu przez użytkownika.
- Walidacja długości wklejonego tekstu (minimum 100 znaków, maksimum 1000 znaków).
- Generowanie 12 propozycji fiszek w formacie "Pojęcie" (przód) - "Definicja" (tył) na podstawie tekstu.
- Możliwość przeglądania, edycji (w oknie modalnym), akceptowania lub usuwania pojedynczych propozycji.
- Akcje grupowe: "Zapisz Zaakceptowane" i "Odrzuć Wszystkie".
- Integracja z LLM przez OpenRouter z włączonym trybem prywatności.

### 3.3. Manualne Tworzenie Fiszki
- Dostępny prosty formularz z polami na "przód" i "tył" fiszki.
- Po dodaniu fiszki formularz jest automatycznie czyszczony, aby ułatwić dodawanie kolejnych.
- Stworzona fiszka jest od razu zapisywana na liście użytkownika.

### 3.4. Zarządzanie Fiszkami
- Jedna, wspólna lista wszystkich zapisanych fiszek (zarówno wygenerowanych przez AI, jak i dodanych manualnie).
- Lista prezentowana w formie kart (3 w jednym rzędzie).
- Możliwość wyszukiwania/filtrowania fiszek na liście.
- Domyślne sortowanie fiszek od najnowszych do najstarszych.
- Możliwość edycji i usuwania każdej zapisanej fiszki.

### 3.5. Przeglądanie Fiszki
- Prosty tryb przeglądania, wyświetlający jedną fiszkę na raz.
- Domyślnie widoczny jest przód fiszki.
- Po kliknięciu fiszka się odwraca, pokazując tył.
- Dostępna nawigacja "Następna" / "Poprzednia" do przechodzenia między fiszkami.

## 4. Granice produktu

Następujące funkcjonalności nie wchodzą w zakres wersji MVP:
- Zaawansowany algorytm powtórek (Spaced Repetition), taki jak SuperMemo czy Anki.
- Możliwość tworzenia i zarządzania tematycznymi zestawami/taliami fiszek.
- Import fiszek z plików (np. PDF, DOCX, CSV).
- Funkcje społecznościowe, takie jak współdzielenie zestawów fiszek między użytkownikami.
- Logowanie za pomocą zewnętrznych dostawców (np. Google, Facebook).
- Aplikacje mobilne (produkt będzie dostępny tylko jako aplikacja internetowa).
- Twarde limity generacji fiszek przez AI per użytkownik.

## 5. Historyjki użytkowników

### Moduł: Uwierzytelnianie

#### ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto za pomocą mojego adresu e-mail i hasła, aby móc zapisywać i zarządzać moimi fiszkami.
- Kryteria akceptacji:
  1. Użytkownik może wprowadzić adres e-mail i hasło w formularzu rejestracji.
  2. System waliduje poprawność formatu adresu e-mail.
  3. System waliduje siłę hasła (np. minimalna długość).
  4. Po pomyślnej rejestracji użytkownik jest automatycznie zalogowany i przekierowany na stronę główną.
  5. W przypadku błędu (np. zajęty e-mail) wyświetlany jest czytelny komunikat.

#### ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się na moje konto, aby uzyskać dostęp do moich fiszek.
- Kryteria akceptacji:
  1. Użytkownik może wprowadzić e-mail i hasło w formularzu logowania.
  2. Po pomyślnym zalogowaniu użytkownik jest przekierowany na stronę główną.
  3. W przypadku podania błędnych danych wyświetlany jest odpowiedni komunikat.

#### ID: US-003
- Tytuł: Wylogowywanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować, aby zabezpieczyć dostęp do mojego konta.
- Kryteria akceptacji:
  1. W interfejsie aplikacji znajduje się przycisk "Wyloguj".
  2. Po kliknięciu przycisku sesja użytkownika jest kończona i jest on przekierowywany na stronę logowania.

### Moduł: Generowanie fiszek AI

#### ID: US-004
- Tytuł: Generowanie propozycji fiszek przez AI
- Opis: Jako użytkownik, chcę wkleić tekst i otrzymać propozycje fiszek wygenerowane przez AI, aby szybko tworzyć materiały do nauki.
- Kryteria akceptacji:
  1. Na stronie głównej domyślnie aktywny jest widok "Generate".
  2. Użytkownik widzi pole tekstowe (`textarea`) i przycisk "Generate".
  3. Po wklejeniu tekstu i kliknięciu przycisku, system wyświetla 12 propozycji fiszek.
  4. Każda propozycja ma wyraźnie oznaczony przód ("Pojęcie") i tył ("Definicja").

#### ID: US-005
- Tytuł: Walidacja tekstu wejściowego dla AI
- Opis: Jako użytkownik, próbując wygenerować fiszki, chcę otrzymać informację zwrotną, jeśli mój tekst jest za krótki lub za długi.
- Kryteria akceptacji:
  1. Przycisk "Generate" jest nieaktywny, jeśli pole tekstowe jest puste.
  2. Jeśli tekst ma mniej niż 100 znaków, po próbie generacji wyświetla się komunikat o minimalnej wymaganej długości.
  3. Jeśli tekst ma więcej niż 1000 znaków, po próbie generacji wyświetla się komunikat o maksymalnej dopuszczalnej długości.
  4. Generowanie rozpoczyna się tylko dla tekstów o długości od 100 do 1000 znaków.

#### ID: US-006
- Tytuł: Zarządzanie pojedynczą propozycją fiszki
- Opis: Jako użytkownik, chcę móc edytować, zaakceptować lub usunąć każdą z wygenerowanych propozycji, aby dostosować je do moich potrzeb.
- Kryteria akceptacji:
  1. Przy każdej propozycji fiszki znajdują się przyciski "Edytuj", "Akceptuj", "Usuń" (jako czytelne ikony).
  2. Kliknięcie "Edytuj" otwiera okno modalne z formularzem do zmiany treści przodu i tyłu fiszki.
  3. Kliknięcie "Akceptuj" wizualnie oznacza fiszkę jako gotową do zapisu (np. zmienia kolor tła, pokazuje ikonę).
  4. Kliknięcie "Usuń" usuwa propozycję z listy.

#### ID: US-007
- Tytuł: Grupowe zarządzanie propozycjami fiszek
- Opis: Jako użytkownik, chcę móc szybko zapisać wszystkie zaakceptowane fiszki lub odrzucić wszystkie propozycje, aby usprawnić pracę.
- Kryteria akceptacji:
  1. Pod listą propozycji znajdują się przyciski "Zapisz Zaakceptowane" i "Odrzuć Wszystkie".
  2. Przycisk "Zapisz Zaakceptowane" jest aktywny tylko, jeśli co najmniej jedna propozycja jest zaakceptowana.
  3. Kliknięcie "Zapisz Zaakceptowane" dodaje wszystkie zaakceptowane fiszki do mojej kolekcji i czyści widok propozycji.
  4. Kliknięcie "Odrzuć Wszystkie" usuwa wszystkie propozycje z listy i czyści pole tekstowe.

### Moduł: Manualne tworzenie fiszek

#### ID: US-008
- Tytuł: Manualne tworzenie nowej fiszki
- Opis: Jako użytkownik, chcę mieć możliwość ręcznego dodania fiszki, gdy znam dokładną treść pytania i odpowiedzi.
- Kryteria akceptacji:
  1. Na stronie głównej mogę przełączyć się na widok "Add Manually".
  2. Widok ten zawiera formularz z polami "Przód", "Tył" i przyciskiem "Dodaj fiszkę".
  3. Po wypełnieniu pól i kliknięciu przycisku, fiszka jest dodawana do mojej kolekcji.
  4. Po dodaniu fiszki pola formularza są automatycznie czyszczone.
  5. Przycisk "Dodaj fiszkę" jest nieaktywny, jeśli oba pola są puste.

### Moduł: Zarządzanie kolekcją fiszek

#### ID: US-009
- Tytuł: Wyświetlanie listy zapisanych fiszek
- Opis: Jako użytkownik, chcę widzieć wszystkie moje zapisane fiszki w jednym miejscu, aby móc nimi zarządzać.
- Kryteria akceptacji:
  1. W nawigacji aplikacji jest link do mojej kolekcji fiszek - Zarządzaj.
  2. Kolekcja jest wyświetlana w formie siatki (grid) z kartami fiszek - 3 w jednym rzędzie, na których widać u góry Przód a na dole Tył fiszki, a także akcje "Edytuj" oraz "Usuń" (jako czytelne ikony).
  3. Fiszki są domyślnie posortowane od najnowszej do najstarszej.

#### ID: US-010
- Tytuł: Wyszukiwanie fiszek
- Opis: Jako użytkownik, chcę móc wyszukać konkretną fiszkę w mojej kolekcji, aby szybko ją znaleźć.
- Kryteria akceptacji:
  1. Nad siatką z fiszkami znajduje się pole wyszukiwania.
  2. Wpisywanie tekstu w pole filtruje listę fiszek w czasie rzeczywistym.
  3. Wyszukiwanie obejmuje zarówno przód, jak i tył fiszki.

#### ID: US-011
- Tytuł: Edycja istniejącej fiszki
- Opis: Jako użytkownik, chcę móc edytować treść zapisanej fiszki, aby poprawić błędy lub zaktualizować informacje.
- Kryteria akceptacji:
  1. Przy każdej fiszce w siatce znajduje się przycisk "Edytuj".
  2. Kliknięcie przycisku otwiera formularz edycji (np. w oknie modalnym) z załadowaną treścią fiszki.
  3. Po zapisaniu zmian, zaktualizowana treść jest widoczna na liście.

#### ID: US-012
- Tytuł: Usuwanie istniejącej fiszki
- Opis: Jako użytkownik, chcę móc usunąć fiszkę, której już nie potrzebuję.
- Kryteria akceptacji:
  1. Przy każdej fiszce w siatce znajduje się przycisk "Usuń".
  2. Kliknięcie przycisku powoduje wyświetlenie prośby o potwierdzenie.
  3. Po potwierdzeniu fiszka jest trwale usuwana z mojej kolekcji.

### Moduł: Przeglądanie fiszek

#### ID: US-013
- Tytuł: Przeglądanie fiszek w trybie nauki
- Opis: Jako użytkownik, chcę móc przeglądać moje fiszki jedna po drugiej, aby utrwalać wiedzę.
- Kryteria akceptacji:
  1. W widoku kolekcji jest przycisk "Ucz się", który uruchamia tryb przeglądania.
  2. W trybie przeglądania na ekranie widoczna jest jedna fiszka (domyślnie przód).
  3. Kliknięcie na fiszkę odsłania jej tył.
  4. Dostępne są przyciski "Następna" i "Poprzednia" do nawigacji po kolekcji.
  5. Po przejściu przez wszystkie fiszki, użytkownik może zakończyć przeglądanie lub zacząć od nowa.

## 6. Metryki sukcesu

- Wskaźnik akceptacji fiszek AI: 75% fiszek wygenerowanych przez AI jest akceptowanych przez użytkownika (tzn. zapisywanych w kolekcji po ewentualnych edycjach).
- Wskaźnik wykorzystania AI: Użytkownicy tworzą 75% wszystkich swoich fiszek przy użyciu generatora AI w porównaniu do tworzenia manualnego.
