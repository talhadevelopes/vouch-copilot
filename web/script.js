feather.replace();

const TICKER_ITEMS = [
  "Fact Check", "Beat Bias", "Chat with Articles", 
  "Verify Claims", "Detect Spin", "Read Smarter", 
  "Stay Informed", "No Guesswork"
];

const tickerTrack = document.querySelector('.ticker-track');
const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => `
  <span class="ticker-item" style="color: ${i % 3 === 0 ? '#dc2626' : '#6b7280'}">
    ${t} <span class="dot">&middot;</span>
  </span>
`).join('');
tickerTrack.innerHTML = tickerContent;

const FEATURES = [
  { icon: "message-square", title: "Conversational Chat", desc: "Ask anything about the article — summaries, context, follow-ups." },
  { icon: "shield", title: "Fact Verification", desc: "Claims scanned live against the web. Verified, contradicted, or flagged." },
  { icon: "mouse-pointer", title: "Vouch This", desc: "Select any text, right-click, verify that exact claim instantly." },
  { icon: "eye", title: "Bias Detection", desc: "Loaded language, spin, and opinion-as-fact — all surfaced." },
  { icon: "pen-tool", title: "Live Highlights", desc: "Click a flagged claim in the sidebar to jump to it on the page." },
  { icon: "clock", title: "Chat History", desc: "Sessions saved per article for 72 hours. Resume anytime." },
  { icon: "zap", title: "Auto Extraction", desc: "Strips ads, popups, clutter. Only the words that matter." },
  { icon: "search", title: "Deep Q&A", desc: "Find quotes, explain jargon, get background on any story." }
];

const featuresGrid = document.getElementById('featuresGrid');
featuresGrid.innerHTML = FEATURES.map((f, i) => `
  <div data-r data-d="${(i % 4) + 1}" class="feat-card">
    <div class="feat-icon-wrap">
      <i data-feather="${f.icon}" color="#dc2626"></i>
    </div>
    <div class="feat-title">${f.title}</div>
    <div class="feat-desc">${f.desc}</div>
  </div>
`).join('');
feather.replace();

const IMAGES = [
  { src: "public/chat-interface.png", label: "Chat Interface" },
  { src: "public/verify-1.png", label: "Fact Verification" },
  { src: "public/bias-1.png", label: "Bias Analysis" },
  { src: "public/vouch-that.png", label: "Vouch This" },
  { src: "public/verify-2.png", label: "Live Highlights" },
  { src: "public/history.png", label: "Chat History" },
  { src: "public/bias-2.png", label: "Page Extraction" },
];

let activeIdx = 0;
let isFading = false;
let autoPlayInterval;

const mainShotView = document.getElementById('mainShotView');
const mainShotImg = document.getElementById('mainShotImg');
const mainShotLabel = document.getElementById('mainShotLabel');
const mainShotCounter = document.getElementById('mainShotCounter');
const thumbRow = document.getElementById('thumbRow');
const dotsRow = document.getElementById('dotsRow');

const getSrc = (i) => IMAGES[i].src || `https://placehold.co/1200x700/F9FAFB/dc2626?text=Screenshot+${i+1}+—+${IMAGES[i].label.replace(/\s/g, '+')}`;

thumbRow.innerHTML = IMAGES.map((img, i) => `
  <div class="thumb ${i === 0 ? 'active' : ''}" onclick="window.goToImage(${i})">
    <img src="${getSrc(i)}" alt="${img.label}">
    <div class="thumb-lbl">${img.label}</div>
  </div>
`).join('');

dotsRow.innerHTML = IMAGES.map((_, i) => `
  <div class="dot-ind ${i === 0 ? 'active' : ''}" onclick="window.goToImage(${i})"></div>
`).join('');

const updateGallery = () => {
  mainShotLabel.textContent = IMAGES[activeIdx].label;
  mainShotCounter.textContent = `${activeIdx + 1} / ${IMAGES.length}`;
  mainShotImg.src = getSrc(activeIdx);
  
  document.querySelectorAll('.thumb').forEach((el, i) => {
    el.classList.toggle('active', i === activeIdx);
  });
  document.querySelectorAll('.dot-ind').forEach((el, i) => {
    el.classList.toggle('active', i === activeIdx);
  });
};

window.goToImage = (idx) => {
  if (isFading || idx === activeIdx) return;
  isFading = true;
  mainShotView.classList.add('fading');
  
  setTimeout(() => {
    activeIdx = idx;
    updateGallery();
    mainShotView.classList.remove('fading');
    isFading = false;
  }, 200);
  resetAutoPlay();
};

window.nextImage = () => window.goToImage((activeIdx + 1) % IMAGES.length);
window.prevImage = () => window.goToImage((activeIdx - 1 + IMAGES.length) % IMAGES.length);

document.getElementById('nextBtn').onclick = window.nextImage;
document.getElementById('prevBtn').onclick = window.prevImage;

const resetAutoPlay = () => {
  clearInterval(autoPlayInterval);
  autoPlayInterval = setInterval(window.nextImage, 7500);
};
resetAutoPlay();
updateGallery();

const observerOptions = { threshold: 0.1 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.setAttribute('data-v', '1');
    }
  });
}, observerOptions);

document.querySelectorAll('[data-r]').forEach(el => observer.observe(el));
