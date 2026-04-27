import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
// INI YANG TADI KURANG: doc & updateDoc
import { getFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAdPxvp6zhIEjNPdQJq-4F7eU0bwTaGrMs",
    authDomain: "simplein-55eeb.firebaseapp.com",
    projectId: "simplein-55eeb",
    storageBucket: "simplein-55eeb.firebasestorage.app",
    messagingSenderId: "513993838187",
    appId: "1:513993838187:web:281d8a37bc75fab7572b2e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
let itemTerpilih = null, currentChatId = null, map = null, marker = null;

window.showview = (id) => {
    ['home-view', 'loading-view', 'results-view'].forEach(v => document.getElementById(v)?.classList.add('hidden-view'));
    document.getElementById(id)?.classList.remove('hidden-view');
};

// --- LOGIKA BROADCAST & OFFERS ---
window.handleaisearch = async function() {
    const q = document.getElementById('ai-input').value; if(!q) return;
    window.showview('loading-view');
    try {
        const docRef = await addDoc(collection(db, "requests"), {
            query: q, status: "open", buyerName: "Malik User", createdAt: serverTimestamp()
        });
        document.getElementById('ai-response-text').innerText = `Broadcast permintaan "${q}" aktif. Menunggu tawaran seller...`;
        window.showview('results-view');
        
        onSnapshot(query(collection(db, "offers"), where("requestId", "==", docRef.id)), (snap) => {
            const container = document.getElementById('product-container'); container.innerHTML = '';
            snap.forEach(d => renderOfferCard(d.data()));
        });
    } catch (e) { window.showview('home-view'); }
};

function renderOfferCard(o) {
    const container = document.getElementById('product-container');
    const dataJson = encodeURIComponent(JSON.stringify(o));
    
    container.innerHTML += `
        <div class="offer-card bg-white rounded-[2.5rem] p-5 shadow-sm border border-slate-100 flex flex-col text-left relative overflow-hidden transition-all hover:border-primary/50">
            <div class="absolute top-4 right-4 bg-primary text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-tighter shadow-lg z-10">New Offer</div>
            
            <img src="${o.media_url}" class="w-full h-44 object-cover rounded-[1.8rem] mb-4 border border-slate-50">
            
            <div class="px-1">
                <h4 class="font-black text-slate-800 text-sm truncate mb-1">${o.productName}</h4>
                <div class="text-[10px] text-primary font-black uppercase tracking-widest mb-1">${o.storeName}</div>
                <div class="text-[9px] font-bold text-slate-400 mb-3 uppercase">Pembayaran: ${o.bank}</div>
                
                <div class="flex gap-2 mb-4">
                    <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span class="text-[8px] font-black text-slate-400 uppercase">WT:</span>
                        <span class="text-[9px] font-bold text-slate-500">${o.berat || '-'}</span>
                    </div>
                    <div class="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                        <span class="text-[8px] font-black text-slate-400 uppercase">VOL:</span>
                        <span class="text-[9px] font-bold text-slate-500">${o.volume || '-'}</span>
                    </div>
                </div>

                <div class="mt-auto flex justify-between items-end border-t border-slate-50 pt-4">
                    <div>
                        <p class="text-[8px] font-black text-slate-300 uppercase mb-0.5">Harga Penawaran</p>
                        <p class="text-orange-500 font-black text-xl leading-none">Rp ${Number(o.price).toLocaleString()}</p>
                    </div>
                    <button onclick="window.opencheckout('${dataJson}')" class="bg-slate-900 text-white p-3.5 rounded-2xl hover:bg-primary transition shadow-xl">
                        <i data-lucide="shopping-cart" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        </div>`;
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// --- LOGIKA CHECKOUT ---
window.opencheckout = (data) => {
    const p = JSON.parse(decodeURIComponent(data)); itemTerpilih = p;
    document.getElementById('modal-title').innerText = p.productName;
    document.getElementById('modal-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('modal-img-placeholder').innerHTML = `<img src="${p.media_url}" class="w-full h-full object-cover">`;
    document.getElementById('modal-store-name').innerText = p.storeName;
    document.getElementById('seller-bank-name').innerText = p.bank || "BANK";
    document.getElementById('seller-rekening').innerText = p.rekening || "-";
    document.getElementById('seller-qr').src = p.qr_url || '';

    document.getElementById('checkout-modal').classList.remove('hidden-view');
    setTimeout(() => { 
        if(!map) { 
            map = L.map('map').setView([-6.2, 106.8], 13); 
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map); 
            map.on('click', (e) => { if(marker) map.removeLayer(marker); marker = L.marker(e.latlng).addTo(map); document.getElementById('buyer-lat').value = e.latlng.lat; document.getElementById('buyer-lng').value = e.latlng.lng; }); 
        } 
    }, 400);
};

window.closecheckout = () => document.getElementById('checkout-modal').classList.add('hidden-view');

window.processpayment = async () => {
    const btn = document.getElementById('btn-bayar'); btn.innerText = "SEDANG DIPROSES...";
    const fileInput = document.getElementById('pembayaran-image');
    
    if(!fileInput.files[0]) {
        btn.innerText = "bayar sekarang";
        return alert("Upload bukti transfer dulu bos!");
    }
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const transRef = await addDoc(collection(db, "transactions"), {
            item: itemTerpilih.productName, price: itemTerpilih.price, customer: document.getElementById('buyer-name').value,
            sellerId: itemTerpilih.sellerId, storeName: itemTerpilih.storeName, media_url: itemTerpilih.media_url, 
            bukti: e.target.result, status: "pending", createdAt: serverTimestamp()
        });
        
        const history = JSON.parse(localStorage.getItem('simplein_history') || '[]');
        history.push({ id: transRef.id, item: itemTerpilih.productName, store: itemTerpilih.storeName, date: new Date().toISOString() });
        localStorage.setItem('simplein_history', JSON.stringify(history));

        alert("Pembayaran Terkirim!"); window.closecheckout(); btn.innerText = "bayar sekarang";
        window.openChatBuyer(transRef.id, itemTerpilih.storeName);
    };
    reader.readAsDataURL(fileInput.files[0]);
};

// --- LOGIKA CHAT & STATUS SELESAI ---
window.openChatBuyer = (orderId, storeName) => {
    currentChatId = orderId;
    document.getElementById('chat-buyer-title').innerText = "chat: " + storeName;
    document.getElementById('chat-modal-buyer').classList.remove('hidden-view');
    
    onSnapshot(doc(db, "transactions", orderId), (docSnap) => {
        const dataTrans = docSnap.data();
        if (!dataTrans) return;
        
        const isSelesai = dataTrans.status === 'selesai';
        const st = dataTrans.status;

        // BIKIN UI TRACKING BAR
        const trackingHTML = `
            <div class="px-5 py-3 bg-white border-b flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-slate-300 shadow-sm z-10">
                <div class="${['pending','diproses','dikirim','sampai','selesai'].includes(st) ? 'text-primary' : ''} flex flex-col items-center gap-1 transition-colors"><i data-lucide="clock" class="w-4 h-4"></i>Pending</div>
                <div class="h-0.5 flex-grow ${['diproses','dikirim','sampai','selesai'].includes(st) ? 'bg-primary' : 'bg-slate-100'} mx-2 transition-colors"></div>
                <div class="${['diproses','dikirim','sampai','selesai'].includes(st) ? 'text-primary' : ''} flex flex-col items-center gap-1 transition-colors"><i data-lucide="package" class="w-4 h-4"></i>Diproses</div>
                <div class="h-0.5 flex-grow ${['dikirim','sampai','selesai'].includes(st) ? 'bg-primary' : 'bg-slate-100'} mx-2 transition-colors"></div>
                <div class="${['dikirim','sampai','selesai'].includes(st) ? 'text-primary' : ''} flex flex-col items-center gap-1 transition-colors"><i data-lucide="truck" class="w-4 h-4"></i>Dikirim</div>
                <div class="h-0.5 flex-grow ${st === 'selesai' ? 'bg-green-500' : 'bg-slate-100'} mx-2 transition-colors"></div>
                <div class="${st === 'selesai' ? 'text-green-500' : ''} flex flex-col items-center gap-1 transition-colors"><i data-lucide="check-circle" class="w-4 h-4"></i>Selesai</div>
            </div>
        `;
        
        const oldTracking = document.getElementById('tracking-bar-buyer');
        if(oldTracking) oldTracking.remove();
        
        const trackingDiv = document.createElement('div');
        trackingDiv.id = 'tracking-bar-buyer';
        trackingDiv.innerHTML = trackingHTML;
        
        const headerChat = document.getElementById('chat-buyer-title').parentElement;
        headerChat.after(trackingDiv);

        // LOGIKA KUNCI/BUKA CHAT & TOMBOL SELESAI
        const chatForm = document.querySelector('#chat-modal-buyer form');
        if (isSelesai) {
            // Kalau selesai, hilangin input
            chatForm.innerHTML = `<div class="w-full text-center p-3 text-[10px] font-black uppercase text-slate-400 bg-slate-100">Transaksi Selesai</div>`;
            if (document.getElementById('btn-konfirmasi-selesai')) document.getElementById('btn-konfirmasi-selesai').remove();
        } else {
            // INI FIXNYA: Balikin input chat kalau belum selesai!
            chatForm.innerHTML = `
                <label class="cursor-pointer text-slate-400 hover:text-primary transition">
                    <i data-lucide="image" class="w-5 h-5"></i>
                    <input type="file" id="chat-img-buyer" accept="image/*" class="hidden">
                </label>
                <input type="text" id="chat-input-buyer" placeholder="tulis pesan..." class="flex-grow bg-slate-100 rounded-xl px-4 py-2 text-xs outline-none font-medium">
                <button type="submit" class="bg-primary text-white p-2 rounded-xl shadow-lg hover:bg-black transition">
                    <i data-lucide="send" class="w-4 h-4"></i>
                </button>
            `;
            
            if (!document.getElementById('btn-konfirmasi-selesai') && ['dikirim', 'sampai'].includes(st)) {
                const btn = document.createElement('button');
                btn.id = 'btn-konfirmasi-selesai';
                btn.className = 'ml-2 bg-orange-500 text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase shadow-sm transition hover:bg-black';
                btn.innerText = 'Selesai';
                btn.onclick = () => window.konfirmasiSelesai(orderId);
                headerChat.insertBefore(btn, headerChat.lastElementChild);
            }
        }
        if (typeof lucide !== 'undefined') lucide.createIcons();
    });

    onSnapshot(query(collection(db, "chats"), where("orderId", "==", orderId)), (snap) => {
        const box = document.getElementById('chat-box-buyer'); 
        box.innerHTML = '';
        const msgs = []; snap.forEach(d => msgs.push(d.data()));
        msgs.sort((a,b) => (a.time?.seconds || 0) - (b.time?.seconds || 0));

        msgs.forEach(m => {
            const isMe = m.sender === 'buyer';
            const align = isMe ? 'items-end' : 'items-start';
            const bg = isMe ? 'bg-primary text-white rounded-l-xl rounded-tr-xl' : 'bg-white border rounded-r-xl rounded-tl-xl';
            const foto = m.img ? `<img src="${m.img}" class="w-full rounded-lg mb-1 cursor-pointer shadow-sm" onclick="window.open('${m.img}')">` : '';
            box.innerHTML += `<div class="flex flex-col ${align} mb-1"><div class="${bg} p-2 max-w-[80%] shadow-sm text-left">${foto}<div class="leading-relaxed">${m.message || ''}</div></div></div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// --- LOGIKA RATING & ULASAN ---
let orderToReview = null;
let currentRating = 5;

// Tombol selesai sekarang buka modal, bukan pake confirm() lagi
window.konfirmasiSelesai = (orderId) => {
    orderToReview = orderId;
    document.getElementById('review-modal').classList.remove('hidden-view');
    window.setRating(5); // Default kasih bintang 5
};

// Efek klik bintang berubah warna
window.setRating = (star) => {
    currentRating = star;
    const stars = document.querySelectorAll('.star-rating');
    stars.forEach((s, i) => {
        if (i < star) {
            s.classList.add('text-yellow-400');
            s.classList.remove('text-slate-200');
        } else {
            s.classList.add('text-slate-200');
            s.classList.remove('text-yellow-400');
        }
    });
};

// Kirim data ke database
window.submitReview = async () => {
    const btn = document.getElementById('btn-submit-review');
    btn.innerText = "MENGIRIM...";
    
    try {
        const ulasan = document.getElementById('review-text').value;
        
        // Update transaksi dengan status selesai + rating + ulasan
        await updateDoc(doc(db, "transactions", orderToReview), { 
            status: "selesai",
            rating: currentRating,
            ulasan: ulasan
        });
        
        // Kirim notif ulasan ke chat otomatis
        await addDoc(collection(db, "chats"), {
            orderId: orderToReview,
            sender: 'buyer',
            message: `Pesanan Selesai! ⭐ ${currentRating}/5\n${ulasan ? '"' + ulasan + '"' : ''}`,
            time: serverTimestamp()
        });
        
        document.getElementById('review-modal').classList.add('hidden-view');
        alert("Ulasan terkirim! Mantap Mal.");
        
        // Reset input
        document.getElementById('review-text').value = '';
        btn.innerText = "KIRIM ULASAN";
    } catch (e) {
        alert("Gagal ngirim ulasan!");
        btn.innerText = "KIRIM ULASAN";
    }
};
window.sendChatBuyer = async () => {
    const input = document.getElementById('chat-input-buyer');
    const fileInput = document.getElementById('chat-img-buyer');
    
    // Gak usah kirim kalo kosong
    if(!input.value && (!fileInput || !fileInput.files[0])) return;

    let imgBase64 = null;
    if(fileInput && fileInput.files[0]) {
        const reader = new FileReader();
        imgBase64 = await new Promise(res => { reader.onload = () => res(reader.result); reader.readAsDataURL(fileInput.files[0]); });
    }

    await addDoc(collection(db, "chats"), { 
        orderId: currentChatId, sender: 'buyer', message: input.value, img: imgBase64, time: serverTimestamp() 
    });
    
    input.value = ''; 
    if(fileInput) fileInput.value = '';
};

window.closeChatBuyer = () => document.getElementById('chat-modal-buyer').classList.add('hidden-view');

// --- LOGIKA HISTORY ---
window.toggleHistory = () => {
    const p = document.getElementById('history-panel'); p.classList.toggle('hidden-view');
    if(!p.classList.contains('hidden-view')) {
        const list = document.getElementById('history-list'); list.innerHTML = '';
        const data = JSON.parse(localStorage.getItem('simplein_history') || '[]');
        data.reverse().forEach(h => {
            list.innerHTML += `
                <div onclick="window.openChatBuyer('${h.id}', '${h.store}')" class="p-4 bg-slate-50 border rounded-2xl cursor-pointer hover:border-primary transition">
                    <h4 class="font-black text-xs text-left">${h.item}</h4>
                    <p class="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1 text-left">${h.store}</p>
                </div>`;
        });
    }
};

    // --- FUNGSI SEARCH MAP ---
window.searchLocation = async () => {
    const query = document.getElementById('search-map-input').value;
    if (!query) return alert("Ketik alamatnya dulu bos!");
    
    // Ganti tombol jadi loading state sementara (opsional tapi biar keren)
    const btn = document.querySelector('button[onclick="window.searchLocation()"]');
    const oriHTML = btn.innerHTML;
    btn.innerHTML = '<div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>';
    
    try {
        // Pake API Nominatim OpenStreetMap (Gratis & Gak perlu API Key)
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
        const data = await res.json();
        
        if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            
            // Terbang ke lokasi yang dicari & Zoom in
            map.setView([lat, lon], 16);
            
            // Pindahin marker ke titik yang dicari
            if (marker) map.removeLayer(marker);
            marker = L.marker([lat, lon]).addTo(map);
            
        } else {
            alert("Alamat gak ketemu! Coba ketik nama kota atau jalan yang lebih spesifik.");
        }
    } catch (e) {
        alert("Gagal nyari alamat ke server peta.");
    } finally {
        // Balikin icon search
        btn.innerHTML = oriHTML;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }
};


window.onload = () => { if (typeof lucide !== 'undefined') lucide.createIcons(); };