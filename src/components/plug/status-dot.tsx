interface StatusDotProps {
	online: boolean;
	/** Élő állapotnál lüktet, jelezve hogy az adat frissül. */
	pulse?: boolean;
}

export function StatusDot({ online, pulse = true }: StatusDotProps) {
	if (!online) {
		return (
			<span
				aria-hidden="true"
				className="inline-block size-2 shrink-0 rounded-full bg-rose-500"
			/>
		);
	}

	return (
		<span className="relative inline-flex size-2 shrink-0" aria-hidden="true">
			{pulse && (
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
			)}
			<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
		</span>
	);
}
