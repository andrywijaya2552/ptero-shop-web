// Client-side Application State
let currentUser = null;
let currentPackages = [];
let currentPayments = [];
let siteSettings = {};
let selectedPackageForBuy = null;
let appliedBuyVoucherData = null;

// Live Chat State
let isChatOpen = false;
let lastChatCount = 0;

// Initialize
function initApp() {
  initUserSession();
  setupEventListeners();
  loadPublicInfo();
  updateCustomSlider();

  if (currentUser) {
    refreshUserProfile();
    loadUserServers();
    loadUserTopups();
    if (currentUser.role === 'admin') {
      loadAdminData();
    }
  }

  fetchChatMessages();
  setInterval(fetchChatMessages, 4000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupEventListeners() {
  const userMenuBtn = document.getElementById('userMenuBtn');
  const userDropdown = document.getElementById('userDropdown');
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle('hidden');
    });
    document.addEventListener('click', () => {
      userDropdown.classList.add('hidden');
    });
  }
}

// Session
function initUserSession() {
  const stored = localStorage.getItem('ptero_user');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      updateAuthUI();
    } catch (e) {
      localStorage.removeItem('ptero_user');
    }
  } else {
    updateAuthUI();
  }
}

function updateAuthUI() {
  const navUser = document.getElementById('nav-user-section');
  const navGuest = document.getElementById('nav-guest-section');
  const tabAdmin = document.getElementById('tabBtn-admin');
  const adminDropdownLink = document.getElementById('adminDropdownLink');

  if (currentUser) {
    navGuest.classList.add('hidden');
    navUser.classList.remove('hidden');
    navUser.classList.add('flex');

    document.getElementById('userNameText').innerText = currentUser.username;
    document.getElementById('userAvatarText').innerText = (currentUser.username || 'U')[0].toUpperCase();
    document.getElementById('user-balance-text').innerText = formatRupiah(currentUser.balance || 0);

    if (currentUser.role === 'admin') {
      document.getElementById('userRoleBadge').classList.remove('hidden');
      tabAdmin.classList.remove('hidden');
      adminDropdownLink.classList.remove('hidden');
    } else {
      document.getElementById('userRoleBadge').classList.add('hidden');
      tabAdmin.classList.add('hidden');
      adminDropdownLink.classList.add('hidden');
    }
  } else {
    navUser.classList.add('hidden');
    navUser.classList.remove('flex');
    navGuest.classList.remove('hidden');
    tabAdmin.classList.add('hidden');
    adminDropdownLink.classList.add('hidden');
  }
}

async function refreshUserProfile() {
  if (!currentUser) return;
  try {
    const res = await fetch('/api/user/profile', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    if (data.success && data.user) {
      currentUser = data.user;
      localStorage.setItem('ptero_user', JSON.stringify(currentUser));
      updateAuthUI();
    }
  } catch (err) {
    console.error('Error sync profile:', err);
  }
}

// Tab Switching
function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-link').forEach(el => {
    el.classList.remove('bg-cyan-500', 'text-black', 'font-bold');
    el.classList.add('text-gray-400');
  });

  const target = document.getElementById(`tab-${tabId}`);
  const targetBtn = document.getElementById(`tabBtn-${tabId}`);
  if (target) target.classList.remove('hidden');
  if (targetBtn && tabId !== 'admin') {
    targetBtn.classList.add('bg-cyan-500', 'text-black', 'font-bold');
    targetBtn.classList.remove('text-gray-400');
  }

  if (tabId === 'my-servers') loadUserServers();
  if (tabId === 'topup') loadUserTopups();
  if (tabId === 'admin') loadAdminData();
}

// Load Public Info
async function loadPublicInfo() {
  try {
    const res = await fetch('/api/public/info');
    const data = await res.json();
    if (data.success) {
      currentPackages = data.packages || [];
      currentPayments = data.payments || [];
      siteSettings = data.settings || {};

      // Render Branding
      if (siteSettings.siteName) {
        document.getElementById('brandSiteName').innerHTML = `${siteSettings.siteName.split(' ')[0]}<span class="text-cyan-400">${siteSettings.siteName.split(' ').slice(1).join(' ') || 'HOST'}</span>`;
        document.title = siteSettings.siteName + ' - Toko Panel Pterodactyl';
      }
      if (siteSettings.siteTagline) {
        document.getElementById('brandTagline').innerText = siteSettings.siteTagline;
      }
      if (siteSettings.announcementText) {
        document.getElementById('broadcastMarquee').innerText = siteSettings.announcementText;
      }
      if (siteSettings.pteroDomain) {
        const directLink = document.getElementById('pteroPanelDirectLink');
        if (directLink) directLink.href = siteSettings.pteroDomain;
      }
      if (siteSettings.contactWa) {
        const waLink = document.getElementById('footerWaLink');
        if (waLink) waLink.href = `https://wa.me/${siteSettings.contactWa}?text=Halo%20Admin%20Ptero`;
      }

      renderPackagesList();
      populatePaymentSelect();
    }
  } catch (err) {
    console.error('Error load public info:', err);
  }
}

function renderPackagesList() {
  const container = document.getElementById('packagesGridContainer');
  if (!container) return;

  container.innerHTML = currentPackages.map(p => {
    return `
      <div class="glass-card glass-card-hover rounded-3xl p-6 border ${p.isPopular ? 'border-cyan-500/50 bg-cyan-950/20' : 'border-gray-800'} flex flex-col justify-between relative transition duration-300">
        ${p.isPopular ? `
          <span class="absolute -top-3 right-6 bg-gradient-to-r from-cyan-500 to-blue-600 text-black text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-lg">
            🔥 Paling Laris
          </span>
        ` : ''}
        <div>
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xl">
              <i class="ri-hard-drive-3-line"></i>
            </div>
            <div>
              <h3 class="text-base font-bold text-white">${p.name}</h3>
              <p class="text-[11px] text-gray-400">${p.duration || '30 Hari Active'}</p>
            </div>
          </div>

          <div class="my-4 pb-4 border-b border-gray-800/80 flex items-baseline">
            <span class="text-2xl sm:text-3xl font-black text-white font-mono">${formatRupiah(p.price)}</span>
            <span class="text-xs text-gray-400 ml-1.5">/ bulan</span>
          </div>

          <!-- Specs Badges -->
          <div class="grid grid-cols-3 gap-2 mb-4 text-center">
            <div class="p-2 rounded-xl bg-gray-900 border border-gray-800">
              <p class="text-[10px] text-gray-400">RAM</p>
              <p class="text-xs font-bold text-cyan-300 font-mono mt-0.5">${p.ram}</p>
            </div>
            <div class="p-2 rounded-xl bg-gray-900 border border-gray-800">
              <p class="text-[10px] text-gray-400">CPU</p>
              <p class="text-xs font-bold text-blue-300 font-mono mt-0.5">${p.cpu}</p>
            </div>
            <div class="p-2 rounded-xl bg-gray-900 border border-gray-800">
              <p class="text-[10px] text-gray-400">Disk SSD</p>
              <p class="text-xs font-bold text-teal-300 font-mono mt-0.5">${p.disk}</p>
            </div>
          </div>

          <!-- Features List -->
          <ul class="space-y-2 text-xs text-gray-300 mb-6">
            ${(p.features || []).map(f => `
              <li class="flex items-center gap-2">
                <i class="ri-check-line text-cyan-400"></i> ${f}
              </li>
            `).join('')}
          </ul>
        </div>

        <button onclick="openBuyModal('${p.id}')" class="w-full py-3 bg-gradient-to-r ${p.isPopular ? 'from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black' : 'from-gray-800 to-gray-700 hover:from-cyan-500 hover:to-blue-600 hover:text-black text-white'} font-extrabold rounded-2xl text-xs shadow-lg transition flex items-center justify-center gap-2">
          <i class="ri-shopping-bag-3-line"></i> Sewa Server Ini
        </button>
      </div>
    `;
  }).join('');
}

// Custom Slider Configurator Logic
function updateCustomSlider() {
  const ram = parseInt(document.getElementById('rangeRam')?.value || '2', 10);
  const cpu = parseInt(document.getElementById('rangeCpu')?.value || '150', 10);
  const disk = parseInt(document.getElementById('rangeDisk')?.value || '4', 10);

  document.getElementById('sliderRamVal').innerText = `${ram} GB`;
  document.getElementById('sliderCpuVal').innerText = `${cpu}% CPU`;
  document.getElementById('sliderDiskVal').innerText = `${disk} GB`;

  // Formula Kalkulasi Harga: Base RAM (Rp 2.000/GB) + CPU (Rp 1.000 per 100%) + Disk (Rp 500 per 2GB)
  const price = Math.round((ram * 2000) + ((cpu / 100) * 1000) + ((disk / 2) * 500));
  document.getElementById('sliderTotalPrice').innerText = formatRupiah(price);
}

function orderFromCustomSlider() {
  if (!currentUser) {
    showToast('Silakan login terlebih dahulu untuk menyewa server!', 'warning');
    openModal('modalLogin');
    return;
  }

  const ram = parseInt(document.getElementById('rangeRam')?.value || '2', 10);
  const cpu = parseInt(document.getElementById('rangeCpu')?.value || '150', 10);
  const disk = parseInt(document.getElementById('rangeDisk')?.value || '4', 10);
  const price = Math.round((ram * 2000) + ((cpu / 100) * 1000) + ((disk / 2) * 500));

  const customPkg = {
    id: `custom-${ram}gb-${cpu}cpu`,
    name: `Custom Panel ${ram}GB (${cpu}% CPU)`,
    ram: `${ram * 1024} MB (${ram}GB)`,
    cpu: `${cpu}% CPU`,
    disk: `${disk * 1024} MB (${disk}GB)`,
    price: price,
    duration: '30 Hari'
  };

  selectedPackageForBuy = customPkg;
  appliedBuyVoucherData = null;

  document.getElementById('buyPackageId').value = customPkg.id;
  document.getElementById('modalBuyPkgName').innerText = customPkg.name;
  document.getElementById('modalBuyPkgSpecs').innerText = `RAM: ${customPkg.ram} | CPU: ${customPkg.cpu} | Disk: ${customPkg.disk}`;
  document.getElementById('buyRawPrice').innerText = formatRupiah(customPkg.price);
  document.getElementById('buyFinalPrice').innerText = formatRupiah(customPkg.price);
  document.getElementById('buyDiscountRow').classList.add('hidden');
  document.getElementById('buyVoucherInput').value = '';
  document.getElementById('buyVoucherMsg').classList.add('hidden');

  openModal('modalCheckout');
}

// Order Server Checkout Modal
function openBuyModal(pkgId) {
  if (!currentUser) {
    showToast('Silakan login terlebih dahulu untuk menyewa server!', 'warning');
    openModal('modalLogin');
    return;
  }

  const pkg = currentPackages.find(p => p.id === pkgId);
  if (!pkg) return;

  selectedPackageForBuy = pkg;
  appliedBuyVoucherData = null;

  document.getElementById('buyPackageId').value = pkg.id;
  document.getElementById('modalBuyPkgName').innerText = pkg.name;
  document.getElementById('modalBuyPkgSpecs').innerText = `RAM: ${pkg.ram} | CPU: ${pkg.cpu} | Disk: ${pkg.disk}`;
  document.getElementById('buyRawPrice').innerText = formatRupiah(pkg.price);
  document.getElementById('buyFinalPrice').innerText = formatRupiah(pkg.price);
  document.getElementById('buyDiscountRow').classList.add('hidden');
  document.getElementById('buyVoucherInput').value = '';
  document.getElementById('buyVoucherMsg').classList.add('hidden');

  openModal('modalCheckout');
}

async function applyBuyVoucher() {
  const code = (document.getElementById('buyVoucherInput')?.value || '').trim();
  const msgElem = document.getElementById('buyVoucherMsg');
  if (!selectedPackageForBuy || !code) {
    showToast('Masukkan kode voucher!', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/voucher/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, amount: selectedPackageForBuy.price })
    });
    const data = await res.json();

    if (data.success && data.voucher) {
      appliedBuyVoucherData = data.voucher;
      msgElem.className = 'text-[11px] mt-1 text-emerald-400 font-semibold block';
      msgElem.innerText = `✓ ${data.message}`;

      document.getElementById('buyDiscountRow').classList.remove('hidden');
      document.getElementById('buyDiscountRow').classList.add('flex');
      document.getElementById('buyDiscountVal').innerText = `- ${formatRupiah(data.voucher.discountAmount)}`;
      document.getElementById('buyFinalPrice').innerText = formatRupiah(data.voucher.finalAmount);
      showToast(data.message, 'success');
    } else {
      appliedBuyVoucherData = null;
      msgElem.className = 'text-[11px] mt-1 text-rose-400 font-semibold block';
      msgElem.innerText = `✗ ${data.message}`;
      document.getElementById('buyDiscountRow').classList.add('hidden');
      document.getElementById('buyFinalPrice').innerText = formatRupiah(selectedPackageForBuy.price);
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Gagal cek voucher promo.', 'error');
  }
}

async function handleConfirmBuyServer(e) {
  e.preventDefault();
  const packageId = document.getElementById('buyPackageId').value;
  const serverName = document.getElementById('buyServerName').value.trim();
  const eggType = document.getElementById('buyEggType').value;
  const voucherCode = appliedBuyVoucherData ? appliedBuyVoucherData.code : (document.getElementById('buyVoucherInput')?.value || '').trim();

  const btn = document.getElementById('btnConfirmBuy');
  btn.disabled = true;
  btn.innerHTML = '<i class="ri-loader-4-line animate-spin"></i> Sedang Membuat Server Panel...';

  try {
    const res = await fetch('/api/orders/create-ptero', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ packageId, serverName, eggType, voucherCode })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeModal('modalCheckout');
      await refreshUserProfile();
      switchTab('my-servers');
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Koneksi server bermasalah.', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = 'Konfirmasi & Aktifkan Server';
  }
}

// Load User Servers
async function loadUserServers() {
  if (!currentUser) return;
  const container = document.getElementById('userServersContainer');
  try {
    const res = await fetch('/api/orders/my-servers', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    if (data.success) {
      if (!data.orders || data.orders.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 text-xs py-10 col-span-2">Belum ada server yang aktif. Beli paket server di menu Katalog Panel!</p>`;
        return;
      }

      container.innerHTML = data.orders.map(s => {
        return `
          <div class="glass-card rounded-2xl p-5 border border-cyan-500/20 space-y-3 relative overflow-hidden">
            <div class="flex justify-between items-start">
              <div>
                <span class="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">${s.id}</span>
                <h3 class="text-sm font-black text-white mt-1.5">${s.serverName}</h3>
                <p class="text-[11px] text-gray-400">${s.packageName} • ${s.eggType}</p>
              </div>
              <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold ${s.status === 'Active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'}">
                ${s.status}
              </span>
            </div>

            <!-- Credentials Box -->
            <div class="p-3 rounded-xl bg-gray-900 border border-gray-800 space-y-1.5 text-xs font-mono">
              <div class="flex justify-between items-center text-gray-400">
                <span>Username Panel:</span>
                <span class="text-white font-bold">${s.pteroUsername}</span>
              </div>
              <div class="flex justify-between items-center text-gray-400">
                <span>Password:</span>
                <span class="text-cyan-400 font-bold">${s.pteroPassword}</span>
              </div>
              <div class="flex justify-between items-center text-gray-400 text-[10px]">
                <span>Expired:</span>
                <span class="text-gray-300">${new Date(s.expiredAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>

            <a href="${s.pteroLoginUrl}" target="_blank" class="w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 transition">
              <i class="ri-external-link-line"></i> Buka & Login Panel
            </a>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error load user servers:', err);
  }
}

// Top Up Saldo
function populatePaymentSelect() {
  const sel = document.getElementById('topupPaymentSelect');
  if (!sel) return;
  sel.innerHTML = currentPayments.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  handlePaymentChange();
}

function handlePaymentChange() {
  const selId = document.getElementById('topupPaymentSelect').value;
  const p = currentPayments.find(item => item.id === selId);
  const qrContainer = document.getElementById('payQrContainer');
  const qrImg = document.getElementById('payQrImg');

  if (!p) return;
  document.getElementById('payAccName').innerText = `Atas Nama: ${p.accountName}`;
  document.getElementById('payAccNumber').innerText = `Nomor/Akun: ${p.accountNumber}`;
  document.getElementById('payInstructionText').innerText = p.instruction || '';

  if (p.qrImage) {
    qrContainer.classList.remove('hidden');
    qrImg.src = p.qrImage;
  } else {
    qrContainer.classList.add('hidden');
  }
}

async function handleRequestTopup(e) {
  e.preventDefault();
  if (!currentUser) {
    showToast('Silakan login terlebih dahulu!', 'warning');
    openModal('modalLogin');
    return;
  }

  const paymentId = document.getElementById('topupPaymentSelect').value;
  const amount = document.getElementById('topupAmount').value;
  const notes = document.getElementById('topupNotes').value;

  try {
    const res = await fetch('/api/topup/request', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ paymentId, amount, notes })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      document.getElementById('topupForm').reset();
      handlePaymentChange();
      loadUserTopups();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Gagal membuat tiket deposit.', 'error');
  }
}

async function loadUserTopups() {
  if (!currentUser) return;
  const container = document.getElementById('topupListContainer');
  try {
    const res = await fetch('/api/topup/history', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    if (data.success) {
      if (!data.topups || data.topups.length === 0) {
        container.innerHTML = `<p class="text-center text-gray-500 text-xs py-10">Belum ada riwayat tiket deposit.</p>`;
        return;
      }

      container.innerHTML = data.topups.map(t => {
        return `
          <div class="p-3.5 rounded-xl bg-gray-900 border border-gray-800 text-xs space-y-2">
            <div class="flex justify-between items-center">
              <span class="font-mono font-bold text-cyan-300">${t.id}</span>
              <span class="px-2 py-0.5 rounded-full font-bold text-[10px] ${t.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : (t.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}">${t.status}</span>
            </div>
            <div class="flex justify-between text-gray-300">
              <span>Metode: ${t.paymentMethod}</span>
              <span class="font-bold text-white">Nominal: ${formatRupiah(t.amount)}</span>
            </div>
            <div class="flex justify-between items-center bg-gray-950 p-2 rounded-lg border border-gray-800">
              <span class="text-gray-400 text-[11px]">Total Ditransfer (Kode Unik):</span>
              <span class="font-mono font-black text-emerald-400 text-sm">${formatRupiah(t.totalPay)}</span>
            </div>
          </div>
        `;
      }).join('');
    }
  } catch (err) {
    console.error('Error load topup:', err);
  }
}

// ----------------- ADMIN LOGIC -----------------

function switchAdminSubTab(subTabId) {
  document.querySelectorAll('.admin-subcontent').forEach(el => el.classList.add('hidden'));
  ['adm-topups', 'adm-servers', 'adm-packages', 'adm-vouchers', 'adm-settings', 'adm-users'].forEach(id => {
    const btn = document.getElementById(`admSubBtn-${id}`);
    if (btn) {
      btn.classList.remove('bg-gray-800', 'text-white', 'border-t-2', 'border-cyan-500');
      btn.classList.add('text-gray-400');
    }
  });

  const activeTab = document.getElementById(`admSubTab-${subTabId}`);
  const activeBtn = document.getElementById(`admSubBtn-${subTabId}`);
  if (activeTab) activeTab.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-gray-800', 'text-white', 'border-t-2', 'border-cyan-500');
    activeBtn.classList.remove('text-gray-400');
  }
}

async function loadAdminData() {
  if (!currentUser || currentUser.role !== 'admin') return;

  try {
    const res = await fetch('/api/admin/all-data', {
      headers: { 'x-user-id': currentUser.id }
    });
    const data = await res.json();
    if (data.success) {
      document.getElementById('admStatUsers').innerText = data.stats.totalUsers;
      document.getElementById('admStatServers').innerText = data.stats.totalServers;
      document.getElementById('admStatDeposit').innerText = formatRupiah(data.stats.totalDeposit);
      document.getElementById('admStatPendingDep').innerText = data.stats.pendingDeposit;

      // Settings Inputs
      if (data.settings) {
        document.getElementById('settingSiteName').value = data.settings.siteName || '';
        document.getElementById('settingSiteTagline').value = data.settings.siteTagline || '';
        document.getElementById('settingPteroDomain').value = data.settings.pteroDomain || '';
        document.getElementById('settingPteroApiKey').value = data.settings.pteroApiKey || '';
        document.getElementById('settingContactWa').value = data.settings.contactWa || '';
        document.getElementById('settingAnnouncement').value = data.settings.announcementText || '';
      }

      renderAdminTopups(data.topups || []);
      renderAdminServers(data.orders || []);
      renderAdminPackages(data.packages || []);
      renderAdminVouchers(data.vouchers || []);
      renderAdminUsers(data.users || []);
    }
  } catch (err) {
    console.error('Error load admin data:', err);
  }
}

function renderAdminTopups(topups) {
  const tbody = document.getElementById('admTopupTableBody');
  if (!tbody) return;
  if (topups.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-500">Tidak ada tiket deposit.</td></tr>`;
    return;
  }

  tbody.innerHTML = topups.map(t => {
    return `
      <tr class="hover:bg-gray-900/40 transition">
        <td class="py-2.5 px-3 font-mono font-bold text-cyan-300 text-[11px]">${t.id}</td>
        <td class="py-2.5 px-3 font-bold text-white">${t.username}</td>
        <td class="py-2.5 px-3 text-gray-300">${t.paymentMethod}</td>
        <td class="py-2.5 px-3 font-mono font-bold text-emerald-400">${formatRupiah(t.totalPay)}</td>
        <td class="py-2.5 px-3">
          ${t.proofUrl ? `<a href="${t.proofUrl}" target="_blank" class="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold underline">Lihat Bukti</a>` : '<span class="text-gray-500 text-[10px]">-</span>'}
        </td>
        <td class="py-2.5 px-3 text-center">
          <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${t.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-400' : (t.status === 'Rejected' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400')}">
            ${t.status}
          </span>
        </td>
        <td class="py-2.5 px-3 text-center">
          ${t.status === 'Pending' ? `
            <div class="flex justify-center space-x-1.5">
              <button onclick="adminActionTopup('${t.id}', 'approve')" class="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-black rounded text-[10px] font-bold">Approve</button>
              <button onclick="adminActionTopup('${t.id}', 'reject')" class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold">Reject</button>
            </div>
          ` : `<span class="text-gray-500 text-[10px]">Selesai</span>`}
        </td>
      </tr>
    `;
  }).join('');
}

async function adminActionTopup(topupId, action) {
  if (!confirm(`Yakin ingin ${action.toUpperCase()} deposit tiket ${topupId}?`)) return;
  try {
    const res = await fetch('/api/admin/topup/action', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ topupId, action })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminData();
    }
  } catch (err) {
    showToast('Gagal proses deposit.', 'error');
  }
}

function renderAdminServers(servers) {
  const tbody = document.getElementById('admServersTableBody');
  if (!tbody) return;
  if (servers.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-6 text-center text-gray-500">Belum ada server terbeli.</td></tr>`;
    return;
  }

  tbody.innerHTML = servers.map(s => {
    return `
      <tr class="hover:bg-gray-900/40 transition">
        <td class="py-2 px-3 font-mono text-[11px] font-bold text-cyan-300">${s.id}</td>
        <td class="py-2 px-3 font-bold text-gray-200">${s.username}</td>
        <td class="py-2 px-3 text-white font-semibold">${s.packageName}</td>
        <td class="py-2 px-3 font-mono text-cyan-300">${s.pteroUsername}</td>
        <td class="py-2 px-3 font-mono text-gray-300">${s.pteroPassword}</td>
        <td class="py-2 px-3"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">${s.status}</span></td>
        <td class="py-2 px-3 text-center">
          <select onchange="adminUpdateServerStatus('${s.id}', this.value)" class="bg-gray-900 border border-gray-700 rounded px-2 py-1 text-[10px] text-white">
            <option value="Active" ${s.status === 'Active' ? 'selected' : ''}>Active</option>
            <option value="Suspended" ${s.status === 'Suspended' ? 'selected' : ''}>Suspended</option>
            <option value="Expired" ${s.status === 'Expired' ? 'selected' : ''}>Expired</option>
          </select>
        </td>
      </tr>
    `;
  }).join('');
}

async function adminUpdateServerStatus(orderId, status) {
  try {
    const res = await fetch('/api/admin/orders/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ orderId, status })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminData();
    }
  } catch (err) {
    showToast('Gagal update server.', 'error');
  }
}

function renderAdminPackages(packages) {
  const tbody = document.getElementById('admPackagesTableBody');
  if (!tbody) return;

  tbody.innerHTML = packages.map(p => {
    return `
      <tr class="hover:bg-gray-900/40 transition">
        <td class="py-2 px-3 font-bold text-white">${p.name}</td>
        <td class="py-2 px-3 text-cyan-300 font-mono">${p.ram}</td>
        <td class="py-2 px-3 text-blue-300 font-mono">${p.cpu}</td>
        <td class="py-2 px-3 text-teal-300 font-mono">${p.disk}</td>
        <td class="py-2 px-3 font-bold text-emerald-400 font-mono">${formatRupiah(p.price)}</td>
        <td class="py-2 px-3 text-center">
          <button onclick="deleteAdminPackage('${p.id}')" class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px]">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

function openAddPackageModal() {
  document.getElementById('adminPkgId').value = '';
  document.getElementById('adminPkgName').value = '';
  document.getElementById('adminPkgRam').value = '2048 MB (2GB)';
  document.getElementById('adminPkgCpu').value = '150% CPU';
  document.getElementById('adminPkgDisk').value = '4096 MB (4GB)';
  document.getElementById('adminPkgPrice').value = '6000';
  document.getElementById('adminPkgDesc').value = '';
  openModal('modalAdminPackage');
}

async function handleSaveAdminPackage(e) {
  e.preventDefault();
  const id = document.getElementById('adminPkgId').value;
  const name = document.getElementById('adminPkgName').value.trim();
  const ram = document.getElementById('adminPkgRam').value.trim();
  const cpu = document.getElementById('adminPkgCpu').value.trim();
  const disk = document.getElementById('adminPkgDisk').value.trim();
  const price = document.getElementById('adminPkgPrice').value;
  const isPopular = document.getElementById('adminPkgPopular').value === 'true';
  const description = document.getElementById('adminPkgDesc').value.trim();

  try {
    const res = await fetch('/api/admin/packages/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ id, name, ram, cpu, disk, price, isPopular, description })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      closeModal('modalAdminPackage');
      loadPublicInfo();
      loadAdminData();
    }
  } catch (err) {
    showToast('Gagal simpan paket.', 'error');
  }
}

async function deleteAdminPackage(id) {
  if (!confirm('Yakin ingin menghapus paket panel ini?')) return;
  try {
    const res = await fetch('/api/admin/packages/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ id })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadPublicInfo();
      loadAdminData();
    }
  } catch (err) {
    showToast('Gagal hapus paket.', 'error');
  }
}

function renderAdminVouchers(vouchers) {
  const tbody = document.getElementById('admVouchersTableBody');
  if (!tbody) return;

  tbody.innerHTML = vouchers.map(v => {
    return `
      <tr class="hover:bg-gray-900/40 transition">
        <td class="py-2 px-3 font-mono font-bold text-cyan-300">${v.code}</td>
        <td class="py-2 px-3 text-white font-bold">${v.type === 'percent' ? v.discount + '%' : formatRupiah(v.discount)}</td>
        <td class="py-2 px-3 text-gray-300">${formatRupiah(v.minOrder || 0)}</td>
        <td class="py-2 px-3 text-center text-gray-400 font-mono">${v.usedCount} / ${v.usageLimit || '∞'}</td>
        <td class="py-2 px-3 text-center"><span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400">Aktif</span></td>
        <td class="py-2 px-3 text-center">
          <button onclick="deleteAdminVoucher('${v.code}')" class="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px]">Hapus</button>
        </td>
      </tr>
    `;
  }).join('');
}

async function deleteAdminVoucher(code) {
  if (!confirm(`Hapus voucher ${code}?`)) return;
  try {
    const res = await fetch('/api/admin/vouchers/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
      body: JSON.stringify({ code })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminData();
    }
  } catch (err) {
    showToast('Gagal hapus voucher.', 'error');
  }
}

async function handleSaveSettings(e) {
  e.preventDefault();
  const siteName = document.getElementById('settingSiteName').value.trim();
  const siteTagline = document.getElementById('settingSiteTagline').value.trim();
  const pteroDomain = document.getElementById('settingPteroDomain').value.trim();
  const pteroApiKey = document.getElementById('settingPteroApiKey').value.trim();
  const contactWa = document.getElementById('settingContactWa').value.trim();
  const announcementText = document.getElementById('settingAnnouncement').value.trim();

  try {
    const res = await fetch('/api/admin/settings/save', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id
      },
      body: JSON.stringify({ siteName, siteTagline, pteroDomain, pteroApiKey, contactWa, announcementText })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadPublicInfo();
    }
  } catch (err) {
    showToast('Gagal menyimpan pengaturan.', 'error');
  }
}

function renderAdminUsers(users) {
  const tbody = document.getElementById('admUsersTableBody');
  if (!tbody) return;

  tbody.innerHTML = users.map(u => {
    return `
      <tr class="hover:bg-gray-900/40 transition">
        <td class="py-2.5 px-3 font-bold text-white">${u.username}</td>
        <td class="py-2.5 px-3 text-gray-300">${u.fullName || '-'}</td>
        <td class="py-2.5 px-3 font-bold ${u.role === 'admin' ? 'text-amber-400' : 'text-gray-400'} uppercase text-[10px]">${u.role}</td>
        <td class="py-2.5 px-3 font-bold text-emerald-400 font-mono">${formatRupiah(u.balance || 0)}</td>
        <td class="py-2.5 px-3 text-center">
          <button onclick="promptSetBalance('${u.id}', '${u.username}', ${u.balance || 0})" class="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black rounded text-[10px] font-bold transition">
            Set Saldo
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function promptSetBalance(userId, username, currentBal) {
  const newBal = prompt(`Masukkan jumlah saldo baru untuk @${username}:`, currentBal);
  if (newBal === null || isNaN(newBal)) return;

  try {
    const res = await fetch('/api/admin/users/set-balance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': currentUser.id },
      body: JSON.stringify({ targetUserId: userId, newBalance: newBal })
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message, 'success');
      loadAdminData();
    }
  } catch (err) {
    showToast('Gagal ubah saldo user.', 'error');
  }
}

// ----------------- LIVE CHAT SUPPORT -----------------

function toggleChatBox() {
  const box = document.getElementById('chatBoxWindow');
  const icon = document.getElementById('chatBtnIcon');
  const badge = document.getElementById('chatUnreadBadge');

  isChatOpen = !isChatOpen;
  if (isChatOpen) {
    box.classList.remove('hidden');
    icon.className = 'ri-close-line text-2xl';
    badge.classList.add('hidden');
    fetchChatMessages();
  } else {
    box.classList.add('hidden');
    icon.className = 'ri-message-3-fill text-2xl';
  }
}

async function fetchChatMessages() {
  try {
    const res = await fetch('/api/chat/messages');
    const data = await res.json();
    if (data.success) {
      const chats = data.chats || [];
      renderChatMessages(chats);

      if (!isChatOpen && chats.length > lastChatCount && lastChatCount > 0) {
        const badge = document.getElementById('chatUnreadBadge');
        if (badge) {
          badge.innerText = chats.length - lastChatCount;
          badge.classList.remove('hidden');
        }
      }
      lastChatCount = chats.length;
    }
  } catch (e) {}
}

function renderChatMessages(chats) {
  const container = document.getElementById('chatMessagesContainer');
  if (!container) return;

  const myId = currentUser ? currentUser.id : getGuestId();

  container.innerHTML = chats.map(c => {
    const isMe = (c.senderId === myId);
    const isAdmin = c.role === 'admin';

    return `
      <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'}">
        <div class="flex items-center gap-1 text-[10px] text-gray-400 mb-0.5">
          <span class="font-bold ${isAdmin ? 'text-cyan-400' : 'text-gray-300'}">${c.senderName} ${isAdmin ? '🛡️ (Admin)' : ''}</span>
          <span>• ${new Date(c.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div class="max-w-[80%] px-3 py-2 rounded-2xl text-xs break-words shadow-sm ${
          isMe 
            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-black font-semibold rounded-tr-none' 
            : (isAdmin ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-200 rounded-tl-none' : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700')
        }">
          ${c.message}
        </div>
      </div>
    `;
  }).join('');

  container.scrollTop = container.scrollHeight;
}

function getGuestId() {
  let gid = localStorage.getItem('ptero_guest_id');
  if (!gid) {
    gid = 'gst_' + Math.floor(10000 + Math.random() * 90000);
    localStorage.setItem('ptero_guest_id', gid);
  }
  return gid;
}

async function handleSendLiveChat(e) {
  e.preventDefault();
  const input = document.getElementById('chatMessageInput');
  const msg = input.value.trim();
  if (!msg) return;

  const senderId = currentUser ? currentUser.id : getGuestId();
  const guestName = document.getElementById('guestChatNameInput')?.value.trim();
  const senderName = currentUser ? (currentUser.fullName || currentUser.username) : (guestName || 'Pengunjung');
  const role = currentUser ? (currentUser.role || 'member') : 'guest';

  input.value = '';

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senderId, senderName, message: msg, role })
    });
    const data = await res.json();
    if (data.success) fetchChatMessages();
  } catch (err) {
    showToast('Gagal kirim pesan.', 'error');
  }
}

// ----------------- AUTH HANDLERS -----------------

async function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value.trim();

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (data.success) {
      currentUser = data.user;
      localStorage.setItem('ptero_user', JSON.stringify(currentUser));
      updateAuthUI();
      closeModal('modalLogin');
      showToast(data.message, 'success');
      loadUserServers();
      loadUserTopups();
      if (currentUser.role === 'admin') loadAdminData();
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Koneksi login bermasalah.', 'error');
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const fullName = document.getElementById('regFullName').value.trim();
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value.trim();

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName, username, password })
    });
    const data = await res.json();

    if (data.success) {
      showToast(data.message, 'success');
      closeModal('modalRegister');
      openModal('modalLogin');
      document.getElementById('loginUsername').value = username;
    } else {
      showToast(data.message, 'error');
    }
  } catch (err) {
    showToast('Pendaftaran gagal.', 'error');
  }
}

function logout() {
  localStorage.removeItem('ptero_user');
  currentUser = null;
  updateAuthUI();
  switchTab('store');
  showToast('Anda telah berhasil logout.', 'info');
}

// ----------------- UTILS & MODALS -----------------

function openModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.remove('hidden');
}

function closeModal(id) {
  const m = document.getElementById(id);
  if (m) m.classList.add('hidden');
}

function formatRupiah(number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(number);
}

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const msg = document.getElementById('toastMessage');

  msg.innerText = message;
  if (type === 'success') icon.innerHTML = '<i class="ri-checkbox-circle-fill text-emerald-400"></i>';
  else if (type === 'error') icon.innerHTML = '<i class="ri-error-warning-fill text-rose-500"></i>';
  else if (type === 'warning') icon.innerHTML = '<i class="ri-alert-fill text-amber-400"></i>';
  else icon.innerHTML = '<i class="ri-information-fill text-cyan-400"></i>';

  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3500);
}
