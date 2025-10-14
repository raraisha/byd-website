import supabase from '../supabase.js';

async function loadCars() {
  const {data: cars, error} = await supabase.from('mobil_summary').select('*');
  if (error) {
    console.error("Error fetching cars ", error);
    return;
  }

  console.log(cars);

  const container = document.getElementById("car-cards-container");
  container.innerHTML = '';

  cars.forEach((car) => {
    const card = document.createElement("div");
    card.classList.add("model-card-tilt", "group", "fade-in", "relative");

    card.innerHTML = `
      <div class="model-card-inner rounded-2xl relative overflow-visible p-4">
        <img src="${car.gambar || 'assets/images/default.png'}" alt="${car.nama_produk}" class="w-full h-40 object-contain">
        <h5 class="text-cyan-400 mt-3 mb-1 font-semibold">${car.nama_produk}</h5>
        <p class="text-gray-400 text-sm">${car.tipe}</p>
        <p class="text-gray-400 text-sm mt-1 font-medium">Start from Rp ${car.harga?.toLocaleString() || "N/A"}</p>
        <a href="model_detail.html?id=${car.id_mobil}" class="btn-gradient w-full mt-3 inline-block text-white font-medium py-2 px-4 rounded-lg text-center transition-all duration-300">
        Details
        </a>

        <svg class="stroke-card absolute inset-0 w-full h-full pointer-events-none">
          <rect x="0" y="0" width="100%" height="100%" rx="16" ry="16"
                fill="none" stroke="url(#gradDefault)" stroke-width="2"
                stroke-dasharray="6 12" stroke-dashoffset="0"/>
          <defs>
            <linearGradient id="gradDefault" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#00ffff"/>
              <stop offset="50%" stop-color="#00ff99"/>
              <stop offset="100%" stop-color="#00ffff"/>
            </linearGradient>
          </defs>
        </svg>

      </div>
    `;
    container.appendChild(card);
  });
}

  loadCars();