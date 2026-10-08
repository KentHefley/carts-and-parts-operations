"use client";
import { useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "@daypicker/react";
import { dateValue, displayDateValue, parseDateValue } from "../../lib/date-values";
import { chicagoDate } from "../../lib/order-types";

export function DateField({ label, value, onChange, invalid, describedBy }: { label: string; value: string; onChange: (value: string) => void; invalid?: boolean; describedBy?: string }) {
  const [open, setOpen] = useState(false);
  const selected = parseDateValue(value);
  const today = parseDateValue(chicagoDate());
  function choose(date: Date | undefined) {
    onChange(date ? dateValue(date) : "");
    setOpen(false);
  }
  return <Popover.Root open={open} onOpenChange={setOpen}>
    <Popover.Trigger asChild><button type="button" className="date-field" aria-label={`${label}: ${displayDateValue(value)}`} data-invalid={invalid || undefined} aria-describedby={describedBy}>
      <span>{displayDateValue(value)}</span><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
    </button></Popover.Trigger>
    <Popover.Portal><Popover.Content className="date-popover" sideOffset={6} align="start" collisionPadding={12} aria-label={`Choose ${label}`}>
      <DayPicker mode="single" selected={selected} defaultMonth={selected ?? today} today={today} onSelect={choose} autoFocus />
      <div className="date-picker-actions"><button type="button" onClick={() => choose(today)}>Today</button><button type="button" onClick={() => choose(undefined)}>Clear date</button><Popover.Close asChild><button type="button">Close</button></Popover.Close></div>
    </Popover.Content></Popover.Portal>
  </Popover.Root>;
}
