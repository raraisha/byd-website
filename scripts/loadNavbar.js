import supabase from '../supabase.js';

document.addEventListener("DOMContentLoaded", async () => {
  const navbarContainer = document.getElementById("navbar");
  if (!navbarContainer) return;

  try {
    const res = await fetch("navbar.html");
    const html = await res.text();
    navbarContainer.innerHTML = html;
    lucide.createIcons();

    const authButtons = document.getElementById("authButtons");
    const userSection = document.getElementById("userSection");
    const navHistory = document.getElementById("navHistory");


    async function updateNavbar() {
    const { data: { session } } = await supabase.auth.getSession();

    if (session && session.user) {
      authButtons.classList.add("hidden");
      userSection.classList.remove("hidden");
      navHistory.classList.remove("hidden");
    } else {
      authButtons.classList.remove("hidden");
      userSection.classList.add("hidden");
      navHistory.classList.add("hidden");
    }
  }

  await updateNavbar();

    supabase.auth.onAuthStateChange((_event, session) => {
      updateNavbar();
    });

  } catch (err) {
    console.error("Gagal memuat navbar:", err);
  }
});
