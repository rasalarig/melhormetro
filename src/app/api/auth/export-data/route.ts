import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getAll, getOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = user.id;

  const [
    userData, sellerData, properties, favorites, leads,
    searchAlerts, engagementEvents, conversations, messages,
    premiumActivations, userProfiles
  ] = await Promise.all([
    getOne("SELECT id, name, email, provider, is_admin, is_premium, accepted_seller_terms, created_at FROM users WHERE id = $1", [userId]),
    getOne("SELECT * FROM sellers WHERE user_id = $1", [userId]),
    getAll("SELECT id, title, price, area, type, city, status, created_at FROM properties WHERE seller_id = (SELECT id FROM sellers WHERE user_id = $1)", [userId]),
    getAll("SELECT f.*, p.title as property_title FROM favorites f JOIN properties p ON f.property_id = p.id WHERE f.user_id = $1", [userId]),
    getAll("SELECT * FROM leads WHERE property_id IN (SELECT id FROM properties WHERE seller_id = (SELECT id FROM sellers WHERE user_id = $1))", [userId]),
    getAll("SELECT * FROM search_alerts WHERE user_id = $1", [userId]),
    getAll("SELECT * FROM engagement_events WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1000", [userId]),
    getAll("SELECT c.id, c.property_id, c.intermediation_status, c.created_at FROM conversations c WHERE c.seller_user_id = $1 OR c.buyer_user_id = $1", [userId]),
    getAll("SELECT m.content, m.created_at, m.read_at FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE m.sender_id = $1 ORDER BY m.created_at DESC LIMIT 500", [userId]),
    getAll("SELECT pa.activated_at, pc.code, pc.description FROM premium_activations pa JOIN premium_codes pc ON pa.code_id = pc.id WHERE pa.user_id = $1", [userId]),
    getAll("SELECT * FROM user_profiles WHERE user_id = $1", [userId]),
  ]);

  return NextResponse.json({
    exportDate: new Date().toISOString(),
    user: userData,
    seller: sellerData,
    profiles: userProfiles,
    properties,
    favorites,
    leads,
    searchAlerts,
    engagementEvents,
    conversations,
    messages,
    premiumActivations,
  });
}
