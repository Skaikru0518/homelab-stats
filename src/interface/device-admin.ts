export interface DeviceListItem {
	slug: string;
	name: string;
	host: string;
	enabled: boolean;
	/** Null, ha önálló mérés. Egyébként a szülő slugja. */
	parentSlug: string | null;
	/** A közvetlen gyerekek slugjai. */
	childSlugs: string[];
	/** Hány nyers mérés tartozik hozzá. Törlésnél ennyit veszítenél. */
	readingCount: number;
	/** Null, ha kikapcsolt eszköz — azt nem kérdezzük le. */
	online: boolean | null;
	/** Pillanatnyi teljesítmény, ha elérhető. */
	power: number | null;
	error: string | null;
}

/** Mezőnkénti hibaüzenetek. A kulcs a mező neve. */
export type FieldErrors = Partial<
	Record<"slug" | "name" | "host" | "parentSlug" | "form", string>
>;

export type MutationResult =
	| { ok: true; slug: string }
	| { ok: false; errors: FieldErrors };
