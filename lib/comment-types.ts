export type CommentUser = { id: string; name: string; active: boolean };
export type CommentView = { id: string; authorId: string; author: string; text: string; mentionIds: string[]; version: number; createdAt: string; editedAt: string | null; canManage: boolean };
export type CommentInput = { orderId: string } & (
  { operation: "add"; requestKey: string; text: string; mentionIds: string[] } |
  { operation: "edit"; id: string; version: number; text: string; mentionIds: string[] } |
  { operation: "delete"; id: string; version: number }
);
