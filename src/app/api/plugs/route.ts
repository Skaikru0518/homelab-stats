import type { PlugLiveStatus, PlugsResponse } from "@/interface";
import { prisma } from "@/lib/database/db";
import { fetchTasmotaEnergy } from "@/lib/tasmota";
import { NextResponse } from "next/server";

export async function GET() {
	const devices = await prisma.device.findMany({
		where: { enabled: true },
		orderBy: { slug: "asc" },
		select: { slug: true, name: true, host: true },
	});

	const plugs: PlugLiveStatus[] = await Promise.all(
		devices.map(async (device): Promise<PlugLiveStatus> => {
			try {
				const energy = await fetchTasmotaEnergy(device.host);
				return {
					...device,
					online: true,
					power: energy.Power,
					voltage: energy.Voltage,
					current: energy.Current,
					apparentPower: energy.ApparentPower,
					reactivePower: energy.ReactivePower,
					factor: energy.Factor,
					totalKwh: energy.Total,
					todayKwh: energy.Today,
				};
			} catch (error) {
				return {
					...device,
					online: false,
					error: error instanceof Error ? error.message : String(error),
				};
			}
		}),
	);

	const totalPower = plugs.reduce(
		(sum, plug) => (plug.online ? sum + plug.power : sum),
		0,
	);

	const body: PlugsResponse = {
		ts: new Date().toISOString(),
		totalPower,
		plugs,
	};

	return NextResponse.json(body);
}
