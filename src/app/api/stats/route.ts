import { getStats } from "@/lib/stats";
import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(await getStats());
}
