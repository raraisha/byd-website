export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const event = req.body;

  console.log("Midtrans Webhook:", event);

  const paymentType = event.payment_type; // 🔥 inilah metode pembayaran
  const orderId = event.order_id;
  const transactionStatus = event.transaction_status;

  // simpan ke database
  const { error } = await supabase
    .from("transaksi")
    .update({
      metode_pembayaran: paymentType,
      status: transactionStatus
    })
    .eq("kode_pembayaran", orderId);

  if (error) console.error(error);

  res.status(200).json({ received: true });
}
