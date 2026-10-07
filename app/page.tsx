import { UserButton } from "@clerk/nextjs";
import { requireApprovedUser } from "../lib/access";
import { getDatabase } from "../lib/db";
import { OrderList } from "./orders/order-list";
import { NewOrderButton } from "./orders/new-order-button";
import Image from "next/image";

export default async function Home() {
  await requireApprovedUser();
  const orders = await getDatabase().salesOrder.findMany({ where: { name: { not: null } }, orderBy: { createdAt: "desc" }, select: { id: true, number: true, name: true, fields: true } });

  return (
    <main className="mx-auto w-full max-w-5xl p-6 sm:p-10">
      <header className="flex items-center justify-between gap-4 border-b pb-6">
        <div>
          <p className="text-sm font-semibold text-blue-600">Development</p>
          <Image className="brand-logo brand-light" src="/branding/logo.png" alt="Carts and Parts, Inc." width={465} height={85} />
          <Image className="brand-logo brand-dark" src="/branding/logo-white.png" alt="Carts and Parts, Inc." width={465} height={85} />
          <h1 className="mt-1 text-2xl font-semibold">Carts and Parts Operations</h1>
        </div>
        <UserButton />
      </header>
      <section className="mt-10">
        <div className="list-heading"><h2 className="text-xl font-semibold">Sales Orders</h2><NewOrderButton /></div>
        <OrderList orders={[...orders].sort((left, right) => String((right.fields as Record<string, string>).dateEntered ?? "").localeCompare(String((left.fields as Record<string, string>).dateEntered ?? ""))).map(order => { const fields = order.fields as Record<string, string>; return { id: order.id, number: `DEV-${String(order.number).padStart(6, "0")}`, name: order.name ?? "", status: fields.status ?? "In Progress", division: fields.division__1 ?? "", jobType: fields.dropdown__1 ?? "", scheduled: fields.start_job_date__1 ?? "" }; })} />
      </section>
    </main>
  );
}
