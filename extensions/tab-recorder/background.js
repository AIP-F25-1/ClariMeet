let isRecording = false;
let currentTabId = null;

/* ---------- offscreen helpers ---------- */

async function offscreenExists() {
    try {
        if (chrome.offscreen?.hasDocument) {
            return await chrome.offscreen.hasDocument();
        }
    } catch { }
    try {
        if (chrome.runtime.getContexts) {
            const ctxs = await chrome.runtime.getContexts({ contextTypes: ["OFFSCREEN_DOCUMENT"] });
            return Array.isArray(ctxs) && ctxs.length > 0;
        }
    } catch { }
    return false;
}

let offscreenReadyResolve;
function waitForOffscreenReady(timeoutMs = 4000) {
    return new Promise((resolve, reject) => {
        offscreenReadyResolve = resolve;
        const t = setTimeout(() => {
            offscreenReadyResolve = null;
            reject(new Error("Offscreen not ready in time"));
        }, timeoutMs);
        resolve._clear = () => clearTimeout(t);
    });
}

async function ensureOffscreen() {
    if (!(await offscreenExists())) {
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: ["BLOBS"],
            justification: "Use MediaRecorder in an offscreen document to save tab audio."
        });
    }
    await waitForOffscreenReady().catch(() => { });
}

/* ---------- IPC with offscreen ---------- */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg?.type === "OF_READY") {
        if (offscreenReadyResolve) {
            offscreenReadyResolve._clear?.();
            offscreenReadyResolve();
            offscreenReadyResolve = null;
        }
        sendResponse?.({ ok: true });
    }
});

/* ---------- start/stop control ---------- */

async function start(tabId) {
    await ensureOffscreen();
    // ask offscreen to start recording this tab
    try {
        await chrome.runtime.sendMessage({ type: "OF_START_RECORDING", tabId });
    } catch {
        // recreate and retry once
        await chrome.offscreen.createDocument({
            url: "offscreen.html",
            reasons: ["BLOBS"],
            justification: "Use MediaRecorder in an offscreen document to save tab audio."
        });
        await ensureOffscreen();
        await chrome.runtime.sendMessage({ type: "OF_START_RECORDING", tabId });
    }

    isRecording = true;
    currentTabId = tabId;
    await chrome.action.setBadgeText({ text: "REC" });
    await chrome.action.setBadgeBackgroundColor({ color: "#d9534f" });
}

async function stop() {
    try {
        await chrome.runtime.sendMessage({ type: "OF_STOP_RECORDING" });
    } catch { }
    isRecording = false;
    currentTabId = null;
    await chrome.action.setBadgeText({ text: "" });
}

/* ---------- toolbar click toggles ---------- */

chrome.action.onClicked.addListener(async (tab) => {
    if (!isRecording) {
        await start(tab.id);
    } else {
        await stop();
    }
});
