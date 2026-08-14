"use client";

import { DeviceForm } from "@/components/devices/device-form";
import { StatusDot } from "@/components/plug/status-dot";
import { Card } from "@/components/ui/card";
import type { DeviceListItem } from "@/interface";
import { formatWatts } from "@/lib/format";
import { CornerDownRight, LineChart, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

interface DevicesTableProps {
	devices: DeviceListItem[];
}

type Editing = { mode: "create" } | { mode: "edit"; slug: string } | null;

export function DevicesTable({ devices }: DevicesTableProps) {
	const router = useRouter();
	const [editing, setEditing] = useState<Editing>(null);
	const [pendingDelete, setPendingDelete] = useState<DeviceListItem | null>(
		null,
	);
	// A szerver újratölti a listát és közben megpingeli az eszközöket. A
	// tranzakció addig fut, amíg az új adat meg nem érkezik.
	const [refreshing, startRefresh] = useTransition();

	function refresh() {
		startRefresh(() => {
			router.refresh();
		});
	}

	function done() {
		setEditing(null);
		refresh();
	}

	const editTarget =
		editing?.mode === "edit"
			? (devices.find((device) => device.slug === editing.slug) ?? null)
			: null;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between gap-3">
				<h1 className="text-lg font-semibold tracking-tight">Eszközök</h1>
				<button
					type="button"
					onClick={() => setEditing({ mode: "create" })}
					className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-500 px-3.5 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
				>
					<Plus size={16} aria-hidden="true" />
					Új konnektor
				</button>
			</div>

			<Card
				className={`overflow-hidden transition-opacity duration-200 ${
					refreshing ? "opacity-60" : "opacity-100"
				}`}
			>
				{editing !== null && (
					<DeviceForm
						key={editing.mode === "edit" ? editing.slug : "create"}
						device={editTarget}
						all={devices}
						onDone={done}
						onCancel={() => setEditing(null)}
					/>
				)}

				{devices.length === 0 ? (
					<p className="p-8 text-center text-sm text-app-muted">
						Még nincs felvett konnektor. Kezdd az „Új konnektor" gombbal.
					</p>
				) : (
					<div className="overflow-x-auto">
						<table className="w-full text-sm">
							<thead>
								<tr className="border-b border-app-border">
									<Th>Állapot</Th>
									<Th>Név</Th>
									<Th>Azonosító</Th>
									<Th>IP cím</Th>
									<Th align="right">Mérések</Th>
									<Th align="right">Műveletek</Th>
								</tr>
							</thead>
							<tbody>
								{devices.map((device) => (
									<tr
										key={device.slug}
										className="border-b border-app-border last:border-0"
									>
										<Td>
											<Status device={device} />
										</Td>
										<Td>
											<span className="flex items-center gap-1.5">
												{device.parentSlug && (
													<CornerDownRight
														size={13}
														className="shrink-0 text-app-faint"
														aria-hidden="true"
													/>
												)}
												<Link
													href={`/device/${device.slug}`}
													className="font-medium transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
												>
													{device.name}
												</Link>
											</span>
											{device.parentSlug && (
												<span className="block text-[11px] text-app-faint">
													{device.parentSlug} mérésén belül
												</span>
											)}
										</Td>
										<Td mono muted>
											{device.slug}
										</Td>
										<Td mono muted>
											{device.host}
										</Td>
										<Td mono muted align="right">
											{device.readingCount}
										</Td>
										<Td align="right">
											<div className="flex justify-end gap-1">
												<Link
													href={`/device/${device.slug}`}
													aria-label={`${device.name} részletei`}
													title={`${device.name} részletei`}
													className="grid size-9 place-items-center rounded-lg border border-app-border text-app-muted transition-colors hover:text-app-text"
												>
													<LineChart size={15} aria-hidden="true" />
												</Link>
												<IconButton
													label={`${device.name} szerkesztése`}
													onClick={() =>
														setEditing({ mode: "edit", slug: device.slug })
													}
												>
													<Pencil size={15} />
												</IconButton>
												<IconButton
													label={`${device.name} törlése`}
													danger
													onClick={() => setPendingDelete(device)}
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

			{pendingDelete && (
				<DeleteDialog
					device={pendingDelete}
					onClose={() => setPendingDelete(null)}
					onDeleted={() => {
						setPendingDelete(null);
						refresh();
					}}
				/>
			)}
		</div>
	);
}

function Status({ device }: { device: DeviceListItem }) {
	if (!device.enabled) {
		return (
			<span className="flex items-center gap-2 text-app-muted">
				<span className="size-2 shrink-0 rounded-full bg-app-faint" />
				Kikapcsolva
			</span>
		);
	}

	if (device.online) {
		return (
			<span className="flex items-center gap-2">
				<StatusDot online pulse={false} />
				<span className="font-mono tabular-nums">
					{formatWatts(device.power ?? 0)} W
				</span>
			</span>
		);
	}

	return (
		<span
			className="flex items-center gap-2 text-rose-600 dark:text-rose-400"
			title={device.error ?? undefined}
		>
			<StatusDot online={false} />
			Nem elérhető
		</span>
	);
}

function DeleteDialog({
	device,
	onClose,
	onDeleted,
}: {
	device: DeviceListItem;
	onClose: () => void;
	onDeleted: () => void;
}) {
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function remove() {
		setBusy(true);
		setError(null);
		try {
			const response = await fetch(`/api/device/${device.slug}`, {
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
		<div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
			<div
				role="alertdialog"
				aria-modal="true"
				aria-labelledby="delete-title"
				className="w-full max-w-md rounded-xl border border-app-border bg-app-panel p-5"
			>
				<h2 id="delete-title" className="text-base font-semibold">
					{device.name} törlése
				</h2>
				<p className="mt-2 text-sm text-app-muted">
					Ezzel a(z) <strong className="font-mono">{device.readingCount}</strong>{" "}
					mérés és a hozzá tartozó napi összesítők is véglegesen törlődnek. Ez
					nem vonható vissza.
				</p>
				<p className="mt-2 text-sm text-app-muted">
					Ha csak szüneteltetni akarod a lekérdezést, szerkesztésnél kapcsold ki
					— az adatok megmaradnak.
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
						Végleges törlés
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
