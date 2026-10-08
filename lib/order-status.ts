export const activeStatuses = ["Pending", "In Progress", "Expedite"];
export const terminalStatuses = ["Complete", "Voided"];
export const orderStatuses = [...activeStatuses, ...terminalStatuses];
export const protectedStatusFields = ["completedBy", "completionDate", "voidedBy", "voidedDate", "statusChangedAt"];
export const terminalStatus = (status: string) => terminalStatuses.includes(status);
export const missingCloseout = (fields: Record<string, string>) => !fields.text_79__1?.trim() || !fields.closed_out_date4__1;
