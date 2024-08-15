/*
  Warnings:

  - You are about to drop the column `slotId` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `slotId` on the `History` table. All the data in the column will be lost.
  - You are about to drop the `Slot` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `appointmentDate` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_slotId_fkey";

-- DropForeignKey
ALTER TABLE "History" DROP CONSTRAINT "History_slotId_fkey";

-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "slotId",
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "History" DROP COLUMN "slotId",
ADD COLUMN     "appointmentDate" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "disease" DROP NOT NULL;

-- DropTable
DROP TABLE "Slot";
