const VIEW_WIDTH = 100;
const VIEW_HEIGHT = 32;
const PADDING = 2;

interface SparklineProps {
	/** Időrendi értékek. A `null` adathiány — ott a vonal megszakad. */
	data: (number | null)[];
	/** Egyedi azonosító a gradiens defs-hez, hogy több sparkline ne ütközzön. */
	gradientId: string;
	/** Képernyőolvasónak szánt leírás. */
	label: string;
}

interface Segment {
	start: number;
	values: number[];
}

/** Összefüggő, adatot tartalmazó szakaszokra bontja a sorozatot. */
function toSegments(data: (number | null)[]): Segment[] {
	const segments: Segment[] = [];
	let current: Segment | null = null;

	data.forEach((value, index) => {
		if (value === null) {
			current = null;
			return;
		}
		if (current === null) {
			current = { start: index, values: [] };
			segments.push(current);
		}
		current.values.push(value);
	});

	return segments;
}

/**
 * Kézzel rajzolt SVG mini-grafikon az utolsó 24 óra teljesítményéről.
 *
 * Nem használ chart könyvtárat: egyetlen vonal és egy kitöltés, nincs
 * tengely és tooltip. A `preserveAspectRatio="none"` miatt vízszintesen
 * nyúlik a kártya szélességéhez, a vonalvastagságot a
 * `vector-effect` tartja egyenletesen.
 */
export function Sparkline({ data, gradientId, label }: SparklineProps) {
	const known = data.filter((value): value is number => value !== null);
	const max = Math.max(...known, 1);
	const lastIndex = Math.max(data.length - 1, 1);

	const x = (index: number) => (index / lastIndex) * VIEW_WIDTH;
	const y = (value: number) =>
		VIEW_HEIGHT - PADDING - (value / max) * (VIEW_HEIGHT - PADDING * 2);

	const segments = toSegments(data);

	return (
		<svg
			viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
			preserveAspectRatio="none"
			className="h-8 w-full"
			role="img"
			aria-label={label}
		>
			<defs>
				<linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="currentColor" stopOpacity="0.28" />
					<stop offset="100%" stopColor="currentColor" stopOpacity="0" />
				</linearGradient>
			</defs>

			{/*
				Alapvonal a teljes ablakon. Enélkül a részben feltöltött grafikon
				törött rajznak látszik, nem "még gyűlik az adat" állapotnak.
			*/}
			<line
				x1="0"
				y1={VIEW_HEIGHT - 0.5}
				x2={VIEW_WIDTH}
				y2={VIEW_HEIGHT - 0.5}
				stroke="currentColor"
				strokeWidth="1"
				strokeOpacity="0.18"
				vectorEffect="non-scaling-stroke"
			/>

			{segments.map((segment) => {
				const points = segment.values.map(
					(value, offset) =>
						[x(segment.start + offset), y(value)] as [number, number],
				);
				const first = points[0];
				const last = points[points.length - 1];

				if (!first || !last) {
					return null;
				}

				// Egyetlen pont nem rajzol vonalat — pötty jelzi, hogy van adat.
				if (points.length === 1) {
					return (
						<circle
							key={segment.start}
							cx={first[0]}
							cy={first[1]}
							r="1.6"
							fill="currentColor"
						/>
					);
				}

				const line = points
					.map(([px, py], index) => `${index === 0 ? "M" : "L"}${px} ${py}`)
					.join(" ");

				const area = `${line} L${last[0]} ${VIEW_HEIGHT} L${first[0]} ${VIEW_HEIGHT} Z`;

				return (
					<g key={segment.start}>
						<path d={area} fill={`url(#${gradientId})`} />
						<path
							d={line}
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							vectorEffect="non-scaling-stroke"
						/>
					</g>
				);
			})}
		</svg>
	);
}
