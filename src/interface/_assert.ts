/**
 * Fordítási idejű segédtípusok az interface-ek és a Prisma séma
 * egyezésének ellenőrzésére.
 */

/** Csak `true`-t fogad el. Bármi más -> tsc hiba. */
export type AssertTrue<T extends true> = T;

/** Pontos (kétirányú) típusegyezés. */
export type Equals<A, B> = [A] extends [B]
	? [B] extends [A]
		? true
		: false
	: false;
