import supabase from "../supabase.js";

lucide.createIcons();

// Get car id from URL
const urlParams = new URLSearchParams(window.location.search);
const carId = urlParams.get("id");

async function loadCarDetails() {
  try {
    // 1️⃣ Get the selected car summary (from the view)
    const { data: summary, error: summaryError } = await supabase
      .from("mobil_summary")
      .select("*")
      .eq("id_mobil", carId)
      .single();

    if (summaryError) throw summaryError;

    // Display main info
    document.getElementById("car-name").textContent = summary.nama_produk;
    document.getElementById("car-desc").textContent = summary.deskripsi;
    document.getElementById("car-image").src = summary.gambar;

    // 2️⃣ Fetch all variants for this car name (real table)
    const { data: variants, error: variantError } = await supabase
      .from("mobil")
      .select("*")
      .eq("nama_produk", summary.nama_produk)
      .order("harga", { ascending: true });

    if (variantError) throw variantError;

    setupVariantSelectors(variants);
  } catch (err) {
    console.error("Error fetching car details:", err);
  }
}

loadCarDetails();

function setupVariantSelectors(variants) {
  const colorContainer = document.getElementById("color-options");
  const typeSelect = document.getElementById("car-type");
  const priceEl = document.getElementById("car-price");
  const stockEl = document.getElementById("car-stock");
  const imageEl = document.getElementById("car-image");

  // Extract unique types
  const types = [...new Set(variants.map(v => v.varian))];
  const colors = [...new Set(variants.map(v => v.warna))];

  // Populate dropdown for types
  typeSelect.innerHTML = types.map(t => `<option value="${t}">${t}</option>`).join("");

  // Create color buttons
  colorContainer.innerHTML = colors.map(c => `
    <button data-color="${c}" class="border border-gray-400 rounded-full px-3 py-1 text-sm hover:bg-gray-700 hover:text-white transition">${c}</button>
  `).join("");

  // Default selection
  let selectedType = types[0];
  let selectedColor = colors[0];

  function updateDisplay() {
    const variant = variants.find(v => v.varian === selectedType && v.warna === selectedColor);
    if (variant) {
      priceEl.textContent = `Rp ${variant.harga.toLocaleString()}`;
      stockEl.textContent = variant.stock;
      imageEl.src = variant.gambar || imageEl.src;

      // 🧩 Update specifications
      document.getElementById("spec-tipe").textContent = variant.tipe || "-";
      document.getElementById("spec-varian").textContent = variant.varian || "-";
      document.getElementById("spec-baterai").textContent = variant.baterai || "-";
      document.getElementById("spec-jarak").textContent = variant.jarak_tempuh || "-";
      document.getElementById("spec-tenaga").textContent = variant.tenaga_motor || "-";
      document.getElementById("spec-akselerasi").textContent = variant.akselerasi || "-";
      document.getElementById("spec-pengisian").textContent = variant.pengisian || "-";
      document.getElementById("spec-penumpang").textContent = variant.kapasitas_penumpang || "-";
      document.getElementById("spec-tahun").textContent = variant.tahun || "-";
      document.getElementById("spec-deskripsi").innerHTML = `
        <span class="text-cyan-400 font-semibold">${variant.nama_produk}</span>
        ${variant.deskripsi || ''}
      `;

      document.querySelectorAll(".spec-card").forEach(card => {
      card.classList.add("animate-fadeInUp");
      });
    }
  }

  // Add event listeners
  typeSelect.addEventListener("change", (e) => {
    selectedType = e.target.value;
    updateDisplay();
  });

  colorContainer.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      colorContainer.querySelectorAll("button").forEach(b => b.classList.remove("border-cyan-400"));
      btn.classList.add("border-cyan-400");
      selectedColor = btn.getAttribute("data-color");
      updateDisplay();
    });
  });

  // Initial render
  updateDisplay();
}

// === ORDER NOW BUTTON HANDLER ===
document.getElementById("order-button").addEventListener("click", async () => {
  // 🔍 1️⃣ Cek session Supabase
  const { data: { session } } = await supabase.auth.getSession();

  if (!session || !session.user) {
    alert("🚫 Anda harus login terlebih dahulu untuk memesan mobil.");
    window.location.href = "login.html";
    return;
  }

  // 2️⃣ Ambil data user dari Supabase (opsional)
  const user = session.user;
  
  const carName = document.getElementById("car-name").textContent;
  const priceText = document.getElementById("car-price").textContent.replace(/[^\d]/g, "");
  const price = parseFloat(priceText);
  const image = document.getElementById("car-image").src;

  // Ambil data terakhir dari variant yang sedang ditampilkan
  const selectedType = document.getElementById("car-type").value;
  const selectedColorBtn = document.querySelector("#color-options button.border-cyan-400");
  const selectedColor = selectedColorBtn ? selectedColorBtn.dataset.color : "-";

  if (!selectedColorBtn) {
    alert("⚠️ Silakan pilih warna mobil terlebih dahulu sebelum melanjutkan.");
    return;
  }
  
  // Simpan ke localStorage
  const selectedCar = {
    id_mobil: carId,
    nama_produk: carName,
    varian: selectedType,
    warna: selectedColor,
    harga: price,
    gambar: image
  };

  localStorage.setItem("selectedCar", JSON.stringify(selectedCar));

  // Redirect ke halaman order
  window.location.href = "order_detail.html";
});

