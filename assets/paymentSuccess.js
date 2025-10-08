lucide.createIcons();

  // Ambil data order dari localStorage
  const order = JSON.parse(localStorage.getItem("bydOrder"));
  if (order) {
    document.getElementById("order-id").textContent = Math.floor(Math.random() * 100000000);
    document.getElementById("order-method").textContent = order.paymentMethod.toUpperCase();
  }