import supabase from "../supabase.js";

document.addEventListener("DOMContentLoaded", async () => {

  // --- 1. CEK LOGIN ---
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !session.user) {
    alert("Anda harus login dahulu.");
    window.location.href = "login.html";
    return;
  }
  const user = session.user;

  // --- 2. AMBIL DATA MOBIL ---
  const car = JSON.parse(localStorage.getItem("selectedCar"));
  if (!car) {
    alert("Tidak ada mobil yang dipilih.");
    window.location.href = "models.html";
    return;
  }

  // Update UI ringkasan mobil
  document.querySelector(".innovation-card img").src = car.gambar;
  document.querySelector("#order-name").textContent = car.nama_produk;
  document.querySelector("#order-color").textContent = car.warna;
  document.querySelector("#order-type").textContent = car.varian;
  document.querySelector("#order-price").textContent =
    `Rp ${parseFloat(car.harga).toLocaleString("id-ID")}`;

  window.price = Number(car.harga);


  // --- 3. AMBIL PROFIL USER ---
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  document.getElementById("fullName").value = profile?.name || "";
  document.getElementById("email").value = profile?.email || user.email;
  document.getElementById("phone").value = profile?.no_telp || "";
  document.getElementById("address").value = profile?.address || "";


  // --- 4. MAP (LEAFLET) ---
  const map = L.map("map").setView([-6.2, 106.816], 12);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; OpenStreetMap"
  }).addTo(map);

  let marker = L.marker([-6.2, 106.816]).addTo(map);

  map.on("click", (e) => {
    marker.setLatLng(e.latlng);
    document.getElementById("latitude").value = e.latlng.lat;
    document.getElementById("longitude").value = e.latlng.lng;
  });


  // --- 5. AUTOCOMPLETE ADDRESS ---
  const addressInput = document.getElementById("address");
  const suggestionBox = document.getElementById("suggestions");
  let debounce;

  addressInput.addEventListener("input", () => {
    clearTimeout(debounce);

    const q = addressInput.value.trim();
    if (q.length < 3) return suggestionBox.classList.add("hidden");

    debounce = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=5`)
        .then(res => res.json())
        .then(data => {
          suggestionBox.innerHTML = "";
          if (data.length === 0) return suggestionBox.classList.add("hidden");

          data.forEach(place => {
            const li = document.createElement("li");
            li.textContent = place.display_name;
            li.className = "px-4 py-2 hover:bg-gray-800 cursor-pointer text-gray-300";

            li.onclick = () => {
              addressInput.value = place.display_name;
              document.getElementById("latitude").value = place.lat;
              document.getElementById("longitude").value = place.lon;

              map.setView([place.lat, place.lon], 15);
              marker.setLatLng([place.lat, place.lon]);

              suggestionBox.classList.add("hidden");
            };

            suggestionBox.appendChild(li);
          });

          suggestionBox.classList.remove("hidden");
        });
    }, 400);
  });


  // --- 6. FULL / DP ---
  const dpRate = 0.05;
  const radios = document.querySelectorAll('input[name="payment-option"]');
  const amountLabel = document.getElementById("payment-amount");

  const updateAmount = (val) => {
    amountLabel.textContent =
      val === "full" ?
        `Rp ${window.price.toLocaleString("id-ID")}` :
        `Rp ${(window.price * dpRate).toLocaleString("id-ID")}`;
  };

  updateAmount("full");
  radios.forEach(r => r.addEventListener("change", () => updateAmount(r.value)));


  // --- 7. SUBMIT & MIDTRANS ---
  document.getElementById("order-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Order data
    const orderData = {
      user_id: user.id,
      name: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      car_name: car.nama_produk,
      car_price: Number(car.harga),
      status: "pending",
      created_at: new Date().toISOString(),
    };

    localStorage.setItem("bydOrder", JSON.stringify(orderData));

    const generateOrderId = () =>
      `ORDER-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    try {
      const response = await fetch("https://byd-website.vercel.app/api/createTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: generateOrderId(),
          gross_amount: Number(orderData.car_price),
          enabled_payments: ["bca_va"],   // ✨ FIX – INI YANG BUAT VA MUNCUL
          customer: {
            first_name: orderData.name,
            email: orderData.email,
            phone: orderData.phone,
            address: orderData.address,
            id_user: profile.id_user,
            id_produk: car.id_mobil
          }
        })
      });

      const text = await response.text();
      console.log("Midtrans return:", text);

      const data = JSON.parse(text);

      if (!data.token) {
        alert("Gagal membuat transaksi.");
        return;
      }

      // Snap Popup
      window.snap.pay(data.token, {
        onSuccess: function(res) {
          orderData.status = "success";
          localStorage.setItem("bydOrder", JSON.stringify(orderData));
          window.location.href = "payment_success.html";
        },
        onPending: function(res) {
          orderData.status = "pending";
          localStorage.setItem("bydOrder", JSON.stringify(orderData));
          alert("VA berhasil dibuat. Silakan selesaikan pembayaran.");
        },
        onError: function() {
          orderData.status = "failed";
          alert("Pembayaran gagal.");
        }
      });

    } catch (err) {
      console.error("ERROR:", err);
      alert("Terjadi kesalahan server.");
    }
  });

});
