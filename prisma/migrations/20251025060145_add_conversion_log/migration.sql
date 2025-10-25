-- CreateTable
CREATE TABLE "ConversionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "folio" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "bitsoConversion" TEXT,
    "source" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "sourceAmount" REAL NOT NULL,
    "targetAmount" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversionLog_folio_key" ON "ConversionLog"("folio");
