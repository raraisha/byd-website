// Ambil data order dari localStorage
const orderData = JSON.parse(localStorage.getItem("bydOrder"));

if (!orderData) {
  alert("No order data found. Please start your order again.");
  window.location.href = "order_detail.html";
}

// Elemen UI target
const orderSummary = document.getElementById("order-summary");
const paymentContainer = document.getElementById("payment-container");

// Render ringkasan order
orderSummary.innerHTML = `
  <h2 class="text-2xl font-bold text-cyan-400 mb-3">Order Summary</h2>
  <p><span class="text-gray-400">Name:</span> ${orderData.name}</p>
  <p><span class="text-gray-400">Email:</span> ${orderData.email}</p>
  <p><span class="text-gray-400">Phone:</span> ${orderData.phone}</p>
  <p><span class="text-gray-400">Address:</span> ${orderData.address}</p>
  <p><span class="text-gray-400">Payment Option:</span> ${orderData.paymentOption === "full" ? "Full Payment" : "Down Payment (30%)"}</p>
`;

// Tampilkan metode pembayaran sesuai pilihan
let html = "";

switch (orderData.paymentMethod) {
  case "qris":
    html = `
      <h3 class="text-xl font-semibold text-cyan-400 mb-4">Scan QRIS to Pay</h3>
      <img src="image/qris-sample.png" alt="QRIS" class="w-64 mx-auto rounded-xl shadow-lg border border-gray-700">
      <p class="text-gray-400 mt-4 text-center">Use any app that supports QRIS (GoPay, ShopeePay, OVO, etc).</p>
    `;
    break;

  case "bca_va":
  case "bni_va":
  case "bri_va":
  case "mandiri_va":
    const bankName = orderData.paymentMethod.split("_")[0].toUpperCase();
    const vaNumber = Math.floor(100000000000 + Math.random() * 900000000000); // Simulasi
    html = `
      <h3 class="text-xl font-semibold text-cyan-400 mb-4">${bankName} Virtual Account</h3>
      <div class="bg-gray-800 border border-gray-700 p-5 rounded-xl text-center">
        <p class="text-gray-400 text-sm mb-1">Virtual Account Number:</p>
        <p class="text-2xl font-bold text-cyan-300 tracking-wider">${vaNumber}</p>
      </div>
      <p class="text-gray-400 mt-4 text-center">
        Complete your payment using ${bankName} Internet/Mobile Banking.
      </p>
    `;
    break;

  case "visa":
  case "mastercard":
    html = `
      <h3 class="text-xl font-semibold text-cyan-400 mb-4">Credit Card Payment</h3>
      <p class="text-gray-400 mb-4">Enter your card details below:</p>
      <input type="text" placeholder="Card Number" class="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white mb-3">
      <div class="flex gap-3">
        <input type="text" placeholder="MM/YY" class="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white">
        <input type="text" placeholder="CVV" class="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white">
      </div>
    `;
    break;

  case "gopay":
  case "spay":
    const ewalletName = orderData.paymentMethod === "gopay" ? "GoPay" : "ShopeePay";
    html = `
      <h3 class="text-xl font-semibold text-cyan-400 mb-4">${ewalletName} Payment</h3>
      <img src="image/qris-sample.png" alt="QR Code" class="w-64 mx-auto rounded-xl shadow-lg border border-gray-700">
      <p class="text-gray-400 mt-4 text-center">Scan the QR code using your ${ewalletName} app.</p>
    `;
    break;

  default:
    html = `<p class="text-gray-400">Unknown payment method selected.</p>`;
}

// Masukkan konten dinamis
paymentContainer.innerHTML = html;

// Tombol konfirmasi pembayaran
const confirmBtn = document.getElementById("confirm-payment");
confirmBtn.addEventListener("click", () => {
  alert("Payment verified successfully!");
  window.location.href = "payment-success.html";
});
