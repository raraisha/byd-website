import supabase from "./supabase.js";

async function updateNavbarLoginState() {
  const { data: { session } } = await supabase.auth.getSession();
  const isLoggedIn = !!session?.user;

  const authButtons = document.getElementById("authButtons");
  const userSection = document.getElementById("userSection");
  const authMobile = document.getElementById("authMobile");
  const userMobile = document.getElementById("userMobile");
  const navHistory = document.getElementById("navHistory");
  const mobileHistory = document.getElementById("mobileHistory");

  if (isLoggedIn) {
    authButtons.classList.add("hidden");
    userSection.classList.remove("hidden");

    authMobile.classList.add("hidden");
    userMobile.classList.remove("hidden");
    userMobile.classList.add("flex");

    navHistory.classList.remove("hidden");
    mobileHistory.classList.remove("hidden");
  } else {
    authButtons.classList.remove("hidden");
    userSection.classList.add("hidden");

    authMobile.classList.remove("hidden");
    userMobile.classList.add("hidden");

    navHistory.classList.add("hidden");
    mobileHistory.classList.add("hidden");
  }
}

// logout Supabase
document.addEventListener("click", async (e) => {
  if (e.target.id === "logoutBtn") {
    await supabase.auth.signOut();
    window.location.reload();
  }
});

updateNavbarLoginState();

