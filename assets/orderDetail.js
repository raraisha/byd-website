const price = 33000; // harga mobil
  const dpRate = 0.3; // 30%
  const paymentRadios = document.querySelectorAll('input[name="payment-option"]');
  const paymentAmount = document.getElementById('payment-amount');

  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'full') {
        paymentAmount.textContent = `$${price.toLocaleString()}`;
      } else {
        const dpAmount = price * dpRate;
        paymentAmount.textContent = `$${dpAmount.toLocaleString()} (30% DP)`;
      }
    });
  });
  
// Simulasi data user login
  const userData = {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+628123456789",
    address: "Jl. Example No.123, Jakarta"
  };

  document.getElementById('fullName').value = userData.fullName;
  document.getElementById('email').value = userData.email;
  document.getElementById('phone').value = userData.phone;
  document.getElementById('address').value = userData.address;

// Inisialisasi Map (Jakarta sebagai default)
  const map = L.map("map").setView([-6.200000, 106.816666], 12);

  // Tambahkan Tile Layer
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  // Marker awal
  let marker = L.marker([-6.200000, 106.816666]).addTo(map);

  // Update marker saat klik di map
  map.on("click", (e) => {
    marker.setLatLng(e.latlng);
    document.getElementById("latitude").value = e.latlng.lat;
    document.getElementById("longitude").value = e.latlng.lng;
  });

  // Autocomplete address
  const addressInput = document.getElementById("address");
  const suggestionBox = document.getElementById("suggestions");

  let debounceTimer;

  addressInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const query = addressInput.value.trim();

    if (query.length < 3) {
      suggestionBox.classList.add("hidden");
      return;
    }

    debounceTimer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&addressdetails=1&limit=5`)
        .then(res => res.json())
        .then(data => {
          suggestionBox.innerHTML = "";
          if (data.length === 0) {
            suggestionBox.classList.add("hidden");
            return;
          }
          data.forEach(place => {
            const li = document.createElement("li");
            li.textContent = place.display_name;
            li.className = "px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-300";
            li.addEventListener("click", () => {
              addressInput.value = place.display_name;
              document.getElementById("latitude").value = place.lat;
              document.getElementById("longitude").value = place.lon;
              map.setView([place.lat, place.lon], 15);
              marker.setLatLng([place.lat, place.lon]);
              suggestionBox.classList.add("hidden");
            });
            suggestionBox.appendChild(li);
          });
          suggestionBox.classList.remove("hidden");
        });
    }, 400); // debounce 400ms
  });

  // Tutup dropdown jika klik di luar
  document.addEventListener("click", (e) => {
    if (!e.target.closest("#address")) suggestionBox.classList.add("hidden");
  });

  // Metode pembayaran dinamis (sandbox)
  const paymentSelect = document.getElementById('payment');

  // Struktur payment lebih rinci
  const paymentMethods = [
    {
      category: 'Bank Transfer',
      options: [
        { value: 'bca_va', label: 'BCA Virtual Account' },
        { value: 'mandiri_va', label: 'Mandiri Virtual Account' },
        { value: 'bni_va', label: 'BNI Virtual Account' },
        { value: 'bri_va', label: 'BRI Virtual Account' },
      ]
    },
    {
      category: 'Credit Card',
      options: [
        { value: 'visa', label: 'Visa' },
        { value: 'mastercard', label: 'MasterCard' },
      ]
    },
    {
      category: 'E-Wallet / QRIS',
      options: [
        { value: 'qris', label: 'QRIS' }, // Bisa dinamis sesuai sandbox
      ]
    }
  ];

  // Generate <optgroup> dan <option>
  paymentMethods.forEach(group => {
    const optGroup = document.createElement('optgroup');
    optGroup.label = group.category;
    group.options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.textContent = opt.label;
      optGroup.appendChild(option);
    });
    paymentSelect.appendChild(optGroup);
  });

  document.getElementById("order-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const paymentMethod = document.getElementById("payment").value;
  const modal = document.getElementById("payment-modal");
  const modalContent = document.getElementById("modal-content");

  const orderData = {
    name: document.getElementById("fullName").value,
    email: document.getElementById("email").value,
    phone: document.getElementById("phone").value,
    address: document.getElementById("address").value,
    paymentMethod,
    status: "pending"
  };
  localStorage.setItem("bydOrder", JSON.stringify(orderData));

  modalContent.innerHTML = "";

  if (paymentMethod === "qris") {
    modalContent.innerHTML = `
      <h2 class="text-2xl font-bold text-cyan-400">Scan QRIS to Pay</h2>
      <img src="image/qris-example.png" alt="QRIS" class="mx-auto w-56 h-56 rounded-lg border border-gray-700 shadow-lg">
      <p class="text-gray-400">Complete your payment within:</p>
      <h3 id="countdown" class="text-3xl font-bold text-cyan-400">15:00</h3>
      <div id="status" class="text-yellow-400 font-semibold">Waiting for payment...</div>
      <button id="cancel-payment" class="btn-gradient-red w-full mt-4 py-2 rounded-lg font-semibold text-white">
        Cancel Payment
      </button>
    `;
    startCountdown(15 * 60, modalContent);
  } 
  else if (paymentMethod.includes("_va")) {
    const bankName = paymentMethod.split("_")[0].toUpperCase();
    const vaNumber = "8808" + Math.floor(1000000000 + Math.random() * 9000000000);

    modalContent.innerHTML = `
      <h2 class="text-2xl font-bold text-cyan-400">${bankName} Virtual Account</h2>
      <p class="text-gray-400">Transfer to the VA number below:</p>
      <div class="bg-gray-800 py-3 rounded-xl border border-gray-700 text-xl font-mono text-cyan-300 mt-3 select-all">${vaNumber}</div>
      <p class="text-gray-500 text-sm mt-2">Valid for 1 hour.</p>
      <h3 id="countdown" class="text-3xl font-bold text-cyan-400 mt-3">60:00</h3>
      <div id="status" class="text-yellow-400 font-semibold mt-2">Waiting for payment confirmation...</div>
      <button id="cancel-payment" class="btn-gradient-red w-full mt-4 py-2 rounded-lg font-semibold text-white">
        Cancel Payment
      </button>
    `;
    startCountdown(60 * 60, modalContent);
  } 
  else if (paymentMethod === "visa" || paymentMethod === "mastercard") {
    modalContent.innerHTML = `
      <h2 class="text-2xl font-bold text-cyan-400">Credit Card Payment</h2>
      <p class="text-gray-400 mb-3">Demo checkout form:</p>
      <input type="text" placeholder="Card Number" class="w-full px-4 py-2 mb-2 rounded-lg bg-gray-800 border border-gray-700 text-white" />
      <div class="flex gap-3">
        <input type="text" placeholder="MM/YY" class="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" />
        <input type="text" placeholder="CVV" class="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white" />
      </div>
      <button id="pay-now" class="btn-gradient w-full py-2 rounded-lg font-semibold mt-4">Pay Now</button>
      <button id="cancel-payment" class="btn-gradient-red w-full mt-2 py-2 rounded-lg font-semibold text-white">
        Cancel Payment
      </button>
    `;
  } 
  else {
    modalContent.innerHTML = `
      <h2 class="text-xl text-red-400 font-semibold">Invalid Payment Method</h2>
      <p class="text-gray-400">Please select a valid option.</p>
      <button id="cancel-payment" class="btn-gradient-red w-full mt-2 py-2 rounded-lg font-semibold text-white">
        Close
      </button>
    `;
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");

  // Tombol close (pojok kanan atas)
  document.getElementById("close-modal").addEventListener("click", confirmCancel);
  // Tombol cancel di dalam modal
  const cancelBtn = document.getElementById("cancel-payment");
  if (cancelBtn) cancelBtn.addEventListener("click", confirmCancel);

  function confirmCancel() {
    if (confirm("Are you sure you want to cancel this payment?")) {
      clearPendingPayment();
      modal.classList.add("hidden");
      alert("Payment cancelled.");
      window.location.href = "order_detail.html"; // arahkan kembali ke halaman order
    }
  }
});

// Timer countdown
function startCountdown(duration, modalContent) {
  let timeLeft = duration;
  const countdownEl = modalContent.querySelector("#countdown");
  const statusEl = modalContent.querySelector("#status");

  const timer = setInterval(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    countdownEl.textContent = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    if (timeLeft === 540) {
      clearInterval(timer);
      statusEl.textContent = "Payment confirmed!";
      statusEl.classList.replace("text-yellow-400", "text-green-400");
      setTimeout(() => {
        window.location.href = "payment_success.html";
      }, 2000);
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      statusEl.textContent = "Payment expired.";
      statusEl.classList.replace("text-yellow-400", "text-red-400");
    }

    timeLeft--;
  }, 1000);
}

// Hapus data order dari localStorage jika cancel
function clearPendingPayment() {
  const order = JSON.parse(localStorage.getItem("bydOrder"));
  if (order) {
    order.status = "cancelled";
    localStorage.setItem("bydOrder", JSON.stringify(order));
  }
}

