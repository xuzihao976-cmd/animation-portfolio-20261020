"use strict";

const video = document.getElementById("reel");
const cover = document.getElementById("play-cover");
const coverText = cover.querySelector(".play-text");
const error = document.getElementById("video-error");
const status = document.getElementById("playback-status");
const retry = document.getElementById("retry");
const quality = document.getElementById("quality");
const toast = document.getElementById("toast");
const sources = {
  "720": { url: "./assets/animation-reel-720p.mp4?v=20261028-c4efeea0", label: "流畅 720p" },
  "1080": { url: "./assets/animation-reel.mp4?v=20261028-c4efeea0", label: "高清 1080p" },
  "540": { url: "./assets/animation-reel-540p.mp4?v=20261028-c4efeea0", label: "省流 540p" }
};
let toastTimer;
let waitTimer;
let loadingVersion = 0;
let pendingSwitch = null;
let wantsToPlay = false;

function showToast(message) {
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, 3000);
}

function setStatus(message, busy = false) {
  status.textContent = message;
  status.classList.toggle("is-loading", busy);
}

function finishWaiting() {
  clearTimeout(waitTimer);
  retry.hidden = true;
}

function showWaiting(message = "正在缓冲视频…") {
  clearTimeout(waitTimer);
  setStatus(message, true);
  waitTimer = setTimeout(() => {
    if (video.error || video.ended || (!wantsToPlay && video.readyState >= 2)) return;
    setStatus(quality.value === "540"
      ? "网络较慢，视频仍在缓冲，请稍候。"
      : "网络较慢，正在缓冲；可切换「省流 540p」。", true);
    // A retry is explicit: automatically restarting would discard the buffer.
    retry.hidden = false;
  }, 8000);
}

function updateReadyStatus() {
  finishWaiting();
  error.hidden = true;
  if (video.ended) {
    cover.hidden = false;
    coverText.textContent = "重新播放";
    setStatus("播放完毕，可重新播放");
  } else if (!video.paused) {
    cover.hidden = true;
    setStatus(`正在播放 · ${sources[quality.value].label}`);
  } else {
    setStatus(`${sources[quality.value].label} · 点击播放`);
  }
}

async function requestPlay() {
  const version = loadingVersion;
  wantsToPlay = true;
  retry.hidden = true;
  error.hidden = true;
  if (video.ended || (Number.isFinite(video.duration) && video.currentTime >= video.duration - 0.05)) video.currentTime = 0;
  cover.hidden = true;
  showWaiting("正在加载，请稍候…");
  try {
    await video.play();
  } catch (reason) {
    if (version !== loadingVersion || reason.name === "AbortError") return;
    wantsToPlay = false;
    finishWaiting();
    cover.hidden = false;
    setStatus("请点击播放按钮继续");
    if (reason.name !== "NotAllowedError") {
      error.hidden = false;
      retry.hidden = false;
    }
  }
}

function loadQuality(resume) {
  const time = pendingSwitch ? pendingSwitch.time : (video.ended ? 0 : video.currentTime);
  loadingVersion += 1;
  pendingSwitch = { time, resume };
  wantsToPlay = resume;
  finishWaiting();
  error.hidden = true;
  cover.hidden = true;
  showWaiting(`正在准备${sources[quality.value].label}…`);
  video.src = sources[quality.value].url;
  video.load();
}

cover.hidden = false;
cover.addEventListener("click", requestPlay);
quality.addEventListener("change", () => loadQuality(wantsToPlay || (!video.paused && !video.ended)));
retry.addEventListener("click", () => loadQuality(true));
video.addEventListener("loadedmetadata", () => {
  const seconds = Math.round(video.duration);
  if (Number.isFinite(seconds)) document.getElementById("duration").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  if (pendingSwitch) {
    const next = pendingSwitch;
    pendingSwitch = null;
    if (next.time > 0 && Number.isFinite(video.duration)) video.currentTime = Math.min(next.time, Math.max(0, video.duration - 0.05));
    if (next.resume) requestPlay();
    else {
      cover.hidden = false;
      coverText.textContent = next.time > 0 ? "继续播放" : "播放作品集";
      if (video.readyState >= 2) updateReadyStatus();
    }
  }
});
video.addEventListener("play", () => {
  wantsToPlay = true;
  cover.hidden = true;
  error.hidden = true;
});
video.addEventListener("playing", updateReadyStatus);
video.addEventListener("canplay", () => { if (!pendingSwitch) updateReadyStatus(); });
video.addEventListener("waiting", () => { if (!video.paused && !video.ended) showWaiting(); });
video.addEventListener("pause", () => {
  if (pendingSwitch || video.ended) return;
  wantsToPlay = false;
  finishWaiting();
  setStatus(`已暂停 · ${sources[quality.value].label}`);
});
video.addEventListener("ended", () => {
  wantsToPlay = false;
  updateReadyStatus();
});
function handleMediaError() {
  pendingSwitch = null;
  wantsToPlay = false;
  finishWaiting();
  cover.hidden = true;
  error.hidden = false;
  retry.hidden = false;
  setStatus("加载失败，可以重新加载或切换画质");
}
video.addEventListener("error", handleMediaError);
if (video.error) handleMediaError();
else if (video.readyState >= 2) updateReadyStatus();
else showWaiting("正在准备视频…");

document.getElementById("fullscreen").addEventListener("click", async () => {
  try {
    if (video.requestFullscreen) await video.requestFullscreen();
    else if (video.webkitEnterFullscreen) video.webkitEnterFullscreen();
    else showToast("请使用播放器右下角的全屏按钮");
  } catch { showToast("请使用播放器右下角的全屏按钮"); }
});
document.getElementById("share").addEventListener("click", async () => {
  const url = location.origin + location.pathname;
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(url);
    else {
      const input = document.createElement("textarea");
      input.value = url;
      input.className = "clipboard-fallback";
      document.body.append(input);
      input.select();
      const ok = document.execCommand("copy");
      input.remove();
      if (!ok) throw new Error("copy");
    }
    showToast("作品集链接已复制");
  } catch { showToast("请复制浏览器地址栏中的链接"); }
});
