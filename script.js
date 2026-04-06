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

// ================= ASISTEN AI (MODEL PINTER) =================
window.toggleAI = () => { document.getElementById('ai-chat-modal').classList.toggle('hidden-view'); };

window.askAI = async () => {
    const input = document.getElementById('ai-query');
    const chatBox = document.getElementById('ai-chat-box');
    const typingIndicator = document.getElementById('ai-typing');
    const queryStr = input.value.trim();
    const API_KEY = "AIzaSyD34-ERbUBfrCQo1SPP7Aia67KEcVJkMvM"; 

    if (!queryStr) return;
    chatBox.innerHTML += `<div class="self-end bg-purple-600 text-white p-3 rounded-l-2xl rounded-tr-2xl max-w-[85%] shadow-sm mb-2 text-[11px] text-left">${queryStr}</div>`;
    input.value = ''; chatBox.scrollTop = chatBox.scrollHeight;
    typingIndicator.classList.remove('hidden');

    try {
        // 1. NGINTIP DATA PRODUK (BIAR AI TAU STOK)
        const prodSnap = await getDocs(collection(db, "product"));
        let daftarProduk = "";
        prodSnap.forEach(d => { const p = d.data(); daftarProduk += `- ${p.name} (Rp${p.price})\n`; });

        // 2. NGINTIP ORDER TERAKHIR (BIAR AI INGET LU BELI APA)
        const lastId = localStorage.getItem('lastOrderId');
        let dataOrder = "User belum belanja.";
        if (lastId) {
            const transDoc = await getDoc(doc(db, "transactions", lastId));
            if (transDoc.exists()) {
                const t = transDoc.data();
                dataOrder = `User terakhir beli ${t.item}, statusnya ${t.status}. ID: ${lastId}`;
            }
        }

        const genAI = new GoogleGenerativeAI(API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const promptKonteks = `Lu adalah asisten Simplein. Jawab gaul lu-gue, panggil bos.
        PRODUK TOKO: ${daftarProduk}
        STATUS BELANJA USER: ${dataOrder}
        Kalo user tanya 'paket gua mana' atau 'beli apa', liat data belanja. Kalo nanya saran, liat daftar produk.
        Pertanyaan: ${queryStr}`;

        const result = await model.generateContent(promptKonteks);
        const text = result.response.text();

        typingIndicator.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-white border border-purple-100 p-3 rounded-r-2xl rounded-tl-2xl max-w-[85%] shadow-sm text-slate-700 mb-2 text-[11px] text-left">${text}</div>`;
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (e) {
        typingIndicator.classList.add('hidden');
        chatBox.innerHTML += `<div class="self-start bg-red-50 text-red-500 p-2 rounded-lg text-[10px]">waduh bos, jaringan lg kaco. coba lagi!</div>`;
    }
    safeCreateIcons();
};

// ================= FITUR SEARCH & LAINNYA =================
window.showview = (viewid) => {
    ['home-view', 'loading-view', 'results-view'].forEach(v => {
        const el = document.getElementById(v); if(el) el.classList.add('hidden-view');
    });
    const target = document.getElementById(viewid); if(target) target.classList.remove('hidden-view');
};

window.handleaisearch = async function() {
    const q = document.getElementById('ai-input').value; if(!q) return;
    window.showview('loading-view');
    const snap = await getDocs(collection(db, "product"));
    const prods = [];
    snap.forEach(doc => { if(doc.data().name.toLowerCase().includes(q.toLowerCase())) prods.push({id: doc.id, ...doc.data()}); });
    renderproducts(prods); window.showview('results-view');
};

function renderproducts(prods) {
    const container = document.getElementById('product-container'); container.innerHTML = ''; 
    prods.forEach(p => {
        container.innerHTML += `
            <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-left">
                <img src="${p.media_url}" class="w-full h-40 object-cover rounded-xl mb-3 shadow-sm">
                <h4 class="font-bold text-sm mb-1">${p.name}</h4>
                <p class="text-orange-500 font-black">Rp ${p.price.toLocaleString()}</p>
                <button class="mt-3 w-full bg-primary text-white py-2.5 rounded-xl text-[10px] font-bold">beli sekarang</button>
            </div>`;
    });
    safeCreateIcons();
}

window.addEventListener('load', () => { if (typeof lucide !== 'undefined') lucide.createIcons(); });