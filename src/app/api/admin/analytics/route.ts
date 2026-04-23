import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const UMAMI_API = "https://api.umami.is/v1";

async function umamiGet(path: string) {
  const apiKey = process.env.UMAMI_API_KEY;
  const websiteId = process.env.UMAMI_WEBSITE_ID;
  if (!apiKey || !websiteId) {
    return null;
  }
  const res = await fetch(`${UMAMI_API}/websites/${websiteId}${path}`, {
    headers: { "x-umami-api-key": apiKey, "Accept": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export async function GET(request: NextRequest) {
  // Admin auth check
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check config
  if (!process.env.UMAMI_API_KEY || !process.env.UMAMI_WEBSITE_ID) {
    return NextResponse.json(
      { error: "Analytics não configurado. Adicione UMAMI_API_KEY e UMAMI_WEBSITE_ID nas variáveis de ambiente." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "stats";

  const now = Date.now();
  const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
  const startAt = searchParams.get("startAt") || String(thirtyDaysAgo);
  const endAt = searchParams.get("endAt") || String(now);
  const unit = searchParams.get("unit") || "day";

  let data;
  switch (type) {
    case "active":
      data = await umamiGet("/active");
      break;
    case "stats":
      data = await umamiGet(`/stats?startAt=${startAt}&endAt=${endAt}`);
      break;
    case "pageviews":
      data = await umamiGet(`/pageviews?startAt=${startAt}&endAt=${endAt}&unit=${unit}&timezone=America/Sao_Paulo`);
      break;
    case "pages":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=url`);
      break;
    case "referrers":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=referrer`);
      break;
    case "devices":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=device`);
      break;
    case "browsers":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=browser`);
      break;
    case "os":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=os`);
      break;
    case "countries":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=country`);
      break;
    case "cities":
      data = await umamiGet(`/metrics?startAt=${startAt}&endAt=${endAt}&type=city`);
      break;
    default:
      return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  }

  if (data === null) {
    return NextResponse.json({ error: "Falha ao consultar analytics" }, { status: 502 });
  }

  return NextResponse.json(data);
}
