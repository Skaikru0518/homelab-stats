-- AlterTable
ALTER TABLE "Device" ADD COLUMN     "parentId" TEXT;

-- AddForeignKey
ALTER TABLE "Device" ADD CONSTRAINT "Device_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Device"("id") ON DELETE SET NULL ON UPDATE CASCADE;
