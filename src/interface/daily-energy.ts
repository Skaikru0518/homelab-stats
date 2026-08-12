import type { DailyEnergyModel } from "@/generated/prisma/models/DailyEnergy";
import type { AssertTrue, Equals } from "./_assert";

/** Napi összesítő, Europe/Budapest naphatár szerint. */
export interface DailyEnergy {
	id: string;
	deviceId: string;
	date: Date;
	kwh: number;
	/** Költség határáron. */
	costHuf: number;
	/** Költség számla szerinti átlagáron. */
	costBlendedHuf: number;
	avgPower: number;
	peakPower: number;
	updatedAt: Date;
}

export interface CreateDailyEnergyDto {
	deviceId: string;
	date: Date;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
	avgPower: number;
	peakPower: number;
}

export interface UpdateDailyEnergyDto {
	kwh?: number;
	costHuf?: number;
	costBlendedHuf?: number;
	avgPower?: number;
	peakPower?: number;
}

type _DailyEnergyMatchesSchema = AssertTrue<
	Equals<DailyEnergyModel, DailyEnergy>
>;
