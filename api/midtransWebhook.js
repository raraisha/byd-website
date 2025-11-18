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

    // 1️⃣ Cek apakah transaksi sudah ada
    const { data: existing, error: checkError } = await supabase
      .from("transaksi")
      .select("*")
      .eq("kode_pembayaran", orderId)
      .maybeSingle();

    if (checkError) {
      console.error("Check error:", checkError);
      return res.status(500).json({ error: "DB check error" });
    }

    if (!existing) {
      // 2️⃣ Jika belum ada, INSERT baru dari Midtrans webhook
      console.log("ℹ️ Transaction not found → inserting new record");

      const { error: insertError } = await supabase.from("transaksi").insert({
        kode_pembayaran: orderId,
        jumlah_dp: event.gross_amount || 0,
        id_user: event.customer_details?.id_user || null,
        id_produk: event.customer_details?.id_produk || null,
        metode_pembayaran: paymentType,
        status,
        tanggal: new Date().toISOString(),
      });

      if (insertError) {
        console.error("Insert error:", insertError);
        return res.status(500).json({ error: "Insert failed" });
      }
    } else {
      // 3️⃣ Jika sudah ada, tinggal UPDATE status & metode pembayaran
      console.log("ℹ️ Transaction exists → updating");

      const { error: updateError } = await supabase
        .from("transaksi")
        .update({
          metode_pembayaran: paymentType,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("kode_pembayaran", orderId);

      if (updateError) {
        console.error("Update error:", updateError);
        return res.status(500).json({ error: "Update failed" });
      }
    }

    return res.status(200).json({ message: "Webhook Processed" });
  } catch (err) {
    console.error("Webhook Error:", err);
    return res.status(500).json({ error: "Webhook Error" });
  }
}
