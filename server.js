const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, 'database.json');
const PAKASIR_BASE = 'https://app.pakasir.com/api';
const FLOWIX_BASE = 'https://flowix.web.id/api/v1';

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Default Initial Packages Panel Pterodactyl
const INITIAL_PACKAGES = [
  {
    id: 'ptero-1gb',
    name: 'Panel Pterodactyl 1GB',
    ram: '1024 MB (1GB)',
    cpu: '100% CPU',
    disk: '2048 MB (2GB)',
    price: 3000,
    duration: '30 Hari',
    description: 'Cocok untuk Bot WhatsApp NodeJS, Bot Discord ringan, atau script uptime mini.',
    features: ['Node.js & Python Support', 'Anti-DDoS Protection', 'Uptime 99.9%', 'Full Root Access File'],
    isPopular: false
  },
  {
    id: 'ptero-2gb',
    name: 'Panel Pterodactyl 2GB',
    ram: '2048 MB (2GB)',
    cpu: '150% CPU',
    disk: '4096 MB (4GB)',
    price: 6000,
    duration: '30 Hari',
    description: 'Paling laris! Sempurna untuk Bot WA Multi-Device, Web API, atau Minecraft Pocket Edition.',
    features: ['Auto Backup Daily', 'High Performance CPU', 'Subdomain Gratis', 'Garansi 30 Hari'],
    isPopular: true
  },
  {
    id: 'ptero-4gb',
    name: 'Panel Pterodactyl 4GB',
    ram: '4096 MB (4GB)',
    cpu: '200% CPU',
    disk: '8192 MB (8GB)',
    price: 12000,
    duration: '30 Hari',
    description: 'Performa tinggi untuk Server Game Minecraft Bedrock/Java, Bot WA traffic ramai, atau Web App.',
    features: ['Multi Egg Support (Node, Py, Java, Go)', 'High Priority Bandwidth', 'Dedicated CPU Core', 'Instant Activation'],
    isPopular: false
  },
  {
    id: 'ptero-8gb',
    name: 'Panel Pterodactyl 8GB',
    ram: '8192 MB (8GB)',
    cpu: '300% CPU',
    disk: '15360 MB (15GB)',
    price: 24000,
    duration: '30 Hari',
    description: 'Spesifikasi Monster untuk Server Minecraft Community, Multi-Bot Server, dan Hosting Database.',
    features: ['Extreme Speed NVMe SSD', 'Unlimited Traffic / Port', 'Priority VIP Support', 'Refill / Re-install 1-Click'],
    isPopular: false
  },
  {
    id: 'ptero-unlimited',
    name: 'Panel Pterodactyl UNLIMITED',
    ram: 'Unlimited RAM',
    cpu: 'Unlimited CPU',
    disk: 'Unlimited NVMe SSD',
    price: 45000,
    duration: '30 Hari',
    description: 'Paket Ultimate tanpa batas kuota RAM, CPU & Disk untuk bisnis hosting atau proyek besar Anda.',
    features: ['No Resource Throttling', 'Ultra Low Latency Node', 'Akses Admin Reseller (Opsional)', 'Full Garansi 30 Hari'],
    isPopular: true
  }
];

const INITIAL_PAYMENTS = [
  {
    id: 'qris',
    name: 'QRIS All Payment (Gopay / DANA / OVO / Shopee / BCA)',
    accountNumber: 'SCAN QR OTOMATIS',
    accountName: 'PTERO HOST DIGITAL',
    qrImage: 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=00020101021126570011ID.DANA.WWW01189360091800000000005204581253033605802ID5916PTEROHOST_DIG6007JAKARTA6304D12A',
    instruction: 'Scan QRIS di atas melalui M-Banking atau E-Wallet apapun. Pastikan nominal transfer sesuai dengan total tiket deposit.'
  },
  {
    id: 'dana',
    name: 'DANA E-Wallet',
    accountNumber: '085812345678',
    accountName: 'Admin Ptero Official',
    qrImage: null,
    instruction: 'Transfer ke nomor DANA di atas. Simpan bukti transfer untuk upload konfirmasi.'
  },
  {
    id: 'gopay',
    name: 'GoPay E-Wallet',
    accountNumber: '085812345678',
    accountName: 'Admin Ptero Official',
    qrImage: null,
    instruction: 'Kirim saldo GoPay ke nomor di atas. Cantumkan username kamu jika memungkinkan.'
  },
  {
    id: 'bca',
    name: 'Bank BCA',
    accountNumber: '8735019281',
    accountName: 'PT PTERO HOSTING INDO',
    qrImage: null,
    instruction: 'Transfer ke rekening BCA di atas lalu upload bukti struk transaksi.'
  }
];

function getDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      settings: {
        siteName: 'NUSA PTERO STORE',
        siteTagline: 'Penyedia Hosting & Server Panel Pterodactyl Termurah #1 di Indonesia',
        pteroDomain: process.env.PTERO_DOMAIN || 'https://panel.nanika.fahridev.my.id',
        pteroApiKey: process.env.PTERO_API_KEY || 'ptla_dummy_api_key',
        contactWa: '6285812345678',
        announcementText: '🚀 SELAMAT DATANG DI NUSA PTERO STORE! Gunakan Kode Promo: PTERONEW untuk diskon 30%! Server aktif instan 24/7 dan bergaransi penuh.',
        pakasirProject: process.env.PAKASIR_PROJECT || '',
        pakasirApiKey: process.env.PAKASIR_API_KEY || '',
        pakasirAutoActive: true,
        flowixApiKey: process.env.FLOWIX_API_KEY || 'sk-d2e1f23c-817d343e328c-a8fe474da8a3',
        flowixMerchantId: process.env.FLOWIX_MERCHANT_ID || '',
        flowixWebhookSecret: process.env.FLOWIX_WEBHOOK_SECRET || '',
        flowixAutoActive: true
      },
      users: [
        {
          id: 'usr_admin',
          username: process.env.ADMIN_USERNAME || 'admin',
          password: process.env.ADMIN_PASSWORD || 'admin123',
          fullName: 'Super Administrator',
          role: 'admin',
          balance: 10000000,
          createdAt: new Date().toISOString()
        },
        {
          id: 'usr_demo',
          username: 'demo_user',
          password: 'password123',
          fullName: 'Demo Member',
          role: 'member',
          balance: 50000,
          createdAt: new Date().toISOString()
        }
      ],
      packages: INITIAL_PACKAGES,
      payments: INITIAL_PAYMENTS,
      orders: [
        {
          id: 'PTR-8812',
          userId: 'usr_demo',
          username: 'demo_user',
          packageId: 'ptero-2gb',
          packageName: 'Panel Pterodactyl 2GB',
          eggType: 'NodeJS (Bot WA & Web API)',
          serverName: 'Bot WA Store V2',
          pteroUsername: 'demo_user_bot',
          pteroPassword: 'Password123#',
          pteroLoginUrl: 'https://panel.nanika.fahridev.my.id',
          price: 6000,
          discount: 0,
          status: 'Active',
          expiredAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
          createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
        }
      ],
      topups: [
        {
          id: 'DEP-7001',
          userId: 'usr_demo',
          username: 'demo_user',
          paymentMethod: 'QRIS All Payment',
          amount: 50000,
          uniqueCode: 154,
          totalPay: 50154,
          proofUrl: '',
          notes: 'Deposit awal member demo',
          status: 'Approved',
          createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
          approvedAt: new Date(Date.now() - 3600000 * 23).toISOString()
        }
      ],
      vouchers: [
        {
          code: 'PTERONEW',
          type: 'percent',
          discount: 30,
          maxDiscount: 10000,
          minOrder: 3000,
          usageLimit: 200,
          usedCount: 5,
          isActive: true
        },
        {
          code: 'HEMAT5K',
          type: 'fixed',
          discount: 5000,
          maxDiscount: 5000,
          minOrder: 10000,
          usageLimit: 50,
          usedCount: 0,
          isActive: true
        }
      ],
      chats: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  try {
    const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    return data;
  } catch (err) {
    return { users: [], packages: [], orders: [], topups: [], vouchers: [], chats: [], settings: {} };
  }
}

function saveDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// ----------------- API ENDPOINTS -----------------

// 1. Get Public Settings & Packages
app.get('/api/public/info', (req, res) => {
  const db = getDB();
  const safeSettings = { ...db.settings };
  // Hide API Key from public response for security, but expose if Gateway is configured
  const hasPakasir = !!(db.settings?.pakasirProject && db.settings?.pakasirApiKey);
  const hasFlowix = !!(db.settings?.flowixApiKey || process.env.FLOWIX_API_KEY);
  safeSettings.hasPakasir = hasPakasir;
  safeSettings.hasFlowix = hasFlowix;
  safeSettings.pakasirAutoActive = db.settings?.pakasirAutoActive !== false;
  safeSettings.flowixAutoActive = db.settings?.flowixAutoActive !== false;
  if (safeSettings.pakasirApiKey) {
    safeSettings.pakasirApiKey = '***';
  }
  if (safeSettings.flowixApiKey) {
    safeSettings.flowixApiKey = '***';
  }
  if (safeSettings.flowixWebhookSecret) {
    safeSettings.flowixWebhookSecret = '***';
  }
  if (safeSettings.pteroApiKey) {
    safeSettings.pteroApiKey = '***';
  }

  res.json({
    success: true,
    settings: safeSettings,
    packages: db.packages || INITIAL_PACKAGES,
    payments: db.payments || INITIAL_PAYMENTS
  });
});

// 2. Auth Register
app.post('/api/auth/register', (req, res) => {
  const { username, password, fullName, email } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username dan Password wajib diisi!' });
  }

  const db = getDB();
  const exists = db.users.find(u => u.username.toLowerCase() === username.trim().toLowerCase());
  if (exists) {
    return res.status(400).json({ success: false, message: 'Username sudah digunakan, silakan pilih yang lain!' });
  }

  const newUser = {
    id: 'usr_' + Date.now(),
    username: username.trim(),
    password: password.trim(),
    fullName: fullName ? fullName.trim() : username.trim(),
    email: email ? email.trim() : `${username.trim()}@pterouser.com`,
    role: 'member',
    balance: 0,
    createdAt: new Date().toISOString()
  };

  db.users.push(newUser);
  saveDB(db);

  const { password: _, ...safeUser } = newUser;
  return res.json({ success: true, message: 'Akun berhasil didaftarkan! Silakan login.', user: safeUser });
});

// 3. Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.username.toLowerCase() === (username || '').trim().toLowerCase() && u.password === (password || '').trim());

  if (!user) {
    return res.status(401).json({ success: false, message: 'Username atau Password salah!' });
  }

  const { password: _, ...safeUser } = user;
  return res.json({ success: true, message: `Selamat datang, ${user.fullName || user.username}!`, user: safeUser });
});

// 4. Sync User Profile & Saldo
app.get('/api/user/profile', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const { password: _, ...safeUser } = user;
  return res.json({ success: true, user: safeUser });
});

// 5. Cek Voucher Promo
app.post('/api/voucher/check', (req, res) => {
  const { code, amount } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Masukkan kode voucher!' });

  const db = getDB();
  const v = (db.vouchers || []).find(item => item.code.toUpperCase() === code.trim().toUpperCase() && item.isActive);

  if (!v) {
    return res.status(404).json({ success: false, message: 'Kode voucher tidak valid atau sudah kedaluwarsa!' });
  }

  if (v.usageLimit && v.usedCount >= v.usageLimit) {
    return res.status(400).json({ success: false, message: 'Kuota pemakaian voucher ini sudah habis!' });
  }

  const rawAmount = Number(amount) || 0;
  if (rawAmount < v.minOrder) {
    return res.status(400).json({ success: false, message: `Minimal pembelian untuk voucher ini adalah Rp ${v.minOrder.toLocaleString()}` });
  }

  let discount = 0;
  if (v.type === 'percent') {
    discount = Math.round((rawAmount * v.discount) / 100);
    if (v.maxDiscount && discount > v.maxDiscount) discount = v.maxDiscount;
  } else {
    discount = v.discount;
  }
  if (discount > rawAmount) discount = rawAmount;

  return res.json({
    success: true,
    message: `Voucher ${v.code} aktif! Hemat Rp ${discount.toLocaleString()}`,
    voucher: {
      code: v.code,
      discountAmount: discount,
      finalAmount: rawAmount - discount
    }
  });
});

// 6. Order Panel Pterodactyl Baru (Auto Account Generator)
app.post('/api/orders/create-ptero', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { packageId, serverName, eggType, voucherCode } = req.body;

  if (!userId) return res.status(401).json({ success: false, message: 'Silakan login terlebih dahulu!' });
  if (!packageId || !serverName) {
    return res.status(400).json({ success: false, message: 'Pilih paket dan masukkan nama server Anda!' });
  }

  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

  let pkg = (db.packages || []).find(p => p.id === packageId);
  
  // Dukungan untuk Paket Custom dari Slider Bar
  if (!pkg && packageId.startsWith('custom-')) {
    const parts = packageId.replace('custom-', '').split('-');
    const ramGb = parseInt(parts[0]) || 2;
    const cpuPct = parseInt(parts[1]) || 150;
    const diskGb = ramGb * 2;
    const calcPrice = Math.round((ramGb * 2000) + ((cpuPct / 100) * 1000) + ((diskGb / 2) * 500));

    pkg = {
      id: packageId,
      name: `Custom Panel ${ramGb}GB (${cpuPct}% CPU)`,
      ram: `${ramGb * 1024} MB (${ramGb}GB)`,
      cpu: `${cpuPct}% CPU`,
      disk: `${diskGb * 1024} MB (${diskGb}GB)`,
      price: calcPrice
    };
  }

  if (!pkg) return res.status(404).json({ success: false, message: 'Paket panel tidak ditemukan!' });

  const rawPrice = pkg.price;
  let finalPrice = rawPrice;
  let discountUsed = 0;
  let appliedVoucher = null;

  if (voucherCode) {
    const v = (db.vouchers || []).find(item => item.code.toUpperCase() === voucherCode.trim().toUpperCase() && item.isActive);
    if (v && (!v.usageLimit || v.usedCount < v.usageLimit) && rawPrice >= v.minOrder) {
      if (v.type === 'percent') {
        discountUsed = Math.round((rawPrice * v.discount) / 100);
        if (v.maxDiscount && discountUsed > v.maxDiscount) discountUsed = v.maxDiscount;
      } else {
        discountUsed = v.discount;
      }
      if (discountUsed > rawPrice) discountUsed = rawPrice;
      finalPrice = rawPrice - discountUsed;
      v.usedCount = (v.usedCount || 0) + 1;
      appliedVoucher = v.code;
    }
  }

  if (user.balance < finalPrice) {
    return res.status(400).json({
      success: false,
      message: `Saldo tidak mencukupi! Diperlukan Rp ${finalPrice.toLocaleString()}, saldo Anda Rp ${user.balance.toLocaleString()}. Silakan Top Up Saldo terlebih dahulu.`
    });
  }

  // Potong saldo
  user.balance -= finalPrice;

  // Generate otomatis Akun Pterodactyl User
  const randomStr = Math.random().toString(36).substring(2, 7);
  const pteroUsername = (user.username.replace(/[^a-zA-Z0-9]/g, '') + '_' + randomStr).toLowerCase();
  const pteroPassword = 'Ptero' + Math.floor(100000 + Math.random() * 900000) + '#';
  const pteroLoginUrl = db.settings.pteroDomain || 'https://panel.nanika.fahridev.my.id';

  const newOrder = {
    id: 'PTR-' + Math.floor(1000 + Math.random() * 9000),
    userId: user.id,
    username: user.username,
    packageId: pkg.id,
    packageName: pkg.name,
    ram: pkg.ram,
    cpu: pkg.cpu,
    disk: pkg.disk,
    eggType: eggType || 'NodeJS (Bot WA / Web)',
    serverName: serverName.trim(),
    pteroUsername: pteroUsername,
    pteroPassword: pteroPassword,
    pteroLoginUrl: pteroLoginUrl,
    price: finalPrice,
    rawPrice: rawPrice,
    discount: discountUsed,
    voucherCode: appliedVoucher,
    status: 'Active',
    expiredAt: new Date(Date.now() + 30 * 24 * 3600000).toISOString(),
    createdAt: new Date().toISOString()
  };

  db.orders.unshift(newOrder);
  saveDB(db);

  return res.json({
    success: true,
    message: '🎉 Server Panel Pterodactyl Anda berhasil dibuat dan aktif instan!',
    order: newOrder,
    newBalance: user.balance
  });
});

// 7. Get User Orders
app.get('/api/orders/my-servers', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const db = getDB();
  const userOrders = (db.orders || []).filter(o => o.userId === userId);
  return res.json({ success: true, orders: userOrders });
});

// 8. Create Topup Request (Manual & Pakasir Automatic)
app.post('/api/topup/request', async (req, res) => {
  const userId = req.headers['x-user-id'];
  const { paymentId, amount, notes, method = 'qris' } = req.body;

  if (!userId) return res.status(401).json({ success: false, message: 'Silakan login!' });
  const depAmount = parseInt(amount, 10);
  if (isNaN(depAmount) || depAmount < 75) {
    return res.status(400).json({ success: false, message: 'Minimal deposit adalah Rp 75!' });
  }

  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

  // 1.2 JIKA METODE PEMBAYARAN FLOWIX AUTO GATEWAY (flowix.web.id)
  if (paymentId === 'flowix' || paymentId === 'flowix-qris' || paymentId === 'flowix-va') {
    const flowixApiKey = db.settings?.flowixApiKey || process.env.FLOWIX_API_KEY || 'sk-d2e1f23c-817d343e328c-a8fe474da8a3';
    const flowixMerchantId = db.settings?.flowixMerchantId || process.env.FLOWIX_MERCHANT_ID || '';

    const payMethod = method || 'QRIS';
    const orderId = `DEP-FLX-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();

    try {
      // Flowix API Deposit
      const headers = {
        'Content-Type': 'application/json',
        'api_key': flowixApiKey
      };
      if (flowixMerchantId) {
        headers['merchant_id'] = flowixMerchantId;
      }

      const flxRes = await fetch(`${FLOWIX_BASE}/deposit`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          amount: depAmount,
          method_code: payMethod.toUpperCase(),
          fee_by_customer: true,
          api_key: flowixApiKey,
          merchant_id: flowixMerchantId
        })
      });

      const flxData = await flxRes.json().catch(() => null);

      if (!flxRes.ok || !flxData || !flxData.success) {
        console.error('Flowix deposit error:', flxData);
        return res.status(502).json({
          success: false,
          message: flxData?.message || 'Gagal membuat deposit di Flowix. Silakan pastikan API Key & Merchant ID Flowix benar di Admin Settings.',
          detail: flxData
        });
      }

      const deposit = flxData.data || {};
      const totalPayment = deposit.amount_total || deposit.amount_request || depAmount;
      const rawPaymentNumber = deposit.qr_string || deposit.pay_code || '';
      
      let cleanedPaymentNumber = rawPaymentNumber;
      const qrisTagIdx = cleanedPaymentNumber.indexOf('000201');
      if (qrisTagIdx > 0) {
        cleanedPaymentNumber = cleanedPaymentNumber.substring(qrisTagIdx);
      }

      let qrDataUrl = '';
      if (cleanedPaymentNumber) {
        try {
          qrDataUrl = await QRCode.toDataURL(cleanedPaymentNumber, {
            errorCorrectionLevel: 'M',
            margin: 3,
            width: 450,
            color: { dark: '#000000', light: '#ffffff' }
          });
        } catch (qrErr) {
          console.error('QR code generation error:', qrErr);
        }
      }

      const expiredAt = deposit.expired_at || new Date(Date.now() + 15 * 60000).toISOString();

      const newTopup = {
        id: orderId,
        reffId: deposit.reff_id || orderId,
        userId: user.id,
        username: user.username,
        paymentMethod: `Flowix (${payMethod.toUpperCase()})`,
        gateway: 'flowix',
        gatewayMethod: payMethod.toLowerCase(),
        amount: depAmount,
        totalPay: totalPayment,
        fee: deposit.fee || 0,
        paymentNumber: cleanedPaymentNumber,
        qrDataUrl: qrDataUrl || deposit.qr_image || '',
        payUrl: deposit.pay_url || '',
        expiredAt: expiredAt,
        proofUrl: '',
        notes: notes || 'Otomatis via Flowix.web.id Payment Gateway',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      db.topups.unshift(newTopup);
      saveDB(db);

      return res.json({
        success: true,
        message: 'Pembayaran Flowix otomatis berhasil dibuat! Silakan bayar sebelum kedaluwarsa.',
        topup: newTopup,
        isAutoGateway: true
      });
    } catch (err) {
      console.error('Flowix fetch error:', err);
      return res.status(500).json({ success: false, message: 'Terjadi gangguan jaringan saat menghubungi gateway Flowix.' });
    }
  }
  if (paymentId === 'pakasir' || paymentId === 'pakasir-qris' || paymentId === 'pakasir-va') {
    const project = db.settings?.pakasirProject || process.env.PAKASIR_PROJECT;
    const apiKey = db.settings?.pakasirApiKey || process.env.PAKASIR_API_KEY;

    if (!project || !apiKey) {
      return res.status(400).json({
        success: false,
        message: 'Payment Gateway Pakasir belum dikonfigurasi oleh Admin. Silakan gunakan metode transfer manual atau hubungi admin.'
      });
    }

    const payMethod = method === 'bni_va' || method === 'bri_va' ? method : 'qris';
    const orderId = `DEP-PKS-${Date.now()}-${crypto.randomBytes(2).toString('hex')}`.toUpperCase();

    try {
      const pksRes = await fetch(`${PAKASIR_BASE}/transactioncreate/${payMethod}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project: project,
          api_key: apiKey,
          order_id: orderId,
          amount: depAmount
        })
      });

      const pksData = await pksRes.json();

      if (!pksRes.ok || !pksData.payment) {
        console.error('Pakasir transactioncreate error:', pksData);
        return res.status(502).json({
          success: false,
          message: pksData.message || pksData.error || 'Gagal membuat pembayaran via Pakasir',
          detail: pksData
        });
      }

      const paymentUrl = `https://app.pakasir.com/pay/${project}/${depAmount}?order_id=${orderId}`;
      const totalPayment = pksData.payment.total_payment || depAmount;
      const rawPaymentNumber = pksData.payment.payment_number || '';
      
      // Bersihkan string QRIS jika ada prefix sandbox agar memenuhi spesifikasi EMVCo QRIS resmi
      let cleanedPaymentNumber = rawPaymentNumber;
      const qrisTagIdx = cleanedPaymentNumber.indexOf('000201');
      if (qrisTagIdx > 0) {
        cleanedPaymentNumber = cleanedPaymentNumber.substring(qrisTagIdx);
      }

      // Generate Data URL PNG beresolusi tinggi (crisp & standar EMVCo QRIS)
      let qrDataUrl = '';
      if (payMethod === 'qris' && cleanedPaymentNumber) {
        try {
          qrDataUrl = await QRCode.toDataURL(cleanedPaymentNumber, {
            errorCorrectionLevel: 'M',
            margin: 3,
            width: 450,
            color: {
              dark: '#000000',
              light: '#ffffff'
            }
          });
        } catch (qrErr) {
          console.error('QR code generation error:', qrErr);
        }
      }

      const expiredAt = pksData.payment.expired_at || new Date(Date.now() + 30 * 60000).toISOString();

      const newTopup = {
        id: orderId,
        userId: user.id,
        username: user.username,
        paymentMethod: `Pakasir (${payMethod.toUpperCase()})`,
        gateway: 'pakasir',
        gatewayMethod: payMethod,
        amount: depAmount,
        totalPay: totalPayment,
        paymentNumber: cleanedPaymentNumber,
        qrDataUrl: qrDataUrl,
        paymentUrl: paymentUrl,
        expiredAt: expiredAt,
        proofUrl: '',
        notes: notes || 'Otomatis via Pakasir Payment Gateway',
        status: 'Pending',
        createdAt: new Date().toISOString()
      };

      db.topups.unshift(newTopup);
      saveDB(db);

      return res.json({
        success: true,
        message: 'Pembayaran Pakasir otomatis berhasil dibuat! Silakan scan QRIS atau bayar sebelum kedaluwarsa.',
        topup: newTopup,
        isAutoGateway: true
      });
    } catch (err) {
      console.error('Pakasir fetch error:', err);
      return res.status(500).json({ success: false, message: 'Terjadi gangguan jaringan saat menghubungi gateway Pakasir.' });
    }
  }

  // 2. METODE TRANSFER MANUAL (QRIS, DANA, GoPay, Bank BCA)
  const pay = (db.payments || []).find(p => p.id === paymentId) || { name: 'QRIS All Payment' };
  const uniqueCode = Math.floor(10 + Math.random() * 890);
  const totalPay = depAmount + uniqueCode;

  const newTopup = {
    id: 'DEP-' + Math.floor(10000 + Math.random() * 90000),
    userId: user.id,
    username: user.username,
    paymentMethod: pay.name,
    gateway: 'manual',
    amount: depAmount,
    uniqueCode: uniqueCode,
    totalPay: totalPay,
    proofUrl: '',
    notes: notes || '',
    status: 'Pending',
    createdAt: new Date().toISOString()
  };

  db.topups.unshift(newTopup);
  saveDB(db);

  return res.json({
    success: true,
    message: 'Tiket deposit berhasil dibuat! Silakan transfer sesuai total bayar.',
    topup: newTopup,
    isAutoGateway: false
  });
});

// 8.1.2 Cek Status Pembayaran Flowix (Polling / Manual Check)
app.get('/api/topup/check-flowix/:topupId', async (req, res) => {
  const { topupId } = req.params;
  const db = getDB();
  const item = (db.topups || []).find(t => t.id === topupId || t.reffId === topupId);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Data deposit tidak ditemukan.' });
  }

  if (item.status === 'Approved') {
    return res.json({ success: true, status: 'Approved', message: 'Pembayaran sudah lunas dan saldo sudah masuk!' });
  }

  const flowixApiKey = db.settings?.flowixApiKey || process.env.FLOWIX_API_KEY || 'sk-d2e1f23c-817d343e328c-a8fe474da8a3';
  const flowixMerchantId = db.settings?.flowixMerchantId || process.env.FLOWIX_MERCHANT_ID || '';
  const reffId = item.reffId || item.id;

  try {
    const headers = {
      'api_key': flowixApiKey
    };
    if (flowixMerchantId) headers['merchant_id'] = flowixMerchantId;

    const response = await fetch(`${FLOWIX_BASE}/deposit/${encodeURIComponent(reffId)}`, {
      headers: headers
    });
    const flxData = await response.json().catch(() => null);

    if (flxData && flxData.success && flxData.data) {
      const deposit = flxData.data;
      const status = String(deposit.status || '').toLowerCase();

      if (status === 'success' || status === 'paid') {
        item.status = 'Approved';
        item.approvedAt = new Date().toISOString();
        const user = db.users.find(u => u.id === item.userId);
        if (user) {
          user.balance += item.amount;
        }
        saveDB(db);

        return res.json({
          success: true,
          status: 'Approved',
          message: '🎉 Pembayaran Flowix terverifikasi lunas! Saldo berhasil masuk.',
          newBalance: user ? user.balance : undefined
        });
      } else if (status === 'failed' || status === 'expired' || status === 'canceled') {
        item.status = 'Rejected';
        item.rejectedAt = new Date().toISOString();
        saveDB(db);
        return res.json({ success: false, status: 'Rejected', message: 'Transaksi telah kedaluwarsa atau dibatalkan.' });
      }
    }

    return res.json({
      success: true,
      status: item.status,
      message: 'Menunggu pembayaran dari Anda...'
    });
  } catch (err) {
    console.error('Check Flowix error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memeriksa status ke Flowix.' });
  }
});

// 8.3 Webhook Flowix (flowix.web.id callback otomatis)
app.post(['/webhook/flowix', '/webhooks/flowix'], async (req, res) => {
  const db = getDB();
  const rawBody = req.body;
  const signature = req.header('X-Flowix-Signature');
  const secret = db.settings?.flowixWebhookSecret || process.env.FLOWIX_WEBHOOK_SECRET || 'whsec_bbe2272d8fe61101125903d59f7061c';

  // Validasi HMAC Signature jika ada header signature & secret terkonfigurasi
  if (secret && signature) {
    try {
      const incoming = String(signature).replace(/^sha256=/i, '');
      const expected = crypto.createHmac('sha256', secret).update(JSON.stringify(rawBody)).digest('hex');
      if (incoming !== expected) {
        console.warn('⚠️ Flowix webhook signature mismatch!');
      }
    } catch (sigErr) {
      console.error('Signature check error:', sigErr);
    }
  }

  const data = rawBody?.data || rawBody;
  const reffId = data?.reff_id || data?.order_id;
  const incomingStatus = String(data?.status || '').toLowerCase();

  if (!reffId) {
    return res.status(400).json({ error: 'Reff ID tidak ditemukan' });
  }

  const localTopup = (db.topups || []).find(t => t.id === reffId || t.reffId === reffId);
  if (!localTopup) {
    return res.status(404).json({ error: 'Transaksi tidak ditemukan' });
  }

  if (localTopup.status === 'Approved') {
    return res.status(200).json({ success: true, message: 'Already completed' });
  }

  if (incomingStatus === 'success' || incomingStatus === 'paid') {
    localTopup.status = 'Approved';
    localTopup.approvedAt = new Date().toISOString();
    const user = db.users.find(u => u.id === localTopup.userId);
    if (user) {
      user.balance += localTopup.amount;
      console.log(`✅ [FLOWIX AUTO] Saldo User ${user.username} bertambah Rp ${localTopup.amount.toLocaleString()} (Reff: ${reffId})`);
    }
    saveDB(db);
  } else if (incomingStatus === 'expired' || incomingStatus === 'canceled' || incomingStatus === 'failed') {
    localTopup.status = 'Rejected';
    localTopup.rejectedAt = new Date().toISOString();
    saveDB(db);
  }

  return res.status(200).json({ success: true });
});
app.get('/api/topup/check-pakasir/:topupId', async (req, res) => {
  const { topupId } = req.params;
  const db = getDB();
  const item = (db.topups || []).find(t => t.id === topupId);

  if (!item) {
    return res.status(404).json({ success: false, message: 'Data deposit tidak ditemukan.' });
  }

  if (item.status === 'Approved') {
    return res.json({ success: true, status: 'Approved', message: 'Pembayaran sudah lunas dan saldo sudah masuk!' });
  }

  const project = db.settings?.pakasirProject || process.env.PAKASIR_PROJECT;
  const apiKey = db.settings?.pakasirApiKey || process.env.PAKASIR_API_KEY;

  if (!project || !apiKey) {
    return res.status(400).json({ success: false, message: 'Gateway Pakasir belum disetup di admin.' });
  }

  try {
    const detailUrl = `${PAKASIR_BASE}/transactiondetail?project=${project}&order_id=${topupId}&amount=${item.amount}&api_key=${apiKey}`;
    const response = await fetch(detailUrl);
    const detail = await response.json();

    const verifiedStatus = detail.transaction?.status;

    if (verifiedStatus === 'completed') {
      item.status = 'Approved';
      item.approvedAt = new Date().toISOString();
      const user = db.users.find(u => u.id === item.userId);
      if (user) {
        user.balance += item.amount;
      }
      saveDB(db);

      return res.json({
        success: true,
        status: 'Approved',
        message: '🎉 Pembayaran terverifikasi lunas! Saldo berhasil ditambahkan otomatis.',
        newBalance: user ? user.balance : undefined
      });
    } else if (verifiedStatus === 'expired' || verifiedStatus === 'cancelled') {
      item.status = 'Rejected';
      item.rejectedAt = new Date().toISOString();
      saveDB(db);
      return res.json({ success: false, status: 'Rejected', message: 'Transaksi telah kedaluwarsa atau dibatalkan.' });
    }

    return res.json({
      success: true,
      status: item.status,
      message: 'Menunggu pembayaran dari Anda...'
    });
  } catch (err) {
    console.error('Check pakasir error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memeriksa status ke Pakasir.' });
  }
});

// 8.2 Webhook Pakasir (Otomatis instan callback dari Pakasir)
app.post('/webhook/pakasir', async (req, res) => {
  const { order_id, project, amount, status } = req.body;
  const db = getDB();

  const configuredProject = db.settings?.pakasirProject || process.env.PAKASIR_PROJECT;
  const apiKey = db.settings?.pakasirApiKey || process.env.PAKASIR_API_KEY;

  if (!configuredProject || project !== configuredProject) {
    return res.status(400).json({ error: 'Project slug tidak cocok!' });
  }

  const localTopup = (db.topups || []).find(t => t.id === order_id);
  if (!localTopup) {
    return res.status(404).json({ error: 'Transaksi tidak ditemukan di database lokal' });
  }

  // Idempoten: Jika sudah di-approve sebelumnya
  if (localTopup.status === 'Approved') {
    return res.status(200).json({ received: true, message: 'Already completed' });
  }

  try {
    // Verifikasi ganda langsung ke API Pakasir
    const detailUrl = `${PAKASIR_BASE}/transactiondetail?project=${configuredProject}&order_id=${order_id}&amount=${localTopup.amount}&api_key=${apiKey}`;
    const detailRes = await fetch(detailUrl);
    const detail = await detailRes.json();

    const verifiedStatus = detail.transaction?.status;
    if (!detailRes.ok || !verifiedStatus) {
      console.error('Webhook double-check fail:', detail);
      return res.status(502).json({ error: 'Gagal memverifikasi transaksi ke server Pakasir' });
    }

    if (verifiedStatus === 'completed') {
      localTopup.status = 'Approved';
      localTopup.approvedAt = new Date().toISOString();
      
      const user = db.users.find(u => u.id === localTopup.userId);
      if (user) {
        user.balance += localTopup.amount;
        console.log(`✅ [PAKASIR AUTO] Saldo User ${user.username} bertambah Rp ${localTopup.amount.toLocaleString()} (Order: ${order_id})`);
      }
      saveDB(db);
    } else if (verifiedStatus === 'expired' || verifiedStatus === 'cancelled') {
      localTopup.status = 'Rejected';
      localTopup.rejectedAt = new Date().toISOString();
      saveDB(db);
    }

    return res.status(200).json({ received: true, status: verifiedStatus });
  } catch (err) {
    console.error('Webhook Pakasir error:', err);
    return res.status(500).json({ error: 'Internal webhook error' });
  }
});

// 9. Upload Proof Topup
app.post('/api/topup/upload-proof', (req, res) => {
  const userId = req.headers['x-user-id'];
  const { topupId, proofUrl } = req.body;

  const db = getDB();
  const item = (db.topups || []).find(t => t.id === topupId && t.userId === userId);
  if (!item) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });

  item.proofUrl = proofUrl;
  saveDB(db);

  return res.json({ success: true, message: 'Bukti transfer berhasil disimpan!', topup: item });
});

// 10. User Topup History
app.get('/api/topup/history', (req, res) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

  const db = getDB();
  const userTopups = (db.topups || []).filter(t => t.userId === userId);
  return res.json({ success: true, topups: userTopups });
});

// 11. Live Chat
app.post('/api/chat/send', (req, res) => {
  const { senderId, senderName, message, role } = req.body;
  if (!message || !message.trim()) return res.status(400).json({ success: false, message: 'Pesan kosong' });

  const db = getDB();
  db.chats = db.chats || [];

  const chatMsg = {
    id: 'msg_' + Date.now(),
    senderId: senderId || 'guest_' + Math.random().toString(36).substr(2, 5),
    senderName: senderName || 'Guest',
    role: role || 'member',
    message: message.trim(),
    createdAt: new Date().toISOString()
  };

  db.chats.push(chatMsg);
  if (db.chats.length > 300) db.chats = db.chats.slice(-300);
  saveDB(db);

  return res.json({ success: true, chat: chatMsg });
});

app.get('/api/chat/messages', (req, res) => {
  const db = getDB();
  res.json({ success: true, chats: db.chats || [] });
});

// ----------------- ADMIN CONTROLLERS -----------------

function checkAdmin(req, res, next) {
  const userId = req.headers['x-user-id'];
  const db = getDB();
  const user = db.users.find(u => u.id === userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Akses khusus Administrator!' });
  }
  next();
}

// Admin Stats & All Data
app.get('/api/admin/all-data', checkAdmin, (req, res) => {
  const db = getDB();
  const totalUsers = db.users.length;
  const totalServers = db.orders.length;
  const totalDeposit = (db.topups || []).filter(t => t.status === 'Approved').reduce((a, b) => a + b.amount, 0);
  const pendingDeposit = (db.topups || []).filter(t => t.status === 'Pending').length;

  res.json({
    success: true,
    stats: { totalUsers, totalServers, totalDeposit, pendingDeposit },
    settings: db.settings,
    users: db.users.map(({ password, ...u }) => u),
    orders: db.orders,
    topups: db.topups,
    packages: db.packages,
    vouchers: db.vouchers,
    payments: db.payments
  });
});

// Admin Save Settings (Domain Panel, Contact, Site Info, Pakasir API, Flowix API, Broadcast Text)
app.post('/api/admin/settings/save', checkAdmin, (req, res) => {
  const {
    siteName, siteTagline, pteroDomain, pteroApiKey, contactWa, announcementText,
    pakasirProject, pakasirApiKey, pakasirAutoActive,
    flowixApiKey, flowixMerchantId, flowixWebhookSecret, flowixAutoActive
  } = req.body;
  const db = getDB();

  db.settings = {
    ...db.settings,
    siteName: siteName !== undefined ? siteName : db.settings.siteName,
    siteTagline: siteTagline !== undefined ? siteTagline : db.settings.siteTagline,
    pteroDomain: pteroDomain !== undefined ? pteroDomain : db.settings.pteroDomain,
    pteroApiKey: pteroApiKey !== undefined ? pteroApiKey : db.settings.pteroApiKey,
    contactWa: contactWa !== undefined ? contactWa : db.settings.contactWa,
    announcementText: announcementText !== undefined ? announcementText : db.settings.announcementText,
    pakasirProject: pakasirProject !== undefined ? pakasirProject.trim() : (db.settings.pakasirProject || ''),
    pakasirApiKey: pakasirApiKey !== undefined ? pakasirApiKey.trim() : (db.settings.pakasirApiKey || ''),
    pakasirAutoActive: pakasirAutoActive !== undefined ? !!pakasirAutoActive : (db.settings.pakasirAutoActive ?? true),
    flowixApiKey: flowixApiKey !== undefined ? flowixApiKey.trim() : (db.settings.flowixApiKey || ''),
    flowixMerchantId: flowixMerchantId !== undefined ? flowixMerchantId.trim() : (db.settings.flowixMerchantId || ''),
    flowixWebhookSecret: flowixWebhookSecret !== undefined ? flowixWebhookSecret.trim() : (db.settings.flowixWebhookSecret || ''),
    flowixAutoActive: flowixAutoActive !== undefined ? !!flowixAutoActive : (db.settings.flowixAutoActive ?? true)
  };

  saveDB(db);
  return res.json({ success: true, message: 'Pengaturan website, panel, Pakasir & Flowix Gateway berhasil disimpan!', settings: db.settings });
});

// Admin Approve / Reject Topup
app.post('/api/admin/topup/action', checkAdmin, (req, res) => {
  const { topupId, action } = req.body;
  const db = getDB();
  const item = (db.topups || []).find(t => t.id === topupId);
  if (!item) return res.status(404).json({ success: false, message: 'Tiket tidak ditemukan.' });

  if (item.status !== 'Pending') {
    return res.status(400).json({ success: false, message: `Tiket sudah berstatus ${item.status}` });
  }

  if (action === 'approve') {
    item.status = 'Approved';
    item.approvedAt = new Date().toISOString();
    const user = db.users.find(u => u.id === item.userId);
    if (user) user.balance += item.amount;
  } else {
    item.status = 'Rejected';
    item.rejectedAt = new Date().toISOString();
  }

  saveDB(db);
  return res.json({ success: true, message: `Status deposit berhasil diubah menjadi ${item.status}!` });
});

// Admin Save / Edit Package
app.post('/api/admin/packages/save', checkAdmin, (req, res) => {
  const { id, name, ram, cpu, disk, price, duration, description, isPopular } = req.body;
  const db = getDB();
  db.packages = db.packages || [];

  if (id) {
    const idx = db.packages.findIndex(p => p.id === id);
    if (idx !== -1) {
      db.packages[idx] = { ...db.packages[idx], name, ram, cpu, disk, price: Number(price), duration, description, isPopular: !!isPopular };
    }
  } else {
    const newPkg = {
      id: 'ptero-' + Date.now(),
      name,
      ram,
      cpu,
      disk,
      price: Number(price),
      duration: duration || '30 Hari',
      description,
      features: ['Full DDoS Protection', 'Multi Egg Support', 'Uptime 99.9%', 'Garansi Penuh'],
      isPopular: !!isPopular
    };
    db.packages.push(newPkg);
  }

  saveDB(db);
  return res.json({ success: true, message: 'Paket panel berhasil disimpan!' });
});

// Admin Delete Package
app.post('/api/admin/packages/delete', checkAdmin, (req, res) => {
  const { id } = req.body;
  const db = getDB();
  db.packages = (db.packages || []).filter(p => p.id !== id);
  saveDB(db);
  return res.json({ success: true, message: 'Paket berhasil dihapus!' });
});

// Admin Set User Balance
app.post('/api/admin/users/set-balance', checkAdmin, (req, res) => {
  const { targetUserId, newBalance } = req.body;
  const db = getDB();
  const user = db.users.find(u => u.id === targetUserId);
  if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });

  user.balance = parseInt(newBalance, 10) || 0;
  saveDB(db);
  return res.json({ success: true, message: `Saldo ${user.username} diubah menjadi Rp ${user.balance.toLocaleString()}` });
});

// Admin Save Voucher
app.post('/api/admin/vouchers/save', checkAdmin, (req, res) => {
  const { code, type, discount, maxDiscount, minOrder, usageLimit, isActive } = req.body;
  const db = getDB();
  db.vouchers = db.vouchers || [];
  const upper = code.trim().toUpperCase();

  const idx = db.vouchers.findIndex(v => v.code.toUpperCase() === upper);
  const data = {
    code: upper,
    type: type || 'percent',
    discount: Number(discount),
    maxDiscount: Number(maxDiscount) || 0,
    minOrder: Number(minOrder) || 0,
    usageLimit: Number(usageLimit) || 0,
    usedCount: idx !== -1 ? db.vouchers[idx].usedCount : 0,
    isActive: isActive !== undefined ? isActive : true
  };

  if (idx !== -1) db.vouchers[idx] = data;
  else db.vouchers.push(data);

  saveDB(db);
  return res.json({ success: true, message: 'Voucher promo berhasil disimpan!' });
});

// Admin Delete Voucher
app.post('/api/admin/vouchers/delete', checkAdmin, (req, res) => {
  const { code } = req.body;
  const db = getDB();
  db.vouchers = (db.vouchers || []).filter(v => v.code.toUpperCase() !== (code || '').toUpperCase());
  saveDB(db);
  return res.json({ success: true, message: 'Voucher berhasil dihapus!' });
});

// Admin Update Server Status (Suspend / Active / Delete)
app.post('/api/admin/orders/status', checkAdmin, (req, res) => {
  const { orderId, status } = req.body;
  const db = getDB();
  const order = (db.orders || []).find(o => o.id === orderId);
  if (!order) return res.status(404).json({ success: false, message: 'Server tidak ditemukan.' });

  order.status = status;
  saveDB(db);
  return res.json({ success: true, message: `Status server diubah menjadi ${status}!` });
});

// Fallback Route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Binding ke 0.0.0.0 agar bisa diakses dari luar panel pterodactyl & IP publik
app.listen(PORT, '0.0.0.0', () => {
  console.log(`⚡ Pterodactyl Store Server berjalan di http://0.0.0.0:${PORT}`);
});
