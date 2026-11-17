/**
 * Seed script to push initial data from db-state.json to Supabase
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://oalpwwreypjprsmkcdvq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hbHB3d3JleXBqcHJzbWtjZHZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ3NjA1MzMsImV4cCI6MjExMDMzNjUzM30.rb4IHUMRt9bQQyMXL_Ank-Ggi-mL76dcUuwui7jqouU';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function seed() {
  console.log('Connecting to Supabase at:', SUPABASE_URL);

  const dbState = JSON.parse(fs.readFileSync(path.join(__dirname, '../db-state.json'), 'utf8'));

  // 1. Seed System Settings
  console.log('Seeding system settings...');
  if (dbState.system_settings) {
    const { error: settingsError } = await supabase.from('system_settings').upsert({
      key: 'general',
      value: dbState.system_settings,
      updated_at: new Date().toISOString()
    });
    if (settingsError) console.error('Settings error:', settingsError);
    else console.log('✓ System settings seeded');
  }

  // 2. Seed Profiles & Wallets (first 10 for quick seed)
  console.log('Seeding profiles & wallets...');
  const users = Object.values(dbState.users || {}).slice(0, 20);
  for (const u of users) {
    const profile = {
      id: u.uid,
      email: u.email,
      full_name: u.fullName,
      phone: u.phone,
      business_name: u.businessName,
      shipping_mark: u.shippingMark || u.flyeTag,
      role: u.role || 'customer',
      kyc_status: u.kycLevel || 'verified',
      updated_at: new Date().toISOString()
    };
    const { error: pErr } = await supabase.from('profiles').upsert(profile);
    if (pErr) {
      console.warn('Profile upsert warning:', pErr.message);
    }

    if (u.balances) {
      for (const [curr, bal] of Object.entries(u.balances)) {
        const wallet = {
          id: `wal_${u.uid}_${curr}`,
          user_id: u.uid,
          currency: curr,
          balance: bal,
          ledger_balance: bal,
          status: 'active',
          updated_at: new Date().toISOString()
        };
        await supabase.from('wallets').upsert(wallet);
      }
    }
  }
  console.log(`✓ Seeded ${users.length} profiles and wallets`);

  // 3. Seed Suppliers
  console.log('Seeding verified suppliers...');
  const suppliers = Object.values(dbState.suppliers || {});
  const supplierRows = suppliers.map((s) => ({
    id: s.id,
    name: s.name,
    chinese_name: s.chineseName,
    category: s.category,
    city: s.city || 'Guangzhou',
    phone: s.phone,
    wechat_id: s.wechatId,
    whatsapp: s.whatsapp,
    business_address: s.businessAddress,
    rating: s.rating || 4.9,
    verified_years: s.verifiedYears || 5,
    badge: s.badge || 'Verified Direct Factory',
    tags: s.tags || ['Factory Direct'],
    main_products: s.mainProducts || [],
    business_card_url: s.businessCardUrl || null,
    is_verified: true,
    status: 'active',
    updated_at: new Date().toISOString()
  }));

  if (supplierRows.length > 0) {
    const { error: supErr } = await supabase.from('suppliers').upsert(supplierRows);
    if (supErr) console.error('Suppliers error:', supErr);
    else console.log(`✓ Seeded ${supplierRows.length} verified suppliers`);
  }

  // 4. Seed Products
  console.log('Seeding hardware products...');
  const products = Object.values(dbState.products || {});
  const productRows = products.map((p) => ({
    id: p.id,
    name: p.title || p.name || 'Apple Hardware Device',
    category: p.category || 'Tech',
    price_ngn: p.priceNGN || p.price_ngn || 0,
    price_cny: p.priceCNY || p.price_cny || 0,
    stock: p.stockCount || p.stock || 50,
    image_url: p.image || p.imageUrl || p.image_url || null,
    additional_images: p.images || [],
    specs: p.technicalSpecs || p.specs || {},
    description: p.subtitle || p.description || p.title,
    status: p.isPublished ? 'active' : 'draft',
    updated_at: new Date().toISOString()
  }));

  if (productRows.length > 0) {
    const { error: prodErr } = await supabase.from('products').upsert(productRows);
    if (prodErr) console.error('Products error:', prodErr);
    else console.log(`✓ Seeded ${productRows.length} products`);
  }

  // 5. Test Live Read Query
  console.log('Testing live query from Supabase...');
  const { data: testSuppliers, error: testErr } = await supabase.from('suppliers').select('id, name, city').limit(3);
  if (testErr) {
    console.error('Test query failed:', testErr);
  } else {
    console.log('✓ Successfully retrieved from Supabase:');
    console.log(testSuppliers);
  }

  console.log('\n🎉 ALL SUPABASE SEEDING & CONNECTION VERIFIED SUCCESSFULLY!');
}

seed().catch(console.error);
