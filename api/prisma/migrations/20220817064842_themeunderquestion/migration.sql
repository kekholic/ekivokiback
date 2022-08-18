/*
  Warnings:

  - Added the required column `task` to the `Card` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Card" ADD COLUMN     "exceptions" TEXT,
ADD COLUMN     "task" TEXT NOT NULL,
ADD COLUMN     "theme" TEXT;
