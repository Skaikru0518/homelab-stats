/** Egy eszköz lekérdezésének eredménye. */
export type DevicePollResult =
	| { slug: string; host: string; ok: true }
	| { slug: string; host: string; ok: false; error: string };

/** Egy teljes poll kör összegzése. */
export interface PollSummary {
	/** A kör időbélyege, percre kerekítve — minden mérés ezt kapja. */
	ts: Date;
	/** Ténylegesen beszúrt sorok száma (duplikátum nélkül). */
	inserted: number;
	results: DevicePollResult[];
}
