export default async function handler(req, res) {
  // Pastikan metode yang digunakan POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    // 🧾 Ambil notifikasi dari Midtrans
    const notification = req.body;
    console.log("📩 Midtrans callback diterima:", notification);

    // 🔐 Verifikasi signature key
    const crypto = await import("crypto");
    const hash = crypto.createHash("sha512")
      .update(notification.order_id + notification.status_code + notification.gross_amount + serverKey)
      .digest("hex");

    if (hash !== notification.signature_key) {
      console.error("❌ Signature tidak valid!");
      return res.status(403).json({ error: "Invalid signature key" });
    }

    // 🧠 Tentukan status berdasarkan notifikasi Midtrans
    let statusPembayaran = "pending";

    switch (notification.transaction_status) {
      case "capture":
      case "settlement":
        statusPembayaran = "success";
        break;
      case "deny":
      case "expire":
      case "cancel":
        statusPembayaran = "failed";
        break;
      case "pending":
      default:
        statusPembayaran = "pending";
        break;
    }

    // 🧱 Update data transaksi di Supabase
    const updateData = {
      status: statusPembayaran,
      metode_pembayaran: notification.payment_type || null,
      updated_at: new Date().toISOString(),
    };

    const response = await fetch(
      `${supabaseUrl}/rest/v1/transaksi?kode_pembayaran=eq.${notification.order_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Supabase update error:", errText);
      return res.status(500).json({ error: "Gagal update status transaksi" });
    }

    console.log("✅ Transaksi berhasil diupdate:", updateData);
    res.status(200).json({ success: true, message: "Transaksi berhasil diperbarui" });
  } catch (error) {
    console.error("❌ Error di saveTransaction:", error);
    res.status(500).json({ error: "Terjadi kesalahan server", details: error.message });
  }
}
