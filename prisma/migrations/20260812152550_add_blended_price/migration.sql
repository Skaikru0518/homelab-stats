-- AlterTable
ALTER TABLE "DailyEnergy" ADD COLUMN     "costBlendedHuf" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "ElectricityPrice" ADD COLUMN     "blendedHufPerKwh" DOUBLE PRECISION;
