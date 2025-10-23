// offscreen.js — minimal recorder with robust capture + Save As dialog

let mediaStream = null;
let mediaRecorder = null;
let chunks = [];
let startedAt = null;

// signal ready to background so it can safely message us
try { chrome.runtime.sendMessage({ type: "OF_READY" }); } catch { }

/* ------------- storage with safe defaults ------------- */

async function getOptions() {
    const store = (chrome.storage && (chrome.storage.sync || chrome.storage.local)) || null;
    const defaults = {
        filenamePattern: "meeting-audio/{YYYY}-{MM}-{DD}_{hh}-{mm}-{ss}.webm",
        audioBps: 128000
    };
    if (!store) return defaults;
    return new Promise((resolve) => {
        store.get(["filenamePattern", "audioBps"], (data) => {
            resolve({
                filenamePattern: data?.filenamePattern || defaults.filenamePattern,
                audioBps: typeof data?.audioBps === "number" ? data.audioBps : defaults.audioBps
            });
        });
    });
}

/* ---------------- util ---------------- */

function pickMime(audioBitsPerSecond) {
    const candidates = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg"
    ];
    for (const mime of candidates) {
        if (MediaRecorder.isTypeSupported(mime)) {
            return { mimeType: mime, audioBitsPerSecond };
        }
    }
    return { audioBitsPerSecond };
}

function formatFilename(pattern, ts) {
    const z = (n) => String(n).padStart(2, "0");
    const map = {
        "{YYYY}": ts.getFullYear(),
        "{MM}": z(ts.getMonth() + 1),
        "{DD}": z(ts.getDate()),
        "{hh}": z(ts.getHours()),
        "{mm}": z(ts.getMinutes()),
        "{ss}": z(ts.getSeconds())
    };
    let out = pattern;
    for (const k in map) out = out.replaceAll(k, map[k]);
    return out;
}

/* --------- robust tab audio capture (capture → fallback) --------- */

async function obtainTabAudioStream(tabId) {
    // preferred: tabCapture.capture if available in offscreen
    if (chrome.tabCapture && typeof chrome.tabCapture.capture === "function") {
        return await new Promise((resolve, reject) => {
            chrome.tabCapture.capture(
                {
                    audio: true,
                    video: false,
                    targetTabId: tabId,
                    audioConstraints: {
                        mandatory: {
                            chromeMediaSource: "tab",
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false
                        }
                    }
                },
                (s) => s ? resolve(s) :
                    reject(new Error(chrome.runtime.lastError?.message || "tabCapture.capture failed"))
            );
        });
    }

    // fallback: getMediaStreamId + getUserMedia with chromeMediaSource: "tab"
    if (chrome.tabCapture && typeof chrome.tabCapture.getMediaStreamId === "function") {
        const streamId = await new Promise((resolve, reject) => {
            chrome.tabCapture.getMediaStreamId(
                { targetTabId: tabId, consumerTabId: tabId },
                (id) => id ? resolve(id) :
                    reject(new Error(chrome.runtime.lastError?.message || "tabCapture.getMediaStreamId failed"))
            );
        });

        return await navigator.mediaDevices.getUserMedia({
            audio: {
                mandatory: {
                    chromeMediaSource: "tab",
                    chromeMediaSourceId: streamId,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            },
            video: false
        });
    }

    throw new Error("Tab capture APIs are unavailable in this offscreen context.");
}

/* ------------- message handler ------------- */

chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
    try {
        if (msg?.type === "OF_START_RECORDING") {
            await startRecording(msg.tabId);
            sendResponse?.({ ok: true });
            return true;
        }
        if (msg?.type === "OF_STOP_RECORDING") {
            await stopRecording();
            sendResponse?.({ ok: true });
            return true;
        }
    } catch (e) {
        console.error("[offscreen] error:", e);
        sendResponse?.({ ok: false, error: String(e) });
    }
});

/* ------------- core record flow ------------- */

async function startRecording(tabId) {
    if (mediaRecorder) throw new Error("Already recording");

    const { filenamePattern, audioBps } = await getOptions();

    const stream = await obtainTabAudioStream(tabId);
    mediaStream = stream;
    startedAt = new Date();
    chunks = [];

    const options = pickMime(audioBps);
    mediaRecorder = new MediaRecorder(mediaStream, options);

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
        try {
            const blob = new Blob(chunks, { type: options.mimeType });
            chunks = [];
            const url = URL.createObjectURL(blob);
            const name = formatFilename(filenamePattern, startedAt);

            const downloadId = await chrome.downloads.download({
                url,
                filename: name,
                saveAs: true   // prompt so you can't lose the file
            });

            try { chrome.downloads.show(downloadId); } catch { }
            try { chrome.downloads.open(downloadId); } catch { }
            try { await chrome.storage.session.set({ lastSaved: name }); } catch { }

            URL.revokeObjectURL(url);
        } finally {
            mediaStream?.getTracks().forEach(t => t.stop());
            mediaStream = null;
            mediaRecorder = null;
            startedAt = null;
        }
    };

    mediaRecorder.start(1000); // 1s chunks
}

async function stopRecording() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
}
