"use client";
import { useEffect, useId, useRef, useState } from "react";
import { normalizeSavedName, personalDescriptionField, type SuggestionField } from "../../lib/saved-name-model";
import { findSavedNames } from "./name-actions";

export function SavedNameInput({ field, label, value, onChange, help }: { field: SuggestionField; label: string; value: string; onChange: (value: string) => void; help?: string }) {
  const id = useId(), root = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState(false), [dismissed, setDismissed] = useState(false), [active, setActive] = useState(-1);
  const [result, setResult] = useState({ query: "", names: [] as string[], error: "" });
  useEffect(() => {
    if (!focused || dismissed || value.length > 200 || normalizeSavedName(value).length < 2) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      findSavedNames(field, value).then(next => { if (!cancelled) setResult({ query: value, ...next }); })
        .catch(() => { if (!cancelled) setResult({ query: value, names: [], error: "Suggestions unavailable. You can still type a name." }); });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [field, value, focused, dismissed]);
  useEffect(() => {
    if (!focused) return;
    function outside(event: PointerEvent) { if (!root.current?.contains(event.target as Node)) setFocused(false); }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [focused]);
  const names = focused && !dismissed && result.query === value ? result.names : [];
  const open = names.length > 0;
  function choose(name: string) { setDismissed(true); setActive(-1); onChange(name); }
  return <div className="saved-name-input" ref={root} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
    <label htmlFor={id}>{label}</label>
    <div className="saved-name-control"><input id={id} type="text" role="combobox" autoComplete="off" aria-autocomplete="list" aria-expanded={open} aria-controls={open ? `${id}-list` : undefined} aria-activedescendant={open && active >= 0 && active < names.length ? `${id}-option-${active}` : undefined} aria-describedby={`${id}-help`} value={value}
      onFocus={() => { setFocused(true); setDismissed(false); }}
      onChange={event => { setActive(-1); setDismissed(false); onChange(event.target.value); }}
      onKeyDown={event => {
        if (event.key === "Escape") { setDismissed(true); setActive(-1); if (open) event.stopPropagation(); }
        if (!open) return;
        if (event.key === "ArrowDown" || event.key === "ArrowUp") { event.preventDefault(); setActive(index => event.key === "ArrowDown" ? (index + 1) % names.length : (index <= 0 ? names.length : index) - 1); }
        if (event.key === "Enter" && active >= 0 && active < names.length) { event.preventDefault(); choose(names[active]); }
      }} />
    {open && <ul id={`${id}-list`} role="listbox" aria-label={`${label} saved names`}>{names.map((name, index) => <li role="presentation" key={name}><button type="button" role="option" id={`${id}-option-${index}`} aria-selected={active === index} tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => choose(name)}>{name}</button></li>)}</ul>}</div>
    <small id={`${id}-help`}>{help ? `${help} ` : ""}{personalDescriptionField(field) ? "Type at least two characters to find your saved descriptions, or enter new text." : "Type at least two characters to find saved names, or enter a new name."}</small>
    {focused && result.query === value && result.error && <small role="status">{result.error}</small>}
  </div>;
}
