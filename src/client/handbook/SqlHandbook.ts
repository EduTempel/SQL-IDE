/**
 * Handbuch SQL (GSG): kurze Erklärungen mit Beispielabfragen. Alle Beispiele laufen auf einer kleinen
 * eigenen Beispieldatenbank „Schule“ (im Browser, unabhängig von der Datenbank des Projekts).
 * Der Sprachumfang folgt den Ergänzenden Hinweisen für das Abitur in Niedersachsen (Abschnitt
 * „Datenbankabfragen“); was darüber hinausgeht, steht gesondert im letzten Abschnitt.
 * Eigene Dateien, damit Updates des Originals möglichst ohne Konflikte übernommen werden können.
 */

export type SqlEntry = {
    title: string;
    /** kurze Erklärung (Markdown: **fett**, `Code`) */
    text: string;
    /** Beispiel (eine oder mehrere Anweisungen) */
    sql: string;
    /** danach ausführen und zeigen (für INSERT, UPDATE, DELETE, CREATE TABLE) */
    show?: string;
};

export type SqlSection = { id: string; title: string; icon: string; intro: string; entries: SqlEntry[] };

/** Beispieldatenbank „Schule“ */
export const SAMPLE_DATABASE: string[] = [
    `CREATE TABLE Lehrkraft (
    Kuerzel VARCHAR(3) PRIMARY KEY,
    Name VARCHAR(30) NOT NULL,
    Vorname VARCHAR(30) NOT NULL
)`,
    `CREATE TABLE Kurs (
    KNr INTEGER PRIMARY KEY,
    Fach VARCHAR(30) NOT NULL,
    Stufe INTEGER NOT NULL,
    Kuerzel VARCHAR(3) NOT NULL REFERENCES Lehrkraft(Kuerzel)
)`,
    `CREATE TABLE Schueler (
    SNr INTEGER PRIMARY KEY,
    Vorname VARCHAR(30) NOT NULL,
    Nachname VARCHAR(30) NOT NULL,
    Jahrgang INTEGER NOT NULL,
    Geburtsjahr INTEGER NOT NULL,
    Wohnort VARCHAR(40)
)`,
    `CREATE TABLE Belegung (
    SNr INTEGER NOT NULL REFERENCES Schueler(SNr),
    KNr INTEGER NOT NULL REFERENCES Kurs(KNr),
    Punkte INTEGER,
    PRIMARY KEY (SNr, KNr)
)`,
    `INSERT INTO Lehrkraft VALUES
    ('BER', 'Berger', 'Anna'),
    ('KAY', 'Kaya', 'Deniz'),
    ('NOW', 'Nowak', 'Lena'),
    ('SCH', 'Schulte', 'Tim')`,
    `INSERT INTO Kurs VALUES
    (1, 'Informatik', 12, 'KAY'),
    (2, 'Mathematik', 12, 'BER'),
    (3, 'Englisch', 12, 'NOW'),
    (4, 'Informatik', 11, 'KAY'),
    (5, 'Biologie', 11, 'SCH'),
    (6, 'Mathematik', 11, 'BER')`,
    `INSERT INTO Schueler VALUES
    (1, 'Mia', 'Becker', 12, 2008, 'Osnabrück'),
    (2, 'Ben', 'Yilmaz', 12, 2008, 'Belm'),
    (3, 'Emma', 'Schmidt', 12, 2007, 'Osnabrück'),
    (4, 'Noah', 'Hoffmann', 12, 2008, 'Wallenhorst'),
    (5, 'Lina', 'Wagner', 12, 2008, NULL),
    (6, 'Elias', 'Krüger', 12, 2007, 'Georgsmarienhütte'),
    (7, 'Sofia', 'Petrović', 11, 2009, 'Osnabrück'),
    (8, 'Paul', 'Meyer', 11, 2009, 'Bramsche'),
    (9, 'Hanna', 'Arslan', 11, 2009, 'Osnabrück'),
    (10, 'Leon', 'Fischer', 11, 2010, 'Belm'),
    (11, 'Clara', 'Wolf', 11, 2009, 'Wallenhorst'),
    (12, 'Jonas', 'Richter', 11, 2009, 'Osnabrück')`,
    `INSERT INTO Belegung VALUES
    (1, 1, 13), (1, 2, 11), (1, 3, 9),
    (2, 1, 8), (2, 2, 6), (2, 3, 12),
    (3, 1, 15), (3, 2, 14),
    (4, 2, 10), (4, 3, 7),
    (5, 1, 11), (5, 3, NULL),
    (6, 1, 5), (6, 2, 9), (6, 3, 10),
    (7, 4, 14), (7, 5, 12), (7, 6, 13),
    (8, 4, 7), (8, 6, 4),
    (9, 4, 12), (9, 5, 15), (9, 6, 11),
    (10, 5, 8), (10, 6, 6),
    (11, 4, 10), (11, 5, 9),
    (12, 4, 9), (12, 5, 11), (12, 6, 8)`,
];

/** Aufbau der Beispieldatenbank in Kurzschreibweise (Primärschlüssel unterstrichen, Fremdschlüssel mit ↑) */
export const SAMPLE_SCHEMA: { table: string; columns: { name: string; key?: boolean; foreign?: boolean }[] }[] = [
    { table: "Schueler", columns: [{ name: "SNr", key: true }, { name: "Vorname" }, { name: "Nachname" }, { name: "Jahrgang" }, { name: "Geburtsjahr" }, { name: "Wohnort" }] },
    { table: "Kurs", columns: [{ name: "KNr", key: true }, { name: "Fach" }, { name: "Stufe" }, { name: "Kuerzel", foreign: true }] },
    { table: "Lehrkraft", columns: [{ name: "Kuerzel", key: true }, { name: "Name" }, { name: "Vorname" }] },
    { table: "Belegung", columns: [{ name: "SNr", key: true, foreign: true }, { name: "KNr", key: true, foreign: true }, { name: "Punkte" }] },
];

export const SQL_HANDBOOK: SqlSection[] = [
    {
        id: "select", title: "Erste Abfragen (SELECT)", icon: "▤",
        intro: "Eine Abfrage beginnt mit `SELECT` (welche Spalten?) und `FROM` (aus welcher Tabelle?). Am Ende steht ein Semikolon. Groß- und Kleinschreibung der Schlüsselwörter ist egal; üblich ist, sie großzuschreiben.",
        entries: [
            {
                title: "Alle Daten einer Tabelle",
                text: "`*` steht für **alle Spalten**.",
                sql: "SELECT * FROM Schueler;",
            },
            {
                title: "Bestimmte Spalten",
                text: "Die gewünschten Spalten werden mit Komma getrennt aufgezählt – in der Reihenfolge, in der sie erscheinen sollen.",
                sql: "SELECT Nachname, Vorname FROM Schueler;",
            },
            {
                title: "Doppelte Zeilen weglassen (DISTINCT)",
                text: "`DISTINCT` zeigt jede Zeile nur einmal – hier jeden Wohnort nur einmal. Eine leere Zelle (`NULL`) bedeutet: Der Wert ist unbekannt.",
                sql: "SELECT DISTINCT Wohnort FROM Schueler;",
            },
            {
                title: "Spalten umbenennen (AS)",
                text: "Mit `AS` bekommt eine Spalte im Ergebnis einen anderen Namen (Alias).",
                sql: "SELECT Vorname AS Name, Jahrgang AS Stufe FROM Schueler;",
            },
            {
                title: "Rechnen",
                text: "In der Spaltenliste darf gerechnet werden: `+`, `-`, `*`, `/`.",
                sql: "SELECT Vorname, Nachname, 2026 - Geburtsjahr AS Lebensalter FROM Schueler;",
            },
        ],
    },
    {
        id: "where", title: "Zeilen auswählen (WHERE)", icon: "⊟",
        intro: "`WHERE` behält nur die Zeilen, für die die Bedingung wahr ist. Vergleiche: `=`, `!=` (ungleich), `<`, `>`, `<=`, `>=`. Texte stehen in **einfachen** Anführungszeichen.",
        entries: [
            {
                title: "Vergleichen",
                text: "Alle Schülerinnen und Schüler aus Jahrgang 12.",
                sql: "SELECT Vorname, Nachname FROM Schueler WHERE Jahrgang = 12;",
            },
            {
                title: "Texte vergleichen",
                text: "Bei Texten muss die Schreibweise genau stimmen.",
                sql: "SELECT Vorname, Nachname FROM Schueler WHERE Wohnort = 'Osnabrück';",
            },
            {
                title: "Bedingungen verknüpfen (AND, OR)",
                text: "`AND`: Beide Bedingungen müssen gelten. `OR`: Mindestens eine muss gelten. Klammern legen fest, was zuerst ausgewertet wird.",
                sql: "SELECT Vorname, Nachname, Wohnort FROM Schueler\nWHERE Jahrgang = 11 AND (Wohnort = 'Belm' OR Wohnort = 'Bramsche');",
            },
            {
                title: "Verneinen (NOT)",
                text: "`NOT` kehrt eine Bedingung um.",
                sql: "SELECT Fach, Stufe FROM Kurs WHERE NOT Fach = 'Informatik';",
            },
            {
                title: "Bereich (BETWEEN)",
                text: "`BETWEEN 13 AND 15` schließt beide Grenzen ein (13, 14 und 15).",
                sql: "SELECT SNr, KNr, Punkte FROM Belegung WHERE Punkte BETWEEN 13 AND 15;",
            },
            {
                title: "Liste von Werten (IN)",
                text: "`IN (…)` ist kürzer als mehrere Vergleiche mit `OR`.",
                sql: "SELECT KNr, Fach, Stufe FROM Kurs WHERE Fach IN ('Informatik', 'Biologie');",
            },
            {
                title: "Muster (LIKE)",
                text: "Platzhalter: `%` steht für beliebig viele Zeichen, `_` für **genau ein** Zeichen. `'W%'` passt zu allem, was mit W beginnt; `'_e%'` zu allem mit e an zweiter Stelle.",
                sql: "SELECT Vorname, Nachname FROM Schueler WHERE Nachname LIKE 'W%' OR Vorname LIKE '_e%';",
            },
            {
                title: "Fehlende Werte (IS NULL)",
                text: "Unbekannte Werte (`NULL`) findet man nur mit `IS NULL` – der Vergleich `= NULL` trifft nie zu. Gegenteil: `IS NOT NULL`.",
                sql: "SELECT Vorname, Nachname FROM Schueler WHERE Wohnort IS NULL;",
            },
        ],
    },
    {
        id: "order", title: "Sortieren und begrenzen", icon: "⇅",
        intro: "`ORDER BY` sortiert das Ergebnis: `ASC` aufsteigend (Standard), `DESC` absteigend. `LIMIT` begrenzt die Anzahl der Zeilen.",
        entries: [
            {
                title: "Sortieren",
                text: "Alphabetisch nach Nachnamen.",
                sql: "SELECT Nachname, Vorname FROM Schueler ORDER BY Nachname;",
            },
            {
                title: "Nach mehreren Spalten sortieren",
                text: "Zuerst nach Jahrgang absteigend; bei gleichem Jahrgang nach Nachnamen.",
                sql: "SELECT Jahrgang, Nachname, Vorname FROM Schueler ORDER BY Jahrgang DESC, Nachname ASC;",
            },
            {
                title: "Die besten drei (LIMIT)",
                text: "Erst absteigend sortieren, dann nur die ersten drei Zeilen nehmen.",
                sql: "SELECT SNr, KNr, Punkte FROM Belegung ORDER BY Punkte DESC LIMIT 3;",
            },
        ],
    },
    {
        id: "aggregat", title: "Aggregatfunktionen", icon: "Σ",
        intro: "Aggregatfunktionen fassen viele Zeilen zu **einem** Wert zusammen: `COUNT` (Anzahl), `SUM` (Summe), `AVG` (Durchschnitt), `MIN`, `MAX`. Leere Zellen (`NULL`) werden dabei nicht mitgezählt.",
        entries: [
            {
                title: "Zählen (COUNT)",
                text: "`COUNT(*)` zählt Zeilen.",
                sql: "SELECT COUNT(*) AS Anzahl FROM Schueler WHERE Jahrgang = 11;",
            },
            {
                title: "Durchschnitt (AVG)",
                text: "Durchschnittliche Punktzahl im Kurs 1. Die Zeile ohne Punkte zählt nicht mit.",
                sql: "SELECT AVG(Punkte) AS Durchschnitt FROM Belegung WHERE KNr = 1;",
            },
            {
                title: "Kleinster und größter Wert (MIN, MAX)",
                text: "Mehrere Aggregatfunktionen dürfen in einer Abfrage stehen.",
                sql: "SELECT MIN(Geburtsjahr) AS Aeltester, MAX(Geburtsjahr) AS Juengster FROM Schueler;",
            },
            {
                title: "Summe (SUM)",
                text: "Alle Punkte von Schüler Nummer 1 zusammengezählt.",
                sql: "SELECT SUM(Punkte) AS Summe FROM Belegung WHERE SNr = 1;",
            },
        ],
    },
    {
        id: "group", title: "Gruppieren (GROUP BY, HAVING)", icon: "▦",
        intro: "`GROUP BY` bildet Gruppen von Zeilen mit gleichem Wert; Aggregatfunktionen rechnen dann **je Gruppe**. Jede Spalte im `SELECT` muss entweder in `GROUP BY` stehen oder von einer Aggregatfunktion umschlossen sein. `HAVING` wählt Gruppen aus – wie `WHERE` für Zeilen.",
        entries: [
            {
                title: "Anzahl je Gruppe",
                text: "Wie viele wohnen an welchem Ort?",
                sql: "SELECT Wohnort, COUNT(*) AS Anzahl FROM Schueler GROUP BY Wohnort;",
            },
            {
                title: "Gruppieren und sortieren",
                text: "Durchschnitt je Kurs, der beste zuerst. Beim Sortieren darf der Alias verwendet werden.",
                sql: "SELECT KNr, AVG(Punkte) AS Schnitt FROM Belegung GROUP BY KNr ORDER BY Schnitt DESC;",
            },
            {
                title: "Gruppen auswählen (HAVING)",
                text: "Nur Kurse mit einem Durchschnitt von mindestens 10 Punkten. `WHERE` filtert Zeilen **vor** dem Gruppieren, `HAVING` Gruppen **danach**.",
                sql: "SELECT KNr, AVG(Punkte) AS Schnitt FROM Belegung GROUP BY KNr HAVING AVG(Punkte) >= 10;",
            },
        ],
    },
    {
        id: "join", title: "Mehrere Tabellen", icon: "⋈",
        intro: "Stehen mehrere Tabellen hinter `FROM`, wird jede Zeile der einen mit jeder Zeile der anderen kombiniert. Die Bedingung im `WHERE` behält nur die **passenden** Paare: Fremdschlüssel = Primärschlüssel. Gleich heißende Spalten schreibt man mit Tabellennamen davor, z. B. `Kurs.Kuerzel`.",
        entries: [
            {
                title: "Zwei Tabellen verbinden",
                text: "Zu jedem Kurs der Name der Lehrkraft.",
                sql: "SELECT Kurs.Fach, Kurs.Stufe, Lehrkraft.Name\nFROM Kurs, Lehrkraft\nWHERE Kurs.Kuerzel = Lehrkraft.Kuerzel;",
            },
            {
                title: "Kurznamen für Tabellen",
                text: "Hinter dem Tabellennamen darf ein Kurzname stehen (`Schueler s`). Das spart Schreibarbeit.",
                sql: "SELECT s.Vorname, s.Nachname, b.Punkte\nFROM Schueler s, Belegung b\nWHERE s.SNr = b.SNr AND b.KNr = 1;",
            },
            {
                title: "Drei Tabellen",
                text: "Für jede Verbindung eine Bedingung: Schueler–Belegung und Belegung–Kurs.",
                sql: "SELECT s.Nachname, k.Fach, b.Punkte\nFROM Schueler s, Belegung b, Kurs k\nWHERE s.SNr = b.SNr AND b.KNr = k.KNr AND k.Stufe = 12\nORDER BY s.Nachname, k.Fach;",
            },
            {
                title: "Verbinden und gruppieren",
                text: "Durchschnitt je Fach und Stufe – mit dem Namen des Fachs statt der Kursnummer.",
                sql: "SELECT k.Fach, k.Stufe, AVG(b.Punkte) AS Schnitt\nFROM Kurs k, Belegung b\nWHERE k.KNr = b.KNr\nGROUP BY k.Fach, k.Stufe\nORDER BY Schnitt DESC;",
            },
            {
                title: "Vorsicht: Bedingung vergessen",
                text: "Ohne Bedingung entsteht jede Kombination: 12 Schüler · 6 Kurse = 72 Zeilen – fast immer ein Fehler.",
                sql: "SELECT COUNT(*) AS Kombinationen FROM Schueler, Kurs;",
            },
        ],
    },
    {
        id: "mehr", title: "Über das Abitur hinaus", icon: "+",
        intro: "Diese Anweisungen kommen in den zentralen Abiturprüfungen nicht vor, sind aber nützlich: `JOIN`, Unterabfragen sowie Daten ändern und Tabellen anlegen. Hier im Handbuch wird für jedes Beispiel eine frische Beispieldatenbank verwendet – Änderungen sind danach wieder weg.",
        entries: [
            {
                title: "Verbinden mit JOIN … ON",
                text: "Dasselbe wie „Zwei Tabellen verbinden“, nur mit eigener Schreibweise für die Verbindung.",
                sql: "SELECT Kurs.Fach, Lehrkraft.Name\nFROM Kurs JOIN Lehrkraft ON Kurs.Kuerzel = Lehrkraft.Kuerzel;",
            },
            {
                title: "Unterabfrage",
                text: "Die innere Abfrage berechnet den Durchschnitt; die äußere zeigt alle Belegungen darüber.",
                sql: "SELECT SNr, KNr, Punkte FROM Belegung\nWHERE Punkte > (SELECT AVG(Punkte) FROM Belegung);",
            },
            {
                title: "Zeile einfügen (INSERT)",
                text: "Die Werte stehen in der Reihenfolge der Spalten.",
                sql: "INSERT INTO Schueler VALUES (13, 'Ida', 'Lange', 11, 2010, 'Osnabrück');",
                show: "SELECT * FROM Schueler WHERE SNr = 13;",
            },
            {
                title: "Werte ändern (UPDATE)",
                text: "**Ohne `WHERE` würden alle Zeilen geändert!**",
                sql: "UPDATE Belegung SET Punkte = 12 WHERE SNr = 5 AND KNr = 3;",
                show: "SELECT * FROM Belegung WHERE SNr = 5;",
            },
            {
                title: "Zeilen löschen (DELETE)",
                text: "Löscht alle Belegungen ohne Punkte. **Ohne `WHERE` wäre die Tabelle leer!**",
                sql: "DELETE FROM Belegung WHERE Punkte IS NULL;",
                show: "SELECT COUNT(*) AS Belegungen FROM Belegung;",
            },
            {
                title: "Tabelle anlegen (CREATE TABLE)",
                text: "Jede Spalte bekommt einen Namen und einen Datentyp; der Primärschlüssel wird gekennzeichnet.",
                sql: "CREATE TABLE AG (\n    AGNr INTEGER PRIMARY KEY,\n    Titel VARCHAR(40) NOT NULL,\n    Wochentag VARCHAR(10)\n);\nINSERT INTO AG VALUES (1, 'Robotik', 'Dienstag');",
                show: "SELECT * FROM AG;",
            },
        ],
    },
];
