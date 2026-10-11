async function getLastUpdated() {
    try {
        const res = await fetch(
            "https://api.github.com/repos/crislazy/v3/commits?per_page=1",
        );

        if (!res.ok) throw new Error();

        const data = await res.json();
        const date = new Date(data[0].commit.committer.date);

        document.getElementById("last-updated").textContent =
            date.toLocaleString("en-GB", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
                hour12: false,
            });
    } catch {
        document.getElementById("last-updated").textContent =
            "Unknown";
    }
}

getLastUpdated();
