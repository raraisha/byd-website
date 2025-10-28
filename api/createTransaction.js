import fetch from "node-fetch";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    // 🔒 Ambil server key dari environment (Vercel)
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const auth = Buffer.from(serverKey + ":").toString("base64");

    const { order_id, gross_amount, customer, paymentMethod } = req.body;

    // 🔧 Data transaksi untuk Midtrans
    const transaction = {
      transaction_details: {
        order_id,
        gross_amount,
      },
      customer_details: {
        first_name: customer.first_name,
        email: customer.email,
        phone: customer.phone,
        billing_address: { address: customer.address },
      },
      enabled_payments: ["bca_va", "bni_va", "bri_va", "qris", "credit_card"],
    };

    // 🔗 Kirim ke Midtrans Snap API
    const midtransRes = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        body: JSON.stringify(transaction),
      }
    );

    const result = await midtransRes.json();
    if (!midtransRes.ok) {
      console.error("Midtrans error:", result);
      return res.status(400).json(result);
    }

    // 💾 Simpan transaksi ke Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const insertData = {
      id_user: customer.id_user || null,
      id_produk: customer.id_produk || null,
      jumlah_dp: gross_amount * 0.05,
      metode_pembayaran: paymentMethod || "qris",
      status: "pending",
      kode_pembayaran: order_id,
      sisa_pembayaran: gross_amount * 0.95,
    };

    const saveRes = await fetch(`${supabaseUrl}/rest/v1/transaksi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(insertData),
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("Supabase insert error:", errText);
    }

    // ✅ Berhasil
    return res.status(200).json({
      token: result.token,
      redirect_url: result.redirect_url,
      message: "Transaksi berhasil dibuat dan disimpan.",
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({
      error: "Terjadi kesalahan server",
      details: err.message,
    });
  }
}
