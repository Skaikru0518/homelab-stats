import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const HUF_PER_KWH = 70.104;
// 2026.06.28-07.27 elszámoló számla: 32 978 Ft / 571 kWh
const BLENDED_HUF_PER_KWH = 57.755;
const PRICE_VALID_FROM = new Date("2026-08-12");

const devices = [
	{ slug: "plug-1", name: "Klíma", host: "192.168.50.250" },
	{ slug: "plug-2", name: "PC", host: "192.168.50.251" },
];
const connectionString = process.env["DATABASE_URL"];

if (!connectionString) throw new Error("DATABAE URL is missing for seed");

const prisma = new PrismaClient({
	adapter: new PrismaPg({ connectionString }),
});

async function main() {
	for (const d of devices) {
		await prisma.device.upsert({
			where: { slug: d.slug },
			update: { host: d.host },
			create: d,
		});
	}

	await prisma.electricityPrice.upsert({
		where: { validFrom: PRICE_VALID_FROM },
		update: {
			hufPerKwh: HUF_PER_KWH,
			blendedHufPerKwh: BLENDED_HUF_PER_KWH,
		},
		create: {
			validFrom: PRICE_VALID_FROM,
			hufPerKwh: HUF_PER_KWH,
			blendedHufPerKwh: BLENDED_HUF_PER_KWH,
		},
	});

	console.log(`Seed kész: ${devices.length} eszköz, ${HUF_PER_KWH} Ft/kWh`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(() => prisma.$disconnect());
