<?php
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$order_id = $input['order_id'] ?? null;
$status = $input['transaction_status'] ?? null;
$payment_type = $input['payment_type'] ?? null;

// Supabase
$supabaseUrl = 'https://qbixwpmyirbydopzxxwe.supabase.co/rest/v1/transaksi?kode_pembayaran=eq.' . $order_id;
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiaXh3cG15aXJieWRvcHp4eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxMjA5MSwiZXhwIjoyMDc0MTg4MDkxfQ.ReyhDaaFjbE2nuK6pBe0B47hIyPL6WW7s7UsoJHvq8E';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey",
    "Prefer: resolution=merge-duplicates"
));
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PATCH");
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "status" => $status,
    "metode_pembayaran" => $payment_type
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

http_response_code(200);
echo json_encode([
    "success" => ($http_status == 200),
    "response" => json_decode($result, true)
]);
?>
