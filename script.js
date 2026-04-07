import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, getDoc, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
const safeCreateIcons = () => { if (typeof lucide !== 'undefined') lucide.createIcons(); };

let itemTerpilih = null;
let map = null;
let marker = null;
let currentChatOrderId = null;

// --- VIEW NAVIGATION ---
window.showview = (viewid) => {
    ['home-view', 'loading-view', 'results-view'].forEach(v => document.getElementById(v)?.classList.add('hidden-view'));
    document.getElementById(viewid)?.classList.remove('hidden-view');
};

// --- AI SEARCH ---
window.handleaisearch = async function() {
    const q = document.getElementById('ai-input').value; if(!q) return;
    window.showview('loading-view');
    try {
        const snap = await getDocs(collection(db, "product"));
        const prods = [];
        snap.forEach(d => { if(d.data().name.toLowerCase().includes(q.toLowerCase())) prods.push({id: d.id, ...d.data()}); });
        renderproducts(prods);
        document.getElementById('ai-response-text').innerText = `ai nemu ${prods.length} barang nih bos. sikat!`;
        window.showview('results-view');
    } catch (e) { window.showview('home-view'); }
};

function renderproducts(prods) {
    const container = document.getElementById('product-container'); container.innerHTML = '';
    prods.forEach(p => {
        const dataJson = encodeURIComponent(JSON.stringify(p));
        const imageUrl = (p.media_url && p.media_url.length > 20) ? p.media_url : 'https://via.placeholder.com/300?text=no+image';
        container.innerHTML += `
            <div class="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col text-left">
                <img src="${imageUrl}" class="w-full h-44 object-cover rounded-2xl mb-4 shadow-sm border">
                <h4 class="font-bold text-sm truncate text-slate-800">${p.name}</h4>
                <div class="text-[10px] text-primary font-bold mb-3 italic">toko: ${p.storename || 'simplein store'}</div>
                <div class="mt-auto">
                    <p class="text-orange-500 font-black text-xl mb-3">Rp ${Number(p.price).toLocaleString()}</p>
                    <button onclick="window.opencheckout('${dataJson}')" class="w-full bg-[#111827] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition">beli sekarang</button>
                </div>
            </div>`;
    });
    safeCreateIcons();
}

// --- CHECKOUT & MAPS ---
window.opencheckout = (data) => {
    const p = JSON.parse(decodeURIComponent(data)); itemTerpilih = p;
    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-price').innerText = "Rp " + Number(p.price).toLocaleString();
    const imageUrl = (p.media_url && p.media_url.length > 20) ? p.media_url : 'https://via.placeholder.com/100?text=no+image';
    document.getElementById('modal-img-placeholder').innerHTML = `<img src="${imageUrl}" class="w-full h-full object-cover">`;
    document.getElementById('seller-bank-name').innerText = p.bank || "dana/qris";
    document.getElementById('seller-rekening').innerText = p.rekening || "-";
    document.getElementById('seller-qr').src = p.qr_url || 'https://via.placeholder.com/150?text=qr+kosong';
    document.getElementById('checkout-modal').classList.remove('hidden-view');
    setTimeout(() => {
        if(!map) {
            map = L.map('map', { attributionControl: false }).setView([-6.2, 106.8], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.Control.geocoder({ defaultMarkGeocode: false }).on('markgeocode', function(e) {
                map.fitBounds(e.geocode.bbox);
                if(marker) map.removeLayer(marker);
                marker = L.marker(e.geocode.center).addTo(map);
                document.getElementById('buyer-lat').value = e.geocode.center.lat;
                document.getElementById('buyer-lng').value = e.geocode.center.lng;
                document.getElementById('location-status').innerText = "lokasi dipasang bos!";
            }).addTo(map);
            map.on('click', (e) => {
                if(marker) map.removeLayer(marker);
                marker = L.marker(e.latlng).addTo(map);
                document.getElementById('buyer-lat').value = e.latlng.lat;
                document.getElementById('buyer-lng').value = e.latlng.lng;
                document.getElementById('location-status').innerText = "titik manual dipasang!";
            });
        } else { map.invalidateSize(); }
    }, 400);
};

window.closecheckout = () => document.getElementById('checkout-modal').classList.add('hidden-view');

window.processpayment = async () => {
    const name = document.getElementById('buyer-name').value;
    const patokan = document.getElementById('buyer-address-detail').value;
    const file = document.getElementById('pembayaran-image').files[0];
    const lat = document.getElementById('buyer-lat').value;
    const lng = document.getElementById('buyer-lng').value;
    if(!name || !patokan || !file || !lat || !lng) return alert("isi data lengkap sama petanya bos!");
    const btn = document.getElementById('btn-bayar'); btn.disabled = true; btn.innerText = "proses...";
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
        try {
            const docRef = await addDoc(collection(db, "transactions"), {
                item: itemTerpilih.name, price: Number(itemTerpilih.price), customer: name,
                sellerid: itemTerpilih.sellerid || 'none', lat: lat, lng: lng, address_detail: patokan,
                bukti_transfer: e.target.result, status: "menunggu konfirmasi", time: serverTimestamp()
            });

            // --- SIMPEN KE HISTORY LOCAL STORAGE ---
            const history = JSON.parse(localStorage.getItem('simplein_history') || '[]');
            history.push({
                id: docRef.id,
                item: itemTerpilih.name,
                store: itemTerpilih.storename || 'simplein store',
                date: new Date().toISOString()
            });
            localStorage.setItem('simplein_history', JSON.stringify(history));

            alert("pesanan berhasil! id: " + docRef.id);
            window.closecheckout();
            window.openChatBuyer(docRef.id, itemTerpilih.storename || 'seller');
        } catch (err) { alert("gagal kirim bos!"); }
        finally { btn.disabled = false; btn.innerText = "bayar sekarang"; }
    };
};

// --- CHAT SYSTEM ---
window.openChatBuyer = (orderId, storeName) => {
    currentChatOrderId = orderId;
    document.getElementById('chat-buyer-title').innerText = "chat ke " + storeName;
    document.getElementById('chat-modal-buyer').classList.remove('hidden-view');
    const q = query(collection(db, "chats"), where("orderid", "==", orderId));
    onSnapshot(q, (snapshot) => {
        const box = document.getElementById('chat-box-buyer'); box.innerHTML = '';
        const msgs = []; snapshot.forEach(doc => msgs.push(doc.data()));
        msgs.sort((a,b) => (a.time?.seconds || 0) - (b.time?.seconds || 0));
        msgs.forEach(c => {
            const isMe = c.sender === 'buyer';
            const media = c.media_url ? `<img src="${c.media_url}" class="max-w-full rounded-lg mb-1 shadow-sm cursor-pointer" onclick="window.open('${c.media_url}')">` : '';
            box.innerHTML += `<div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-1"><div class="${isMe ? 'bg-blue-600 text-white rounded-l-xl rounded-tr-xl' : 'bg-white border text-slate-700 rounded-r-xl rounded-tl-xl'} p-2 text-[10px] shadow-sm max-w-[80%] break-words">${media}${c.message || ''}</div></div>`;
        });
        box.scrollTop = box.scrollHeight;
    });
};

window.sendChatBuyer = async () => {
    const input = document.getElementById('chat-input-buyer');
    const fileInput = document.getElementById('chat-media-buyer');
    if(!input.value && (!fileInput || fileInput.files.length === 0)) return;
    const saveMsg = async (base64 = null) => {
        await addDoc(collection(db, "chats"), { orderid: currentChatOrderId, sender: 'buyer', message: input.value, media_url: base64, time: serverTimestamp() });
        input.value = ''; if(fileInput) fileInput.value = '';
    };
    if (fileInput && fileInput.files.length > 0) {
        const reader = new FileReader(); reader.readAsDataURL(fileInput.files[0]);
        reader.onload = (e) => saveMsg(e.target.result);
    } else { saveMsg(); }
};

window.closeChatBuyer = () => document.getElementById('chat-modal-buyer').classList.add('hidden-view');

// --- HISTORY LOGIC ---
window.toggleHistory = () => {
    const panel = document.getElementById('history-panel');
    panel.classList.toggle('hidden-view');
    if (!panel.classList.contains('hidden-view')) renderHistory();
};

function renderHistory() {
    const container = document.getElementById('history-list');
    const localData = JSON.parse(localStorage.getItem('simplein_history') || '[]');
    container.innerHTML = '';
    if (localData.length === 0) {
        container.innerHTML = '<div class="text-center py-10 text-slate-300 text-[10px] font-bold italic uppercase tracking-widest">belum ada history bos...</div>';
        return;
    }
    localData.slice().reverse().forEach(h => {
        container.innerHTML += `
            <div onclick="window.openChatBuyer('${h.id}', '${h.store}')" class="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-primary cursor-pointer transition group">
                <div class="flex justify-between items-start mb-2">
                    <span class="text-[9px] font-black text-blue-500 uppercase tracking-tighter">ID: ${h.id}</span>
                    <span class="text-[8px] text-slate-300 font-bold">${new Date(h.date).toLocaleDateString()}</span>
                </div>
                <h4 class="font-bold text-[11px] text-slate-800 truncate">${h.item}</h4>
                <p class="text-[10px] text-slate-400 mt-1 italic">toko: ${h.store}</p>
                <div class="mt-3 flex justify-end">
                    <span class="text-[9px] font-black text-slate-300 group-hover:text-primary transition uppercase tracking-widest flex items-center gap-1">lanjut chat <i data-lucide="chevron-right" class="w-3 h-3"></i></span>
                </div>
            </div>`;
    });
    safeCreateIcons();
}

// --- OTHER FEATURES ---
window.promptLacak = async () => {
    const id = prompt("masukin ID pesanan lu bos:"); if(!id) return;
    const d = await getDoc(doc(db, "transactions", id));
    if(d.exists()) { window.openChatBuyer(id, "seller"); } else { alert("ID pesanan gak ketemu!"); }
};

window.toggleAI = () => document.getElementById('ai-chat-modal').classList.toggle('hidden-view');

window.askAI = async () => {
    const input = document.getElementById('ai-query'); const qStr = input.value; if(!qStr) return;
    const chatBox = document.getElementById('ai-chat-box'); const typing = document.getElementById('ai-typing');
    chatBox.innerHTML += `<div class="self-end bg-indigo-500 text-white p-3 rounded-2xl mb-2 shadow-sm">${qStr}</div>`;
    input.value = ''; typing.classList.remove('hidden'); chatBox.scrollTop = chatBox.scrollHeight;
    try {
        const genAI = new GoogleGenerativeAI("AIzaSyD34-ERbUBfrCQo1SPP7Aia67KEcVJkMvM");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`lu asisten simplein. jawab gaul. tanya: ${qStr}`);
        typing.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-white p-3 rounded-2xl mb-2 border shadow-sm text-slate-700">${result.response.text()}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) { typing.classList.add('hidden'); }
};

window.addEventListener('load', () => { safeCreateIcons(); });