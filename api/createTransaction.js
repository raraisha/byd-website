export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY; // simpan di .env
    const auth = Buffer.from(`${serverKey}:`).toString("base64");

    const { order_id, gross_amount, customer } = req.body;

    // Data transaksi ke Midtrans
    const transaction = {
      transaction_details: {
        order_id: order_id || `ORDER-${Date.now()}`,
        gross_amount: gross_amount || 10000,
      },
      customer_details: {
        first_name: customer?.first_name || "Guest",
        email: customer?.email || "guest@example.com",
        phone: customer?.phone || "08123456789",
        billing_address: { address: customer?.address || "-" },
      },
      enabled_payments: ["credit_card", "bca_va", "qris"],
    };

    // Kirim ke Midtrans Snap API
    const midtransResponse = await fetch(
      "https://app.sandbox.midtrans.com/snap/v1/transactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${auth}`,
        },
        body: JSON.stringify(transaction),
      }
    );

    const result = await midtransResponse.json();

    // Jika berhasil, simpan ke Supabase
    if (result.token) {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_KEY;

      const saveRes = await fetch(`${supabaseUrl}/rest/v1/transaksi`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": supabaseKey,
          "Authorization": `Bearer ${supabaseKey}`,
          "Prefer": "return=minimal"
        },
        body: JSON.stringify({
          id_user: customer?.id_user || null,
          id_produk: customer?.id_produk || null,
          jumlah_dp: gross_amount * 0.05,
          metode_pembayaran: "qris", // default dulu
          status: "pending",
          kode_pembayaran: order_id,
          sisa_pembayaran: gross_amount * 0.95,
        }),
      });

      console.log("Supabase status:", saveRes.status);
    }

    res.status(midtransResponse.status).json(result);
  } catch (error) {
    console.error("Error Midtrans:", error);
    res.status(500).json({ error: "Gagal membuat transaksi", details: error.message });
  }
}
