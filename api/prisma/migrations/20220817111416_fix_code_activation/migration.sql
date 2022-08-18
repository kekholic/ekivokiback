/*
  Warnings:

  - A unique constraint covering the columns `[codeActivation]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "User_codeActivation_key" ON "User"("codeActivation");
