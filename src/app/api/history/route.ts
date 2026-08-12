import type { HistoryRange } from "@/interface";
import { getHistory } from "@/lib/history";
import { type NextRequest, NextResponse } from "next/server";

const RANGES: HistoryRange[] = ["week", "month", "year"];

function parseRange(value: string | null): HistoryRange {
	return RANGES.find((range) => range === value) ?? "week";
}

export async function GET(request: NextRequest) {
	const range = parseRange(request.nextUrl.searchParams.get("range"));
	return NextResponse.json(await getHistory(range));
}
