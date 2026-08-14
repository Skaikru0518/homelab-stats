export interface PriceListItem {
	id: string;
	/** YYYY-MM-DD */
	validFrom: string;
	hufPerKwh: number;
	blendedHufPerKwh: number | null;
	/** Ez az ár van most érvényben. */
	active: boolean;
	/** Meddig érvényes, azaz a következő ár kezdete. Null, ha ez a legfrissebb. */
	validUntil: string | null;
	/** Hány napi összesítő költsége készült ezzel az árral. Ezek befagytak. */
	frozenDays: number;
}

export type PriceFieldErrors = Partial<
	Record<"validFrom" | "hufPerKwh" | "blendedHufPerKwh" | "form", string>
>;

export type PriceMutationResult =
	| { ok: true; id: string }
	| { ok: false; errors: PriceFieldErrors };
