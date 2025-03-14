/*
  Warnings:

  - A unique constraint covering the columns `[name,userId]` on the table `EventCategory` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "EventCategory_name_userId_idx";

-- CreateIndex
CREATE UNIQUE INDEX "EventCategory_name_userId_key" ON "EventCategory"("name", "userId");
