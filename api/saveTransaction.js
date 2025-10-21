export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    const { id_user, id_produk, jumlah_dp, metode_pembayaran, status, kode_pembayaran, sisa_pembayaran } = req.body;

    const response = await fetch(`${supabaseUrl}/rest/v1/transaksi`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": supabaseKey,
        "Authorization": `Bearer ${supabaseKey}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        id_user,
        id_produk,
        jumlah_dp,
        metode_pembayaran,
        status,
        kode_pembayaran,
        sisa_pembayaran
      }),
    });

    if (response.ok) {
      res.status(201).json({ success: true });
    } else {
      const err = await response.text();
      res.status(400).json({ success: false, error: err });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
}
