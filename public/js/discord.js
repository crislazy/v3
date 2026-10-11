async function discordstatus() {
    const statusElement = document.getElementById("status");

    try {
        const res = await fetch(
            "https://api.lanyard.rest/v1/users/1528816581105156200",
        );

        if (!res.ok)
            throw new Error("failed for some reason :/");

        const result = await res.json();

        if (!result.success)
            throw new Error("api error i think");

        const status = result.data.discord_status;
        const online = status !== "offline";

        statusElement.textContent = online
            ? "online"
            : "offline";
        statusElement.style.color = online
            ? "#8de7b0"
            : "#ff6b6b";
    } catch {
        statusElement.textContent = "status unavailable";
    }
}

discordstatus();
setInterval(discordstatus, 30000);
