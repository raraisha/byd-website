<?php
header('Content-Type: application/json');

// Midtrans sandbox Server Key
$serverKey = getenv("MIDTRANS_SERVER_KEY");
$auth = base64_encode($serverKey . ':');

// Ambil data dari request frontend
$input = json_decode(file_get_contents('php://input'), true);
$order_id = $input['order_id'] ?? 'ORDER-' . time();
$gross_amount = $input['gross_amount'] ?? 10000;
$customer = $input['customer'] ?? [];

$transaction = [
    "transaction_details" => [
        "order_id" => $order_id,
        "gross_amount" => $gross_amount
    ],
    "customer_details" => [
        "first_name" => $customer['first_name'] ?? "Guest",
        "email" => $customer['email'] ?? "guest@example.com",
        "phone" => $customer['phone'] ?? "08123456789",
        "billing_address" => [
            "address" => $customer['address'] ?? "-"
        ]
    ],
    "enabled_payments" => ["credit_card", "bca_va", "qris"]
];

// Kirim request ke Midtrans Snap API
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "https://app.sandbox.midtrans.com/snap/v1/transactions");
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "Authorization: Basic $auth"
));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($transaction));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Setelah sukses generate Snap token
$response = json_decode($result, true);
$token = $response['token'] ?? null;

if ($token) {
    // Kirim data transaksi ke saveTransaction.php
    $save = curl_init();
    curl_setopt($save, CURLOPT_URL, "https://byd-website.vercel.app/api/saveTransaction.php");
    curl_setopt($save, CURLOPT_HTTPHEADER, array("Content-Type: application/json"));
    curl_setopt($save, CURLOPT_POST, 1);
    curl_setopt($save, CURLOPT_POSTFIELDS, json_encode([
        "id_user" => $customer['id_user'] ?? null,
        "id_produk" => $customer['id_produk'] ?? null,
        "jumlah_dp" => $gross_amount * 0.05,
        "metode_pembayaran" => "snap",
        "status" => "pending",
        "kode_pembayaran" => $order_id,
        "sisa_pembayaran" => $gross_amount * 0.95
    ]));
    curl_setopt($save, CURLOPT_RETURNTRANSFER, true);
    curl_exec($save);
    curl_close($save);
}

echo $result; // kembalikan token ke frontend

