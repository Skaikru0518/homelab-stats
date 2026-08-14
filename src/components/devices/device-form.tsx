"use client";

import type { DeviceListItem, FieldErrors } from "@/interface";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface DeviceFormProps {
	/** Meglévő eszköz szerkesztéshez, vagy null új felvételhez. */
	device: DeviceListItem | null;
	/** Az összes eszköz — ebből választható a szülő. */
	all: DeviceListItem[];
	onDone: () => void;
	onCancel: () => void;
}

export function DeviceForm({ device, all, onDone, onCancel }: DeviceFormProps) {
	const isEdit = device !== null;

	const [slug, setSlug] = useState(device?.slug ?? "");
	const [name, setName] = useState(device?.name ?? "");
	const [host, setHost] = useState(device?.host ?? "");
	const [enabled, setEnabled] = useState(device?.enabled ?? true);
	const [parentSlug, setParentSlug] = useState(device?.parentSlug ?? "");
	const [errors, setErrors] = useState<FieldErrors>({});
	const [saving, setSaving] = useState(false);

	const hasChildren = (device?.childSlugs.length ?? 0) > 0;

	// Szülő csak olyan lehet, aminek nincs szülője, és nem önmaga.
	const parentOptions = all.filter(
		(candidate) =>
			candidate.slug !== device?.slug && candidate.parentSlug === null,
	);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setErrors({});

		const url = isEdit ? `/api/device/${device.slug}` : "/api/devices";
		const payload = isEdit
			? { name, host, enabled, parentSlug }
			: { slug, name, host, enabled, parentSlug };

		try {
			const response = await fetch(url, {
				method: isEdit ? "PATCH" : "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const result = await response.json();

			if (result.ok) {
				onDone();
			} else {
				setErrors(result.errors ?? { form: "A mentés nem sikerült." });
			}
		} catch {
			setErrors({ form: "A szerver nem válaszolt." });
		} finally {
			setSaving(false);
		}
	}

	return (
		<form
			onSubmit={submit}
			className="flex flex-col gap-4 border-b border-app-border bg-app-inset p-4 sm:p-5"
		>
			<h2 className="text-sm font-semibold">
				{isEdit ? `${device.name} szerkesztése` : "Új konnektor"}
			</h2>

			<div className="grid gap-4 sm:grid-cols-3">
				<Field
					label="Azonosító"
					hint={isEdit ? "Nem módosítható" : "Például: plug-3"}
					error={errors.slug}
				>
					<input
						value={slug}
						onChange={(event) => setSlug(event.target.value)}
						disabled={isEdit}
						placeholder="plug-3"
						autoComplete="off"
						className={inputClass(errors.slug)}
					/>
				</Field>

				<Field label="Név" hint="Ez jelenik meg a felületen" error={errors.name}>
					<input
						value={name}
						onChange={(event) => setName(event.target.value)}
						placeholder="Nappali"
						autoComplete="off"
						className={inputClass(errors.name)}
					/>
				</Field>

				<Field label="IP cím" hint="A routerben rögzített cím" error={errors.host}>
					<input
						value={host}
						onChange={(event) => setHost(event.target.value)}
						placeholder="192.168.50.252"
						autoComplete="off"
						inputMode="decimal"
						className={inputClass(errors.host)}
					/>
				</Field>
			</div>

			<div className="grid gap-4 sm:grid-cols-3">
				<Field
					label="Része egy másik mérésnek"
					hint={
						hasChildren
							? "Ennek az eszköznek már vannak gyerekei"
							: "Ha egy másik konnektor elosztóján lóg"
					}
					error={errors.parentSlug}
				>
					<select
						value={parentSlug}
						onChange={(event) => setParentSlug(event.target.value)}
						disabled={hasChildren}
						className={inputClass(errors.parentSlug)}
					>
						<option value="">Önálló mérés</option>
						{parentOptions.map((candidate) => (
							<option key={candidate.slug} value={candidate.slug}>
								{candidate.name}
							</option>
						))}
					</select>
				</Field>
			</div>

			<label className="flex w-fit items-center gap-2.5 text-sm">
				<input
					type="checkbox"
					checked={enabled}
					onChange={(event) => setEnabled(event.target.checked)}
					className="size-4 accent-emerald-500"
				/>
				Lekérdezés bekapcsolva
			</label>

			{errors.form && (
				<p className="text-sm text-rose-600 dark:text-rose-400">{errors.form}</p>
			)}

			<div className="flex gap-2">
				<button
					type="submit"
					disabled={saving}
					className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-500 px-4 text-sm font-medium text-white transition-colors hover:bg-emerald-600 disabled:opacity-60"
				>
					{saving && <Loader2 size={15} className="animate-spin" />}
					{isEdit ? "Mentés" : "Hozzáadás"}
				</button>
				<button
					type="button"
					onClick={onCancel}
					className="min-h-10 rounded-lg border border-app-border bg-app-panel px-4 text-sm font-medium text-app-muted transition-colors hover:text-app-text"
				>
					Mégse
				</button>
			</div>
		</form>
	);
}

function inputClass(error?: string): string {
	return `min-h-10 w-full rounded-lg border bg-app-panel px-3 font-mono text-sm transition-colors disabled:opacity-50 ${
		error ? "border-rose-500" : "border-app-border"
	}`;
}

function Field({
	label,
	hint,
	error,
	children,
}: {
	label: string;
	hint: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<label className="flex flex-col gap-1.5">
			<span className="text-[11px] font-medium uppercase tracking-wider text-app-faint">
				{label}
			</span>
			{children}
			<span
				className={`text-[11px] ${
					error ? "text-rose-600 dark:text-rose-400" : "text-app-faint"
				}`}
			>
				{error ?? hint}
			</span>
		</label>
	);
}
