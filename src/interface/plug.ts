interface PlugIdentity {
	slug: string;
	name: string;
	host: string;
	/** Null, ha önálló mérés. Egyébként a szülő slugja — nem számít az összesítésbe. */
	parentSlug: string | null;
}

/** Egy konnektor élő állapota. Az `online` diszkriminálja a két ágat. */
export type PlugLiveStatus =
	| (PlugIdentity & {
			online: true;
			/** Hatásos teljesítmény, W. */
			power: number;
			voltage: number;
			current: number;
			apparentPower: number;
			reactivePower: number;
			factor: number;
			/** Kumulatív számláló, kWh. */
			totalKwh: number;
			/** Mai fogyasztás az eszköz szerint, kWh. */
			todayKwh: number;
	  })
	| (PlugIdentity & {
			online: false;
			error: string;
	  });

/** A `/api/plugs` válasza. Az időbélyeg ISO string — JSON-ön át nem marad Date. */
export interface PlugsResponse {
	ts: string;
	/** Pillanatnyi összteljesítmény, W. Csak a gyökér eszközök — a gyerekek benne vannak a szülőben. */
	totalPower: number;
	plugs: PlugLiveStatus[];
}
