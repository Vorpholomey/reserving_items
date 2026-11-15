-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "bookings" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "depositHeld" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "receivedAt" TIMESTAMP(3),
ADD COLUMN     "returnedAt" TIMESTAMP(3),
ALTER COLUMN "totalAmount" DROP DEFAULT;
