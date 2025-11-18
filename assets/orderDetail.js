import supabase from "../supabase.js";

document.addEventListener("DOMContentLoaded", async () => {
  // --- 1️⃣ Pastikan user login dulu ---
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) {
    alert("🚫 Anda harus login terlebih dahulu sebelum melanjutkan pesanan.");
    window.location.href = "login.html";
    return;
  }
  const user = session.user;

  // --- 2️⃣ Ambil data mobil yang dipilih ---
  const car = JSON.parse(localStorage.getItem("selectedCar"));
  if (!car) {
    alert("Tidak ada mobil yang dipilih.");
    window.location.href = "models.html";
    return;
  }

  // Update tampilan ringkasan order
  document.querySelector(".innovation-card img").src = car.gambar;
  document.querySelector("#order-name").textContent = car.nama_produk;
  document.querySelector("#order-color").textContent = car.warna;
  document.querySelector("#order-type").textContent = car.varian;
  document.querySelector("#order-price").textContent = `Rp ${parseFloat(car.harga).toLocaleString("id-ID")}`;
  window.price = parseFloat(car.harga);

  // --- 3️⃣ Ambil profil user dari tabel users Supabase ---
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (error) {
    console.error("Gagal memuat profil:", error);
    alert("Gagal memuat data pengguna.");
  } else {
    // Isi otomatis form
    document.getElementById("fullName").value = profile.name || "";
    document.getElementById("email").value = profile.email || user.email;
    document.getElementById("phone").value = profile.no_telp || "";
    document.getElementById("address").value = profile.address || "";
  }

  // --- 4️⃣ Setup Leaflet Map untuk alamat ---
  const map = L.map("map").setView([-6.200000, 106.816666], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap",
  }).addTo(map);

  let marker = L.marker([-6.200000, 106.816666]).addTo(map);
  map.on("click", (e) => {
    marker.setLatLng(e.latlng);
    document.getElementById("latitude").value = e.latlng.lat;
    document.getElementById("longitude").value = e.latlng.lng;
  });

  // --- 5️⃣ Autocomplete alamat ---
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
    }, 400);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest("#address")) suggestionBox.classList.add("hidden");
  });


  // --- 7️⃣ Hitung dan tampilkan jumlah pembayaran (DP / Full) ---
  const dpRate = 0.05;
  const paymentRadios = document.querySelectorAll('input[name="payment-option"]');
  const paymentAmount = document.getElementById("payment-amount");
  const fullRadio = document.querySelector('input[value="full"]');
  if (fullRadio) fullRadio.checked = true;

  function updatePaymentDisplay(selected) {
    const dpAmount = window.price * dpRate;
    paymentAmount.textContent = selected === "full"
      ? `Rp ${window.price.toLocaleString("id-ID")}`
      : `Rp ${dpAmount.toLocaleString("id-ID")}`;
  }
  paymentRadios.forEach(radio => {
    radio.addEventListener("change", (e) => updatePaymentDisplay(e.target.value));
  });
  updatePaymentDisplay("full");

document.getElementById("order-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const orderData = {
    user_id: user.id,
    name: document.getElementById("fullName").value || profile.name,
    email: document.getElementById("email").value || profile.email || user.email,
    phone: document.getElementById("phone").value || profile.no_telp,
    address: document.getElementById("address").value || profile.address,
    status: "pending",
    created_at: new Date().toISOString(),
    car_name: car.nama_produk,
    car_price: car.harga,
  };

  // Simpan sementara ke localStorage
  localStorage.setItem("bydOrder", JSON.stringify(orderData));

  // --- 1️⃣ Request Snap Token ke backend PHP ---
  try {
    const res = await fetch("https://byd-website.vercel.app/api/createTransaction", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order_id: "ORDER-" + Date.now(),
        gross_amount: orderData.car_price,
        customer: {
          first_name: orderData.name,
          email: orderData.email,
          phone: orderData.phone,
          address: orderData.address,
          id_user: user.id,           // ✅ Add this
          id_produk: car.id_produk
        }
      })
    });

    const text = await res.text();
  console.log("Raw response:", text);
  const data = JSON.parse(text);
  if (data.error) {
    alert("Error: " + data.error);
    console.error("Backend error:", data);
    return;
  }

  if (!data.token) {
    alert("Gagal membuat transaksi Midtrans.");
    console.error(data);
    return;
  }

    // --- 2️⃣ Panggil Snap popup ---
    window.snap.pay(data.token, {
      onSuccess: function(result){
        console.log("Payment success:", result);
        // Update status order
        orderData.status = "success";
        localStorage.setItem("bydOrder", JSON.stringify(orderData));
        window.location.href = "payment_success.html";
      },
      onPending: function(result){
        console.log("Payment pending:", result);
        orderData.status = "pending";
        localStorage.setItem("bydOrder", JSON.stringify(orderData));
        alert("Pembayaran sedang menunggu konfirmasi.");
      },
      onError: function(result){
        console.log("Payment error:", result);
        orderData.status = "failed";
        localStorage.setItem("bydOrder", JSON.stringify(orderData));
        alert("Pembayaran gagal.");
      },
      onClose: function(){
        alert("Popup pembayaran ditutup.");
      }
    });

  } catch(err) {
    console.error(err);
    alert("Terjadi kesalahan saat memproses pembayaran.");
  }
});
});

// --- Fungsi countdown timer ---
function startCountdown(duration, modalContent) {
  let timeLeft = duration;
  const countdownEl = modalContent.querySelector("#countdown");
  const statusEl = modalContent.querySelector("#status");

  const timer = setInterval(() => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    countdownEl.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;

    if (timeLeft === 540) {
      clearInterval(timer);
      statusEl.textContent = "Payment confirmed!";
      statusEl.classList.replace("text-yellow-400", "text-green-400");
      setTimeout(() => window.location.href = "payment_success.html", 2000);
    }

    if (timeLeft <= 0) {
      clearInterval(timer);
      statusEl.textContent = "Payment expired.";
      statusEl.classList.replace("text-yellow-400", "text-red-400");
    }

    timeLeft--;
  }, 1000);
}

// --- Jika cancel, ubah status order ---
function clearPendingPayment() {
  const order = JSON.parse(localStorage.getItem("bydOrder"));
  if (order) {
    order.status = "cancelled";
    localStorage.setItem("bydOrder", JSON.stringify(order));
  }
}
