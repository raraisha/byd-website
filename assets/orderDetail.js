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
  document.querySelector("#order-price").textContent =
    `Rp ${parseFloat(car.harga).toLocaleString("id-ID")}`;
  
  window.price = Number(car.harga);

  // --- 3️⃣ Ambil profil user dari Supabase ---
  const { data: profile, error } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  if (error) {
    console.error("Gagal memuat profil:", error);
    alert("Gagal memuat data pengguna.");
  }

  // Isi otomatis form
  document.getElementById("fullName").value = profile?.name || "";
  document.getElementById("email").value = profile?.email || user.email;
  document.getElementById("phone").value = profile?.no_telp || "";
  document.getElementById("address").value = profile?.address || "";

  // --- 4️⃣ Map (Leaflet) ---
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
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}&limit=5`)
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

  // --- 6️⃣ DP / Full Payment ---
  const dpRate = 0.05;
  const paymentRadios = document.querySelectorAll('input[name="payment-option"]');
  const paymentAmount = document.getElementById("payment-amount");

  function updatePayment(selected) {
    paymentAmount.textContent =
      selected === "full"
        ? `Rp ${window.price.toLocaleString("id-ID")}`
        : `Rp ${(window.price * dpRate).toLocaleString("id-ID")}`;
  }

  updatePayment("full");

  paymentRadios.forEach(r => {
    r.addEventListener("change", (e) => updatePayment(e.target.value));
  });

  // --- 7️⃣ Submit Order ---
  document.getElementById("order-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderData = {
      user_id: user.id,
      name: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      status: "pending",
      created_at: new Date().toISOString(),
      car_name: car.nama_produk,
      car_price: Number(car.harga),
    };

    localStorage.setItem("bydOrder", JSON.stringify(orderData));

    // Generate ID
    const generateOrderId = () => {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 10000);
      return `ORDER-${timestamp}-${random}`;
    };

    // --- ✨ FIX MIDTRANS REQUEST ✨ ---
    try {
      console.log("Sending request to Midtrans backend...");

      const res = await fetch("https://byd-website.vercel.app/api/createTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: generateOrderId(),
          gross_amount: Number(orderData.car_price), // FIXED
          payment_type: "bank_transfer",             // FIXED
          enabled_payments: ["bank_transfer"],       // FIXED
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

      const text = await res.text();
      console.log("Backend response:", text);

      const data = JSON.parse(text);
      if (!data.token) {
        alert("Gagal membuat transaksi Midtrans.");
        console.error(data);
        return;
      }

      // --- Snap Popup ---
      window.snap.pay(data.token, {
        onSuccess: function(result){
          orderData.status = "success";
          localStorage.setItem("bydOrder", JSON.stringify(orderData));
          window.location.href = "payment_success.html";
        },
        onPending: function(result){
          orderData.status = "pending";
          localStorage.setItem("bydOrder", JSON.stringify(orderData));
          alert("Pembayaran pending.");
        },
        onError: function(result){
          orderData.status = "failed";
          localStorage.setItem("bydOrder", JSON.stringify(orderData));
          alert("Pembayaran gagal.");
        },
        onClose: function(){
          alert("Popup pembayaran ditutup.");
        }
      });

    } catch (err) {
      console.error("Fetch error:", err);
      alert("Terjadi kesalahan saat memproses pembayaran.");
    }
  });
});
