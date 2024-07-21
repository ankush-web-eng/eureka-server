/*
  Warnings:

  - You are about to drop the column `slot` on the `Appointment` table. All the data in the column will be lost.
  - You are about to drop the column `Hospital` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `slots` on the `Doctor` table. All the data in the column will be lost.
  - You are about to drop the column `slot` on the `History` table. All the data in the column will be lost.
  - Added the required column `slotId` to the `Appointment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `address` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `city` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hospital` to the `Doctor` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slotId` to the `History` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Appointment" DROP COLUMN "slot",
ADD COLUMN     "slotId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Doctor" DROP COLUMN "Hospital",
DROP COLUMN "slots",
ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "city" TEXT NOT NULL,
ADD COLUMN     "hospital" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "History" DROP COLUMN "slot",
ADD COLUMN     "slotId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Slot" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Slot_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Appointment" ADD CONSTRAINT "Appointment_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "History" ADD CONSTRAINT "History_slotId_fkey" FOREIGN KEY ("slotId") REFERENCES "Slot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Slot" ADD CONSTRAINT "Slot_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "Doctor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;