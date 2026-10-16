CREATE TABLE "OrderFieldAmount" (
  "orderId" UUID NOT NULL,
  "fieldKey" TEXT NOT NULL,
  "amount" DECIMAL(20,2) NOT NULL,
  PRIMARY KEY ("orderId", "fieldKey"),
  CONSTRAINT "OrderFieldAmount_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
