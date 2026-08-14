import { createPrice, listPrices } from "@/lib/price-admin";
import { type NextRequest, NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(await listPrices());
}

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => null);

	if (body === null || typeof body !== "object") {
		return NextResponse.json(
			{ ok: false, errors: { form: "Hibás kérés." } },
			{ status: 400 },
		);
	}

	const result = await createPrice(body);

	return NextResponse.json(result, { status: result.ok ? 201 : 422 });
}
