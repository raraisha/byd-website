<?php
header('Content-Type: application/json');

// Ambil data dari request frontend
$input = json_decode(file_get_contents('php://input'), true);

$id_user = $input['id_user'] ?? null;
$id_produk = $input['id_produk'] ?? null;
$jumlah_dp = $input['jumlah_dp'] ?? 0;
$metode_pembayaran = $input['metode_pembayaran'] ?? 'qris';
$status = $input['status'] ?? 'pending';
$kode_pembayaran = $input['kode_pembayaran'] ?? null;
$sisa_pembayaran = $input['sisa_pembayaran'] ?? 0;

// Supabase REST API endpoint
$supabaseUrl = 'https://qbixwpmyirbydopzxxwe.supabase.co/rest/v1/transaksi';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFiaXh3cG15aXJieWRvcHp4eHdlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYxMjA5MSwiZXhwIjoyMDc0MTg4MDkxfQ.ReyhDaaFjbE2nuK6pBe0B47hIyPL6WW7s7UsoJHvq8E';

// Buat request POST ke Supabase
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $supabaseUrl);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "apikey: $supabaseKey",
    "Authorization: Bearer $supabaseKey"
));
curl_setopt($ch, CURLOPT_POST, 1);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "id_user" => $id_user,
    "id_produk" => $id_produk,
    "jumlah_dp" => $jumlah_dp,
    "metode_pembayaran" => $metode_pembayaran,
    "status" => $status,
    "kode_pembayaran" => $kode_pembayaran,
    "sisa_pembayaran" => $sisa_pembayaran
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$result = curl_exec($ch);
$http_status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($http_status == 201 || $http_status == 200) {
    echo json_encode(["success" => true, "data" => json_decode($result)]);
} else {
    echo json_encode(["success" => false, "error" => $result]);
}
?>
