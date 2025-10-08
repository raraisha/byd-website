// Data stok per tipe & warna
    const stockData = {
      advanced: {
        "Surf Blue": 12,
        "Sky White": 8,
        "Boulder Grey": 6,
        "Cosmos Black": 5,
        price: "$33,000"
      },
      superior: {
        "Surf Blue": 7,
        "Sky White": 5,
        "Boulder Grey": 3,
        "Cosmos Black": 2,
        price: "$37,500"
      }
    };

    const colorButtons = document.querySelectorAll("[data-color]");
    const selectedColorText = document.getElementById("selected-color");
    const carImage = document.getElementById("car-image");
    const carTypeSelect = document.getElementById("car-type");
    const carPrice = document.getElementById("car-price");
    const carStock = document.getElementById("car-stock");

    let selectedColor = "Surf Blue";
    let selectedType = "advanced";

    colorButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        colorButtons.forEach(b => b.classList.remove("border-white"));
        btn.classList.add("border-white");
        selectedColor = btn.getAttribute("data-color");
        selectedColorText.textContent = selectedColor;
        carImage.src = btn.getAttribute("data-img");
        updateStock();
      });
    });

    carTypeSelect.addEventListener("change", () => {
      selectedType = carTypeSelect.value;
      updateStock();
    });

    function updateStock() {
      const data = stockData[selectedType];
      carPrice.textContent = data.price;
      carStock.textContent = data[selectedColor];
    }

    updateStock();

    lucide.createIcons();

  // Reveal animation on scroll
  const cards = document.querySelectorAll('.spec-card');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeInUp');
      }
    });
  }, { threshold: 0.2 });
  cards.forEach(card => observer.observe(card));