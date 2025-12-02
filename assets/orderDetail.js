import supabase from "../supabase.js";

document.addEventListener("DOMContentLoaded", async () => {

  // =============================
  // 🔐 SESSION USER
  // =============================
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    alert("Anda harus login terlebih dahulu.");
    return window.location.href = "login.html";
  }
  const user = session.user;

  // =============================
  // 🚗 DATA MOBIL SELECTED
  // =============================
  const car = JSON.parse(localStorage.getItem("selectedCar"));
  if (!car) return (window.location.href = "models.html");

  document.querySelector("#order-name").textContent = car.nama_produk;
  document.querySelector("#order-color").textContent = car.warna;
  document.querySelector("#order-type").textContent = car.varian;
  const hargaNumber = Number(car.harga.toString().replace(/\./g, ''));
  document.querySelector("#order-price").textContent =
    `Rp ${parseFloat(car.harga).toLocaleString("id-ID")}`;
  window.price = hargaNumber;

  // =============================
  // 👤 USER PROFILE
  // =============================
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("auth_id", user.id)
    .single();

  document.getElementById("fullName").value = profile?.name || "";
  document.getElementById("email").value = profile?.email || user.email;
  document.getElementById("phone").value = profile?.no_telp || "";
  document.getElementById("address").value = profile?.address || "";

  // =============================
  // 🗺️ MAP
  // =============================
  const map = L.map("map").setView([-6.2, 106.81], 12);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

  let marker = L.marker([-6.2, 106.81]).addTo(map);

  map.on("click", e => {
    marker.setLatLng(e.latlng);
    document.getElementById("latitude").value = e.latlng.lat;
    document.getElementById("longitude").value = e.latlng.lng;
  });

  // =============================
  // 📌 AUTOCOMPLETE ADDRESS
  // =============================
  const addressInput = document.getElementById("address");
  const suggestionBox = document.getElementById("suggestions");
  let debounceTimer;

  addressInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    const q = addressInput.value.trim();
    if (q.length < 3) return suggestionBox.classList.add("hidden");

    debounceTimer = setTimeout(() => {
      fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=5`)
        .then(res => res.json())
        .then(data => {
          suggestionBox.innerHTML = "";
          if (data.length === 0) return suggestionBox.classList.add("hidden");

          data.forEach(place => {
            const li = document.createElement("li");
            li.textContent = place.display_name;
            li.className = "px-4 py-2 hover:bg-gray-800 cursor-pointer";

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
    }, 300);
  });

  // =============================
  // 💰 PAYMENT OPTION
  // =============================
  const dpRate = 0.05;
  const paymentRadios = document.querySelectorAll('input[name="payment-option"]');
  const paymentAmount = document.getElementById("payment-amount");

  function updatePayment(type) {
    const amount = type === "full"
      ? window.price
      : Math.floor(window.price * dpRate);

    paymentAmount.textContent = `Rp ${amount.toLocaleString("id-ID")}`;
    paymentAmount.dataset.amount = amount;
  }

  updatePayment("full");
  paymentRadios.forEach(r => r.addEventListener("change", e => updatePayment(e.target.value)));

  // =============================
  // 📝 SUBMIT ORDER
  // =============================
  document.getElementById("order-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    const orderData = {
      user_id: user.id,
      name: fullName.value,
      email: email.value,
      phone: phone.value,
      address: address.value,
      status: "pending",
      created_at: new Date().toISOString(),
      car_name: car.nama_produk,
      car_price: hargaNumber,
    };

    localStorage.setItem("bydOrder", JSON.stringify(orderData));

    const orderId = `ORDER-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

    // =============================
    // 📦 DATA TRANSAKSI UNTUK SUPABASE
    // =============================
const transaksiData = {
  id_user: profile?.id_user ?? profile?.id,   // sesuai kolom
  id_produk: car.id_mobil,                    // sesuai kolom
  jumlah_dp: paymentType === "dp" ? amountToPay : null,
  metode_pembayaran: paymentType,             // "full" atau "dp"
  kode_pembayaran: orderId,                   // wajib
  bukti_pembayaran: null,                     // default NULL
  sisa_pembayaran: paymentType === "full" ? 0 : window.price - amountToPay,
  catatan: "",                                // opsional
  status: "pending",                          // pending / success / failed
  // tanggal, created_at, updated_at --> dibuat otomatis oleh database
};


    // =============================
    // 💾 SIMPAN KE SUPABASE
    // =============================
    const { data: saved, error } = await supabase
      .from("transaksi")
      .insert(transaksiData)
      .select()
      .single();

    if (error) {
      console.error(error);
      return alert("Gagal menyimpan transaksi.");
    }

    console.log("Saved transaksi:", saved);

    // =============================
    // 🔗 MIDTRANS TOKEN REQUEST
    // =============================
    try {
      const res = await fetch("https://byd-website.vercel.app/api/createTransaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: orderId,
          gross_amount: hargaNumber,
          payment_type: "bank_transfer",
          enabled_payments: ["bank_transfer"],
          customer: {
            first_name: profile?.name,
            email: profile?.email,
            phone: profile?.no_telp,
            address: profile?.address,
            id_user: saved.id_user,
            id_produk: car.id_mobil
          }
        })
      });

      const text = await res.text();
      const data = JSON.parse(text);

      if (!data.token) {
        alert("Gagal membuat transaksi Midtrans.");
        return;
      }

      // =============================
      // 💳 SNAP POPUP
      // =============================
      window.snap.pay(data.token, {
        onSuccess: async () => {
          await supabase.from("transaksi")
            .update({ status: "success" })
            .eq("id_transaksi", saved.id_transaksi);

          window.location.href = "payment_success.html";
        },
        onPending: async () => {
          await supabase.from("transaksi")
            .update({ status: "pending" })
            .eq("id_transaksi", saved.id_transaksi);

          alert("Pembayaran pending.");
        },
        onError: async () => {
          await supabase.from("transaksi")
            .update({ status: "failed" })
            .eq("id_transaksi", saved.id_transaksi);

          alert("Pembayaran gagal.");
        },
        onClose: () => {
          alert("Popup pembayaran ditutup.");
        }
      });

    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat memproses pembayaran.");
    }

  });

});
