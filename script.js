import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, query, where, onSnapshot, orderBy, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
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
safeCreateIcons();

let itemTerpilih = null;
let map = null;
let marker = null;

// ================= NAVIGASI =================
window.showview = (viewid) => {
    ['home-view', 'loading-view', 'results-view'].forEach(v => {
        const el = document.getElementById(v);
        if(el) el.classList.add('hidden-view');
    });
    const target = document.getElementById(viewid);
    if(target) target.classList.remove('hidden-view');
};

// ================= CARI BARANG =================
window.handleaisearch = async function() {
    const queryStr = document.getElementById('ai-input').value;
    if(!queryStr) return;
    window.showview('loading-view');
    try {
        const querySnapshot = await getDocs(collection(db, "product"));
        const products = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.name.toLowerCase().includes(queryStr.toLowerCase())) {
                products.push({ id: doc.id, ...data });
            }
        });
        renderproducts(products);
        document.getElementById('ai-response-text').innerText = `ai nemu ${products.length} produk buat lu bos.`;
        window.showview('results-view');
    } catch (e) { 
        window.showview('home-view');
        alert("error bos pas cari barang!");
    }
};

function renderproducts(products) {
    const container = document.getElementById('product-container');
    container.innerHTML = ''; 
    products.forEach(p => {
        // Encode data produk buat dikirim ke fungsi beli
        const dataStr = encodeURIComponent(JSON.stringify(p));
        
        container.innerHTML += `
            <div class="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 flex flex-col text-left">
                <img src="${p.media_url}" class="w-full h-44 object-cover rounded-2xl mb-4 shadow-sm">
                <h4 class="font-bold text-slate-800 text-sm mb-1 truncate">${p.name}</h4>
                <div class="text-[10px] text-slate-400 mb-3 italic">Toko: ${p.storename || 'Simplein'}</div>
                
                <div class="grid grid-cols-2 gap-2 mb-4 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div>
                        <div class="text-[8px] text-slate-400 uppercase font-bold mb-1">berat</div>
                        <div class="text-[10px] font-bold text-slate-700">${p.berat || '-'}</div>
                    </div>
                    <div>
                        <div class="text-[8px] text-slate-400 uppercase font-bold mb-1">dimensi</div>
                        <div class="text-[10px] font-bold text-slate-700">${p.volume || '-'}</div>
                    </div>
                </div>

                <div class="mt-auto">
                    <p class="text-orange-500 font-black text-xl mb-3">Rp ${Number(p.price).toLocaleString()}</p>
                    <button onclick="window.opencheckout('${dataStr}')" class="w-full bg-[#111827] text-white py-3.5 rounded-2xl text-xs font-bold transition hover:bg-black">beli sekarang</button>
                </div>
            </div>`;
    });
    safeCreateIcons();
}

// ================= CHECKOUT =================
window.opencheckout = (dataJson) => {
    const p = JSON.parse(decodeURIComponent(dataJson));
    itemTerpilih = p;
    
    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('modal-img-placeholder').innerHTML = `<img src="${p.media_url}" class="w-full h-full object-cover">`;
    document.getElementById('seller-bank-name').innerText = p.bank || "DANA / QRIS";
    document.getElementById('seller-rekening').innerText = p.rekening || "08123456789";
    
    const qrImg = document.getElementById('seller-qr');
    qrImg.src = p.qr_url || `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${p.rekening}`;
    
    document.getElementById('checkout-modal').classList.remove('hidden-view');
    
    // Reset & Init Map
    setTimeout(() => {
        if (!map) {
            map = L.map('map', { attributionControl: false }).setView([-6.2000, 106.8166], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            L.Control.geocoder({ defaultMarkGeocode: false, placeholder: "cari alamat lu..." }).on('markgeocode', function(e) {
                map.setView(e.geocode.center, 18);
                if (marker) map.removeLayer(marker);
                marker = L.marker(e.geocode.center, {draggable: true}).addTo(map);
                document.getElementById('buyer-lat').value = e.geocode.center.lat;
                document.getElementById('buyer-lng').value = e.geocode.center.lng;
                document.getElementById('location-status').innerText = "lokasi terpilih: " + e.geocode.name;
            }).addTo(map);
            
            map.on('click', (e) => {
                if (marker) map.removeLayer(marker);
                marker = L.marker(e.latlng, {draggable: true}).addTo(map);
                document.getElementById('buyer-lat').value = e.latlng.lat;
                document.getElementById('buyer-lng').value = e.latlng.lng;
                document.getElementById('location-status').innerText = "lokasi diset manual";
            });
        } else {
            map.invalidateSize();
        }
    }, 400);
};

window.closecheckout = () => document.getElementById('checkout-modal').classList.add('hidden-view');

window.processpayment = async function() {
    const nama = document.getElementById('buyer-name').value;
    const detail = document.getElementById('buyer-address-detail').value;
    const lat = document.getElementById('buyer-lat').value;
    const file = document.getElementById('pembayaran-image').files[0];
    
    if(!nama || !lat || !file) return alert("lengkapi data dan bukti transfer bos!");

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
        try {
            const docRef = await addDoc(collection(db, "transactions"), {
                item: itemTerpilih.name, price: Number(itemTerpilih.price), sellerid: itemTerpilih.sellerid,
                customer: nama, address: detail, lat: Number(lat),
                lng: Number(document.getElementById('buyer-lng').value),
                bukti_transfer: e.target.result, status: "menunggu konfirmasi", time: serverTimestamp()
            });
            localStorage.setItem('lastOrderId', docRef.id);
            alert("Sip bos! Pesanan dikirim. ID: " + docRef.id);
            window.closecheckout();
            window.showview('home-view');
        } catch (err) { alert("gagal kirim data bos!"); }
    };
};

// ================= AI ASISTEN =================
window.toggleAI = () => { document.getElementById('ai-chat-modal').classList.toggle('hidden-view'); };

window.askAI = async () => {
    const input = document.getElementById('ai-query');
    const chatBox = document.getElementById('ai-chat-box');
    const typingIndicator = document.getElementById('ai-typing');
    const queryStr = input.value.trim();
    const API_KEY = "AIzaSyD34-ERbUBfrCQo1SPP7Aia67KEcVJkMvM"; 

    if (!queryStr) return;
    chatBox.innerHTML += `<div class="self-end bg-purple-600 text-white p-3 rounded-l-2xl rounded-tr-2xl max-w-[85%] shadow-sm mb-2 text-left">${queryStr}</div>`;
    input.value = ''; chatBox.scrollTop = chatBox.scrollHeight;
    typingIndicator.classList.remove('hidden');

    try {
        const prodSnap = await getDocs(collection(db, "product"));
        let daftarProduk = "";
        prodSnap.forEach(d => { const p = d.data(); daftarProduk += `- ${p.name} (Harga: Rp${p.price})\n`; });

        const lastOrderId = localStorage.getItem('lastOrderId');
        let infoTransaksi = "User belum pernah belanja.";
        if (lastOrderId) {
            const transDoc = await getDoc(doc(db, "transactions", lastOrderId));
            if (transDoc.exists()) {
                const t = transDoc.data();
                infoTransaksi = `User terakhir beli ${t.item} seharga Rp${t.price} dengan status: ${t.status}.`;
            }
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptKonteks = `Lu asisten AI Simplein. Jawab gaul lu-gue, panggil bos.
        KONTEKS TOKO KITA:
        ${daftarProduk}
        RIWAYAT USER:
        ${infoTransaksi}
        Bantu bos ini: ${queryStr}`;

        const result = await model.generateContent(promptKonteks);
        const text = result.response.text();

        typingIndicator.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-white border border-purple-100 p-3 rounded-r-2xl rounded-tl-2xl max-w-[85%] shadow-sm text-slate-700 mb-2 text-left">${text}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        typingIndicator.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-red-50 text-red-500 p-2 rounded-lg text-[10px]">waduh bos, jaringan amsyat. coba lagi!</div>`;
    }
    safeCreateIcons();
};

window.promptLacak = async () => {
    const id = prompt("masukin ID pesanan:");
    if(!id) return;
    try {
        const d = await getDoc(doc(db, "transactions", id));
        if(d.exists()) { alert("status: " + d.data().status.toUpperCase()); } else { alert("ID gak nemu bos!"); }
    } catch(e) { alert("gagal melacak!"); }
};