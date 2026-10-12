import { requireApprovedUser } from "../../lib/access";
import { getDatabase } from "../../lib/db";
import { listPriceBooks } from "../../lib/price-book-store";
import { AuthenticatedShell } from "../ui/authenticated-shell";
import { PriceBooks } from "./price-books";

export default async function PriceBooksPage() {
  const user = await requireApprovedUser();
  const books = await listPriceBooks(getDatabase());
  const pending = user.role === "ADMIN" ? await getDatabase().priceBookFile.findMany({ where: { uploaderId: user.id, state: "PENDING", expiresAt: { gt: new Date() } }, select: { id: true, bookKey: true, filename: true }, orderBy: { createdAt: "desc" }, take: 10 }) : [];
  return <AuthenticatedShell title="Price Books" active="Price Books" admin={user.role === "ADMIN"}><PriceBooks books={books} admin={user.role === "ADMIN"} pending={pending} /></AuthenticatedShell>;
}
