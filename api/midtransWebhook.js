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

    const orderId = event.order_id;
    const paymentType = event.payment_type; // <- metode pembayaran user
    const status = event.transaction_status;

    // Update transaksi di database
    const { error } = await supabase
      .from("transaksi")
      .update({
        metode_pembayaran: paymentType,
        status: status,
      })
      .eq("kode_pembayaran", orderId);

    if (error) {
      console.error("DB Update Error:", error);
      return res.status(500).json({ error: "DB Update Failed" });
    }

    return res.status(200).json({ message: "Webhook Received" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Webhook Error" });
  }
}
