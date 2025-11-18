// api/midtransWebhook.js
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const event = req.body;

    console.log("🔔 Webhook received:", event);

    const orderId = event.order_id;
    const paymentType = event.payment_type;
    const status = event.transaction_status;

    // 1️⃣ Update hanya berdasarkan kode_pembayaran
    const { error: updateError } = await supabase
      .from("transaksi")
      .update({
        status: status,
        metode_pembayaran: paymentType,
        updated_at: new Date().toISOString(),
      })
      .eq("kode_pembayaran", orderId);

    if (updateError) {
      console.error("Update error:", updateError);
      return res.status(500).json({ error: "Update Failed" });
    }

    return res.status(200).json({ message: "Webhook processed" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Webhook Error" });
  }
}
