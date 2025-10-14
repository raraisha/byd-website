const cars = [
    {
      name: "BYD Atto 1",
      image: "image/byd-atto1.png",
      type: "SUV with advanced electric performance",
      price: "$45,000",
      gradient: "gradTang",
      gradientColors: ["#00ffff","#00ff99","#00ffff"]
    },
    {
      name: "BYD Atto 3",
      image: "image/byd-atto3.png",
      type: "Compact SUV blending efficiency and style",
      price: "$33,000",
      gradient: "gradAtto",
      gradientColors: ["#ff00ff","#ff9900","#ff00ff"]
    },
    {
      name: "BYD Dolphin",
      image: "image/byd-dolphin-2.png",
      type: "Hatchback with smooth city driving experience",
      price: "$25,000",
      gradient: "gradDolphin",
      gradientColors: ["#00ffff","#00ffff","#00ff99"]
    },
    {
      name: "BYD Seal",
      image: "image/byd-seal.png",
      type: "Electric sport sedan with breathtaking acceleration",
      price: "$48,000",
      gradient: "gradSeal",
      gradientColors: ["#00ffff","#ff00ff","#00ffff"]
    },
    {
      name: "BYD Sealion 7",
      image: "image/byd-seal.png",
      type: "Electric sport sedan with breathtaking acceleration",
      price: "$48,000",
      gradient: "gradSeal",
      gradientColors: ["#00ffff","#ff00ff","#00ffff"]
    },
    {
      name: "BYD M6",
      image: "image/byd-seal.png",
      type: "Electric sport sedan with breathtaking acceleration",
      price: "$48,000",
      gradient: "gradSeal",
      gradientColors: ["#00ffff","#ff00ff","#00ffff"]
    }
  ];

  const container = document.getElementById("car-cards-container");

  cars.forEach((car, index) => {
    const card = document.createElement("div");
    card.classList.add("model-card-tilt", "group", "fade-in", "relative");

    card.innerHTML = `
      <div class="model-card-inner rounded-2xl relative overflow-visible p-4">
        <img src="${car.image}" alt="${car.name}" class="w-full h-40 object-contain">
        <h5 class="text-cyan-400 mt-3 mb-1 font-semibold">${car.name}</h5>
        <p class="text-gray-400 text-sm">${car.type}</p>
        <p class="text-gray-400 text-sm mt-1 font-medium">Start from ${car.price}</p>
        <a href="#" class="btn-gradient w-full mt-3 inline-block text-white font-medium py-2 px-4 rounded-lg text-center transition-all duration-300">
        Details
        </a>

        <svg class="stroke-card absolute inset-0 w-full h-full pointer-events-none">
          <rect x="0" y="0" width="100%" height="100%" rx="16" ry="16"
                fill="none" stroke="url(#${car.gradient})" stroke-width="2"
                stroke-dasharray="6 12" stroke-dashoffset="0"/>
          <defs>
            <linearGradient id="${car.gradient}" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="${car.gradientColors[0]}"/>
              <stop offset="50%" stop-color="${car.gradientColors[1]}"/>
              <stop offset="100%" stop-color="${car.gradientColors[2]}"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    `;
    container.appendChild(card);
  });