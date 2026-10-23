/* VIBE-CODED SCRIPT BECAUSE I DON'T FEEL LIKE WRITING IT */

const EMOJI_API = "https://badger.hackclub.dev/api/emoji/";
const EMOJI_PROXY = "https://images.weserv.nl/";
const EMOJI_SIZE = 30;

// Change this version if you want to download the emoji list again.
const CACHE_KEY = "slack-emojis-v1";
const DB_NAME = "crislzy-cache";
const STORE_NAME = "emoji-data";

let emojiMap = new Map();

function getEmojiUrl(url) {
    const params = new URLSearchParams({
        url,
        w: EMOJI_SIZE,
        h: EMOJI_SIZE,
        fit: "contain",
        n: "-1"
    });

    return `${EMOJI_PROXY}?${params}`;
}

// Open the browser's IndexedDB cache.
function openEmojiDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, {
                    keyPath: "id"
                });
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function readEmojiCache() {
    const db = await openEmojiDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const request = transaction
            .objectStore(STORE_NAME)
            .get(CACHE_KEY);

        request.onsuccess = () => {
            resolve(request.result?.data ?? null);
        };

        request.onerror = () => reject(request.error);

        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function saveEmojiCache(data) {
    const db = await openEmojiDB();

    return new Promise((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, "readwrite");

        transaction.objectStore(STORE_NAME).put({
            id: CACHE_KEY,
            data
        });

        transaction.oncomplete = () => {
            db.close();
            resolve();
        };

        transaction.onerror = () => {
            db.close();
            reject(transaction.error);
        };

        transaction.onabort = () => {
            db.close();
            reject(transaction.error);
        };
    });
}

async function loadSlackEmojis() {
    let data;

    // Try the local cache first.
    try {
        data = await readEmojiCache();

        if (data) {
            console.log("Using cached Slack emojis.");
        }
    } catch (error) {
        console.warn("Could not read emoji cache:", error);
    }

    // Only contact Hack Club if no cached copy exists.
    if (!data) {
        console.log("Downloading Slack emoji list...");

        const response = await fetch(EMOJI_API);

        if (!response.ok) {
            throw new Error(`Emoji API returned ${response.status}`);
        }

        data = await response.json();

        if (
            !data ||
            typeof data !== "object" ||
            Array.isArray(data) ||
            typeof data.yesyes !== "string"
        ) {
            throw new Error("Unexpected emoji API response.");
        }

        // Save the result for future visits.
        try {
            await saveEmojiCache(data);
            console.log("Saved Slack emojis to IndexedDB.");
        } catch (error) {
            console.warn("Could not save emoji cache:", error);
        }
    }

    emojiMap = new Map(Object.entries(data));

    // Resolve Slack aliases if present.
    for (const [name, value] of emojiMap) {
        if (typeof value !== "string" || !value.startsWith("alias:")) {
            continue;
        }

        const target = value.slice(6).replace(/^:|:$/g, "");
        const targetUrl = emojiMap.get(target);

        if (typeof targetUrl === "string" &&
            targetUrl.startsWith("https://")) {
            emojiMap.set(name, targetUrl);
        }
    }

    console.log("Loaded Slack emojis:", emojiMap.size);
}

function replaceSlackEmojis(root = document.body) {
    const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!node.nodeValue.includes(":")) {
                    return NodeFilter.FILTER_REJECT;
                }

                const parent = node.parentElement;

                if (
                    !parent ||
                    parent.closest(
                        "script, style, textarea, input, pre, code"
                    )
                ) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    const nodes = [];

    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }

    const regex = /:([a-zA-Z0-9_+-]+):/g;

    for (const node of nodes) {
        const text = node.nodeValue;
        const fragment = document.createDocumentFragment();

        let lastIndex = 0;
        let match;
        let replaced = false;

        regex.lastIndex = 0;

        while ((match = regex.exec(text)) !== null) {
            const url = emojiMap.get(match[1]);

            if (
                typeof url !== "string" ||
                !url.startsWith("https://")
            ) {
                continue;
            }

            fragment.append(
                document.createTextNode(
                    text.slice(lastIndex, match.index)
                )
            );

            const img = document.createElement("img");

            img.src = getEmojiUrl(url);
            img.alt = match[0];
            img.title = match[0];
            img.width = EMOJI_SIZE;
            img.height = EMOJI_SIZE;
            img.loading = "lazy";
            img.className = "slack-emoji";

            fragment.append(img);

            lastIndex = regex.lastIndex;
            replaced = true;
        }

        if (replaced) {
            fragment.append(
                document.createTextNode(text.slice(lastIndex))
            );

            node.replaceWith(fragment);
        }
    }
}

loadSlackEmojis()
    .then(() => replaceSlackEmojis())
    .catch(error => {
        console.error("Failed to load Slack emojis:", error);
    });
