const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 5050;
const DB_FILE = path.join(__dirname, 'db-state.json');

// Default initial seed data matching the user's schema specification
const INITIAL_DATABASE = {
  users: {
    'usr_alade_01': {
      uid: 'usr_alade_01',
      fullName: 'Chief Babatunde Alade',
      email: 'babatunde@aladeholding.ng',
      phone: '+234 803 555 9201',
      businessName: 'Alade Global Enterprises Ltd',
      verifiedBadge: true,
      role: 'client',
      createdAt: Date.now() - 30 * 86400000,
      balances: {
        NGN: 28450200,
        CNY: 184250,
        USD: 42890.50
      }
    },
    'usr_chen_agent': {
      uid: 'usr_chen_agent',
      fullName: 'Chen Wei',
      email: 'chen.wei@flyemass.cn',
      phone: '+86 186 2008 9142',
      businessName: 'FlyeMass Guangzhou Logistics Center',
      verifiedBadge: true,
      role: 'agent',
      createdAt: Date.now() - 90 * 86400000,
      balances: {
        NGN: 0,
        CNY: 520000,
        USD: 75000
      }
    }
  },
  wallets_ledger: {
    'ldg_89201': {
      id: 'ldg_89201',
      userId: 'usr_alade_01',
      type: 'PAY_SUPPLIER',
      sourceCurrency: 'CNY',
      targetCurrency: 'CNY',
      amount: 45000,
      fee: 0,
      status: 'completed',
      reference: 'FLYE-ALIPAY-98214',
      timestamp: Date.now() - 3600000,
      notes: 'Payment to Shenzhen Foxconn Micro Tech via Alipay Business'
    },
    'ldg_89202': {
      id: 'ldg_89202',
      userId: 'usr_alade_01',
      type: 'FX_SWAP',
      sourceCurrency: 'NGN',
      targetCurrency: 'CNY',
      amount: 15000000,
      fee: 0,
      status: 'completed',
      reference: 'SWP-NGN-CNY-7712',
      timestamp: Date.now() - 14400000,
      notes: 'Instant swap ₦15,000,000 to ¥69,930 CNY'
    },
    'ldg_89203': {
      id: 'ldg_89203',
      userId: 'usr_alade_01',
      type: 'FUND',
      sourceCurrency: 'NGN',
      targetCurrency: 'NGN',
      amount: 10000000,
      fee: 0,
      status: 'completed',
      reference: 'NIP-CR-992144882',
      timestamp: Date.now() - 86400000,
      notes: 'Virtual Providus Account Direct Top-up'
    },
    'ldg_89204': {
      id: 'ldg_89204',
      userId: 'usr_alade_01',
      type: 'SHOP_ORDER',
      sourceCurrency: 'USD',
      targetCurrency: 'USD',
      amount: 1420.00,
      fee: 45.00,
      status: 'completed',
      reference: 'ORD-TECH-89201',
      timestamp: Date.now() - 172800000,
      notes: 'iPhone 16 Pro Max (512GB) HK Spec'
    }
  },
  shipments: {
    'ship_can_los_89241': {
      id: 'ship_can_los_89241',
      trackingNumber: 'FM-CAN-LOS-89241',
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      originWarehouse: 'Guangzhou',
      destination: 'Lagos Hub',
      weightKg: 28.5,
      mode: 'Air Freight',
      currentStatus: 'In Transit/Customs',
      timeline: [
        {
          status: 'Origin Received',
          location: 'Baiyun Logistics Hub, Guangzhou',
          timestamp: '2026-11-01 09:30 AM',
          notes: 'Package verified against supplier invoice. 100% seal intact.'
        },
        {
          status: 'Packed',
          location: 'Guangzhou Export Terminal B',
          timestamp: '2026-11-01 19:45 PM',
          notes: 'Loaded into flight security ULD container.'
        },
        {
          status: 'In Transit/Customs',
          location: 'Flight ET921 (Addis Ababa - Lagos MM2)',
          timestamp: '2026-11-02 04:15 AM',
          notes: 'Air cargo mid-transit approaching West African airspace.'
        }
      ],
      updatedAt: Date.now() - 7200000,
      cbm: 0.18,
      costEstimate: 285.00,
      costCurrency: 'USD',
      title: '50x Apple Tech Gadgets & Accessories'
    },
    'ship_yiw_los_77192': {
      id: 'ship_yiw_los_77192',
      trackingNumber: 'FM-YIW-LOS-77192',
      userId: 'usr_alade_01',
      receiverName: 'Chief Babatunde Alade',
      originWarehouse: 'Yiwu',
      destination: 'Lagos Hub',
      weightKg: 4200,
      mode: 'Sea Freight',
      currentStatus: 'Packed',
      timeline: [
        {
          status: 'Origin Received',
          location: 'Yiwu International Port D-18 Hub',
          timestamp: '2026-10-30 11:20 AM',
          notes: 'Consolidated from 4 factory suppliers.'
        },
        {
          status: 'Packed',
          location: 'Ningbo Maritime Port Terminal',
          timestamp: '2026-11-01 16:00 PM',
          notes: 'Container CN-9821 stuffed and customs export sealed.'
        }
      ],
      updatedAt: Date.now() - 43200000,
      cbm: 28.4,
      costEstimate: 4200.00,
      costCurrency: 'USD',
      title: '40ft Container: Small Commodities & Solar Inverters'
    }
  },
  supplier_payments: {
    'pay_foxconn_01': {
      id: 'pay_foxconn_01',
      userId: 'usr_alade_01',
      paymentMethod: 'Alipay',
      receiverAccount: '13800138000',
      receiverName: 'Shenzhen Foxconn Micro Tech Ltd',
      amountRMB: 45000,
      equivalentNGN: 9652500,
      status: 'disbursed',
      createdAt: Date.now() - 3600000,
      reference: 'FLYE-ALIPAY-98214',
      notes: 'PO #9824 - iPhone Parts Batch 2'
    },
    'pay_shengda_02': {
      id: 'pay_shengda_02',
      userId: 'usr_alade_01',
      paymentMethod: 'WeChat Pay',
      receiverAccount: 'wxp_yiwu_shengda_88',
      receiverName: 'Yiwu Shengda Global Commodity Group',
      amountRMB: 18500,
      equivalentNGN: 3968250,
      status: 'disbursed',
      createdAt: Date.now() - 86400000,
      reference: 'FLYE-WXP-44102',
      notes: 'District 3 Hardware Samples'
    }
  },
  shop_orders: {
    'ord_tech_89201': {
      id: 'ord_tech_89201',
      userId: 'usr_alade_01',
      items: [
        {
          product: {
            id: 'prod-iphone-16-pro',
            title: 'Apple iPhone 16 Pro Max (512GB)',
            subtitle: 'Desert Titanium • HK Spec Dual Nano-SIM',
            category: 'iPhone',
            priceUSD: 1420,
            priceNGN: 2108700,
            priceCNY: 10280,
            image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
            rating: 4.9,
            reviewsCount: 312,
            specs: ['A18 Pro Chip', 'Grade 5 Titanium', 'Dual Nano-SIM (HK Spec)'],
            inStock: true,
            stockCount: 18,
            tag: 'Wholesale Leader',
            colors: [{ name: 'Desert Titanium', hex: '#C2AD97' }],
            storageOptions: ['512GB']
          },
          quantity: 1,
          selectedColor: 'Desert Titanium',
          selectedStorage: '512GB'
        }
      ],
      totalAmount: 1465,
      currency: 'USD',
      deliveryAddress: 'Plot 14, Commercial Avenue, Ikeja Computer Village, Lagos, Nigeria',
      paymentWalletUsed: 'USD',
      fulfillmentStatus: 'shipped',
      createdAt: Date.now() - 172800000,
      orderNumber: 'ORD-89201',
      trackingNumber: 'FM-CAN-LOS-89241'
    }
  },
  support_tickets: {
    'tkt_8901': {
      id: 'tkt_8901',
      userId: 'usr_alade_01',
      subject: 'Alipay merchant payment clearance confirmation',
      status: 'in_progress',
      messages: [
        {
          senderId: 'usr_alade_01',
          senderName: 'Chief Babatunde Alade',
          text: 'Can you confirm if my Alipay payment of ¥45,000 to Shenzhen Foxconn was cleared by their merchant account?',
          timestamp: '10:02 AM',
          isAdmin: false
        },
        {
          senderId: 'usr_chen_agent',
          senderName: 'Chen Wei (Guangzhou Clearing Desk)',
          text: 'Yes Chief Alade! We received instant SAFE API confirmation. Foxconn has acknowledged receipt and scheduled your 50x gadgets dispatch to our Baiyun Hub.',
          timestamp: '10:04 AM',
          isAdmin: true
        }
      ],
      updatedAt: Date.now() - 1800000,
      ticketNumber: 'TKT-8901',
      category: 'Supplier Escrow',
      priority: 'High'
    }
  }
};

let dbState = { ...INITIAL_DATABASE };

// Load persistent file if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    dbState = {
      users: { ...INITIAL_DATABASE.users, ...(parsed.users || {}) },
      wallets_ledger: { ...INITIAL_DATABASE.wallets_ledger, ...(parsed.wallets_ledger || {}) },
      shipments: { ...INITIAL_DATABASE.shipments, ...(parsed.shipments || {}) },
      supplier_payments: { ...INITIAL_DATABASE.supplier_payments, ...(parsed.supplier_payments || {}) },
      shop_orders: { ...INITIAL_DATABASE.shop_orders, ...(parsed.shop_orders || {}) },
      support_tickets: { ...INITIAL_DATABASE.support_tickets, ...(parsed.support_tickets || {}) }
    };
  }
} catch (e) {
  console.warn('Failed to load db-state.json, using seed', e);
}

function persistState() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(dbState, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to write db-state.json', e);
  }
}

// Active Server-Sent Events subscribers
const sseClients = new Set();

function broadcastUpdate() {
  const payload = JSON.stringify({ type: 'SYNC', state: dbState });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = parsedUrl.pathname;

  // 1. SSE Stream for Real-Time Sync across ports 3000 and 5173
  if (pathname === '/api/db/stream') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    // Send initial snapshot
    res.write(`data: ${JSON.stringify({ type: 'SNAPSHOT', state: dbState })}\n\n`);
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // 2. Get full DB snapshot
  if (pathname === '/api/db' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(dbState));
    return;
  }

  // 3. Update full state or mutations
  if (pathname === '/api/db/update' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        const update = JSON.parse(body);
        if (update && typeof update === 'object') {
          if (update.state) {
            dbState = { ...dbState, ...update.state };
          } else if (update.collection && update.id && update.data) {
            if (!dbState[update.collection]) dbState[update.collection] = {};
            dbState[update.collection][update.id] = update.data;
          }
          persistState();
          broadcastUpdate();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid update body' }));
        }
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
    return;
  }

  // 4. Reset to Seed Defaults
  if (pathname === '/api/db/reset' && req.method === 'POST') {
    dbState = JSON.parse(JSON.stringify(INITIAL_DATABASE));
    persistState();
    broadcastUpdate();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Reset to seed data' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Endpoint not found' }));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[FlyeMass Backend Sync Server] Running on http://localhost:${PORT}`);
});
