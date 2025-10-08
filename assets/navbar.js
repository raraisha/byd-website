        fetch("navbar.html")
      .then(res => res.text())
      .then(data => {
        document.getElementById("navbar").innerHTML = data;
        lucide.createIcons(); // aktifkan ikon setelah navbar dimuat
      });
        fetch("footer.html")
    .then(res => res.text())
    .then(data => {
      document.getElementById("footer").innerHTML = data;
      lucide.createIcons(); // aktifin ikon lucide
    });
