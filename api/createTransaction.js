import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const router = express.Router();

router.use(express.json());

// CORS middleware
router.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

router.post("/", async (req, res) => {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const auth = Buffer.from(serverKey + ":").toString("base64");

    const { order_id, gross_amount, customer, paymentMethod } = req.body;

    if (!gross_amount || !customer) {
      return res.status(400).json({ error: "gross_amount dan customer wajib diisi" });
    }

    // Data transaksi Midtrans
    const transaction = {
      transaction_details: {
        order_id: order_id || `ORDER-${Date.now()}`,
        gross_amount,
      },
      customer_details: {
        first_name: customer.first_name || "Guest",
        email: customer.email || "guest@example.com",
        phone: customer.phone || "08123456789",
        billing_address: { address: customer.address || "-" },
      },
      enabled_payments: [
        "bca_va",
        "bni_va",
        "bri_va",
        "mandiri_va",
        "qris",
        "credit_card",
      ],
    };

    // Kirim ke Midtrans
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
      return res.status(400).json({ error: "Gagal membuat transaksi Midtrans", details: result });
    }

    // Simpan transaksi ke Supabase
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
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal",
      },
      body: JSON.stringify(insertData),
    });

    if (!saveRes.ok) {
      const errText = await saveRes.text();
      console.error("Supabase insert error:", errText);
    }

    res.status(200).json({
      token: result.token,
      redirect_url: result.redirect_url,
      message: "Transaksi berhasil dibuat dan disimpan.",
    });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Terjadi kesalahan server", details: err.message });
  }
});

export default router;
