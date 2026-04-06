import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, serverTimestamp, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
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

window.showview = (viewid) => {
    ['home-view', 'loading-view', 'results-view'].forEach(v => document.getElementById(v)?.classList.add('hidden-view'));
    document.getElementById(viewid)?.classList.remove('hidden-view');
};

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
        container.innerHTML += `
            <div class="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col text-left">
                <img src="${p.media_url}" class="w-full h-44 object-cover rounded-2xl mb-4 shadow-sm">
                <h4 class="font-bold text-sm truncate text-slate-800">${p.name}</h4>
                <div class="grid grid-cols-2 gap-2 my-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <div><p class="text-[8px] uppercase font-bold text-slate-400 mb-1">berat</p><p class="text-[10px] font-black text-slate-700">${p.berat || '-'}</p></div>
                    <div><p class="text-[8px] uppercase font-bold text-slate-400 mb-1">dimensi</p><p class="text-[10px] font-black text-slate-700">${p.volume || '-'}</p></div>
                </div>
                <div class="mt-auto">
                    <p class="text-orange-500 font-black text-xl mb-3">Rp ${Number(p.price).toLocaleString()}</p>
                    <button onclick="window.opencheckout('${dataJson}')" class="w-full bg-[#111827] text-white py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-black transition">beli sekarang</button>
                </div>
            </div>`;
    });
    safeCreateIcons();
}

window.opencheckout = (data) => {
    const p = JSON.parse(decodeURIComponent(data)); itemTerpilih = p;
    document.getElementById('modal-title').innerText = p.name;
    document.getElementById('modal-price').innerText = "Rp " + Number(p.price).toLocaleString();
    document.getElementById('modal-img-placeholder').innerHTML = `<img src="${p.media_url}" class="w-full h-full object-cover">`;
    document.getElementById('seller-bank-name').innerText = p.bank || "DANA/QRIS";
    document.getElementById('seller-rekening').innerText = p.rekening || "08123456789";
    document.getElementById('seller-qr').src = p.qr_url || `https://api.qrserver.com/v1/create-qr-code/?data=${p.rekening}`;
    document.getElementById('checkout-modal').classList.remove('hidden-view');
    setTimeout(() => {
        if(!map) {
            map = L.map('map', { attributionControl: false }).setView([-6.2, 106.8], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
            map.on('click', (e) => {
                if(marker) map.removeLayer(marker);
                marker = L.marker(e.latlng).addTo(map);
                document.getElementById('buyer-lat').value = e.latlng.lat;
                document.getElementById('buyer-lng').value = e.latlng.lng;
                document.getElementById('location-status').innerText = "lokasi diset manual bos!";
            });
        } else { map.invalidateSize(); }
    }, 400);
};

window.closecheckout = () => document.getElementById('checkout-modal').classList.add('hidden-view');

window.processpayment = async () => {
    const name = document.getElementById('buyer-name').value;
    const file = document.getElementById('pembayaran-image').files[0];
    if(!name || !file) return alert("data & bukti tf jangan lupa bos!");
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async (e) => {
        try {
            const docRef = await addDoc(collection(db, "transactions"), {
                item: itemTerpilih.name, price: Number(itemTerpilih.price), customer: name,
                bukti_transfer: e.target.result, status: "menunggu konfirmasi", time: serverTimestamp()
            });
            localStorage.setItem('lastOrderId', docRef.id);
            alert("pesanan dibuat! id: " + docRef.id);
            window.closecheckout();
        } catch (err) { alert("gagal kirim!"); }
    };
};

window.toggleAI = () => document.getElementById('ai-chat-modal').classList.toggle('hidden-view');

window.askAI = async () => {
    const input = document.getElementById('ai-query');
    const qStr = input.value; if(!qStr) return;
    const chatBox = document.getElementById('ai-chat-box');
    const typing = document.getElementById('ai-typing');
    chatBox.innerHTML += `<div class="self-end bg-purple-600 text-white p-3 rounded-2xl mb-2 shadow-sm">${qStr}</div>`;
    input.value = ''; typing.classList.remove('hidden'); chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const prodSnap = await getDocs(collection(db, "product"));
        let daftar = ""; prodSnap.forEach(d => { daftar += `- ${d.data().name} (Rp${d.data().price})\n`; });
        const lastId = localStorage.getItem('lastOrderId');
        let order = "User belum belanja.";
        if(lastId) { const d = await getDoc(doc(db, "transactions", lastId)); if(d.exists()) order = `User terakhir beli ${d.data().item}, status: ${d.data().status}`; }

        const genAI = new GoogleGenerativeAI("AIzaSyD34-ERbUBfrCQo1SPP7Aia67KEcVJkMvM");
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(`Lu asisten Simplein. Jawab gaul lu-gue, panggil bos. Produk kita: ${daftar}. Riwayat user: ${order}. Tanya: ${qStr}`);
        
        typing.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-white p-3 rounded-2xl mb-2 border shadow-sm text-slate-700 leading-relaxed">${result.response.text()}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) { typing.classList.add('hidden'); }
};

window.promptLacak = async () => {
    const id = prompt("masukin ID pesanan:"); if(!id) return;
    const d = await getDoc(doc(db, "transactions", id));
    alert(d.exists() ? "status: " + d.data().status.toUpperCase() : "ID gak ketemu bos!");
};

window.addEventListener('load', () => { safeCreateIcons(); });