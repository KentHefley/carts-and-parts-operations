CREATE TABLE "OrderChoice" ("id" UUID NOT NULL, "fieldKey" TEXT NOT NULL, "label" TEXT NOT NULL, "normalizedLabel" TEXT NOT NULL, "position" INTEGER NOT NULL, "active" BOOLEAN NOT NULL DEFAULT true, "version" INTEGER NOT NULL DEFAULT 1, CONSTRAINT "OrderChoice_pkey" PRIMARY KEY ("id"));
CREATE UNIQUE INDEX "OrderChoice_fieldKey_normalizedLabel_key" ON "OrderChoice"("fieldKey", "normalizedLabel");
CREATE INDEX "OrderChoice_fieldKey_position_idx" ON "OrderChoice"("fieldKey", "position");
CREATE TABLE "OrderChoiceAudit" ("id" UUID NOT NULL, "actorId" UUID NOT NULL, "choiceId" UUID NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "changes" JSONB NOT NULL, CONSTRAINT "OrderChoiceAudit_pkey" PRIMARY KEY ("id"));
CREATE INDEX "OrderChoiceAudit_createdAt_idx" ON "OrderChoiceAudit"("createdAt");
INSERT INTO "OrderChoice" ("id","fieldKey","label","normalizedLabel","position") VALUES
('66dd217c-c59a-4a77-b95e-cc3f5bf257ef','division__1','Oklahoma City','oklahoma city',0),
('86551d0e-e6d4-4daf-bf95-d06c7a9ab3ce','division__1','Dallas/Fort Worth','dallas/fort worth',1),
('efb793a3-d025-45ee-8f6a-8e6e8b2e4e25','division__1','Houston','houston',2),
('8aaeaccb-a656-46f8-b103-55f7c510492d','division__1','San Antonio','san antonio',3),
('5ed8e77a-0b65-4d4c-8c24-e5b3c5449113','division__1','Phoenix','phoenix',4),
('2b5eb8cb-358e-4483-a710-0929401a5611','division__1','Cleveland','cleveland',5),
('7a11d084-cde0-4467-84d2-09c1b84b7559','division__1','Corporate','corporate',6),
('ee0f8777-a60d-4c7a-9789-5aba3d3f9e2e','dropdown__1','CartWipes','cartwipes',0),
('3c0f2a48-1d13-47a3-b5b0-1699c0945c6f','dropdown__1','CartWorks','cartworks',1),
('2184484f-4e2f-4512-acb0-7eb4aca1e220','dropdown__1','CNP','cnp',2),
('4ae5ce30-0b78-47a9-ade9-0c1f5b49c930','dropdown__1','Hand Baskets','hand baskets',3),
('da6276a5-055a-4640-9315-cbd160f215f1','dropdown__1','Online Order','online order',4),
('1b1e10a1-6df2-49d3-907b-a7f0024e51e6','dropdown__1','Parts','parts',5),
('fd8aa29a-0901-42a9-8353-29f2143ea4a0','dropdown__1','Unarco','unarco',6),
('e7517dd5-b04b-45ef-b3ef-663e2bbb602a','dropdown__1','Used Carts','used carts',7),
('153a6797-bc4a-4ed2-b0b4-72da129dae0a','dropdown__1','Other','other',8),
('47d81f83-ed4c-4b57-b22d-8cad10d9f7aa','terms__1','COD','cod',0),
('3b72702a-f29b-453d-9b43-f7f92b7c8dfb','terms__1','Credit Card','credit card',1),
('293e7670-706a-4c38-8f5c-e32bd8fca673','terms__1','Net 30','net 30',2),
('40dc24df-4869-4142-9bbb-3da2385fc298','terms__1','No Charge','no charge',3),
('341afb38-76e8-4d2a-8db1-5724c40e00fa','freight__1','CPU','cpu',0),
('2ca99ec9-a914-423f-8b2b-32b8ff41a277','freight__1','FOB Delivered','fob delivered',1),
('122f9824-8647-422d-abe1-42e441fe14b6','freight__1','Freight Collect','freight collect',2),
('fa45d673-81c1-4e8e-a9ee-1d3ff504b057','freight__1','Prepaid + Add','prepaid + add',3),
('71e898fc-264e-40e2-a6ac-6b6efb8da191','freight__1','NA','na',4);
