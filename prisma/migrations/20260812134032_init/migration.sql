-- CreateTable
CREATE TABLE "Device" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Device_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reading" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "ts" TIMESTAMP(3) NOT NULL,
    "power" DOUBLE PRECISION NOT NULL,
    "voltage" DOUBLE PRECISION NOT NULL,
    "current" DOUBLE PRECISION NOT NULL,
    "apparentPower" DOUBLE PRECISION NOT NULL,
    "reactivePower" DOUBLE PRECISION NOT NULL,
    "factor" DOUBLE PRECISION NOT NULL,
    "totalKwh" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "Reading_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyEnergy" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "kwh" DOUBLE PRECISION NOT NULL,
    "costHuf" DOUBLE PRECISION NOT NULL,
    "avgPower" DOUBLE PRECISION NOT NULL,
    "peakPower" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyEnergy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectricityPrice" (
    "id" TEXT NOT NULL,
    "validFrom" DATE NOT NULL,
    "hufPerKwh" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ElectricityPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Device_slug_key" ON "Device"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Reading_deviceId_ts_key" ON "Reading"("deviceId", "ts");

-- CreateIndex
CREATE UNIQUE INDEX "DailyEnergy_deviceId_date_key" ON "DailyEnergy"("deviceId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ElectricityPrice_validFrom_key" ON "ElectricityPrice"("validFrom");

-- AddForeignKey
ALTER TABLE "Reading" ADD CONSTRAINT "Reading_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyEnergy" ADD CONSTRAINT "DailyEnergy_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "Device"("id") ON DELETE CASCADE ON UPDATE CASCADE;
