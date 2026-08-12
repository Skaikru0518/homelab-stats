import type { ReadingModel } from "@/generated/prisma/models/Reading";
import type { AssertTrue, Equals } from "./_assert";

/** Egy nyers mérés egy eszközről (percenként). */
export interface Reading {
	id: string;
	deviceId: string;
	/** Mérés időpontja, UTC-ben tárolva. */
	ts: Date;
	/** Hatásos teljesítmény, W. */
	power: number;
	/** Feszültség, V. */
	voltage: number;
	/** Áramerősség, A. */
	current: number;
	/** Látszólagos teljesítmény, VA. */
	apparentPower: number;
	/** Meddő teljesítmény, var. */
	reactivePower: number;
	/** Teljesítménytényező, 0..1. */
	factor: number;
	/** Az eszköz kumulatív energiaszámlálója, kWh. Reset esetén visszaugrik. */
	totalKwh: number;
}

/**
 * Új mérés rögzítése. A mérések változatlanok — nincs Update DTO.
 * Hibás adat esetén törlés és újraírás, nem módosítás.
 */
export interface CreateReadingDto {
	deviceId: string;
	ts: Date;
	power: number;
	voltage: number;
	current: number;
	apparentPower: number;
	reactivePower: number;
	factor: number;
	totalKwh: number;
}

/** Fordítási idejű őr: eltér a séma? -> tsc hiba. */
type _ReadingMatchesSchema = AssertTrue<Equals<ReadingModel, Reading>>;
