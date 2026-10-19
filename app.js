"use strict";
const video=document.getElementById("reel");
const cover=document.getElementById("play-cover");
const error=document.getElementById("video-error");
const toast=document.getElementById("toast");
let toastTimer;
function showToast(message){toast.textContent=message;toast.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.hidden=true,2800);}
cover.hidden=false;
cover.addEventListener("click",async()=>{try{await video.play();}catch{cover.hidden=true;showToast("请点击播放器左下角的播放按钮");}});
video.addEventListener("play",()=>{cover.hidden=true;error.hidden=true;});
video.addEventListener("ended",()=>{cover.hidden=false;cover.querySelector(".play-text").textContent="重新播放";});
video.addEventListener("error",()=>{cover.hidden=true;error.hidden=false;});
video.addEventListener("loadedmetadata",()=>{const seconds=Math.round(video.duration);if(Number.isFinite(seconds)){document.getElementById("duration").textContent=String(Math.floor(seconds/60)).padStart(2,"0")+":"+String(seconds%60).padStart(2,"0");}});
document.getElementById("fullscreen").addEventListener("click",async()=>{try{if(video.requestFullscreen){await video.requestFullscreen();}else if(video.webkitEnterFullscreen){video.webkitEnterFullscreen();}else{showToast("请使用播放器右下角的全屏按钮");}}catch{showToast("请使用播放器右下角的全屏按钮");}});
document.getElementById("share").addEventListener("click",async()=>{const url=location.origin+location.pathname;try{if(navigator.clipboard&&window.isSecureContext){await navigator.clipboard.writeText(url);}else{const input=document.createElement("textarea");input.value=url;input.className="clipboard-fallback";document.body.append(input);input.select();const ok=document.execCommand("copy");input.remove();if(!ok)throw new Error("copy");}showToast("作品集链接已复制");}catch{showToast("请复制浏览器地址栏中的链接");}});
