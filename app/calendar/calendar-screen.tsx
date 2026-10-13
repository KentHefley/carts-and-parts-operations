"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar, { type DatesSetInfo, type EventClickInfo, type EventDisplayInfo } from "@fullcalendar/react";
import themePlugin from "@fullcalendar/react/themes/monarch";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/monarch/theme.css";
import "@fullcalendar/react/themes/monarch/palettes/blue.css";
import { DateTime } from "luxon";
import { useRouter } from "next/navigation";
import { expandEntries, textColor, type CalendarKind, type Entry, type Person, type Category, type EventDetails, type Occurrence } from "../../lib/calendar-model";
import { saveEvent, saveSetting } from "./actions";
const plugins = [themePlugin, dayGridPlugin];
const toolbar = { start: "prev,next today", center: "title", end: "dayGridMonth,dayGridWeek,dayGridDay" };
const views = { dayGridMonth: { dayMaxEvents: 3 }, dayGridWeek: { dayMaxEvents: 3 }, dayGridDay: { dayMaxEvents: false } };
const zoneOptions = ["America/Chicago", "America/Denver", "America/Phoenix", "America/New_York", "America/Los_Angeles"];
const today = () => DateTime.now().setZone("America/Chicago").toISODate()!;

export function CalendarScreen({ kind, admin, entries, people, categories }: { kind: CalendarKind; admin: boolean; entries: Entry[]; people: Person[]; categories: Category[] }) {
  const [range, setRange] = useState({ from: DateTime.now().startOf("month").minus({ days: 7 }).toISODate()!, to: DateTime.now().endOf("month").plus({ days: 8 }).toISODate()! });
  const [filter, setFilter] = useState<string[]>([]);
  const peopleDropdown = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const closeOutside = (event: Event) => {
      const dropdown = peopleDropdown.current;
      if (dropdown?.open && event.target instanceof Node && !dropdown.contains(event.target)) dropdown.open = false;
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      const dropdown = peopleDropdown.current;
      if (event.key === "Escape" && dropdown?.open) {
        dropdown.open = false;
        dropdown.querySelector("summary")?.focus();
      }
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("focusin", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("focusin", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);
  const [zone, setZone] = useState("America/Chicago");
  const [selected, setSelected] = useState<Occurrence | "new" | null>(null);
  const [setting, setSetting] = useState<{ type: "person" | "category"; row?: Person | Category } | null>(null);
  const datesSet = useCallback((info: DatesSetInfo) => { const from = info.startStr.slice(0, 10), to = info.endStr.slice(0, 10); setRange(old => old.from === from && old.to === to ? old : { from, to }); }, []);
  const occurrences = useMemo(() => expandEntries(entries, people, categories, range.from, range.to).filter(event => !filter.length || event.details.people.some(id => filter.includes(id))), [entries, people, categories, range, filter]);
  const eventClick = useCallback((info: EventClickInfo) => { const event = occurrences.find(item => item.id === info.event.id); if (event) setSelected(event); }, [occurrences]);
  const render = useCallback((info: EventDisplayInfo) => {
    const event = info.event.extendedProps.occurrence as Occurrence;
    const person = people.find(item => item.id === event.details.primaryPerson);
    const category = categories.find(item => item.id === event.details.category);
    const title = `${kind === "employee" && category ? `${category.name}: ` : ""}${person && !event.title.toLowerCase().includes(person.name.toLowerCase()) ? `${person.name} — ` : ""}${event.title}`;
    return <span className="calendar-event-title" title={`${title}${event.allDay ? " · All day" : ` · ${DateTime.fromISO(event.start).setZone(event.details.zone).toFormat("MMM d, h:mm a")} ${event.details.zone}`}`}>{title}</span>;
  }, [people, categories, kind]);
  const events = useMemo(() => occurrences.map(event => ({ ...event, color: event.backgroundColor, contrastColor: event.textColor, display: "block", extendedProps: { occurrence: event } })), [occurrences]);
  const title = kind === "management" ? "Calendar" : "Time Off/Birthday Calendar";
  return <main className="screen-page calendar-screen"><div className="screen-heading"><div><h1>{title}</h1><p className="screen-caption">Manually maintained schedules · Sunday starts the week</p></div>{admin && <button className="primary-button" onClick={() => setSelected("new")}>Add Event</button>}</div>
    <div className="calendar-filters"><details ref={peopleDropdown}><summary>People {filter.length ? `(${filter.length} selected)` : "— All People"}</summary><fieldset><legend>Show events for any selected person</legend>{people.map(person => <label key={person.id}><input type="checkbox" checked={filter.includes(person.id)} onChange={event => setFilter(previous => event.target.checked ? [...previous, person.id] : previous.filter(id => id !== person.id))} />{person.name}{!person.active ? " (inactive)" : ""}</label>)}</fieldset></details><div className="calendar-selected-people" aria-label="Selected people">{people.filter(person => filter.includes(person.id)).map(person => <span className="calendar-person-chip" key={person.id}>{person.name}<button type="button" aria-label={`Remove ${person.name} from filters`} onClick={() => setFilter(previous => previous.filter(id => id !== person.id))}>×</button></span>)}</div><button onClick={() => setFilter([])}>Clear Filters</button><label className="calendar-grid-zone">Grid time zone<select value={zone} onChange={event => setZone(event.target.value)}>{zoneOptions.map(value => <option key={value}>{value}</option>)}</select></label></div>
    <p className="screen-caption">Timed bars use the grid time zone. Open an event for its location’s local time and full details. All-day dates stay unchanged.</p>
    <div className="calendar-legend" aria-label={kind === "management" ? "Person colors" : "Category colors"}>{(kind === "management" ? people : categories).filter(item => item.active).map(item => <span key={item.id} style={{ background: item.color, color: textColor(item.color) }}>{item.name}</span>)}{kind === "management" && <span style={{ background: "#596575", color: "white" }}>No person</span>}</div>
    <div className="calendar-grid"><FullCalendar plugins={plugins} initialView="dayGridMonth" firstDay={0} headerToolbar={toolbar} views={views} timeZone={zone} events={events} eventClick={eventClick} eventContent={render} datesSet={datesSet} moreLinkClick="day" displayEventTime={false} eventInteractive editable={false} height="auto" /></div>
    {!occurrences.length && <p role="status">No events in this date range for the selected people.</p>}
    {admin && <details className="calendar-settings"><summary>Calendar Settings</summary>
      <div className="calendar-settings-sections">
        <section aria-labelledby="calendar-people-heading">
          <header><h2 id="calendar-people-heading">People</h2><button onClick={() => setSetting({ type: "person" })}>Add Person</button></header>
          <p className="screen-caption">Manage names, calendar colors and active status. People can be listed without a login account.</p>
          <ul className="calendar-settings-list">{people.map(person => <li key={person.id}>
            <span className="calendar-setting-swatch" style={{ background: person.color }} aria-hidden="true" />
            <span className="calendar-setting-name">{person.name}<small>{person.active ? "Active" : "Inactive"}</small></span>
            <button aria-label={`Edit ${person.name}`} onClick={() => setSetting({ type: "person", row: person })}>Edit</button>
          </li>)}</ul>
        </section>
        {kind === "employee" && <section aria-labelledby="calendar-categories-heading">
          <header><h2 id="calendar-categories-heading">Event Categories</h2><button onClick={() => setSetting({ type: "category" })}>Add Category</button></header>
          <p className="screen-caption">Manage labels and colors for this employee calendar. Deactivation preserves existing events.</p>
          <ul className="calendar-settings-list">{categories.map(category => <li key={category.id}>
            <span className="calendar-setting-swatch" style={{ background: category.color }} aria-hidden="true" />
            <span className="calendar-setting-name">{category.name}<small>{category.active ? "Active" : "Inactive"}</small></span>
            <button aria-label={`Edit ${category.name}`} onClick={() => setSetting({ type: "category", row: category })}>Edit</button>
          </li>)}</ul>
        </section>}
      </div>
    </details>}
    {selected && <EventDialog kind={kind} admin={admin} occurrence={selected === "new" ? null : selected} entry={selected === "new" ? undefined : entries.find(entry => entry.id === selected.entryId)} people={people} categories={categories} onClose={() => setSelected(null)} />}
    {setting && <SettingDialog {...setting} onClose={() => setSetting(null)} />}
  </main>;
}

function Modal({ title, busy, onClose, children }: { title: string; busy: boolean; onClose: () => void; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const previous = document.activeElement as HTMLElement | null; const element = dialog.current!; element.showModal(); return () => { element.close(); if (previous?.isConnected) previous.focus(); }; }, []);
  return <dialog className="calendar-dialog" ref={dialog} aria-labelledby="calendar-dialog-title" aria-busy={busy} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}><header><h2 id="calendar-dialog-title">{title}</h2><button disabled={busy} onClick={onClose}>Close</button></header>{children}</dialog>;
}

function EventDialog({ kind, admin, occurrence, entry, people, categories, onClose }: { kind: CalendarKind; admin: boolean; occurrence: Occurrence | null; entry?: Entry; people: Person[]; categories: Category[]; onClose: () => void }) {
  const router = useRouter();
  const [id] = useState(() => entry?.id ?? crypto.randomUUID());
  const [editing, setEditing] = useState(!entry);
  const [scope, setScope] = useState<"occurrence" | "series">("occurrence");
  const [details, setDetails] = useState<EventDetails>(occurrence?.details ?? { title: "", people: [], primaryPerson: "", location: "", allDay: true, start: today(), end: today(), zone: "America/Chicago", repeat: "NONE", until: "", notes: "", category: kind === "employee" ? categories.find(item => item.active)?.id ?? "" : "" });
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const repeating = entry?.payload.repeat !== "NONE" && !!entry;
  function update<K extends keyof EventDetails>(key: K, value: EventDetails[K]) { setDetails(previous => ({ ...previous, [key]: value })); }
  async function save(remove = false) {
    setBusy(true); setMessage("");
    try { const result = await saveEvent({ id, kind, revision: entry?.revision ?? null, details, ...(repeating && scope === "occurrence" ? { occurrence: occurrence!.key } : {}), remove }); if (result.ok) { router.refresh(); onClose(); } else setMessage(result.message); }
    catch { setMessage("Save could not be confirmed. Your input is preserved. Retry before creating another event."); }
    finally { setBusy(false); }
  }
  const names = details.people.map(id => people.find(person => person.id === id)?.name ?? "Unavailable person").join(", ");
  return <Modal title={entry ? editing ? "Edit Event" : details.title : "Add Event"} busy={busy} onClose={onClose}>
    {!editing ? <><dl><dt>People</dt><dd>{names || "No person"}</dd>{kind === "employee" && <><dt>Category</dt><dd>{categories.find(category => category.id === details.category)?.name}</dd></>}<dt>Location</dt><dd>{details.location || "—"}</dd><dt>Start</dt><dd>{details.start.replace("T", " ")}</dd><dt>End{details.allDay ? " (inclusive)" : ""}</dt><dd>{details.end.replace("T", " ")}</dd><dt>Time zone</dt><dd>{details.allDay ? "All day — dates do not shift" : details.zone}</dd><dt>Repeat</dt><dd>{entry?.payload.repeat}{entry?.payload.until ? ` through ${entry.payload.until}` : ""}</dd><dt>Notes</dt><dd className="calendar-notes">{details.notes || "—"}</dd></dl>{admin && <button onClick={() => setEditing(true)}>Edit Event</button>}</> : <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <fieldset disabled={busy}>
        {repeating && <label>Apply changes to<select value={scope} onChange={event => { const next = event.target.value as typeof scope; setScope(next); setDetails(next === "series" ? entry!.payload : occurrence!.details); setDeleting(false); }}><option value="occurrence">Only this occurrence</option><option value="series">Entire series</option></select></label>}
        {repeating && scope === "series" && <p>Existing occurrence exceptions stay in place. Changes to the repeat pattern apply to the series.</p>}
        <label>Title<input required maxLength={200} value={details.title} onChange={event => update("title", event.target.value)} /></label>
        <fieldset><legend>People</legend>{people.filter(person => person.active || details.people.includes(person.id)).map(person => <label className="calendar-checkbox" key={person.id}><input type="checkbox" checked={details.people.includes(person.id)} onChange={event => { const selected = event.target.checked ? [...details.people, person.id] : details.people.filter(id => id !== person.id); setDetails(previous => ({ ...previous, people: selected, primaryPerson: selected.includes(previous.primaryPerson) ? previous.primaryPerson : selected[0] ?? "" })); }} />{person.name}{!person.active ? " (inactive)" : ""}</label>)}</fieldset>
        {!!details.people.length && <label>Primary person<select value={details.primaryPerson} onChange={event => update("primaryPerson", event.target.value)}>{people.filter(person => details.people.includes(person.id)).map(person => <option key={person.id} value={person.id}>{person.name}</option>)}</select></label>}
        {kind === "employee" && <label>Category<select required value={details.category} onChange={event => update("category", event.target.value)}><option value="">Choose category</option>{categories.filter(category => category.active || category.id === details.category).map(category => <option key={category.id} value={category.id}>{category.name}{!category.active ? " (inactive)" : ""}</option>)}</select></label>}
        <label>Location<input maxLength={200} value={details.location} onChange={event => update("location", event.target.value)} /></label>
        <label className="calendar-checkbox"><input type="checkbox" checked={details.allDay} onChange={event => setDetails(previous => ({ ...previous, allDay: event.target.checked, start: previous.start.slice(0, 10) + (event.target.checked ? "" : "T09:00"), end: previous.end.slice(0, 10) + (event.target.checked ? "" : "T10:00") }))} />All Day</label>
        <div className="calendar-date-fields"><label>Start<input required type={details.allDay ? "date" : "datetime-local"} value={details.start} onChange={event => update("start", event.target.value)} /></label><label>End{details.allDay ? " (inclusive)" : ""}<input required type={details.allDay ? "date" : "datetime-local"} value={details.end} onChange={event => update("end", event.target.value)} /></label></div>
        {!details.allDay && <label>Event time zone<select value={details.zone} onChange={event => update("zone", event.target.value)}>{zoneOptions.map(zone => <option key={zone}>{zone}</option>)}</select></label>}
        {(!repeating || scope === "series") && <><label>Repeat<select value={details.repeat} onChange={event => update("repeat", event.target.value as EventDetails["repeat"])}>{["NONE", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"].map(value => <option key={value}>{value}</option>)}</select></label>{details.repeat !== "NONE" && <label>Repeat through (optional)<input type="date" value={details.until} onChange={event => update("until", event.target.value)} /></label>}</>}
        <label>Notes<textarea maxLength={5000} value={details.notes} onChange={event => update("notes", event.target.value)} /></label>
        <div className="calendar-actions"><button type="submit" className="primary-button">Save Event</button>{entry && <button type="button" className="danger-button" onClick={() => setDeleting(true)}>Delete Event</button>}</div>
        {deleting && <div className="calendar-delete-warning" role="alert"><p>Delete {repeating && scope === "series" ? "the entire series" : "this event occurrence"}? This cannot be restored.</p><button type="button" onClick={() => setDeleting(false)}>Cancel</button><button type="button" className="danger-button" onClick={() => save(true)}>Confirm Delete</button></div>}
      </fieldset>
    </form>}{message && <p role="alert">{message}</p>}{busy && <p role="status">Saving…</p>}
  </Modal>;
}

function SettingDialog({ type, row, onClose }: { type: "person" | "category"; row?: Person | Category; onClose: () => void }) {
  const router = useRouter();
  const [id] = useState(() => row?.id ?? crypto.randomUUID());
  const [name, setName] = useState(row?.name ?? "");
  const [color, setColor] = useState(row?.color ?? "#1764A0");
  const [active, setActive] = useState(row?.active ?? true);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <Modal title={`${row ? "Edit" : "Add"} ${type === "person" ? "Person" : "Category"}`} busy={busy} onClose={onClose}><form onSubmit={async event => { event.preventDefault(); setBusy(true); try { const result = await saveSetting({ type, id, revision: row?.revision ?? null, name, color, active }); if (result.ok) { router.refresh(); onClose(); } else setMessage(result.message); } catch { setMessage("Could not save. Retry later."); } finally { setBusy(false); } }}><fieldset disabled={busy}><label>Name<input required maxLength={200} value={name} onChange={event => setName(event.target.value)} /></label><label>Bar color<input type="color" value={color} onChange={event => setColor(event.target.value)} /></label><label className="calendar-checkbox"><input type="checkbox" checked={active} onChange={event => setActive(event.target.checked)} />Active</label><button type="submit">Save {type === "person" ? "Person" : "Category"}</button></fieldset></form>{message && <p role="alert">{message}</p>}</Modal>;
}
