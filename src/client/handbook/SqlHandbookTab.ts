import * as monaco from "monaco-editor";
import markdownit from "markdown-it";
import wasmUrl from "sql.js/dist/sql-wasm.wasm?url";
import type { MainBase } from "../main/MainBase.js";
import type { RightSplit } from "../rightpanel/RightPanel.js";
import { SAMPLE_DATABASE, SAMPLE_SCHEMA, SQL_HANDBOOK, type SqlEntry, type SqlSection } from "./SqlHandbook.js";
import "/assets/css/gsg-sqlhandbook.css";

/**
 * Handbuch im unteren Teil des rechten Bereichs der SQL-IDE (GSG): Erklärungen und Beispielabfragen,
 * gegliedert in Abschnitte zum Aufklappen, mit Suche. „▶ Ausführen“ zeigt das Ergebnis gleich im
 * Handbuch – auf der Beispieldatenbank „Schule“, die für jedes Beispiel frisch angelegt wird (die
 * Datenbank des Projekts bleibt unberührt). „In den Editor“ fügt das Beispiel in den Editor ein.
 * Idee wie das Handbuch der Java-IDE.
 */

const MAX_ROWS = 20;

const md = markdownit({ html: false, linkify: false, breaks: false });

function el<K extends keyof HTMLElementTagNameMap>(tag: K, cls?: string, text?: string): HTMLElementTagNameMap[K] {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
}

type QueryResult = { columns: string[]; values: unknown[][] };
type SqlDatabase = { exec(sql: string): QueryResult[]; close(): void };
type SqlStatic = { Database: new () => SqlDatabase };

let sqlJs: Promise<SqlStatic> | undefined;
/** sql.js erst beim ersten Ausführen laden */
function loadSqlJs(): Promise<SqlStatic> {
    sqlJs ??= import("sql.js/dist/sql-wasm").then((m) => (m.default as unknown as (c: object) => Promise<SqlStatic>)({ locateFile: () => wasmUrl }));
    return sqlJs;
}

/** Beispiel auf einer frischen Beispieldatenbank ausführen; Ergebnis der letzten Abfrage */
async function runExample(e: SqlEntry): Promise<QueryResult | undefined> {
    const SQL = await loadSqlJs();
    const db = new SQL.Database();
    try {
        for (const q of SAMPLE_DATABASE) db.exec(q);
        let results = db.exec(e.sql);
        if (e.show) results = db.exec(e.show);
        return results[results.length - 1];
    } finally {
        db.close();
    }
}

let opener: (() => void) | undefined;

/** Handbuch zeigen (Menü „Hilfe → Handbuch SQL“) */
export function openSqlHandbook() {
    opener?.();
}

/** Handbuch in den unteren Teil des rechten Bereichs setzen (wie in der Java-IDE) */
export function addSqlHandbookTab(main: MainBase, split: RightSplit) {
    const tab = el("div", "gsg-sqlhb");
    split.body.append(tab);

    let query = "";
    const opened = new Set<string>();
    let rendered = false;

    const render = () => {
        rendered = true;
        const scroll = tab.querySelector(".gsg-sqlhb-content")?.scrollTop ?? 0;
        tab.innerHTML = "";
        tab.append(header());
        const content = el("div", "gsg-sqlhb-content");
        const q = query.trim().toLowerCase();
        if (!q) content.append(intro());
        let found = 0;
        for (const s of SQL_HANDBOOK) {
            const entries = s.entries.filter((e) => !q || (e.title + " " + e.text + " " + e.sql).toLowerCase().includes(q));
            if (q && !entries.length) continue;
            found += entries.length;
            content.append(section(s, entries, !!q));
        }
        if (q && !found) content.append(el("p", "gsg-sqlhb-empty", `Nichts gefunden zu „${query.trim()}“.`));
        tab.append(content);
        content.scrollTop = scroll;
    };

    const header = (): HTMLElement => {
        const head = el("div", "gsg-sqlhb-head");
        head.append(el("span", "gsg-sqlhb-title", "Handbuch SQL"));
        const search = el("input", "gsg-sqlhb-search");
        search.type = "search";
        search.placeholder = "Suchen …";
        search.value = query;
        search.setAttribute("aria-label", "Im Handbuch suchen");
        let timer: number | undefined;
        search.addEventListener("input", () => {
            clearTimeout(timer);
            timer = window.setTimeout(() => {
                query = search.value;
                render();
                const again = tab.querySelector<HTMLInputElement>(".gsg-sqlhb-search");
                again?.focus();
                again?.setSelectionRange(again.value.length, again.value.length);
            }, 200);
        });
        head.append(search);
        return head;
    };

    const intro = (): HTMLElement => {
        const box = el("div", "gsg-sqlhb-intro");
        const p = el("p");
        p.innerHTML = "Die Beispiele laufen auf der kleinen Beispieldatenbank <b>Schule</b>. Mit <b>▶ Ausführen</b> erscheint das Ergebnis gleich hier – deine eigene Datenbank bleibt unverändert. <b>In den Editor</b> übernimmt ein Beispiel in deinen Editor.";
        box.append(p);
        // Aufbau in Kurzschreibweise wie in den Abituraufgaben
        const schema = el("div", "gsg-sqlhb-schema");
        for (const t of SAMPLE_SCHEMA) {
            const line = el("div");
            line.append(el("b", undefined, t.table), document.createTextNode("("));
            t.columns.forEach((c, i) => {
                if (i) line.append(document.createTextNode(", "));
                const name = el(c.key ? "u" : "span", undefined, (c.foreign ? "↑" : "") + c.name);
                line.append(name);
            });
            line.append(document.createTextNode(")"));
            schema.append(line);
        }
        box.append(schema, el("p", "gsg-sqlhb-note", "Unterstrichen: Primärschlüssel · ↑: Fremdschlüssel. In Belegung steht für jede Schülerin und jeden Schüler, welche Kurse belegt sind und wie viele Punkte es gab."));
        return box;
    };

    const section = (s: SqlSection, entries: SqlEntry[], searching: boolean): HTMLElement => {
        const d = el("details", "gsg-sqlhb-section");
        d.open = searching || opened.has(s.id);
        const sum = el("summary");
        sum.append(el("span", "gsg-sqlhb-icon", s.icon), el("span", "gsg-sqlhb-stitle", s.title), el("span", "gsg-sqlhb-count", String(entries.length)));
        d.append(sum);
        const fill = () => {
            if (d.querySelector(".gsg-sqlhb-body")) return;
            const body = el("div", "gsg-sqlhb-body");
            const text = el("div", "gsg-sqlhb-text");
            text.innerHTML = md.render(s.intro);
            body.append(text);
            for (const e of entries) body.append(entry(e));
            d.append(body);
        };
        if (d.open) fill();
        d.addEventListener("toggle", () => {
            if (searching) return;
            if (d.open) { opened.add(s.id); fill(); } else opened.delete(s.id);
        });
        return d;
    };

    const entry = (e: SqlEntry): HTMLElement => {
        const box = el("div", "gsg-sqlhb-entry");
        box.append(el("h4", "gsg-sqlhb-etitle", e.title));
        const text = el("div", "gsg-sqlhb-text");
        text.innerHTML = md.render(e.text);
        box.append(text);
        const pre = el("pre", "gsg-sqlhb-sql");
        pre.textContent = e.sql;
        // normale Leerzeichen statt &nbsp;: lange Zeilen brechen in der schmalen Spalte um
        monaco.editor.colorize(e.sql, "vscSQL", { tabSize: 4 }).then((html) => { pre.innerHTML = html.replace(/&nbsp;| /g, " "); }).catch(() => { /* ohne Farben */ });
        box.append(pre);
        const result = el("div", "gsg-sqlhb-result");
        const actions = el("div", "gsg-sqlhb-actions");
        const run = el("button", "gsg-sqlhb-button gsg-sqlhb-primary", "▶ Ausführen");
        run.type = "button";
        run.title = "Auf der Beispieldatenbank ausführen und das Ergebnis hier zeigen";
        run.addEventListener("click", async () => {
            run.disabled = true;
            result.textContent = "Wird ausgeführt …";
            try {
                showResult(result, await runExample(e));
            } catch (err) {
                result.textContent = "Fehler: " + (err instanceof Error ? err.message : String(err));
                result.classList.add("gsg-sqlhb-error");
            } finally {
                run.disabled = false;
            }
        });
        const copy = el("button", "gsg-sqlhb-button", "In den Editor");
        copy.type = "button";
        copy.title = "Beispiel am Ende deines Editors einfügen (es läuft dann auf deiner Datenbank)";
        copy.addEventListener("click", () => toEditor(e));
        actions.append(run, copy);
        box.append(actions, result);
        return box;
    };

    const showResult = (target: HTMLElement, r: QueryResult | undefined) => {
        target.classList.remove("gsg-sqlhb-error");
        target.innerHTML = "";
        if (!r) {
            target.textContent = "Ausgeführt – die Abfrage liefert keine Zeilen.";
            return;
        }
        const wrap = el("div", "gsg-sqlhb-tablewrap");
        const table = el("table", "gsg-sqlhb-table");
        const head = el("tr");
        for (const c of r.columns) head.append(el("th", undefined, c));
        table.append(head);
        for (const row of r.values.slice(0, MAX_ROWS)) {
            const tr = el("tr");
            for (const v of row) tr.append(v === null ? el("td", "gsg-sqlhb-null", "NULL") : el("td", typeof v === "number" ? "gsg-sqlhb-num" : undefined, String(v)));
            table.append(tr);
        }
        wrap.append(table);
        target.append(wrap);
        const n = r.values.length;
        target.append(el("div", "gsg-sqlhb-rows", n > MAX_ROWS ? `${n} Zeilen (die ersten ${MAX_ROWS} gezeigt)` : n === 1 ? "1 Zeile" : `${n} Zeilen`));
    };

    const toEditor = (e: SqlEntry) => {
        const editor = main.getMonacoEditor?.();
        const model = editor?.getModel();
        if (!editor || !model || !main.getCurrentWorkspace?.()) {
            alert("Bitte zuerst links eine Datenbank (ein Projekt) auswählen.");
            return;
        }
        if (editor.getOption(monaco.editor.EditorOption.readOnly)) {
            alert("Der Editor ist gerade schreibgeschützt.");
            return;
        }
        const last = model.getLineCount();
        const end = model.getLineMaxColumn(last);
        const before = model.getValueInRange({ startLineNumber: last, startColumn: 1, endLineNumber: last, endColumn: end }).trim() ? "\n\n" : model.getValueLength() ? "\n" : "";
        const text = before + "-- aus dem Handbuch: " + e.title + "\n" + e.sql + "\n";
        editor.executeEdits("gsg-handbuch", [{ range: new monaco.Range(last, end, last, end), text, forceMoveMarkers: true }]);
        editor.pushUndoStop();
        const lines = model.getLineCount();
        editor.setPosition({ lineNumber: lines, column: 1 });
        editor.revealLineInCenter(lines);
        editor.focus();
    };

    split.onOpen = () => { if (!rendered) render(); };

    opener = () => {
        split.open();
        if (!rendered) render();
    };
}
