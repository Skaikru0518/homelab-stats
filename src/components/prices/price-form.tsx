"use client";

import type { PriceFieldErrors, PriceListItem } from "@/interface";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface PriceFormProps {
	price: PriceListItem | null;
	onDone: () => void;
	onCancel: () => void;
}

export function PriceForm({ price, onDone, onCancel }: PriceFormProps) {
	const isEdit = price !== null;

	const [validFrom, setValidFrom] = useState(price?.validFrom ?? "");
	const [hufPerKwh, setHufPerKwh] = useState(
		price ? String(price.hufPerKwh) : "",
	);
	const [blended, setBlended] = useState(
		price?.blendedHufPerKwh === null || price === null
			? ""
			: String(price.blendedHufPerKwh),
	);
	const [errors, setErrors] = useState<PriceFieldErrors>({});
	const [saving, setSaving] = useState(false);

	async function submit(event: React.FormEvent) {
		event.preventDefault();
		setSaving(true);
		setErrors({});

		try {
			const response = await fetch(
				isEdit ? `/api/prices/${price.id}` : "/api/prices",
				{
					method: isEdit ? "PATCH" : "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						validFrom,
						hufPerKwh,
						blendedHufPerKwh: blended,
					}),
				},
			);
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
				{isEdit ? "Ár szerkesztése" : "Új ár"}
			</h2>

			<div className="grid gap-4 sm:grid-cols-3">
				<Field
					label="Érvényes ettől"
					hint="Ettől a naptól számol ezzel"
					error={errors.validFrom}
				>
					<input
						type="date"
						value={validFrom}
						onChange={(event) => setValidFrom(event.target.value)}
						className={inputClass(errors.validFrom)}
					/>
				</Field>

				<Field
					label="Határár"
					hint="Ft/kWh, egy plusz kWh ára"
					error={errors.hufPerKwh}
				>
					<input
						value={hufPerKwh}
						onChange={(event) => setHufPerKwh(event.target.value)}
						placeholder="70,104"
						inputMode="decimal"
						autoComplete="off"
						className={inputClass(errors.hufPerKwh)}
					/>
				</Field>

				<Field
					label="Átlagár"
					hint="Ft/kWh a számláról, elhagyható"
					error={errors.blendedHufPerKwh}
				>
					<input
						value={blended}
						onChange={(event) => setBlended(event.target.value)}
						placeholder="57,755"
						inputMode="decimal"
						autoComplete="off"
						className={inputClass(errors.blendedHufPerKwh)}
					/>
				</Field>
			</div>

			<p className="text-[11px] leading-relaxed text-app-faint">
				A korábbi napok költsége nem változik — azok a rögzítéskor érvényes
				árral már be vannak fagyasztva.
			</p>

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
	return `min-h-10 w-full rounded-lg border bg-app-panel px-3 font-mono text-sm transition-colors ${
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
