import type { DailyEnergyModel } from "@/generated/prisma/models/DailyEnergy";
import type { AssertTrue, Equals } from "./_assert";

/** Napi összesítő egy eszközre. Europe/Budapest naphatár szerint. */
export interface DailyEnergy {
	id: string;
	deviceId: string;
	/** A nap dátuma (időpont nélkül). */
	date: Date;
	/** Aznapi fogyasztás, kWh. */
	kwh: number;
	/** Aznap érvényes árral számolt költség, HUF. Befagyasztva. */
	costHuf: number;
	/** Átlagos teljesítmény, W. */
	avgPower: number;
	/** Csúcsteljesítmény, W. */
	peakPower: number;
	updatedAt: Date;
}

/** Napi összesítő létrehozása a rollup során. */
export interface CreateDailyEnergyDto {
	deviceId: string;
	date: Date;
	kwh: number;
	costHuf: number;
	avgPower: number;
	peakPower: number;
}

/**
 * Napi összesítő újraszámolása. A deviceId és a date a kulcs, azok nem
 * módosulnak — az aktuális nap rollupja többször is lefut.
 */
export interface UpdateDailyEnergyDto {
	kwh?: number;
	costHuf?: number;
	avgPower?: number;
	peakPower?: number;
}

/** Fordítási idejű őr: eltér a séma? -> tsc hiba. */
type _DailyEnergyMatchesSchema = AssertTrue<Equals<DailyEnergyModel, DailyEnergy>>;
