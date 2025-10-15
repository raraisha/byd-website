document.addEventListener("DOMContentLoaded", async () => {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  try {
    const res = await fetch("navbar.html");
    const html = await res.text();
    navbarContainer.innerHTML = html;

    // aktifkan lucide icons setelah navbar dimuat
    lucide.createIcons();

    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const userEmail = localStorage.getItem("userEmail");
    const authButtons = document.getElementById("authButtons");
    const userSection = document.getElementById("userSection");
    const userBtn = document.getElementById("userBtn");
    const dropdownMenu = document.getElementById("dropdownMenu");
    const logoutBtn = document.getElementById("logoutBtn");
    const navHistory = document.getElementById("navHistory");

    // tampilkan icon profile kalau login
    if (isLoggedIn === "true" && userEmail) {
      authButtons.classList.add("hidden");
      userSection.classList.remove("hidden");
      navHistory.classList.remove("hidden");
    }

    // toggle dropdown
    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dropdownMenu.classList.toggle("hidden");
    });

    // logout
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("isLoggedIn");
      localStorage.removeItem("userEmail");
      window.location.href = "login.html";
    });

    // klik di luar dropdown → tutup
    document.addEventListener("click", (e) => {
      if (!userSection.contains(e.target)) {
        dropdownMenu.classList.add("hidden");
      }
    });
  } catch (err) {
    console.error("Gagal memuat navbar:", err);
  }
});
