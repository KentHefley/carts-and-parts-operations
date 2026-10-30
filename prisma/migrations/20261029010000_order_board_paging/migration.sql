-- Expression/partial indexes are maintained here because Prisma's schema cannot
-- express these JSON sort keys. No saved order values or schema columns change.
CREATE INDEX "SalesOrder_open_board_idx" ON "SalesOrder"
  ((COALESCE(fields->>'dateEntered', '')) DESC, "createdAt" DESC, id DESC)
  WHERE "deletedAt" IS NULL AND name IS NOT NULL
    AND fields->>'status' IN ('Pending', 'In Progress', 'Expedite');
CREATE INDEX "SalesOrder_completed_board_idx" ON "SalesOrder"
  ((COALESCE(fields->>'statusChangedAt', '')) DESC, "createdAt" DESC, id DESC)
  WHERE "deletedAt" IS NULL AND name IS NOT NULL
    AND fields->>'status' IN ('Complete', 'Voided');
