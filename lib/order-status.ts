export const activeStatuses = ["Pending", "In Progress", "Expedite"];
export const terminalStatuses = ["Complete", "Voided"];
export const orderStatuses = [...activeStatuses, ...terminalStatuses];
export const protectedStatusFields = ["completedBy", "completionDate", "voidedBy", "voidedDate", "statusChangedAt"];
export const terminalStatus = (status: string) => terminalStatuses.includes(status);
