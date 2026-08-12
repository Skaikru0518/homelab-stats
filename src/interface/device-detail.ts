import type { PlugLiveStatus } from "./plug";

export interface PeriodTotals {
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
}

export interface DeviceDailyRow {
	/** YYYY-MM-DD */
	date: string;
	label: string;
	kwh: number;
	costHuf: number;
	costBlendedHuf: number;
	avgPower: number;
	peakPower: number;
}

export interface DeviceDetailResponse {
	slug: string;
	name: string;
	host: string;
	enabled: boolean;
	live: PlugLiveStatus;
	today: PeriodTotals;
	last7: PeriodTotals;
	last30: PeriodTotals;
	windowHours: number;
	powerSeries: (number | null)[];
	/** Az utolsó 30 nap, régebbitől a maiig. Adat nélküli napok is szerepelnek. */
	daily: DeviceDailyRow[];
}
