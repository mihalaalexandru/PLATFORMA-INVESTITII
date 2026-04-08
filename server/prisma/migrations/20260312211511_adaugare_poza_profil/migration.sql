/*
  Warnings:

  - You are about to drop the column `emailChangeToken` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `emailChangeTokenExpiry` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `pendingEmail` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "emailChangeToken",
DROP COLUMN "emailChangeTokenExpiry",
DROP COLUMN "pendingEmail",
ADD COLUMN     "profilePicture" TEXT;
