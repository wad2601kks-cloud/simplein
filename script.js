import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

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

// --- LOGIKA CHECKOUT & QR DINAMIS ---
window.opencheckout = (data) => {
    const p = JSON.parse(decodeURIComponent(data)); itemTerpilih = p;
    document.getElementById('modal-title').innerText = p.productName;
    document.getElementById('modal-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('modal-img-placeholder').innerHTML = `<img src="${p.media_url}" class="w-full h-full object-cover">`;
    document.getElementById('modal-store-name').innerText = p.storeName;
    
    // ISI DATA PEMBAYARAN DARI SELLER (QR & BANK)
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
    if(!fileInput.files[0]) return alert("Upload bukti transfer dulu bos!");
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        // Update bagian ini di script.js (Buyer) lo pas addDoc ke transactions
const transRef = await addDoc(collection(db, "transactions"), {
    item: itemTerpilih.productName,
    price: itemTerpilih.price,
    customer: document.getElementById('buyer-name').value,
    sellerId: itemTerpilih.sellerId,
    storeName: itemTerpilih.storeName,
    media_url: itemTerpilih.media_url, // HARUS ADA INI BIAR SELLER BISA TARIK FOTONYA
    bukti: e.target.result,
    status: "pending",
    createdAt: serverTimestamp()
});
        const history = JSON.parse(localStorage.getItem('simplein_history') || '[]');
        history.push({ id: transRef.id, item: itemTerpilih.productName, store: itemTerpilih.storeName, date: new Date().toISOString() });
        localStorage.setItem('simplein_history', JSON.stringify(history));

        alert("Pembayaran Terkirim!"); window.closecheckout(); btn.innerText = "bayar sekarang";
        window.openChatBuyer(transRef.id, itemTerpilih.storeName);
    };
    reader.readAsDataURL(fileInput.files[0]);
};

// --- LOGIKA CHAT & HISTORY (Tetap Sama) ---
// Ganti fungsi openChatBuyer di script.js lu pake yang ini
window.openChatBuyer = (orderId, storeName) => {
    currentChatId = orderId;
    document.getElementById('chat-buyer-title').innerText = "chat: " + storeName;
    document.getElementById('chat-modal-buyer').classList.remove('hidden-view');
    
    // Listen status transaksi & chat
    onSnapshot(doc(db, "transactions", orderId), (docSnap) => {
        const dataTrans = docSnap.data();
        const isSelesai = dataTrans.status === 'selesai';
        const chatForm = document.querySelector('#chat-modal-buyer form');
        const box = document.getElementById('chat-box-buyer');

        // Kalo udah selesai, sembunyiin form chat biar gak bisa ngetik lagi
        if (isSelesai) {
            chatForm.innerHTML = `<div class="w-full text-center p-2 text-[10px] font-black uppercase text-slate-400 bg-slate-100">Transaksi Selesai - Chat Dinonaktifkan</div>`;
        }

        // Tampilkan tombol konfirmasi jika status belum selesai
        const headerChat = document.getElementById('chat-buyer-title').parentElement;
        if (!isSelesai && !document.getElementById('btn-konfirmasi-selesai')) {
            const btnKonfirm = document.createElement('button');
            btnKonfirm.id = 'btn-konfirmasi-selesai';
            btnKonfirm.className = 'ml-2 bg-accent text-white px-3 py-1 rounded-lg text-[9px] font-black uppercase';
            btnKonfirm.innerText = 'Selesai';
            btnKonfirm.onclick = () => window.konfirmasiSelesai(orderId);
            headerChat.insertBefore(btnKonfirm, headerChat.lastElementChild);
        } else if (isSelesai && document.getElementById('btn-konfirmasi-selesai')) {
            document.getElementById('btn-konfirmasi-selesai').remove();
        }
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
            const foto = m.img ? `<img src="${m.img}" class="w-full rounded-lg mb-1 cursor-pointer" onclick="window.open('${m.img}')">` : '';
            box.innerHTML += `<div class="flex flex-col ${align} mb-1"><div class="${bg} p-2 max-w-[80%] shadow-sm">${foto}${m.message || ''}</div></div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

// Tambahin fungsi konfirmasi ini di script.js
window.konfirmasiSelesai = async (orderId) => {
    if(confirm("Barang udah beneran sampe dan sesuai, Mal?")) {
        try {
            const { updateDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js");
            await updateDoc(doc(db, "transactions", orderId), { status: "selesai" });
            
            // Kirim chat otomatis kalo pesanan beres
            await addDoc(collection(db, "chats"), {
                orderId: orderId,
                sender: 'buyer',
                message: "Pesanan selesai! Barang sudah saya terima. Terima kasih seller!",
                time: serverTimestamp()
            });
            alert("Mantap! Transaksi selesai.");
        } catch (e) { alert("Gagal konfirmasi!"); }
    }
};

window.sendChatBuyer = async () => {
    const input = document.getElementById('chat-input-buyer'), fileInput = document.getElementById('chat-img-buyer');
    if(!input.value && !fileInput.files[0]) return;
    let imgBase64 = null;
    if(fileInput.files[0]) {
        const reader = new FileReader();
        imgBase64 = await new Promise(res => { reader.onload = () => res(reader.result); reader.readAsDataURL(fileInput.files[0]); });
    }
    await addDoc(collection(db, "chats"), { orderId: currentChatId, sender: 'buyer', message: input.value, img: imgBase64, time: serverTimestamp() });
    input.value = ''; fileInput.value = '';
};

window.closeChatBuyer = () => document.getElementById('chat-modal-buyer').classList.add('hidden-view');

window.toggleHistory = () => {
    const p = document.getElementById('history-panel'); p.classList.toggle('hidden-view');
    if(!p.classList.contains('hidden-view')) {
        const list = document.getElementById('history-list'); list.innerHTML = '';
        const data = JSON.parse(localStorage.getItem('simplein_history') || '[]');
        data.reverse().forEach(h => {
            list.innerHTML += `<div onclick="window.openChatBuyer('${h.id}', '${h.store}')" class="p-4 bg-slate-50 border rounded-2xl cursor-pointer hover:border-primary transition"><h4 class="font-black text-xs text-left">${h.item}</h4><p class="text-[9px] text-slate-400 uppercase font-bold tracking-widest mt-1 text-left">${h.store}</p></div>`;
        });
    }
};

window.onload = () => { if (typeof lucide !== 'undefined') lucide.createIcons(); };