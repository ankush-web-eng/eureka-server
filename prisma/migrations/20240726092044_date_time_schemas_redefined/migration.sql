/*
  Warnings:

  - You are about to drop the column `doctorId` on the `Slot` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `Doctor` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Appointment" DROP CONSTRAINT "Appointment_slotId_fkey";

-- DropForeignKey
ALTER TABLE "Slot" DROP CONSTRAINT "Slot_doctorId_fkey";

-- AlterTable
ALTER TABLE "Appointment" ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "disease" DROP NOT NULL,
ALTER COLUMN "slotId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Doctor" ADD COLUMN     "availableDays" INTEGER[],
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Slot" DROP COLUMN "doctorId";

-- CreateTable
CREATE TABLE "TimeSlot" (
    "id" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "doctorId" TEXT NOT NULL,

    CONSTRAINT "TimeSlot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TimeSlot" ADD CONSTRAINT "TimeSlot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
