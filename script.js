const screens = [...document.querySelectorAll(".screen")];
const progressSteps = [...document.querySelectorAll(".progress-step")];
const progressFill = document.querySelector("#progress-fill");
const toast = document.querySelector("#toast");
let currentStage = 1;
let toastTimer;
let candleCount = 0;
let photos = [];
let currentPhoto = 0;
let musicStopped = false;
const candleSlots = [
  [27, 27], [34.7, 27], [42.3, 27], [50, 27], [57.7, 27], [65.3, 27], [73, 27],
  [19, 36], [29.3, 36], [39.7, 36], [50, 36], [60.3, 36], [70.7, 36], [81, 36],
  [25, 45], [33.3, 45], [41.7, 45], [50, 45], [58.3, 45], [66.7, 45], [75, 45]
];

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

function showStage(stage) {
  currentStage = stage;
  screens.forEach((screen, index) => {
    const active = index === stage - 1;
    screen.classList.toggle("active", active);
    screen.setAttribute("aria-hidden", String(!active));
  });
  progressSteps.forEach((step, index) => {
    step.classList.toggle("active", index === stage - 1);
    step.classList.toggle("done", index < stage - 1);
  });
  progressFill.style.width = `${((stage - 1) / (progressSteps.length - 1)) * 100}%`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (stage === 4) {
    stopMusic();
    document.querySelector("#music-button").classList.add("hidden");
  }
}

function revealLetter() {
  const button = document.querySelector("#blow-button");
  button.disabled = true;
  stopMusic();
  document.body.classList.add("blackout");
  window.setTimeout(() => {
    try {
      document.querySelector("#stage-3 .stage-heading").classList.add("hidden");
      document.querySelector(".wish-card").classList.add("hidden");
      const videoScreen = document.querySelector("#birthday-video-screen");
      const video = document.querySelector("#birthday-video");
      videoScreen.classList.remove("hidden");
      video.currentTime = 0;
      video.play().catch((error) => {
        if (error.name === "NotAllowedError") {
          document.querySelector("#video-message").textContent = "กดเล่นวิดีโอได้เลยนะ ♡";
          showToast("กดปุ่มเล่นบนวิดีโอเพื่อรับชม");
          return;
        }
        console.error("Unable to play the birthday video.", error);
        document.querySelector("#video-message").textContent = "เล่นวิดีโอไม่สำเร็จ ลองกดเล่นอีกครั้งนะ";
        showToast("เล่นวิดีโอไม่สำเร็จ ตรวจสอบไฟล์ video/01.mp4");
      });
    } finally {
      document.body.classList.remove("blackout");
    }
  }, 800);
}

document.querySelector("#birthday-video").addEventListener("ended", () => {
  document.querySelector("#video-message").textContent = "ดูจบแล้ว ไปต่อกันเลยนะ ♡";
  document.querySelector("#video-continue").classList.remove("hidden");
});

document.querySelector("#birthday-video").addEventListener("error", () => {
  const video = document.querySelector("#birthday-video");
  console.error("Unable to load the birthday video.", video.error);
  document.querySelector("#video-message").textContent = "โหลดวิดีโอไม่สำเร็จ ลองตรวจสอบไฟล์ video/01.mp4";
  showToast("โหลดวิดีโอไม่สำเร็จ");
});

document.querySelector("#video-continue").addEventListener("click", () => {
  document.querySelector("#birthday-video").pause();
  showStage(4);
});

function makeFireworks() {
  const symbols = ["✦", "✧", "♡", "·", "✺"];
  for (let index = 0; index < 24; index += 1) {
    const particle = document.createElement("span");
    const angle = (Math.PI * 2 * index) / 24;
    const distance = 50 + Math.random() * 120;
    particle.className = "firework";
    particle.textContent = symbols[index % symbols.length];
    particle.style.left = `${window.innerWidth / 2}px`;
    particle.style.top = `${window.innerHeight * 0.37}px`;
    particle.style.setProperty("--dx", `${Math.cos(angle) * distance}px`);
    particle.style.setProperty("--dy", `${Math.sin(angle) * distance}px`);
    document.body.append(particle);
    window.setTimeout(() => particle.remove(), 1500);
  }
}

["#birth-day", "#birth-month", "#birth-year"].forEach((selector) => {
  document.querySelector(selector).addEventListener("input", (event) => {
    event.target.value = event.target.value.replace(/\D/g, "");
  });
});

document.querySelector("#unlock-button").addEventListener("click", () => {
  const day = document.querySelector("#birth-day").value;
  const month = document.querySelector("#birth-month").value;
  const year = document.querySelector("#birth-year").value;
  const isBirthday = day === "23" && month === "10" && year === "2548";
  const feedback = document.querySelector("#date-feedback");
  if (!isBirthday) {
    feedback.textContent = "ยังไม่ใช่วันพิเศษของเรา ลองตั้งวันที่อีกครั้งนะ ♡";
    return;
  }
  feedback.textContent = "";
  document.querySelector("#birthday-backdrop").classList.remove("hidden");
  document.querySelector(".unlock-card").classList.add("unlocked");
  makeFireworks();
  document.querySelector("#stage-one-continue").focus();
});

document.querySelector("#stage-one-continue").addEventListener("click", () => {
  document.querySelector("#birthday-backdrop").classList.add("hidden");
  showStage(2);
});

function placeCandle(index, area) {
  const candle = document.createElement("button");
  const [x, y] = candleSlots[index];
  candle.type = "button";
  candle.className = "candle iso-candle";
  candle.style.left = `${x}%`;
  candle.style.setProperty("--candle-y", `${y}%`);
  candle.setAttribute("aria-label", `เทียนเล่มที่ ${index + 1} แตะเพื่อลบ`);
  candle.addEventListener("click", (event) => {
    event.stopPropagation();
    if (candle.classList.contains("static")) return;
    candle.remove();
    candleCount -= 1;
    updateCandleCount();
  });
  area.append(candle);
}

function updateCandleCount() {
  const count = document.querySelector("#candle-count");
  const progress = document.querySelector("#candle-progress");
  const message = document.querySelector("#candle-message");
  const doneButton = document.querySelector("#candles-done");
  count.textContent = String(candleCount).padStart(2, "0");
  progress.style.width = `${(candleCount / 21) * 100}%`;
  doneButton.disabled = candleCount !== 21;
  if (candleCount === 21) {
    message.textContent = "ครบ 21 แท่งพอดี เก่งมากเลย! ♡";
  } else if (candleCount > 21) {
    message.textContent = "เกินมาแล้วน้า แตะเทียนเพื่อลบออกได้เลย";
  } else {
    message.textContent = `ยังขาดอีก ${21 - candleCount} แท่ง มาเติมเทียนให้หน่อยน้า`;
  }
}

function addCandle() {
  if (candleCount >= 21) {
    showToast("ครบ 21 แท่งแล้ว แตะเทียนเพื่อลบออกได้นะ ♡");
    return;
  }
  candleCount += 1;
  placeCandle(candleCount - 1, document.querySelector("#candle-area"));
  updateCandleCount();
}

const cake = document.querySelector("#cake");
cake.addEventListener("click", (event) => {
  const bounds = cake.getBoundingClientRect();
  const x = (event.clientX - bounds.left) / bounds.width;
  const y = (event.clientY - bounds.top) / bounds.height;
  const onTopSurface = ((x - 0.5) / 0.34) ** 2 + ((y - 0.383) / 0.17) ** 2 <= 1;
  if (onTopSurface) addCandle();
});
cake.addEventListener("keydown", (event) => {
  if (event.target !== cake) return;
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    addCandle();
  }
});

document.querySelector("#candles-done").addEventListener("click", () => {
  if (candleCount !== 21) return;
  const wishCandles = document.querySelector("#wish-candles");
  wishCandles.replaceChildren();
  for (let index = 0; index < 21; index += 1) {
    const candle = document.createElement("span");
    const column = index % 7;
    const row = Math.floor(index / 7);
    candle.className = "candle static";
    candle.style.left = `${14 + (column * 72) / 6}%`;
    candle.style.bottom = `${21 + row * 9}px`;
    wishCandles.append(candle);
  }
  showStage(3);
  beginWishCountdown();
});

function beginWishCountdown() {
  const countdown = document.querySelector("#wish-countdown");
  countdown.textContent = "กำลังเตรียมช่วงเวลาพิเศษ…";
  window.setTimeout(() => {
    countdown.textContent = "ขอพรในใจไว้ได้เลยนะ ✨";
    document.querySelector("#blow-button").classList.remove("hidden");
  }, 5000);
}

document.querySelector("#blow-button").addEventListener("click", revealLetter);

function updatePhoto() {
  const image = document.querySelector("#memory-image");
  const placeholder = document.querySelector("#photo-placeholder");
  const count = document.querySelector("#photo-count");
  const dots = document.querySelector("#slide-dots");
  dots.replaceChildren();
  count.textContent = `${photos.length} / 4 รูป`;
  photos.forEach((photo, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `slide-dot${index === currentPhoto ? " active" : ""}`;
    dot.setAttribute("aria-label", `ดูรูปที่ ${index + 1}`);
    dot.addEventListener("click", () => {
      currentPhoto = index;
      updatePhoto();
    });
    dots.append(dot);
  });
  if (photos.length === 0) {
    image.classList.add("hidden");
    image.removeAttribute("src");
    placeholder.classList.remove("hidden");
    return;
  }
  currentPhoto = Math.min(currentPhoto, photos.length - 1);
  image.src = photos[currentPhoto];
  image.classList.remove("hidden");
  placeholder.classList.add("hidden");
}

document.querySelector("#photo-upload").addEventListener("change", (event) => {
  const files = [...event.target.files];
  const note = document.querySelector("#upload-note");
  if (files.length !== 4) {
    note.textContent = "เลือกรูปภาพให้ครบ 4 รูปในครั้งเดียวนะ ♡";
    event.target.value = "";
    return;
  }
  if (files.some((file) => !file.type.startsWith("image/"))) {
    note.textContent = "ไฟล์ที่เลือกต้องเป็นรูปภาพทั้งหมดนะ";
    event.target.value = "";
    return;
  }
  photos.forEach((photo) => URL.revokeObjectURL(photo));
  photos = files.map((file) => URL.createObjectURL(file));
  currentPhoto = 0;
  note.textContent = "เพิ่มรูปความทรงจำครบแล้ว ♡";
  updatePhoto();
  event.target.value = "";
});

document.querySelector("#photo-prev").addEventListener("click", () => {
  if (!photos.length) return;
  currentPhoto = (currentPhoto - 1 + photos.length) % photos.length;
  updatePhoto();
});

document.querySelector("#photo-next").addEventListener("click", () => {
  if (!photos.length) return;
  currentPhoto = (currentPhoto + 1) % photos.length;
  updatePhoto();
});

document.querySelector("#open-letter").addEventListener("click", () => {
  const gate = document.querySelector("#envelope-gate");
  gate.classList.add("opening");
  document.querySelector("#open-letter").disabled = true;
  window.setTimeout(() => {
    gate.classList.add("hidden");
    document.querySelector("#letter-card").classList.remove("hidden");
    document.querySelector("#ending-note").classList.remove("hidden");
    document.querySelector("#upload-note").textContent = "เลือกรูปความทรงจำของเราให้ครบ 4 รูปนะ ♡";
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
  }, 750);
});

function startMusic() {
  if (musicStopped) return;
  document.querySelector("#music-fallback").classList.remove("hidden");
}

function stopMusic() {
  musicStopped = true;
  const frame = document.querySelector("#music-frame");
  frame.contentWindow.postMessage(JSON.stringify({
    event: "command",
    func: "stopVideo",
    args: []
  }), "https://www.youtube-nocookie.com");
  frame.removeAttribute("src");
  document.querySelector("#music-fallback").classList.add("hidden");
}

document.querySelector("#music-button").addEventListener("click", startMusic);
document.querySelector("#music-close").addEventListener("click", () => {
  document.querySelector("#music-fallback").classList.add("hidden");
});
document.querySelector("#music-frame").src = "https://www.youtube-nocookie.com/embed/apZ-FtdD4VE?autoplay=1&loop=1&playlist=apZ-FtdD4VE&controls=1&playsinline=1&rel=0";
updateCandleCount();
updatePhoto();
showStage(1);
