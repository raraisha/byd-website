// cek status login setelah navbar sudah terload
function updateNavbarLoginState() {
    const authButtons = document.getElementById("authButtons");
    const userSection = document.getElementById("userSection");

    const isLoggedIn = localStorage.getItem("userLoggedIn"); // ambil status login

    if (isLoggedIn) {
        authButtons?.classList.add("hidden"); // sembunyikan Login + SignUp
        userSection?.classList.remove("hidden"); // munculkan icon user
    } else {
        authButtons?.classList.remove("hidden");
        userSection?.classList.add("hidden");
    }
}
