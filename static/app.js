const API_BASE = "http://localhost:5000/api";

// ─── DOM Elements ─────────────────────────────────────────
const productGrid = document.getElementById('productGrid');
const loading = document.getElementById('loading');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const categoryFilter = document.getElementById('categoryFilter');
const priceRange = document.getElementById('priceRange');
const priceValue = document.getElementById('priceValue');
const ratingFilter = document.getElementById('ratingFilter');
const ratingValue = document.getElementById('ratingValue');
const sortFilter = document.getElementById('sortFilter');
const themeToggle = document.getElementById('themeToggle');

// Modal
const chartModal = document.getElementById('chartModal');
const closeBtn = document.querySelector('.close-modal');
const ctx = document.getElementById('priceChart').getContext('2d');
let priceChartInstance = null;

// Chat
const toggleChat = document.getElementById('toggleChat');
const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendChat = document.getElementById('sendChat');
const chatMessages = document.getElementById('chatMessages');
const micBtn = document.getElementById('micBtn');

// ─── INR Formatter ────────────────────────────────────────
const formatINR = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// ─── Products ─────────────────────────────────────────────
let allProducts = [];

async function fetchProducts() {
    loading.classList.remove('hidden');
    productGrid.innerHTML = '';

    const query = searchInput.value;
    const category = categoryFilter.value;
    const maxPrice = priceRange.value;
    const minRating = ratingValue.value;
    const sort = sortFilter.value;

    const url = `${API_BASE}/products?query=${query}&category=${category}&max_price=${maxPrice}&min_rating=${minRating}&sort=${sort}`;

    try {
        const response = await fetch(url);
        const products = await response.json();
        allProducts = products;
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        productGrid.innerHTML = `<p style="color:var(--error-color)">Failed to load products. Ensure backend is running.</p>`;
    } finally {
        loading.classList.add('hidden');
    }
}

function renderProducts(products) {
    if (products.length === 0) {
        productGrid.innerHTML = '<p>No products found matching your filters.</p>';
        return;
    }

    products.forEach(p => {
        const card = document.createElement('div');
        card.className = 'product-card glass';

        let starsHTML = '';
        for (let i = 1; i <= 5; i++) {
            starsHTML += i <= Math.round(p.rating)
                ? '<i class="fa-solid fa-star filled"></i>'
                : '<i class="fa-regular fa-star"></i>';
        }

        const offersHTML = p.offers.map(o => `<li>${o}</li>`).join('');

        // EMI calculations
        const emi3 = Math.round(p.discounted_price / 3);
        const emi6 = Math.round(p.discounted_price / 6);
        const emi12 = Math.round(p.discounted_price / 12);

        card.innerHTML = `
            ${p.discount_percentage ? `<div class="discount-badge">${p.discount_percentage}% OFF</div>` : ''}
            <img src="${p.image_url}" alt="${p.title}" class="product-image">
            <div class="product-info">
                <h3 class="product-title">${p.title}</h3>
                <div class="rating-stars" style="font-size:0.8rem">${starsHTML} <span style="color:var(--text-main); margin-left:5px">${p.rating}</span></div>
                
                <div class="price-container">
                    <span class="discounted-price">${formatINR(p.discounted_price)}</span>
                    ${p.original_price > p.discounted_price ? `<span class="original-price">${formatINR(p.original_price)}</span>` : ''}
                </div>

                <div class="offers-section">
                    <ul>${offersHTML}</ul>
                </div>

                <div class="emi-info">
                    EMI Options: <br>
                    3m: ${formatINR(emi3)}/mo | 6m: ${formatINR(emi6)}/mo | 12m: ${formatINR(emi12)}/mo
                </div>

                <div class="card-actions">
                    <button class="btn btn-primary analyze-btn" data-id="${p.id}">Analyze Price</button>
                    <button class="btn btn-secondary ask-ai-btn" data-title="${p.title}">Ask AI</button>
                </div>
            </div>
        `;
        productGrid.appendChild(card);
    });

    // Analyze Price buttons
    document.querySelectorAll('.analyze-btn').forEach(btn => {
        btn.addEventListener('click', (e) => openAnalyzeModal(parseInt(e.target.dataset.id)));
    });

    // Ask AI buttons
    document.querySelectorAll('.ask-ai-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const title = e.target.dataset.title;
            chatBody.classList.remove('hidden');
            chatInput.value = `Tell me about offers and EMI for ${title}.`;
            sendMessage();
        });
    });
}

// ─── Chart / Price Analysis ───────────────────────────────

function openAnalyzeModal(productId) {
    const product = allProducts.find(p => p.id === productId);
    if (!product) return;

    chartModal.classList.remove('hidden');
    document.getElementById('chartModalTitle').innerText = `Price History: ${product.title}`;

    const lowest = Math.min(...product.historical_prices);
    document.getElementById('lowestPriceVal').innerText = formatINR(lowest);

    if (product.discounted_price <= lowest) {
        document.getElementById('bestTimeVal').innerText = "Yes! Price has never been lower.";
        document.getElementById('bestTimeVal').style.color = "#10b981";
    } else {
        document.getElementById('bestTimeVal').innerText = "Wait. It has been cheaper before.";
        document.getElementById('bestTimeVal').style.color = "#ef4444";
    }

    if (priceChartInstance) priceChartInstance.destroy();

    const labels = ['2 Months Ago', 'Last Month', 'Current Price'];

    priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Price in INR (₹)',
                data: product.historical_prices,
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.2)',
                borderWidth: 3,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#f97316',
                pointRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    ticks: {
                        callback: (v) => '₹' + v.toLocaleString('en-IN')
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (c) => ' Price: ' + formatINR(c.raw)
                    }
                }
            }
        }
    });
}

closeBtn.addEventListener('click', () => chartModal.classList.add('hidden'));

// ─── Chatbot (Text) ──────────────────────────────────────

toggleChat.addEventListener('click', () => {
    chatBody.classList.toggle('hidden');
    toggleChat.innerHTML = chatBody.classList.contains('hidden')
        ? '<i class="fa-solid fa-chevron-up"></i>'
        : '<i class="fa-solid fa-chevron-down"></i>';
});

async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    appendMessage(text, 'user');
    chatInput.value = '';

    const loaderId = appendMessage('<i class="fa-solid fa-ellipsis fa-beat"></i>', 'bot');

    try {
        const response = await fetch(`${API_BASE}/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: text })
        });
        const data = await response.json();

        document.getElementById(loaderId).remove();
        appendMessage(data.reply, 'bot');

        // Speak the reply using Sarvam TTS
        speakReply(data.reply);
    } catch (e) {
        document.getElementById(loaderId).remove();
        appendMessage('Oops, I ran into an error connecting to the AI server.', 'bot');
    }
}

function appendMessage(text, sender) {
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${sender}`;
    msgDiv.innerHTML = text;
    const id = 'msg-' + Date.now();
    msgDiv.id = id;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
}

sendChat.addEventListener('click', sendMessage);
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendMessage(); });

// ─── Voice: Mic → Sarvam STT ─────────────────────────────

let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;

micBtn.addEventListener('click', async () => {
    if (isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
});

async function startRecording() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
        audioChunks = [];

        mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);

        mediaRecorder.onstop = async () => {
            stream.getTracks().forEach(t => t.stop());
            const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
            await transcribeAudio(audioBlob);
        };

        mediaRecorder.start();
        isRecording = true;
        micBtn.classList.add('recording');
        micBtn.innerHTML = '<i class="fa-solid fa-stop"></i>';
    } catch (err) {
        console.error('Microphone access error:', err);
        appendMessage('⚠️ Microphone access denied. Please allow mic permissions.', 'bot');
    }
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.innerHTML = '<i class="fa-solid fa-microphone"></i>';
}

async function transcribeAudio(audioBlob) {
    appendMessage('<i class="fa-solid fa-ear-listen"></i> Listening...', 'bot');

    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');

    try {
        const resp = await fetch(`${API_BASE}/stt`, {
            method: 'POST',
            body: formData,
        });
        const data = await resp.json();

        // Remove "Listening..." message
        const lastBot = chatMessages.querySelector('.message.bot:last-child');
        if (lastBot) lastBot.remove();

        if (data.transcript) {
            // Show transcribed text as user message and send to AI
            chatInput.value = data.transcript;
            sendMessage();
        } else {
            appendMessage("Sorry, I couldn't understand the audio. Please try again.", 'bot');
        }
    } catch (e) {
        appendMessage('Error processing voice input.', 'bot');
    }
}

// ─── Voice: Sarvam TTS → Speaker ─────────────────────────

async function speakReply(text) {
    if (!text || text.length < 2) return;
    try {
        const resp = await fetch(`${API_BASE}/tts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text })
        });
        const data = await resp.json();

        if (data.audio_base64) {
            const audioSrc = `data:audio/wav;base64,${data.audio_base64}`;
            const audio = new Audio(audioSrc);
            audio.play().catch(() => { }); // autoplay may be blocked
        }
    } catch (e) {
        console.log('TTS playback skipped:', e);
    }
}

// ─── Filters ──────────────────────────────────────────────

searchBtn.addEventListener('click', fetchProducts);
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchProducts(); });
categoryFilter.addEventListener('change', fetchProducts);
sortFilter.addEventListener('change', fetchProducts);

priceRange.addEventListener('input', (e) => { priceValue.innerText = formatINR(e.target.value); });
priceRange.addEventListener('change', fetchProducts);

const stars = document.querySelectorAll('.filter-rating i');
stars.forEach(star => {
    star.addEventListener('click', (e) => {
        const val = parseInt(e.target.dataset.value);
        ratingValue.value = val;
        stars.forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.value) <= val);
        });
        fetchProducts();
    });
});

// ─── Theme Toggle ─────────────────────────────────────────

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode');
    themeToggle.innerHTML = document.body.classList.contains('dark-mode')
        ? '<i class="fa-solid fa-sun"></i>'
        : '<i class="fa-solid fa-moon"></i>';
});

// ─── Init ─────────────────────────────────────────────────
fetchProducts();
