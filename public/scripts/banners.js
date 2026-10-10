const toggle = document.getElementById("toggle-ads");
const ads = document.querySelectorAll(".side-banner");

function updateAds(hidden) {
    ads.forEach((ad) => {
        ad.hidden = hidden;
    });

    toggle.textContent = hidden ? "Show ads" : "Hide ads";
    localStorage.setItem("ads-hidden", String(hidden));
}

const hidden = localStorage.getItem("ads-hidden") === "true";
updateAds(hidden);

toggle.addEventListener("click", () => {
    const hidden = localStorage.getItem("ads-hidden") !== "true";
    updateAds(hidden);
});
