async function updateStatus() {
    try {
        const res = await fetch(
            "https://webcris.icu/api/status",
        );
        if (!res.ok) throw new Error();

        const status = await res.json();

        document.getElementById("server").textContent =
            status.server;
        document.getElementById("online").textContent =
            "Online";
        document.getElementById("temp").textContent =
            `Temp ${status.temperature}C`;

        const h = Math.floor(status.uptime_seconds / 3600);
        const m = Math.floor(
            (status.uptime_seconds % 3600) / 60,
        );
        const s = status.uptime_seconds % 60;

        document.getElementById("uptime").textContent =
            `Uptime ${h}h ${m}m ${s}s`;
    } catch {
        document.getElementById("server").textContent =
            "Unavailable";
        document.getElementById("online").textContent =
            "Offline";
    }
}

updateStatus();
setInterval(updateStatus, 10000); // every 10s
