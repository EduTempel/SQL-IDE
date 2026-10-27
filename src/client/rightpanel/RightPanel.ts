import "/assets/css/gsg-rightpanel.css";

/**
 * Rechter Bereich der SQL-IDE in zwei Teilen (GSG, wie in der Java-IDE):
 *  - oben: die Datenbank (Baum)
 *  - unten: das Handbuch
 * Dazwischen eine Trennlinie zum Ziehen (Höhe bleibt im Browser gespeichert, Doppelklick klappt zu/auf).
 * Der untere Teil startet zugeklappt; ein Klick auf „Handbuch“ oder das Menü klappt ihn auf.
 */

const KEY_HEIGHT = "gsg-sql-right-bottom-height";
const DEFAULT_HEIGHT = 360;
const MIN_HEIGHT = 90;
/** so viel Platz bleibt oben mindestens */
const MIN_TOP = 120;

const ICONS: Record<string, string> = {
    handbook: '<path d="M12 6c-2-1.5-5-2-8-1.5V19c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V4.5c-3-.5-6 0-8 1.5zM12 6v14.5"/>',
    collapse: '<path d="M6 9l6 6 6-6"/>',
    expand: '<path d="M6 15l6-6 6 6"/>',
};

function icon(name: string): string {
    return `<svg class="gsg-tab-icon" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ""}</svg>`;
}

function loadHeight(): number {
    try {
        const v = Number(localStorage.getItem(KEY_HEIGHT));
        return v && Number.isFinite(v) && v >= MIN_HEIGHT ? v : DEFAULT_HEIGHT;
    } catch {
        return DEFAULT_HEIGHT;
    }
}

export type RightSplit = {
    /** hierhin kommt der Inhalt des unteren Teils */
    body: HTMLElement;
    /** unteren Teil aufklappen */
    open: () => void;
    /** wird beim (ersten) Aufklappen aufgerufen */
    onOpen?: () => void;
};

/**
 * Teilt den rechten Bereich. Die vorhandene Reiterleiste samt Reitern wandert nach oben; nach
 * makeTabs aufrufen, damit die Reiter oben den unteren Teil nicht kennen.
 */
export function splitRightDiv(inner: HTMLElement, label: string, tooltip: string): RightSplit {
    inner.classList.add("gsg-split");
    const top = document.createElement("div");
    top.className = "gsg-right-top";
    const headings = inner.querySelector(":scope > .jo_tabheadings");
    const tabs = inner.querySelector(":scope > .jo_tabs");
    if (headings) top.append(headings);
    if (tabs) top.append(tabs);

    const splitter = document.createElement("div");
    splitter.className = "gsg-right-splitter";
    splitter.title = "Ziehen: Höhe ändern · Doppelklick: unteren Bereich zu- oder aufklappen";

    const bottom = document.createElement("div");
    bottom.className = "gsg-right-bottom";
    const bar = document.createElement("div");
    bar.className = "jo_tabheadings gsg-tabheadings";
    const heading = document.createElement("div");
    heading.className = "jo_tabheading jo_active gsg-tabheading";
    heading.title = tooltip;
    heading.innerHTML = `${icon("handbook")}<span class="gsg-tab-label"></span>`;
    heading.querySelector(".gsg-tab-label")!.textContent = label;
    const right = document.createElement("div");
    right.className = "jo_tabheading-right";
    const toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "gsg-right-toggle";
    right.append(toggle);
    bar.append(heading, right);
    const body = document.createElement("div");
    body.className = "gsg-right-body";
    bottom.append(bar, body);

    inner.append(top, splitter, bottom);

    let height = loadHeight();
    let collapsed = true;
    const split: RightSplit = { body, open: () => setCollapsed(false) };

    const apply = () => {
        const max = Math.max(MIN_HEIGHT, inner.clientHeight - MIN_TOP);
        bottom.classList.toggle("gsg-collapsed", collapsed);
        bottom.style.height = collapsed ? "" : Math.min(height, max) + "px";
        splitter.classList.toggle("gsg-collapsed", collapsed);
        toggle.innerHTML = icon(collapsed ? "expand" : "collapse");
        toggle.title = collapsed ? "Bereich aufklappen" : "Bereich zuklappen";
        toggle.setAttribute("aria-expanded", String(!collapsed));
        if (!collapsed) split.onOpen?.();
    };
    const setCollapsed = (c: boolean) => {
        if (c === collapsed) return;
        collapsed = c;
        apply();
    };

    heading.addEventListener("click", () => setCollapsed(false));
    toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        setCollapsed(!collapsed);
    });
    splitter.addEventListener("dblclick", () => setCollapsed(!collapsed));

    splitter.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        const startY = e.clientY;
        const startHeight = collapsed ? MIN_HEIGHT : bottom.getBoundingClientRect().height;
        let moved = false;
        splitter.classList.add("gsg-dragging");
        const move = (ev: PointerEvent) => {
            const dy = startY - ev.clientY;
            if (!moved && Math.abs(dy) < 3) return;
            moved = true;
            const max = Math.max(MIN_HEIGHT, inner.clientHeight - MIN_TOP);
            height = Math.round(Math.min(max, Math.max(MIN_HEIGHT, startHeight + dy)));
            collapsed = false;
            bottom.classList.remove("gsg-collapsed");
            splitter.classList.remove("gsg-collapsed");
            bottom.style.height = height + "px";
        };
        const up = () => {
            window.removeEventListener("pointermove", move);
            window.removeEventListener("pointerup", up);
            window.removeEventListener("pointercancel", up);
            splitter.classList.remove("gsg-dragging");
            if (!moved) return;
            try { localStorage.setItem(KEY_HEIGHT, String(height)); } catch { /* egal */ }
            apply();
        };
        // am ganzen Fenster lauschen: die Maus verlässt die schmale Trennlinie beim Ziehen sofort
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", up);
        window.addEventListener("pointercancel", up);
    });

    // Fenster kleiner: oben muss Platz bleiben
    new ResizeObserver(() => { if (!collapsed) apply(); }).observe(inner);

    apply();
    return split;
}
