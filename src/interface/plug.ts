interface PlugIdentity {
	slug: string;
	name: string;
	host: string;
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
	/** Az elérhető konnektorok pillanatnyi összteljesítménye, W. */
	totalPower: number;
	plugs: PlugLiveStatus[];
}
