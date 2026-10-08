type Change = { before: unknown; after: unknown };
type Event = { id: string; orderId: string; actorId: string; createdAt: Date; changes: unknown };
const changesOf = (event: Event) => event.changes as Record<string, unknown>;
const isChange = (value: unknown): value is Change => !!value && typeof value === "object" && "before" in value && "after" in value;
const ordinary = (event: Event) => Object.entries(changesOf(event)).every(([key, value]) => !["status", "assignments", "event"].includes(key) && isChange(value));

// Presentation grouping only: never modify or delete stored audit events.
export function groupActivity<T extends Event>(events: T[]) {
  const groups: (T & { lastEventId: string; saveCount: number })[] = [];
  for (const event of events) {
    const group = groups.at(-1);
    if (group && ordinary(group) && ordinary(event) && group.orderId === event.orderId && group.actorId === event.actorId && group.createdAt.getTime() - event.createdAt.getTime() <= 60_000) {
      const merged = { ...changesOf(group) };
      for (const [key, value] of Object.entries(changesOf(event))) {
        const newer = merged[key];
        merged[key] = isChange(newer) && isChange(value) ? { before: value.before, after: newer.after } : value;
      }
      group.changes = merged;
      group.lastEventId = event.id;
      group.saveCount++;
    } else groups.push({ ...event, changes: structuredClone(event.changes), lastEventId: event.id, saveCount: 1 });
  }
  return groups;
}
