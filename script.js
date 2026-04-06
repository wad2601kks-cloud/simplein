import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const firebaseConfig = {
    apiKey: "AIzaSyAdPxvp6zhIEjNPdQJq-4F7eU0bwTaGrMs",
    authDomain: "simplein-55eeb.firebaseapp.com",
    projectId: "simplein-55eeb",
    storageBucket: "simplein-55eeb.firebasestorage.app",
    messagingSenderId: "513993838187",
    appId: "1:513993838187:web:281d8a37bc75fab7572b2e",
    measurementId: "G-FWX89Z1PRG"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const safeCreateIcons = () => { if (typeof lucide !== 'undefined') lucide.createIcons(); };
safeCreateIcons();

let itemTerpilih = null;
let map = null;
let marker = null;
let currentOrderChat = null;
let unsubscribeChatBuyer = null;

// ================= NAVIGASI =================
window.showview = (viewid) => {
    document.getElementById('home-view').classList.add('hidden-view');
    document.getElementById('loading-view').classList.add('hidden-view');
    document.getElementById('results-view').classList.add('hidden-view');
    if(document.getElementById(viewid)) document.getElementById(viewid).classList.remove('hidden-view');
};

// ================= CARI BARANG =================
window.handleaisearch = async function() {
    const queryStr = document.getElementById('ai-input').value;
    if(!queryStr) return alert('ketik dulu barangnya!');
    window.showview('loading-view');
    try {
        const querySnapshot = await getDocs(collection(db, "product"));
        const products = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name && data.name.toLowerCase().includes(queryStr.toLowerCase())) {
                products.push({ id: doc.id, ...data });
            }
        });
        setTimeout(() => {
            renderproducts(queryStr, products);
            window.showview('results-view');
        }, 1500);
    } catch (error) { window.showview('home-view'); }
};

function renderproducts(query, products) {
    const container = document.getElementById('product-container');
    container.innerHTML = ''; 
    if (products.length === 0) {
        document.getElementById('ai-response-text').innerHTML = `maaf bos, gak nemu barang <b>"${query}"</b>.`;
        return;
    }
    document.getElementById('ai-response-text').innerHTML = `ai nemu <b>${products.length} toko</b> buat lu.`;
    
    products.forEach(seller => {
        const cleanData = { ...seller, id: seller.id };
        const dataJson = encodeURIComponent(JSON.stringify(cleanData));
        let mediaHtml = `<div class="w-full h-40 bg-slate-100 rounded-xl mb-3 flex items-center justify-center text-slate-400 font-bold text-[10px]">no media</div>`;
        if (seller.media_url) {
            mediaHtml = seller.media_type === 'video' 
                ? `<video src="${seller.media_url}" class="w-full h-40 object-cover rounded-xl mb-3" muted loop autoplay></video>`
                : `<img src="${seller.media_url}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm">`;
        }
        container.innerHTML += `
            <div class="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col relative pt-8 text-left">
                <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-100 text-primary text-[10px] font-bold px-3 py-1 rounded-full">rekomendasi ai</div>
                ${mediaHtml}
                <h4 class="font-bold text-slate-800 text-sm mb-2 truncate">${seller.name}</h4>
                <div class="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg text-left">
                    <div class="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary"><i data-lucide="store" class="w-3.5 h-3.5"></i></div>
                    <div class="text-[11px] font-bold text-slate-800 truncate">${seller.storename || 'toko simplein'}</div>
                </div>
                <div class="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div><div class="text-[9px] text-slate-400 uppercase font-bold mb-1">berat</div><div class="text-[11px] font-semibold text-slate-700">${seller.berat || '-'}</div></div>
                    <div><div class="text-[9px] text-slate-400 uppercase font-bold mb-1">dimensi</div><div class="text-[11px] font-semibold text-slate-700">${seller.volume || '-'}</div></div>
                </div>
                <div class="mt-auto">
                    <div class="font-black text-orange-500 text-xl mb-3 text-left">Rp ${seller.price.toLocaleString()}</div>
                    <button onclick="window.opencheckout('${dataJson}')" class="w-full bg-[#111827] text-white font-bold py-3 rounded-xl transition text-sm">beli sekarang</button>
                </div>
            </div>`;
    });
    safeCreateIcons();
}

// ================= CHECKOUT & MAPS =================
window.opencheckout = function(dataJsonEncoded) {
    const product = JSON.parse(decodeURIComponent(dataJsonEncoded));
    itemTerpilih = product;
    document.getElementById('modal-title').innerText = product.name;
    document.getElementById('modal-price').innerText = "Rp " + product.price.toLocaleString();
    document.getElementById('seller-bank-name').innerText = product.bank || "dana / qris";
    document.getElementById('seller-rekening').innerText = product.rekening || "000000";
    
    const qrImg = document.getElementById('seller-qr');
    if (product.qr_url) { qrImg.src = product.qr_url; } 
    else { qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${product.rekening}`; }
    
    document.getElementById('checkout-modal').classList.remove('hidden-view');
    setTimeout(() => {
        if (!map) {
            map = L.map('map', { attributionControl: false }).setView([-6.2000, 106.8166], 13);
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}').addTo(map);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png').addTo(map);
            L.Control.geocoder({ defaultMarkGeocode: false, placeholder: "cari alamat lu..." }).on('markgeocode', function(e) {
                map.setView(e.geocode.center, 18);
                if (marker) map.removeLayer(marker);
                marker = L.marker(e.geocode.center, {draggable: true}).addTo(map);
                document.getElementById('buyer-lat').value = e.geocode.center.lat;
                document.getElementById('buyer-lng').value = e.geocode.center.lng;
                document.getElementById('location-status').innerText = "lokasi: " + e.geocode.name;
            }).addTo(map);
            map.on('click', (e) => {
                if (marker) map.removeLayer(marker);
                marker = L.marker(e.latlng, {draggable: true}).addTo(map);
                document.getElementById('buyer-lat').value = e.latlng.lat;
                document.getElementById('buyer-lng').value = e.latlng.lng;
                document.getElementById('location-status').innerText = "lokasi diset manual";
            });
        } else { map.invalidateSize(); }
    }, 400);
};

window.closecheckout = () => document.getElementById('checkout-modal').classList.add('hidden-view');

window.processpayment = async function() {
    if (!itemTerpilih) return alert("pilih barang dulu!");
    const nama = document.getElementById('buyer-name').value;
    const detailAlamat = document.getElementById('buyer-address-detail').value;
    const fileInput = document.getElementById('pembayaran-image');
    if (!nama || !detailAlamat || fileInput.files.length === 0) return alert("lengkapi data & bukti tf!");
    
    const reader = new FileReader();
    reader.readAsDataURL(fileInput.files[0]);
    reader.onload = async (event) => {
        try {
            const docRef = await addDoc(collection(db, "transactions"), {
                item: itemTerpilih.name, price: Number(itemTerpilih.price), sellerid: itemTerpilih.sellerid,
                customer: nama, address_detail: detailAlamat, lat: Number(document.getElementById('buyer-lat').value),
                lng: Number(document.getElementById('buyer-lng').value),
                bukti_transfer: event.target.result, status: "menunggu konfirmasi", time: serverTimestamp()
            });
            localStorage.setItem('lastOrderId', docRef.id);
            alert("sukses! id: " + docRef.id);
            window.closecheckout(); window.showview('home-view');
            window.openChatBuyer(docRef.id, itemTerpilih.name);
            window.cekPesananAktif(); 
        } catch (e) { alert("gagal!"); }
    };
};

// ================= CHAT SELLER =================
window.sendChatBuyer = async function() {
    const input = document.getElementById('chat-input-buyer');
    const fileInput = document.getElementById('chat-media-buyer');
    if(!input.value && (!fileInput || fileInput.files.length === 0)) return;
    const save = async (mediaData = null, type = null) => {
        await addDoc(collection(db, "chats"), {
            orderid: currentOrderChat, sender: 'buyer', message: input.value,
            media_url: mediaData, media_type: type, time: serverTimestamp()
        });
        input.value = ''; if(fileInput) fileInput.value = '';
    };
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (e) => save(e.target.result, file.type.startsWith('video') ? 'video' : 'image');
    } else { save(); }
};

window.openChatBuyer = (orderId, title) => {
    currentOrderChat = orderId;
    document.getElementById('chat-modal-buyer').classList.remove('hidden');
    if(unsubscribeChatBuyer) unsubscribeChatBuyer();
    const q = query(collection(db, "chats"), where("orderid", "==", orderId), orderBy("time", "asc"));
    unsubscribeChatBuyer = onSnapshot(q, (snapshot) => {
        const chatBox = document.getElementById('chat-box-buyer');
        chatBox.innerHTML = `<div class="bg-blue-50 border border-blue-100 p-2 rounded-xl mb-2 text-center text-[10px] font-mono font-bold text-blue-700 select-all">${orderId}</div>`;
        snapshot.forEach(doc => {
            const c = doc.data(); const isMe = c.sender === 'buyer';
            let media = c.media_url ? (c.media_type === 'video' ? `<video src="${c.media_url}" controls class="max-w-full rounded-lg mb-1"></video>` : `<img src="${c.media_url}" class="max-w-full rounded-lg mb-1 shadow-sm">`) : '';
            chatBox.innerHTML += `<div class="${isMe ? 'self-end bg-orange-500 text-white rounded-l-2xl rounded-tr-2xl' : 'self-start bg-white border border-slate-200 rounded-r-2xl rounded-tl-2xl'} p-2.5 text-[11px] shadow-sm max-w-[80%] break-words mb-1 text-left">${media}${c.message || ''}</div>`;
        });
        chatBox.scrollTop = chatBox.scrollHeight;
    });
};

window.closeChatBuyer = () => document.getElementById('chat-modal-buyer').classList.add('hidden');

// ================= ASISTEN AI SDK (FINAL FIX) =================
window.toggleAI = () => { 
    const modal = document.getElementById('ai-chat-modal');
    if(modal) modal.classList.toggle('hidden-view');
};

window.askAI = async () => {
    const input = document.getElementById('ai-query');
    const chatBox = document.getElementById('ai-chat-box');
    const typingIndicator = document.getElementById('ai-typing');
    const queryStr = input.value.trim();
    const API_KEY = "AIzaSyD34-ERbUBfrCQo1SPP7Aia67KEcVJkMvM"; 

    if (!queryStr) return;
    chatBox.innerHTML += `<div class="self-end bg-purple-600 text-white p-3 rounded-l-2xl rounded-tr-2xl max-w-[85%] shadow-sm mb-2 text-xs text-left">${queryStr}</div>`;
    input.value = ''; chatBox.scrollTop = chatBox.scrollHeight;
    typingIndicator.classList.remove('hidden');

    try {
        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Lu asisten Simplein. Jawab gaul lu-gue, asik, panggil bos. User tanya: ${queryStr}`);
        const response = await result.response;
        const text = response.text();

        typingIndicator.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-white border border-purple-100 p-3 rounded-r-2xl rounded-tl-2xl max-w-[85%] shadow-sm text-slate-700 mb-2 text-xs text-left">${text}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        typingIndicator.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-red-50 text-red-500 p-2 rounded-lg text-[10px]">waduh bos, jaringan amsyat. coba lagi!</div>`;
    }
    safeCreateIcons();
};

window.cekPesananAktif = () => {
    const savedId = localStorage.getItem('lastOrderId');
    if (savedId) {
        const oldBtn = document.getElementById('sticky-chat-btn'); if (oldBtn) oldBtn.remove();
        const btn = document.createElement('div'); btn.id = 'sticky-chat-btn';
        btn.innerHTML = `<div class="fixed bottom-6 right-6 z-50"><button onclick="window.openChatBuyer('${savedId}', 'pesanan')" class="bg-primary text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-3"><i data-lucide="message-circle"></i><div class="text-left font-bold text-xs uppercase text-white">chat seller</div></button></div>`;
        document.body.appendChild(btn); safeCreateIcons();
    }
};

window.promptLacak = async () => {
    const orderId = prompt("id pesanan:"); if(!orderId) return;
    try {
        const docSnap = await getDoc(doc(db, "transactions", orderId));
        if (docSnap.exists()) { const data = docSnap.data(); alert(`status: ${data.status.toUpperCase()}`); window.openChatBuyer(orderId, data.item); } else { alert("id gak ada!"); }
    } catch (e) { alert("gagal melacak."); }
};

window.addEventListener('load', window.cekPesananAktif);