// inisialisasi icon lucide
lucide.createIcons();

// navigasi tab
function switchtab(tab) {
    document.getElementById('dashboard-view').classList.add('hidden-view');
    document.getElementById('products-view').classList.add('hidden-view');
    document.getElementById('history-view').classList.add('hidden-view');
    
    // reset style
    ['dashboard', 'products', 'history'].forEach(t => {
        const el = document.getElementById(`tab-${t}`);
        el.className = 'w-full flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl font-medium transition';
    });

    // aktifkan tab yang dipilih
    document.getElementById(`${tab}-view`).classList.remove('hidden-view');
    document.getElementById(`tab-${tab}`).className = 'w-full flex items-center gap-3 px-4 py-3 bg-blue-50 text-primary rounded-xl font-medium transition';
}

// data state buat nyimpen data simulasi
let totalrevenue = 0;
let totalorders = 0;
const historydata = [
    { id: 'trx-001', item: 'headphone noise cancelling', price: 1500000, status: 'selesai' },
    { id: 'trx-002', item: 'mouse wireless logitech', price: 350000, status: 'selesai' }
];

// fungsi hitung pendapatan harian (history + order baru)
function updatedashboardstats() {
    // format rupiah
    const formatrupiah = (angka) => new intl.numberformat('id-id', { style: 'currency', currency: 'idr', maximumfractiondigits: 0 }).format(angka);
    
    document.getElementById('daily-revenue').innerText = formatrupiah(totalrevenue);
    document.getElementById('daily-orders').innerText = totalorders;
}

// render tabel history
function renderhistory() {
    const tbody = document.getElementById('history-table-body');
    tbody.innerHTML = '';
    
    // reset revenue awal dari history
    totalrevenue = 0;
    
    historydata.forEach(trx => {
        totalrevenue += trx.price; // jumlahin ke total harian
        const row = `
            <tr class="hover:bg-slate-50">
                <td class="p-4 font-medium text-slate-700">${trx.id}</td>
                <td class="p-4">${trx.item}</td>
                <td class="p-4 font-semibold text-accent">rp ${(trx.price).tolocalestring('id-id')}</td>
                <td class="p-4"><span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">${trx.status}</span></td>
            </tr>
        `;
        tbody.innerHTML += row;
    });
    
    // init jumlah order
    totalorders = historydata.length;
    updatedashboardstats();
}

// simulasi firebase onsnapshot (realtime order masuk)
// di project asli, ganti pake: firestore.collection('transactions').where('sellerid','==', id).onsnapshot(doc => { ... })
function simulatorealtimeorder() {
    setTimeout(() => {
        const neworder = {
            id: 'trx-003',
            item: 'kado ultah cowok (paket lengkap)',
            price: 500000,
            customer: 'budi santoso',
            time: 'baru saja'
        };

        // ilangin tulisan kosong
        const emptyel = document.getElementById('empty-order-msg');
        if(emptyel) emptyel.remove();

        // bikin card order baru
        const orderhtml = `
            <div class="p-6 flex justify-between items-center bg-blue-50/50">
                <div class="flex gap-4 items-center">
                    <div class="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center">
                        <i data-lucide="package" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <div class="font-bold text-slate-800">${neworder.item}</div>
                        <div class="text-sm text-slate-500">pembeli: ${neworder.customer} • ${neworder.time}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="font-bold text-xl text-accent">rp ${(neworder.price).tolocalestring('id-id')}</div>
                    <button class="mt-2 bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition">proses pesanan</button>
                </div>
            </div>
        `;

        // masukin ke paling atas list
        const container = document.getElementById('live-orders-container');
        container.insertadjacenthtml('afterbegin', orderhtml);
        lucide.createIcons();

        // update pendapatan dan jumlah pesanan secara otomatis
        totalrevenue += neworder.price;
        totalorders += 1;
        updatedashboardstats();

        // munculin pop-up notif melayang
        const notif = document.getElementById('realtime-notif');
        notif.style.display = 'flex';
        notif.classlist.add('animate-slide-in');
        
        // ilangin notif setelah 4 detik
        setTimeout(() => {
            notif.style.display = 'none';
            notif.classlist.remove('animate-slide-in');
        }, 4000);

    }, 3000); // pesanan masuk setelah 3 detik halaman dibuka
}

// simulasi upload file
document.getElementById('media-upload').addeventlistener('change', function(e) {
    if(e.target.files.length > 0) {
        document.getElementById('upload-status').classlist.remove('hidden');
        document.getElementById('upload-status').innertext = `file "${e.target.files[0].name}" siap diupload.`;
    }
});

function handleupload() {
    // di project asli, kirim file ke firebase storage di sini
    alert('simulasi: produk dan video/foto berhasil disimpan ke database!');
    document.getElementById('upload-status').classlist.add('hidden');
}

// inisialisasi awal
renderhistory();
simulatorealtimeorder();