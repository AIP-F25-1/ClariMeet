// let mediaStream = null;
// let mediaRecorder = null;
// let chunks = [];
// let startedAt = null;

// // UI
// const $start = document.getElementById("start");
// const $stop = document.getElementById("stop");
// const $status = document.getElementById("status");
// const $monitorAudio = document.getElementById("monitorAudio");

// const setStatus = (t) => { $status.textContent = t; };

// /* ---------------------- helpers ---------------------- */

// // Pick a recording MIME the browser supports
// function pickMime(audioBitsPerSecond) {
//     const options = [
//         "audio/webm;codecs=opus",
//         "audio/webm",
//         "audio/ogg;codecs=opus",
//         "audio/ogg"
//     ];
//     for (const m of options) {
//         if (MediaRecorder.isTypeSupported(m)) {
//             return { mimeType: m, audioBitsPerSecond };
//         }
//     }
//     return { audioBitsPerSecond };
// }

// // meeting-audio/YYYY-MM-DD_hh-mm-ss.webm
// function formatFilename(ts) {
//     const z = (n) => String(n).padStart(2, "0");
//     const y = ts.getFullYear();
//     const M = z(ts.getMonth() + 1);
//     const D = z(ts.getDate());
//     const h = z(ts.getHours());
//     const m = z(ts.getMinutes());
//     const s = z(ts.getSeconds());
//     return `meeting-audio/${y}-${M}-${D}_${h}-${m}-${s}.webm`;
// }

// // Capture the CURRENT active tab's audio (no targetTabId!)
// function captureActiveTabAudio() {
//     return new Promise((resolve, reject) => {
//         if (!chrome.tabCapture || typeof chrome.tabCapture.capture !== "function") {
//             return reject(new Error("chrome.tabCapture.capture not available"));
//         }
//         chrome.tabCapture.capture(
//             {
//                 audio: true,
//                 video: false,
//                 audioConstraints: {
//                     mandatory: {
//                         chromeMediaSource: "tab",
//                         echoCancellation: false,
//                         noiseSuppression: false,
//                         autoGainControl: false
//                     }
//                 }
//             },
//             (s) => {
//                 if (s) return resolve(s);
//                 reject(new Error(chrome.runtime.lastError?.message || "tabCapture.capture failed"));
//             }
//         );
//     });
// }

// /* ---------------------- core flow ---------------------- */

// async function startRecording() {
//     if (mediaRecorder) return;

//     // Ensure the active tab exists & is unmuted (so Chrome doesn't silence it)
//     const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
//     if (!active) {
//         setStatus("No active tab.");
//         return;
//     }
//     if (active.mutedInfo?.muted) {
//         try {
//             await chrome.tabs.update(active.id, { muted: false });
//             // tiny delay lets unmute apply before capture
//             await new Promise((r) => setTimeout(r, 75));
//         } catch (e) {
//             console.warn("Could not unmute tab:", e);
//         }
//     }

//     // Capture audio from the CURRENT active tab
//     try {
//         mediaStream = await captureActiveTabAudio();
//     } catch (e) {
//         console.error("Failed to capture tab audio:", e);
//         setStatus("Failed to capture tab audio: " + (e.message || e.name || String(e)));
//         return;
//     }

//     // Monitor: play captured stream locally so you can hear it while recording
//     try {
//         $monitorAudio.srcObject = mediaStream;
//         $monitorAudio.muted = false;
//         $monitorAudio.volume = 1.0;
//         await $monitorAudio.play(); // allowed due to user gesture (Start click)
//     } catch (err) {
//         console.warn("Monitor playback failed (autoplay policy?):", err);
//     }

//     // Set up MediaRecorder
//     chunks = [];
//     startedAt = new Date();

//     const opts = pickMime(128000);
//     mediaRecorder = new MediaRecorder(mediaStream, opts);

//     mediaRecorder.ondataavailable = (e) => {
//         if (e.data && e.data.size) chunks.push(e.data);
//     };

//     mediaRecorder.onstop = async () => {
//         try {
//             const blob = new Blob(chunks, { type: opts.mimeType });
//             const url = URL.createObjectURL(blob);
//             const name = formatFilename(startedAt);

//             await chrome.downloads.download({
//                 url,
//                 filename: name,
//                 saveAs: true // prompt user, avoids path confusion
//             });

//             URL.revokeObjectURL(url);
//         } finally {
//             // Cleanup
//             try { $monitorAudio.pause(); } catch { }
//             $monitorAudio.srcObject = null;

//             mediaStream?.getTracks().forEach((t) => t.stop());
//             mediaStream = null;
//             mediaRecorder = null;
//             chunks = [];
//             startedAt = null;

//             $start.disabled = false;
//             $stop.disabled = true;
//             setStatus("Saved.");
//         }
//     };

//     mediaRecorder.start(1000); // ~1s chunks
//     $start.disabled = true;
//     $stop.disabled = false;
//     setStatus("Recording… (keep this popup open)");
// }

// async function stopRecording() {
//     if (!mediaRecorder) return;
//     if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
// }

// /* ---------------------- wire up ---------------------- */

// $start.addEventListener("click", startRecording);
// $stop.addEventListener("click", stopRecording);

// // If the popup closes while recording, finalize gracefully
// window.addEventListener("beforeunload", () => {
//     if (mediaRecorder && mediaRecorder.state !== "inactive") {
//         mediaRecorder.stop();
//     }
// });



let mediaStream = null;
let mediaRecorder = null;
let chunks = [];
let startedAt = null;

// UI
const $start = document.getElementById("start");
const $stop = document.getElementById("stop");
const $status = document.getElementById("status");
const $monitorAudio = document.getElementById("monitorAudio");
const $pill = document.getElementById("pill");
const $tabName = document.getElementById("tabName");

const setStatus = (t) => { $status.textContent = t; };
const setRecordingState = (on) => {
    document.body.classList.toggle("recording", !!on);
    $pill.textContent = on ? "Recording" : "Ready";
};

// prettified MIME selection
function pickMime(audioBitsPerSecond) {
    const options = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/ogg;codecs=opus",
        "audio/ogg"
    ];
    for (const m of options) {
        if (MediaRecorder.isTypeSupported(m)) {
            return { mimeType: m, audioBitsPerSecond };
        }
    }
    return { audioBitsPerSecond };
}

// meeting-audio/YYYY-MM-DD_hh-mm-ss.webm
function formatFilename(ts) {
    const z = (n) => String(n).padStart(2, "0");
    const y = ts.getFullYear();
    const M = z(ts.getMonth() + 1);
    const D = z(ts.getDate());
    const h = z(ts.getHours());
    const m = z(ts.getMinutes());
    const s = z(ts.getSeconds());
    return `meeting-audio/${y}-${M}-${D}_${h}-${m}-${s}.webm`;
}

// Capture the CURRENT active tab's audio (no targetTabId!)
function captureActiveTabAudio() {
    return new Promise((resolve, reject) => {
        if (!chrome.tabCapture || typeof chrome.tabCapture.capture !== "function") {
            return reject(new Error("chrome.tabCapture.capture not available"));
        }
        chrome.tabCapture.capture(
            {
                audio: true,
                video: false,
                audioConstraints: {
                    mandatory: {
                        chromeMediaSource: "tab",
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false
                    }
                }
            },
            (s) => {
                if (s) return resolve(s);
                reject(new Error(chrome.runtime.lastError?.message || "tabCapture.capture failed"));
            }
        );
    });
}

async function startRecording() {
    if (mediaRecorder) return;

    // Show current tab title (nice touch in footer)
    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    $tabName.textContent = active?.title || "";

    // Ensure the active tab is unmuted
    if (!active) {
        setStatus("No active tab.");
        return;
    }
    if (active.mutedInfo?.muted) {
        try {
            await chrome.tabs.update(active.id, { muted: false });
            await new Promise((r) => setTimeout(r, 75));
        } catch (e) {
            console.warn("Could not unmute tab:", e);
        }
    }

    // Capture audio from current tab
    try {
        mediaStream = await captureActiveTabAudio();
    } catch (e) {
        console.error("Failed to capture tab audio:", e);
        setStatus("Failed to capture tab audio: " + (e.message || e.name || String(e)));
        return;
    }

    // Monitor: play captured stream locally so you can hear it while recording
    try {
        $monitorAudio.srcObject = mediaStream;
        $monitorAudio.muted = false;
        $monitorAudio.volume = 1.0;
        await $monitorAudio.play();
    } catch (err) {
        console.warn("Monitor playback failed (autoplay policy?):", err);
    }

    // Set up MediaRecorder
    chunks = [];
    startedAt = new Date();

    const opts = pickMime(128000);
    mediaRecorder = new MediaRecorder(mediaStream, opts);

    mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size) chunks.push(e.data);
    };

    mediaRecorder.onstop = async () => {
        try {
            const blob = new Blob(chunks, { type: opts.mimeType });
            const url = URL.createObjectURL(blob);
            const name = formatFilename(startedAt);

            await chrome.downloads.download({
                url,
                filename: name,
                saveAs: true
            });

            URL.revokeObjectURL(url);
        } finally {
            // Cleanup
            try { $monitorAudio.pause(); } catch { }
            $monitorAudio.srcObject = null;

            mediaStream?.getTracks().forEach((t) => t.stop());
            mediaStream = null;
            mediaRecorder = null;
            chunks = [];
            startedAt = null;

            $start.disabled = false;
            $stop.disabled = true;
            setStatus("Saved.");
            setRecordingState(false);
        }
    };

    mediaRecorder.start(1000);
    $start.disabled = true;
    $stop.disabled = false;
    setStatus("Recording… (keep this popup open)");
    setRecordingState(true);
}

async function stopRecording() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
}

// Wire up
$start.addEventListener("click", startRecording);
$stop.addEventListener("click", stopRecording);

// If the popup closes while recording, finalize gracefully
window.addEventListener("beforeunload", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
});
