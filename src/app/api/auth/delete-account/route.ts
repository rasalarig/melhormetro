import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, getOne } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  if (body.confirmEmail !== user.email) {
    return NextResponse.json({ error: "Email de confirmação não confere" }, { status: 400 });
  }

  const userId = user.id;

  const seller = await getOne("SELECT id FROM sellers WHERE user_id = $1", [userId]) as { id: number } | null;

  // 1. Messages sent by user
  await query("DELETE FROM messages WHERE sender_id = $1", [userId]);
  // 2. Contact violations
  await query("DELETE FROM contact_violations WHERE user_id = $1", [userId]);
  // 3. Conversations where user is buyer or seller
  await query("DELETE FROM messages WHERE conversation_id IN (SELECT id FROM conversations WHERE buyer_user_id = $1 OR seller_user_id = $1)", [userId]);
  await query("DELETE FROM contact_violations WHERE conversation_id IN (SELECT id FROM conversations WHERE buyer_user_id = $1 OR seller_user_id = $1)", [userId]);
  await query("DELETE FROM conversations WHERE buyer_user_id = $1 OR seller_user_id = $1", [userId]);
  // 4. Engagement events
  await query("DELETE FROM engagement_events WHERE user_id = $1", [userId]);
  // 5. Campaign recipients
  await query("DELETE FROM campaign_recipients WHERE user_id = $1", [userId]);
  // 6. Favorites
  await query("DELETE FROM favorites WHERE user_id = $1", [userId]);
  // 7. Alert matches and search alerts
  await query("DELETE FROM alert_matches WHERE alert_id IN (SELECT id FROM search_alerts WHERE user_id = $1)", [userId]);
  await query("DELETE FROM search_alerts WHERE user_id = $1", [userId]);
  // 8. Premium activations
  await query("DELETE FROM premium_activations WHERE user_id = $1", [userId]);
  // 9. User profiles
  await query("DELETE FROM user_profiles WHERE user_id = $1", [userId]);

  // 10. If seller, handle properties
  if (seller) {
    await query("DELETE FROM property_images WHERE property_id IN (SELECT id FROM properties WHERE seller_id = $1)", [seller.id]);
    await query("DELETE FROM leads WHERE property_id IN (SELECT id FROM properties WHERE seller_id = $1)", [seller.id]);
    await query("DELETE FROM alert_matches WHERE property_id IN (SELECT id FROM properties WHERE seller_id = $1)", [seller.id]);
    await query("DELETE FROM properties WHERE seller_id = $1", [seller.id]);
    await query("DELETE FROM sellers WHERE id = $1", [seller.id]);
  }

  // 11. Sessions
  await query("DELETE FROM sessions WHERE user_id = $1", [userId]);
  // 12. Finally delete user
  await query("DELETE FROM users WHERE id = $1", [userId]);

  return NextResponse.json({ message: "Conta excluída com sucesso" });
}
