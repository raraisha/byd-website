import supabase from "./supabase.js";

async function loadNavbar() {
  const container = document.getElementById("navbar");
  const html = await fetch("./navbar.html").then(res => res.text());
  container.innerHTML = html;

  initializeNavbar();
}

async function initializeNavbar() {
  // Dropdown mobile
  const btn = document.getElementById("menuBtn");
  const mobile = document.getElementById("mobileMenu");
  const overlay = document.getElementById("overlay");

  btn?.addEventListener("click", () => {
    mobile.classList.toggle("hidden");
    overlay.classList.toggle("hidden");
  });

  overlay?.addEventListener("click", () => {
    mobile.classList.add("hidden");
    overlay.classList.add("hidden");
  });

  // LOGIN STATE
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session?.user;

  const authButtons = document.getElementById("authButtons");
  const userSection = document.getElementById("userSection");
  const authMobile = document.getElementById("authMobile");
  const userMobile = document.getElementById("userMobile");
  const navHistory = document.getElementById("navHistory");
  const mobileHistory = document.getElementById("mobileHistory");

  if (isLoggedIn) {
    authButtons?.classList.add("hidden");
    userSection?.classList.remove("hidden");

    authMobile?.classList.add("hidden");
    userMobile?.classList.remove("hidden");
    userMobile?.classList.add("flex");

    navHistory?.classList.remove("hidden");
    mobileHistory?.classList.remove("hidden");
  } else {
    authButtons?.classList.remove("hidden");
    userSection?.classList.add("hidden");

    authMobile?.classList.remove("hidden");
    userMobile?.classList.add("hidden");

    navHistory?.classList.add("hidden");
    mobileHistory?.classList.add("hidden");
  }

  // LOGOUT
  document.getElementById("logoutBtn")?.addEventListener("click", async () => {
    await supabase.auth.signOut();
    window.location.reload();
  });
}

loadNavbar();
