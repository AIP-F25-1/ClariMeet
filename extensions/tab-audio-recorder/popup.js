// popup.js — record current tab → save OR upload to ClariMeet; remember settings; auto-open report option.

let mediaStream = null;
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
const $reportRow = document.getElementById("reportRow");
const $reportLink = document.getElementById("reportLink");
const $openAuto = document.getElementById("openAuto");

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

// Capture the CURRENT active tab's audio
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
        mediaStream = await captureActiveTabAudio();
    } catch (e) {
        console.error("Failed to capture tab audio:", e);
        setStatus("Failed to capture tab audio: " + (e.message || e.name || String(e)));
        return;
    }

    try {
        $monitorAudio.srcObject = mediaStream;
        $monitorAudio.muted = false;
        $monitorAudio.volume = 1.0;
        await $monitorAudio.play();
    } catch (err) {
        console.warn("Monitor playback failed:", err);
    }

    chunks = [];
    lastBlob = null;
    startedAt = new Date();

    const opts = pickMime(128000);
    lastBlobMime = opts.mimeType || "audio/webm";
    mediaRecorder = new MediaRecorder(mediaStream, opts);

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
            mediaStream?.getTracks().forEach((t) => t.stop());
            mediaStream = null;
            mediaRecorder = null;
            chunks = [];
            startedAt = null;
            $start.disabled = false;
            $stop.disabled = true;
            setRecordingState(false);
        }
    };

    mediaRecorder.start(1000);
    $start.disabled = true;
    $stop.disabled = false;
    $saveBtn.disabled = true;
    $runBtn.disabled = true;
    setStatus("Recording… (keep this popup open)");
    setRecordingState(true);
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

// ---------- run pipeline ----------
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
        const resp = await fetch("http://127.0.0.1:8010/ui/run", { method: "POST", body: fd });
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

// ---------- wire ----------
$start.addEventListener("click", startRecording);
$stop.addEventListener("click", stopRecording);
$saveBtn.addEventListener("click", saveFile);
$runBtn.addEventListener("click", runPipeline);
window.addEventListener("beforeunload", () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
    }
});

// boot
initUI().catch(() => { });
