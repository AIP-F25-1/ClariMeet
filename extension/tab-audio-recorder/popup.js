// // popup.js — record current tab + microphone → save OR upload to ClariMeet; remember settings; auto-open report option.

// let tabStream = null;
// let micStream = null;
// let mixedStream = null;
// let mediaRecorder = null;
// let chunks = [];
// let startedAt = null;
// let lastBlob = null;
// let lastBlobMime = "audio/webm;codecs=opus";
// let audioCtx = null; // keep AudioContext alive while recording

// // UI
// const $start = document.getElementById("start");
// const $stop = document.getElementById("stop");
// const $status = document.getElementById("status");
// const $monitorAudio = document.getElementById("monitorAudio");
// const $pill = document.getElementById("pill");
// const $tabName = document.getElementById("tabName");

// const $org = document.getElementById("org");
// const $meeting = document.getElementById("meeting");
// const $model = document.getElementById("model");
// const $bullets = document.getElementById("bullets");
// const $speakers = document.getElementById("speakers");

// const $saveBtn = document.getElementById("saveBtn");
// const $runBtn = document.getElementById("runBtn");
// const $reportRow = document.getElementById("reportRow");
// const $reportLink = document.getElementById("reportLink");
// const $openAuto = document.getElementById("openAuto");

// // ---------- helpers ----------

// const setStatus = (t) => { $status.textContent = t; };

// const setRecordingState = (on) => {
//     document.body.classList.toggle("recording", !!on);
//     $pill.textContent = on ? "Recording" : "Ready";
// };

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

// function suggestMeetingIdFromTitle(title) {
//     const slug = (title || "")
//         .toLowerCase()
//         .replace(/['"`’]/g, "")
//         .replace(/[^a-z0-9]+/g, "-")
//         .replace(/^-+|-+$/g, "")
//         .slice(0, 40) || "session";
//     const d = new Date();
//     const z = (n) => String(n).padStart(2, "0");
//     const stamp = `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
//     return `${slug}-${stamp}`;
// }

// // Capture the CURRENT active tab's audio (no targetTabId here – that caused errors)
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

// // Capture microphone audio
// async function captureMicrophone() {
//     try {
//         const stream = await navigator.mediaDevices.getUserMedia({
//             audio: {
//                 echoCancellation: true,
//                 noiseSuppression: true,
//                 autoGainControl: true
//             },
//             video: false
//         });
//         return stream;
//     } catch (e) {
//         console.warn("[popup] mic capture failed:", e);
//         throw e;
//     }
// }

// // Mix tab + mic into one MediaStream using AudioContext
// function mixStreams(tab, mic) {
//     // if either missing, just return the one we have
//     if (tab && !mic) return tab;
//     if (mic && !tab) return mic;
//     if (!tab && !mic) return null;

//     audioCtx = new (window.AudioContext || window.webkitAudioContext)();
//     const destination = audioCtx.createMediaStreamDestination();

//     const tabSource = audioCtx.createMediaStreamSource(tab);
//     tabSource.connect(destination);

//     const micSource = audioCtx.createMediaStreamSource(mic);
//     micSource.connect(destination);

//     return destination.stream;
// }

// // ---------- settings persistence ----------

// const store = (chrome.storage && (chrome.storage.local || chrome.storage.sync)) || null;
// const SETTINGS_KEYS = ["org", "model", "bullets", "speakers", "openAuto"];

// async function loadSettings() {
//     const defaults = { org: "demo", model: "tiny", bullets: "3", speakers: "2", openAuto: false };
//     if (!store) return defaults;
//     return new Promise((resolve) => {
//         store.get(SETTINGS_KEYS, (data) => {
//             resolve({
//                 org: data?.org ?? defaults.org,
//                 model: data?.model ?? defaults.model,
//                 bullets: data?.bullets ?? defaults.bullets,
//                 speakers: data?.speakers ?? defaults.speakers,
//                 openAuto: !!data?.openAuto,
//             });
//         });
//     });
// }

// async function saveSettings() {
//     if (!store) return;
//     const data = {
//         org: ($org.value || "demo").trim(),
//         model: $model.value || "tiny",
//         bullets: $bullets.value || "3",
//         speakers: $speakers.value || "2",
//         openAuto: !!$openAuto.checked,
//     };
//     try { store.set(data, () => { }); } catch { }
// }

// function wireSettingsAutosave() {
//     [$org, $model, $bullets, $speakers, $openAuto].forEach((el) => {
//         el.addEventListener("change", saveSettings);
//         el.addEventListener("blur", saveSettings);
//     });
// }

// // ---------- init ----------

// async function initUI() {
//     const s = await loadSettings();
//     $org.value = s.org;
//     $model.value = s.model;
//     $bullets.value = s.bullets;
//     $speakers.value = s.speakers;
//     $openAuto.checked = !!s.openAuto;

//     try {
//         const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
//         $tabName.textContent = active?.title || "";
//         if (!$meeting.value.trim()) {
//             $meeting.value = suggestMeetingIdFromTitle(active?.title || "");
//         }
//     } catch { }

//     wireSettingsAutosave();
// }

// // ---------- recording ----------

// async function startRecording() {
//     if (mediaRecorder) return;

//     // hide previous report link
//     $reportRow.style.display = "none";
//     $reportLink.removeAttribute("href");

//     const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
//     $tabName.textContent = active?.title || "";
//     if (!$meeting.value.trim()) {
//         $meeting.value = suggestMeetingIdFromTitle(active?.title || "");
//     }

//     if (!active) {
//         setStatus("No active tab.");
//         return;
//     }

//     // Try to unmute the tab if it's muted
//     if (active.mutedInfo?.muted) {
//         try {
//             await chrome.tabs.update(active.id, { muted: false });
//             await new Promise((r) => setTimeout(r, 75));
//         } catch (e) { console.warn("Could not unmute tab:", e); }
//     }

//     // Reset state
//     chunks = [];
//     lastBlob = null;
//     tabStream = null;
//     micStream = null;
//     mixedStream = null;
//     startedAt = new Date();

//     // Capture tab + mic (in parallel)
//     setStatus("Requesting tab and microphone access…");

//     let tabOk = false;
//     let micOk = false;

//     try {
//         tabStream = await captureActiveTabAudio();
//         tabOk = true;
//     } catch (e) {
//         console.error("Failed to capture tab audio:", e);
//     }

//     try {
//         micStream = await captureMicrophone();
//         micOk = true;
//     } catch (e) {
//         console.error("Mic capture failed or denied:", e);
//         // we continue; we can still record tab-only
//     }

//     if (!tabOk && !micOk) {
//         setStatus("Could not capture tab or microphone. Check Chrome permissions.");
//         return;
//     }

//     // Build the stream that will be recorded & monitored
//     mixedStream = mixStreams(tabStream, micStream);
//     const recordStream = mixedStream || tabStream || micStream;

//     if (!recordStream) {
//         setStatus("Nothing to record (no streams).");
//         return;
//     }

//     // Monitor audio: play what we record so you can hear it
//     try {
//         $monitorAudio.srcObject = recordStream;
//         $monitorAudio.muted = false; // if you hear echo, you can set this to true
//         $monitorAudio.volume = 1.0;
//         await $monitorAudio.play();
//     } catch (err) {
//         console.warn("Monitor playback failed:", err);
//     }

//     const opts = pickMime(128000);
//     lastBlobMime = opts.mimeType || "audio/webm";

//     try {
//         mediaRecorder = new MediaRecorder(recordStream, opts);
//     } catch (e) {
//         console.error("Failed to start MediaRecorder:", e);
//         setStatus("Cannot start recorder: " + (e.message || String(e)));
//         return;
//     }

//     mediaRecorder.ondataavailable = (e) => {
//         if (e.data && e.data.size) chunks.push(e.data);
//     };

//     mediaRecorder.onstop = async () => {
//         try {
//             const blob = new Blob(chunks, { type: lastBlobMime });
//             lastBlob = blob;
//             $saveBtn.disabled = !lastBlob;
//             $runBtn.disabled = !lastBlob;
//             setStatus("Recording stopped. Choose: Save file or Run ClariMeet pipeline.");
//         } finally {
//             try { $monitorAudio.pause(); } catch { }
//             $monitorAudio.srcObject = null;

//             // stop underlying streams
//             if (tabStream) tabStream.getTracks().forEach((t) => t.stop());
//             if (micStream) micStream.getTracks().forEach((t) => t.stop());
//             if (audioCtx) {
//                 try { audioCtx.close(); } catch { }
//                 audioCtx = null;
//             }

//             tabStream = null;
//             micStream = null;
//             mixedStream = null;
//             mediaRecorder = null;
//             chunks = [];
//             startedAt = null;

//             $start.disabled = false;
//             $stop.disabled = true;
//             setRecordingState(false);
//         }
//     };

//     mediaRecorder.start(1000);
//     $start.disabled = true;
//     $stop.disabled = false;
//     $saveBtn.disabled = true;
//     $runBtn.disabled = true;
//     setStatus("Recording… (keep this popup open)");
//     setRecordingState(true);
// }

// async function stopRecording() {
//     if (!mediaRecorder) return;
//     if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
// }

// // ---------- save ----------

// async function saveFile() {
//     if (!lastBlob) return;
//     const url = URL.createObjectURL(lastBlob);
//     const name = formatFilename(new Date());
//     try {
//         await chrome.downloads.download({ url, filename: name, saveAs: true });
//         setStatus("Saved to disk.");
//     } catch (e) {
//         console.error("Download failed:", e);
//         setStatus("Save failed: " + (e.message || String(e)));
//     } finally {
//         URL.revokeObjectURL(url);
//     }
// }

// // ---------- run pipeline ----------

// async function runPipeline() {
//     if (!lastBlob) {
//         setStatus("No audio to send. Record first.");
//         return;
//     }

//     const org = ($org.value || "demo").trim();
//     const meeting = ($meeting.value || "").trim();
//     const model = $model.value || "tiny";
//     const bullets = $bullets.value || "3";
//     const speakers = $speakers.value || "2";

//     if (!meeting) {
//         setStatus("Enter a meeting id.");
//         $meeting.focus();
//         return;
//     }

//     await saveSettings();

//     const fd = new FormData();
//     fd.append("org_id", org);
//     fd.append("meeting_id", meeting);
//     fd.append("model", model);
//     fd.append("max_bullets", bullets);
//     fd.append("num_speakers", speakers);
//     const filename = formatFilename(new Date());
//     fd.append("file", lastBlob, filename);

//     setStatus("Uploading and running pipeline…");
//     $runBtn.disabled = true;

//     try {
//         const resp = await fetch("http://127.0.0.1:8010/ui/run", { method: "POST", body: fd });
//         if (!resp.ok) {
//             const text = await resp.text().catch(() => "");
//             throw new Error(`Server error (${resp.status}): ${text || resp.statusText}`);
//         }
//         const j = await resp.json();
//         const report = j?.report_url;

//         if (report) {
//             $reportLink.href = report;
//             $reportRow.style.display = "flex";
//             setStatus("Pipeline OK. Open the report.");

//             if ($openAuto.checked) {
//                 try {
//                     await chrome.tabs.create({ url: report, active: true });
//                 } catch {
//                     try { window.open(report, "_blank"); } catch { }
//                 }
//             }
//         } else {
//             setStatus("Pipeline finished, but no report URL returned.");
//         }
//     } catch (e) {
//         console.error("Pipeline failed:", e);
//         setStatus("Pipeline failed: " + (e.message || String(e)));
//         $runBtn.disabled = false;
//     }
// }

// // ---------- wire ----------

// $start.addEventListener("click", startRecording);
// $stop.addEventListener("click", stopRecording);
// $saveBtn.addEventListener("click", saveFile);
// $runBtn.addEventListener("click", runPipeline);

// window.addEventListener("beforeunload", () => {
//     if (mediaRecorder && mediaRecorder.state !== "inactive") {
//         mediaRecorder.stop();
//     }
// });

// // boot
// initUI().catch(() => { });



// popup.js — record current tab + mic → save OR upload to ClariMeet; capture whiteboard frames.

let tabStream = null;
let micStream = null;
let mixedStream = null;
let mediaRecorder = null;
let chunks = [];
let startedAt = null;
let lastBlob = null;
let lastBlobMime = "audio/webm;codecs=opus";

// UI
const $start = document.getElementById("start");
const $stop = document.getElementById("stop");
const $status = document.getElementById("status");
const $monitorAudio = document.getElementById("monitorAudio");
const $pill = document.getElementById("pill");
const $tabName = document.getElementById("tabName");

const $org = document.getElementById("org");
const $meeting = document.getElementById("meeting");
const $model = document.getElementById("model");
const $bullets = document.getElementById("bullets");
const $speakers = document.getElementById("speakers");

const $saveBtn = document.getElementById("saveBtn");
const $runBtn = document.getElementById("runBtn");
const $captureWb = document.getElementById("captureWb");
const $reportRow = document.getElementById("reportRow");
const $reportLink = document.getElementById("reportLink");
const $openAuto = document.getElementById("openAuto");

const API_UPLOAD_BASE = "http://127.0.0.1:8010";   // dash UI (existing /ui/run)
const API_WHITEBOARD_BASE = "http://127.0.0.1:8001"; // upload_extract service

// ---------- helpers ----------

const setStatus = (t) => { $status.textContent = t; };
const setRecordingState = (on) => {
    document.body.classList.toggle("recording", !!on);
    $pill.textContent = on ? "Recording" : "Ready";
};

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

function suggestMeetingIdFromTitle(title) {
    const slug = (title || "")
        .toLowerCase()
        .replace(/['"`’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "session";
    const d = new Date();
    const z = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}${z(d.getMonth() + 1)}${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
    return `${slug}-${stamp}`;
}

// Capture CURRENT active tab's audio (no targetTabId to avoid errors)
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

// Capture microphone
async function captureMic() {
    try {
        const mic = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true
            },
            video: false
        });
        return mic;
    } catch (e) {
        console.warn("[popup] mic capture failed:", e);
        setStatus("Mic capture failed or denied.");
        throw e;
    }
}

// Mix tab + mic into a single MediaStream
async function createMixedStream() {
    tabStream = await captureActiveTabAudio();
    micStream = await captureMic();

    const ctx = new AudioContext();
    const dest = ctx.createMediaStreamDestination();

    if (tabStream) {
        const tabSource = ctx.createMediaStreamSource(tabStream);
        tabSource.connect(dest);
    }
    if (micStream) {
        const micSource = ctx.createMediaStreamSource(micStream);
        micSource.connect(dest);
    }

    const out = dest.stream;
    return { out, ctx };
}

// ---------- settings persistence ----------

const store = (chrome.storage && (chrome.storage.local || chrome.storage.sync)) || null;
const SETTINGS_KEYS = ["org", "model", "bullets", "speakers", "openAuto"];

async function loadSettings() {
    const defaults = { org: "demo", model: "tiny", bullets: "3", speakers: "2", openAuto: false };
    if (!store) return defaults;
    return new Promise((resolve) => {
        store.get(SETTINGS_KEYS, (data) => {
            resolve({
                org: data?.org ?? defaults.org,
                model: data?.model ?? defaults.model,
                bullets: data?.bullets ?? defaults.bullets,
                speakers: data?.speakers ?? defaults.speakers,
                openAuto: !!data?.openAuto,
            });
        });
    });
}

async function saveSettings() {
    if (!store) return;
    const data = {
        org: ($org.value || "demo").trim(),
        model: $model.value || "tiny",
        bullets: $bullets.value || "3",
        speakers: $speakers.value || "2",
        openAuto: !!$openAuto.checked,
    };
    try { store.set(data, () => { }); } catch { }
}

function wireSettingsAutosave() {
    [$org, $model, $bullets, $speakers, $openAuto].forEach((el) => {
        el.addEventListener("change", saveSettings);
        el.addEventListener("blur", saveSettings);
    });
}

// ---------- init ----------

async function initUI() {
    const s = await loadSettings();
    $org.value = s.org;
    $model.value = s.model;
    $bullets.value = s.bullets;
    $speakers.value = s.speakers;
    $openAuto.checked = !!s.openAuto;

    try {
        const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
        $tabName.textContent = active?.title || "";
        if (!$meeting.value.trim()) {
            $meeting.value = suggestMeetingIdFromTitle(active?.title || "");
        }
    } catch { }

    wireSettingsAutosave();
}

// ---------- recording ----------

async function startRecording() {
    if (mediaRecorder) return;

    $reportRow.style.display = "none";
    $reportLink.removeAttribute("href");

    const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
    $tabName.textContent = active?.title || "";
    if (!$meeting.value.trim()) {
        $meeting.value = suggestMeetingIdFromTitle(active?.title || "");
    }

    if (!active) { setStatus("No active tab."); return; }
    if (active.mutedInfo?.muted) {
        try {
            await chrome.tabs.update(active.id, { muted: false });
            await new Promise((r) => setTimeout(r, 75));
        } catch (e) { console.warn("Could not unmute tab:", e); }
    }

    try {
        const { out, ctx } = await createMixedStream();
        mixedStream = out;
        chunks = [];
        lastBlob = null;
        startedAt = new Date();

        $monitorAudio.srcObject = mixedStream;
        $monitorAudio.muted = false;
        $monitorAudio.volume = 1.0;
        await $monitorAudio.play();

        const opts = pickMime(128000);
        lastBlobMime = opts.mimeType || "audio/webm";
        mediaRecorder = new MediaRecorder(mixedStream, opts);

        mediaRecorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };

        mediaRecorder.onstop = async () => {
            try {
                const blob = new Blob(chunks, { type: lastBlobMime });
                lastBlob = blob;
                $saveBtn.disabled = !lastBlob;
                $runBtn.disabled = !lastBlob;
                setStatus("Recording stopped. Choose: Save file or Run ClariMeet pipeline.");
            } finally {
                try { $monitorAudio.pause(); } catch { }
                $monitorAudio.srcObject = null;

                if (tabStream) tabStream.getTracks().forEach((t) => t.stop());
                if (micStream) micStream.getTracks().forEach((t) => t.stop());
                if (mixedStream) mixedStream.getTracks().forEach((t) => t.stop());

                tabStream = null;
                micStream = null;
                mixedStream = null;
                mediaRecorder = null;
                chunks = [];
                startedAt = null;
                $start.disabled = false;
                $stop.disabled = true;
                setRecordingState(false);

                try { ctx.close(); } catch { }
            }
        };

        mediaRecorder.start(1000);
        $start.disabled = true;
        $stop.disabled = false;
        $saveBtn.disabled = true;
        $runBtn.disabled = true;
        setStatus("Recording… (keep this popup open)");
        setRecordingState(true);
    } catch (e) {
        console.error("Failed to start recording:", e);
        setStatus("Failed to start recording: " + (e.message || String(e)));
    }
}

async function stopRecording() {
    if (!mediaRecorder) return;
    if (mediaRecorder.state !== "inactive") mediaRecorder.stop();
}

// ---------- save ----------

async function saveFile() {
    if (!lastBlob) return;
    const url = URL.createObjectURL(lastBlob);
    const name = formatFilename(new Date());
    try {
        await chrome.downloads.download({ url, filename: name, saveAs: true });
        setStatus("Saved to disk.");
    } catch (e) {
        console.error("Download failed:", e);
        setStatus("Save failed: " + (e.message || String(e)));
    } finally {
        URL.revokeObjectURL(url);
    }
}

// ---------- run pipeline (audio) ----------

async function runPipeline() {
    if (!lastBlob) { setStatus("No audio to send. Record first."); return; }

    const org = ($org.value || "demo").trim();
    const meeting = ($meeting.value || "").trim();
    const model = $model.value || "tiny";
    const bullets = $bullets.value || "3";
    const speakers = $speakers.value || "2";

    if (!meeting) { setStatus("Enter a meeting id."); $meeting.focus(); return; }

    await saveSettings();

    const fd = new FormData();
    fd.append("org_id", org);
    fd.append("meeting_id", meeting);
    fd.append("model", model);
    fd.append("max_bullets", bullets);
    fd.append("num_speakers", speakers);
    const filename = formatFilename(new Date());
    fd.append("file", lastBlob, filename);

    setStatus("Uploading and running pipeline…");
    $runBtn.disabled = true;

    try {
        const resp = await fetch(`${API_UPLOAD_BASE}/ui/run`, { method: "POST", body: fd });
        if (!resp.ok) {
            const text = await resp.text().catch(() => "");
            throw new Error(`Server error (${resp.status}): ${text || resp.statusText}`);
        }
        const j = await resp.json();
        const report = j?.report_url;

        if (report) {
            $reportLink.href = report;
            $reportRow.style.display = "flex";
            setStatus("Pipeline OK. Open the report.");

            if ($openAuto.checked) {
                try {
                    await chrome.tabs.create({ url: report, active: true });
                } catch {
                    try { window.open(report, "_blank"); } catch { }
                }
            }
        } else {
            setStatus("Pipeline finished, but no report URL returned.");
        }
    } catch (e) {
        console.error("Pipeline failed:", e);
        setStatus("Pipeline failed: " + (e.message || String(e)));
        $runBtn.disabled = false;
    }
}

// ---------- whiteboard capture ----------

async function captureWhiteboardFrame() {
    try {
        const [active] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!active) {
            setStatus("No active tab to capture.");
            return;
        }

        const ensureMeeting = () => {
            let m = ($meeting.value || "").trim();
            if (!m) {
                m = suggestMeetingIdFromTitle(active.title || "");
                $meeting.value = m;
            }
            return m;
        };

        const org = ($org.value || "demo").trim();
        const meeting = ensureMeeting();

        setStatus("Capturing whiteboard frame…");

        chrome.tabs.captureVisibleTab(active.windowId, { format: "png" }, async (dataUrl) => {
            if (chrome.runtime.lastError || !dataUrl) {
                console.error("captureVisibleTab error:", chrome.runtime.lastError);
                setStatus("Failed to capture whiteboard.");
                return;
            }

            try {
                const blob = await (await fetch(dataUrl)).blob();
                const fd = new FormData();
                fd.append("org_id", org);
                fd.append("meeting_id", meeting);

                // seconds since recording start, if available
                let tsSec = 0;
                if (startedAt) {
                    tsSec = (Date.now() - startedAt.getTime()) / 1000;
                }
                fd.append("ts_sec", String(tsSec.toFixed(3)));
                fd.append("file", blob, "frame.png");

                const resp = await fetch(`${API_WHITEBOARD_BASE}/whiteboard/frame`, {
                    method: "POST",
                    body: fd
                });

                if (!resp.ok) {
                    const txt = await resp.text().catch(() => "");
                    throw new Error(`Server error (${resp.status}): ${txt || resp.statusText}`);
                }

                setStatus("Whiteboard frame captured.");
            } catch (e) {
                console.error("Whiteboard upload failed:", e);
                setStatus("Whiteboard upload failed: " + (e.message || String(e)));
            }
        });
    } catch (e) {
        console.error("Capture whiteboard failed:", e);
        setStatus("Whiteboard capture failed: " + (e.message || String(e)));
    }
}

// ---------- wire ----------

$start.addEventListener("click", startRecording);
$stop.addEventListener("click", stopRecording);
$saveBtn.addEventListener("click", saveFile);
$runBtn.addEventListener("click", runPipeline);
$captureWb.addEventListener("click", captureWhiteboardFrame);

window.addEventListener("beforeunload", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
});

// boot
initUI().catch(() => { });
