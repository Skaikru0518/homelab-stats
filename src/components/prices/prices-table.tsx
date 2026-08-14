"use client";

import { PriceForm } from "@/components/prices/price-form";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/card";
import type { PriceListItem } from "@/interface";
import { formatPrice } from "@/lib/format";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const FORM_EXIT_MS = 200;
const DIALOG_EXIT_MS = 160;

type Editing = { mode: "create" } | { mode: "edit"; id: string } | null;

interface PricesTableProps {
	prices: PriceListItem[];
}

export function PricesTable({ prices }: PricesTableProps) {
	const router = useRouter();
	const [editing, setEditing] = useState<Editing>(null);
	const [formLeaving, setFormLeaving] = useState(false);
	const [pendingDelete, setPendingDelete] = useState<PriceListItem | null>(null);
	const [dialogLeaving, setDialogLeaving] = useState(false);
	const [refreshing, startRefresh] = useTransition();

	function refresh() {
		startRefresh(() => router.refresh());
	}

	function closeForm() {
		setFormLeaving(true);
		setTimeout(() => {
			setEditing(null);
			setFormLeaving(false);
		}, FORM_EXIT_MS);
	}

	function openForm(next: Editing) {
		setFormLeaving(false);
		setEditing(next);
	}

	function closeDialog() {
		setDialogLeaving(true);
		setTimeout(() => {
			setPendingDelete(null);
			setDialogLeaving(false);
		}, DIALOG_EXIT_MS);
	}

	const editTarget =
		editing?.mode === "edit"
			? (prices.find((price) => price.id === editing.id) ?? null)
			: null;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex animate-rise items-center justify-between gap-3">
				<h1 className="text-lg font-semibold tracking-tight">Áram ára</h1>
				<button
					type="button"
					onClick={() => openForm({ mode: "create" })}
					className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-500 px-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
				>
					<Plus size={16} aria-hidden="true" />
					Új ár
				</button>
			</div>

			<Card
				delay={70}
				className={`overflow-hidden transition-opacity duration-200 ${
					refreshing ? "opacity-60" : "opacity-100"
				}`}
			>
				{editing !== null && (
					<div
						className={`grid ${
							formLeaving ? "animate-panel-out" : "animate-panel-in"
						}`}
					>
						<div className="min-h-0 overflow-hidden">
							<PriceForm
								key={editing.mode === "edit" ? editing.id : "create"}
								price={editTarget}
								onDone={() => {
									closeForm();
									refresh();
								}}
								onCancel={closeForm}
							/>
						</div>
					</div>
				)}

				{prices.length === 0 ? (
					<p className="p-8 text-center text-sm text-app-muted">
						Nincs felvett ár. Enélkül minden költség nulla lesz.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-app-border">
									<Th>Érvényes</Th>
									<Th align="right">Határár</Th>
									<Th align="right">Átlagár</Th>
									<Th align="right">Rögzített napok</Th>
									<Th align="right">Műveletek</Th>
								</tr>
							</thead>
							<tbody>
								{prices.map((price) => (
									<tr
										key={price.id}
										className="border-b border-app-border last:border-0"
									>
										<Td>
											<span className="flex items-center gap-2">
												<span className="font-mono tabular-nums">
													{price.validFrom}
												</span>
												{price.active && (
													<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
														érvényben
													</span>
												)}
											</span>
											<span className="block text-[11px] text-app-faint">
												{price.validUntil
													? `${price.validUntil} napig`
													: "visszavonásig"}
											</span>
										</Td>
										<Td align="right" mono>
											{formatPrice(price.hufPerKwh)} Ft
										</Td>
										<Td align="right" mono muted>
											{price.blendedHufPerKwh === null
												? "–"
												: `${formatPrice(price.blendedHufPerKwh)} Ft`}
										</Td>
										<Td align="right" mono muted>
											{price.frozenDays}
										</Td>
										<Td align="right">
											<div className="flex justify-end gap-1">
												<IconButton
													label={`${price.validFrom} szerkesztése`}
													onClick={() =>
														openForm({ mode: "edit", id: price.id })
													}
												>
													<Pencil size={15} />
												</IconButton>
												<IconButton
													label={`${price.validFrom} törlése`}
													danger
													onClick={() => setPendingDelete(price)}
												>
													<Trash2 size={15} />
												</IconButton>
											</div>
										</Td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</Card>

			<p className="animate-rise text-[11px] leading-relaxed text-app-faint">
				Minden nap költsége a rögzítéskor érvényes árral fagy be. Új ár felvétele
				a korábbi napokat nem írja át — azok már ki vannak fizetve.
			</p>

			{pendingDelete && (
				<DeleteDialog
					price={pendingDelete}
					leaving={dialogLeaving}
					onClose={closeDialog}
					onDeleted={() => {
						closeDialog();
						refresh();
					}}
				/>
			)}
		</div>
	);
}

function DeleteDialog({
	price,
	leaving,
	onClose,
	onDeleted,
}: {
	price: PriceListItem;
	leaving: boolean;
	onClose: () => void;
	onDeleted: () => void;
}) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function remove() {
		setBusy(true);
		setError(null);
		try {
			const response = await fetch(api(`/api/prices/${price.id}`), {
				method: "DELETE",
			});
			const result = await response.json();
			if (result.ok) {
				onDeleted();
			} else {
				setError(result.errors?.form ?? "A törlés nem sikerült.");
				setBusy(false);
			}
		} catch {
			setError("A szerver nem válaszolt.");
			setBusy(false);
		}
	}

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px] ${
				leaving ? "animate-scrim-out" : "animate-scrim-in"
			}`}
		>
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="delete-price-title"
				className={`w-full max-w-md rounded-xl border border-app-border bg-app-panel p-5 shadow-2xl ${
					leaving ? "animate-pop-out" : "animate-pop-in"
				}`}
			>
				<h2 id="delete-price-title" className="text-base font-semibold">
					Ár törlése
				</h2>
				<p className="mt-2 text-sm text-app-muted">
					A <strong className="font-mono">{price.validFrom}</strong> napjától
					érvényes ár törlődik. A már kiszámolt napi költségek{" "}
					<strong>nem változnak</strong> — azok befagyasztva vannak.
				</p>
				<p className="mt-2 text-sm text-app-muted">
					A mai és a tegnapi nap viszont újraszámolódik a következő poll körben,
					az akkor érvényes árral.
				</p>

				{error && (
					<p className="mt-3 text-sm text-rose-600 dark:text-rose-400">
						{error}
					</p>
				)}

				<div className="mt-5 flex justify-end gap-2">
					<button
						type="button"
						onClick={onClose}
						className="min-h-10 rounded-lg border border-app-border px-4 text-sm font-medium text-app-muted transition-colors hover:text-app-text"
					>
						Mégse
					</button>
					<button
						type="button"
						onClick={remove}
						disabled={busy}
						className="min-h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-60"
					>
						Törlés
					</button>
				</div>
			</div>
		</div>
	);
}

function IconButton({
	label,
	onClick,
	danger = false,
	children,
}: {
	label: string;
	onClick: () => void;
	danger?: boolean;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			title={label}
			className={`grid size-9 place-items-center rounded-lg border border-app-border transition-colors ${
				danger
					? "text-app-muted hover:border-rose-500/40 hover:text-rose-600 dark:hover:text-rose-400"
					: "text-app-muted hover:text-app-text"
			}`}
		>
			{children}
		</button>
	);
}

function Th({
	children,
	align = "left",
}: {
	children: React.ReactNode;
	align?: "left" | "right";
}) {
	return (
		<th
			className={`whitespace-nowrap px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-app-faint ${
				align === "right" ? "text-right" : "text-left"
			}`}
		>
			{children}
		</th>
	);
}

function Td({
	children,
	align = "left",
	mono = false,
	muted = false,
}: {
	children: React.ReactNode;
	align?: "left" | "right";
	mono?: boolean;
	muted?: boolean;
}) {
	return (
		<td
			className={`whitespace-nowrap px-4 py-3 ${
				align === "right" ? "text-right" : "text-left"
			} ${mono ? "font-mono tabular-nums" : ""} ${muted ? "text-app-muted" : ""}`}
		>
			{children}
		</td>
	);
}
