import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { TECH_PRODUCTS } from '../../data/mockData';
import { TechProduct, ShopOrderDocument, ProductVariant } from '../../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Edit, 
  Trash2, 
  DollarSign, 
  X,
  ExternalLink,
  ShieldCheck,
  Settings,
  Plane,
  AlertTriangle,
  RotateCcw,
  Layers,
  Sparkles,
  FileText
} from 'lucide-react';

export const AdminShopScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [products, setProducts] = useState<TechProduct[]>(() => {
    const list = db.getProducts();
    return list.length > 0 ? list : TECH_PRODUCTS;
  });
  
  const [activeTab, setActiveTab] = useState<'fulfillment' | 'catalog' | 'settings'>('fulfillment');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Delivery settings
  const [deliveryFeeNGN, setDeliveryFeeNGN] = useState<number>(() => {
    return db.getShopSettings()?.deliveryFeeNGN ?? 5000;
  });
  const rates = dbState.system_settings?.rates || { USD_NGN: 1485, USD_CNY: 7.24 };

  // Dispatch / Fulfillment Modal
  const [selectedOrderToShip, setSelectedOrderToShip] = useState<any | null>(null);
  const [courierName, setCourierName] = useState('FlyeMass Express Air Cargo');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');

  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Apple iPhone 16 Pro Max');
  const [newSubtitle, setNewSubtitle] = useState('Desert Titanium • Hong Kong Dual SIM Spec');
  const [newCategory, setNewCategory] = useState<string>('iPhone');
  const [newCondition, setNewCondition] = useState<'Brand New' | 'Refurbished' | 'Fair / Pre-owned'>('Brand New');
  const [newPriceUSD, setNewPriceUSD] = useState('1420');
  const [newPriceNGN, setNewPriceNGN] = useState('2108700');
  const [newStock, setNewStock] = useState('12');
  const [newTag, setNewTag] = useState('New Release');
  const [newChip, setNewChip] = useState('Apple A18 Pro (3nm)');
  const [newRAM, setNewRAM] = useState('8GB Unified LPDDR5X');
  const [newDisplay, setNewDisplay] = useState('6.9" Super Retina XDR OLED');
  const [newCamera, setNewCamera] = useState('48MP Fusion + 48MP Ultra-Wide');
  const [newBatteryHealth, setNewBatteryHealth] = useState('100%');
  const [newBiometrics, setNewBiometrics] = useState('Face ID');
  const [newWarranty, setNewWarranty] = useState('1-Year Apple Global Warranty');

  // Variants in Add Product modal
  const [newVariants, setNewVariants] = useState<ProductVariant[]>([
    { id: `v-${Date.now()}-1`, color: 'Desert Titanium', colorHex: '#C2AD97', storage: '256GB', priceAdjustmentNGN: 0, stockCount: 6, isActive: true },
    { id: `v-${Date.now()}-2`, color: 'Desert Titanium', colorHex: '#C2AD97', storage: '512GB', priceAdjustmentNGN: 250000, stockCount: 6, isActive: true }
  ]);

  useEffect(() => {
    return db.subscribe(() => {
      const nextState = db.getState();
      setDbState({ ...nextState });
      const current = db.getProducts();
      if (current.length > 0) setProducts(current);
      if (nextState.device_shop_settings?.deliveryFeeNGN) {
        setDeliveryFeeNGN(nextState.device_shop_settings.deliveryFeeNGN);
      }
    });
  }, []);

  const ordersList = Object.values(dbState.shop_orders || {}).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));

  const filteredOrders = ordersList.filter((ord) => {
    const st = (ord.fulfillmentStatus || 'pending').toLowerCase();
    const matchesStatus = orderStatusFilter === 'all' || st === orderStatusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q ||
      (ord.orderNumber && ord.orderNumber.toLowerCase().includes(q)) ||
      (ord.trackingNumber && ord.trackingNumber.toLowerCase().includes(q)) ||
      (ord.userId && ord.userId.toLowerCase().includes(q)) ||
      (ord.deliveryAddress && ord.deliveryAddress.toLowerCase().includes(q));
    return matchesStatus && matchesQuery;
  });

  const handleUpdateStock = (productId: string, delta: number) => {
    db.updateProductStock(productId, delta);
    setProducts(db.getProducts());
    showToast('Inventory stock counter updated', 'info');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await db.fulfillShopOrder(orderId, undefined, status, undefined, 'adm-001');
      firebaseSync.recordAudit('Fulfillment Officer', 'ORDER_STATUS_UPDATE', 'shop_orders', orderId, `Marked order as ${status}`);
      showToast(`Order status updated to "${status.toUpperCase()}"!`, 'success');
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Failed to update order', 'error');
    }
  };

  const handleOpenShipModal = (order: any) => {
    setSelectedOrderToShip(order);
    setCourierName(order.courierName || 'FlyeMass Express Air Cargo');
    setTrackingNumber(order.trackingNumber || `FM-HK-LOS-${Math.floor(10000 + Math.random() * 90000)}`);
    setDeliveryNotes(order.deliveryNotes || 'Consignment packed and scheduled for Cathay Air Cargo dispatch.');
  };

  const handleConfirmShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderToShip) return;

    try {
      const res = await fetch(`http://localhost:5050/api/admin/shop/orders/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-id': 'adm-001',
          'x-admin-role': 'super_admin'
        },
        body: JSON.stringify({
          orderId: selectedOrderToShip.id,
          status: 'shipped',
          trackingNumber: trackingNumber.trim(),
          courierName: courierName.trim(),
          deliveryNotes: deliveryNotes.trim()
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch shipment');

      showToast(`Order #${selectedOrderToShip.orderNumber || selectedOrderToShip.id} dispatched! Waybill: ${trackingNumber}`, 'success');
      setSelectedOrderToShip(null);
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Failed to dispatch order', 'error');
    }
  };

  const handleRefundOrder = async (order: any) => {
    const num = order.orderNumber || order.id;
    if (!window.confirm(`Issue authoritative refund for Order #${num}? ${order.currency} ${order.totalAmount.toLocaleString()} will be credited to customer wallet and stock restored.`)) return;
    try {
      await db.cancelShopOrder(order.id, 'Refunded by Admin Shop Operations', 'adm-001');
      showToast(`Order refunded and ${order.currency} ${order.totalAmount.toLocaleString()} credited back!`, 'success');
      setDbState({ ...db.getState() });
      setProducts(db.getProducts());
    } catch (e: any) {
      showToast(e.message || 'Failed to refund order', 'error');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await db.updateShopSettings(deliveryFeeNGN, 'adm-001');
      showToast(`Global delivery fee updated to ₦${deliveryFeeNGN.toLocaleString()}`, 'success');
      setDbState({ ...db.getState() });
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const handleAddVariant = () => {
    setNewVariants(prev => [
      ...prev,
      {
        id: `v-${Date.now()}-${prev.length + 1}`,
        color: 'Natural Titanium',
        colorHex: '#9A958E',
        storage: '256GB',
        priceAdjustmentNGN: 0,
        stockCount: 5,
        isActive: true
      }
    ]);
  };

  const handleRemoveVariant = (id: string) => {
    setNewVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(newPriceUSD) || 1000;
    const ngn = parseFloat(newPriceNGN) || Math.round(usd * (rates.USD_NGN || 1485));
    const totalVariantStock = newVariants.reduce((sum, v) => sum + (v.stockCount || 0), 0);
    const initialStock = totalVariantStock > 0 ? totalVariantStock : (parseInt(newStock) || 5);

    const newProd: TechProduct = {
      id: `prod-apple-${Date.now()}`,
      title: newTitle,
      subtitle: newSubtitle,
      category: newCategory,
      condition: newCondition,
      priceUSD: usd,
      priceNGN: ngn,
      priceCNY: Math.round(usd * (rates.USD_CNY || 7.24)),
      image: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
      images: [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80'
      ],
      rating: 5.0,
      reviewsCount: 1,
      specs: [newChip, newDisplay, newCamera],
      technicalSpecs: {
        chip: newChip,
        ram: newRAM,
        display: newDisplay,
        camera: newCamera,
        batteryHealth: newBatteryHealth,
        biometrics: newBiometrics,
        warranty: newWarranty,
        deliveryEstimate: '2–4 Business Days via Express Air Cargo'
      },
      inStock: initialStock > 0,
      stockCount: initialStock,
      tag: newTag,
      colors: Array.from(new Set(newVariants.map(v => v.color))).map(color => ({
        name: color,
        hex: newVariants.find(v => v.color === color)?.colorHex || '#1E1E22'
      })),
      storageOptions: Array.from(new Set(newVariants.map(v => v.storage))),
      variants: newVariants,
      warrantyInfo: newWarranty,
      deliveryInfo: 'Direct air freight dispatch to Lagos Hub with escrow guarantee',
      isPublished: true
    };

    db.addProduct(newProd);
    setProducts(db.getProducts());
    firebaseSync.recordAudit('Shop Manager', 'ADD_PRODUCT', 'products', newProd.id, `Added product ${newTitle}`);
    showToast(`Added ${newTitle} to Apple tech catalog!`, 'success');
    setShowAddModal(false);
  };

  return (
    <AdminLayout activeTab="shop">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Apple Shop & Fulfillment Operations</h1>
            <p className="text-xs text-slate-400">
              Manage Hong Kong Apple catalog, hardware variants, dynamic air freight fees, and customer fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Apple Stock</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('fulfillment')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'fulfillment' ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Fulfillment Board ({ordersList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'catalog' ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Apple Catalog ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'settings' ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Shop Settings</span>
          </button>
        </div>

        {/* TAB 1: ORDER FULFILLMENT BOARD */}
        {activeTab === 'fulfillment' && (
          <div className="space-y-4">
            {/* Status Filter Sub-tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {(['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setOrderStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                      orderStatusFilter === st
                        ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, customer, waybill..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Orders Cards Grid */}
            <div className="space-y-3">
              {filteredOrders.length === 0 ? (
                <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-2">
                  <Package className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-300">No {orderStatusFilter !== 'all' ? orderStatusFilter : ''} orders found</p>
                  <p className="text-xs text-slate-500">Orders placed by customers in the mobile shop will appear here.</p>
                </div>
              ) : (
                filteredOrders.map((ord: any) => {
                  const status = (ord.fulfillmentStatus || 'pending').toLowerCase();
                  const orderNum = ord.orderNumber || ord.id;
                  const waybill = ord.trackingNumber || 'Pending Allocation';
                  const courier = ord.courierName || 'FlyeMass Express Air Cargo';
                  const items = ord.items || [];

                  return (
                    <div
                      key={ord.id}
                      className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-extrabold text-white text-xs">
                            {orderNum}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Customer: <strong className="text-slate-300">{ord.userId}</strong>
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            status === 'delivered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            status === 'shipped' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                            status === 'processing' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                            status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                            'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {status}
                          </span>
                        </div>

                        <div className="text-right">
                          <p className="font-mono font-extrabold text-emerald-400 text-sm">
                            {ord.currency} {ord.totalAmount?.toLocaleString()}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {ord.createdAt ? new Date(ord.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent'}
                          </p>
                        </div>
                      </div>

                      {/* Items & Delivery Details */}
                      <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p>
                            <span className="text-slate-500">Destination:</span> <strong className="text-white">{ord.deliveryAddress}</strong>
                          </p>
                          <p>
                            <span className="text-slate-500">Courier:</span> <span className="text-cyan-400 font-semibold">{courier}</span>
                          </p>
                        </div>

                        <div className="pt-1.5 border-t border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <p>
                            <span className="text-slate-500">Waybill Tracking:</span> <strong className="font-mono text-emerald-400">{waybill}</strong>
                          </p>
                          <p className="text-slate-400">
                            {items.length} line item(s): {items[0]?.product?.title || 'Apple Device'} {items[0]?.selectedStorage ? `(${items[0].selectedStorage})` : ''}
                          </p>
                        </div>

                        {ord.deliveryNotes && (
                          <p className="pt-1 text-[11px] text-slate-400 italic">
                            <span className="text-slate-500 not-italic font-semibold">Staff Notes:</span> {ord.deliveryNotes}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenShipModal(ord)}
                            className="px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Plane className="w-3.5 h-3.5" />
                            <span>Dispatch & Ship (Waybill)</span>
                          </button>

                          {status !== 'cancelled' && status !== 'delivered' && (
                            <button
                              type="button"
                              onClick={() => handleRefundOrder(ord)}
                              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Refund & Restore Stock</span>
                            </button>
                          )}
                        </div>

                        {/* Quick Status Buttons */}
                        <div className="flex items-center gap-1.5">
                          {(['pending', 'processing', 'shipped', 'delivered'] as const).map((st) => (
                            <button
                              key={st}
                              type="button"
                              onClick={() => handleUpdateOrderStatus(ord.id, st)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize transition-all border ${
                                status === st
                                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {st}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 2: PRODUCT CATALOG & VARIANT MANAGEMENT */}
        {activeTab === 'catalog' && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Apple Hardware & Specs</th>
                    <th className="py-3 px-4">Category & Condition</th>
                    <th className="py-3 px-4">Catalog Pricing (USD / NGN / CNY)</th>
                    <th className="py-3 px-4">Variants & Stock</th>
                    <th className="py-3 px-4 text-right">Inventory Adjuster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((prod) => {
                    const variantsCount = prod.variants?.length || 0;
                    const condition = prod.condition || 'Brand New';

                    return (
                      <tr key={prod.id} className="hover:bg-slate-950/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 flex items-center justify-center shrink-0 overflow-hidden">
                              <img
                                src={prod.image}
                                alt={prod.title}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="font-bold text-white text-xs">{prod.title}</p>
                              <p className="text-[10px] text-slate-400">{prod.subtitle}</p>
                              {prod.technicalSpecs?.chip && (
                                <p className="text-[9px] text-cyan-400 font-mono mt-0.5">{prod.technicalSpecs.chip}</p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300 block w-fit">
                              {prod.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-indigo-950 text-[9px] font-semibold text-indigo-300 border border-indigo-800/40 block w-fit">
                              {condition}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <p className="font-bold text-emerald-400">${prod.priceUSD.toLocaleString()} USD</p>
                          <p className="text-[10px] text-slate-300">₦{prod.priceNGN.toLocaleString()} NGN</p>
                          <p className="text-[9px] text-indigo-300">¥{prod.priceCNY.toLocaleString()} CNY</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold block w-fit ${
                            prod.stockCount > 5 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {prod.stockCount} units available
                          </span>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {variantsCount} configured variant(s)
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(prod.id, -1)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-white text-xs">
                              {prod.stockCount}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateStock(prod.id, 1)}
                              className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SHOP SETTINGS (GLOBAL DELIVERY FEE) */}
        {activeTab === 'settings' && (
          <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-400" />
                <span>Global Apple Shop Delivery Configuration</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure standard air cargo shipping fees applied to all tech gadget and Apple orders dispatched to Nigeria.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <label className="text-xs font-bold text-slate-300 block">
                  Standard Flat Air Cargo Delivery Fee (NGN)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-500">₦</span>
                  <input
                    type="number"
                    value={deliveryFeeNGN}
                    onChange={(e) => setDeliveryFeeNGN(Number(e.target.value) || 0)}
                    required
                    min={0}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm font-bold font-mono text-emerald-400 outline-none focus:border-emerald-500"
                  />
                </div>

                {/* Conversion Preview */}
                <div className="flex items-center gap-3 text-xs text-slate-400 font-mono pt-1">
                  <span>≈ ${Math.round(deliveryFeeNGN / (rates.USD_NGN || 1485))} USD</span>
                  <span>•</span>
                  <span>≈ ¥{Math.round((deliveryFeeNGN / (rates.USD_NGN || 1485)) * (rates.USD_CNY || 7.24))} CNY</span>
                  <span className="text-[10px] text-slate-500 font-sans">(Live Authoritative Rate)</span>
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Save Global Delivery Configuration
              </button>
            </form>
          </div>
        )}
      </div>

      {/* DISPATCH & SHIP MODAL */}
      {selectedOrderToShip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">Dispatch Order #{selectedOrderToShip.orderNumber || selectedOrderToShip.id}</h3>
                <p className="text-[10px] text-slate-400">Assign courier and flight waybill to advance to Shipped</p>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedOrderToShip(null)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmShipment} className="space-y-3.5 text-xs">
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Air Cargo Courier Partner</label>
                <input
                  type="text"
                  value={courierName}
                  onChange={(e) => setCourierName(e.target.value)}
                  required
                  placeholder="e.g. FlyeMass Express Air Cargo / Cathay Aviation"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Air Waybill / Consignment Tracking Number</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  required
                  placeholder="e.g. FM-HK-LOS-89241"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-emerald-400 font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1">Operations & Dispatch Notes (Visible to Customer)</label>
                <textarea
                  value={deliveryNotes}
                  onChange={(e) => setDeliveryNotes(e.target.value)}
                  rows={3}
                  placeholder="e.g. Cleared Hong Kong air cargo customs. Departure scheduled on flight CX-890."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plane className="w-4 h-4" />
                  <span>Confirm Dispatch & Notify Customer</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD APPLE PRODUCT & VARIANTS MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">Add New Apple Stock & Variants</h3>
                <p className="text-[10px] text-slate-400">Configure technical specs, pricing, and variant matrix</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddModal(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Product Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="iPhone">iPhone</option>
                    <option value="MacBook">MacBook</option>
                    <option value="iPad">iPad</option>
                    <option value="AirPods">AirPods</option>
                    <option value="Apple Watch">Apple Watch</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Condition</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Fair / Pre-owned">Fair / Pre-owned</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Tag</label>
                  <input
                    type="text"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Base Price ($ USD)</label>
                  <input
                    type="number"
                    value={newPriceUSD}
                    onChange={(e) => {
                      setNewPriceUSD(e.target.value);
                      const usd = parseFloat(e.target.value) || 0;
                      setNewPriceNGN(String(Math.round(usd * (rates.USD_NGN || 1485))));
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Base Price (₦ NGN)</label>
                  <input
                    type="number"
                    value={newPriceNGN}
                    onChange={(e) => setNewPriceNGN(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white outline-none"
                    required
                  />
                </div>
              </div>

              {/* Technical Specs Accordion/Fields */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Technical Specifications
                </span>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500">Chip / Processor:</span>
                    <input
                      type="text"
                      value={newChip}
                      onChange={(e) => setNewChip(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">RAM:</span>
                    <input
                      type="text"
                      value={newRAM}
                      onChange={(e) => setNewRAM(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Display:</span>
                    <input
                      type="text"
                      value={newDisplay}
                      onChange={(e) => setNewDisplay(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Camera System:</span>
                    <input
                      type="text"
                      value={newCamera}
                      onChange={(e) => setNewCamera(e.target.value)}
                      className="w-full p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Variant Matrix Manager */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Product Variants ({newVariants.length})
                  </span>
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="text-[10px] font-bold text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add Variant</span>
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto no-scrollbar">
                  {newVariants.map((v, i) => (
                    <div key={v.id} className="p-2 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2">
                      <input
                        type="color"
                        value={v.colorHex}
                        onChange={(e) => {
                          const hex = e.target.value;
                          setNewVariants(prev => prev.map((x, idx) => idx === i ? { ...x, colorHex: hex } : x));
                        }}
                        className="w-6 h-6 rounded-md bg-transparent cursor-pointer border-0"
                      />
                      <input
                        type="text"
                        placeholder="Color Name"
                        value={v.color}
                        onChange={(e) => {
                          const name = e.target.value;
                          setNewVariants(prev => prev.map((x, idx) => idx === i ? { ...x, color: name } : x));
                        }}
                        className="w-24 p-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-white"
                      />
                      <input
                        type="text"
                        placeholder="Storage"
                        value={v.storage}
                        onChange={(e) => {
                          const st = e.target.value;
                          setNewVariants(prev => prev.map((x, idx) => idx === i ? { ...x, storage: st } : x));
                        }}
                        className="w-20 p-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] text-white"
                      />
                      <input
                        type="number"
                        placeholder="+₦ Adj"
                        value={v.priceAdjustmentNGN}
                        onChange={(e) => {
                          const adj = Number(e.target.value) || 0;
                          setNewVariants(prev => prev.map((x, idx) => idx === i ? { ...x, priceAdjustmentNGN: adj } : x));
                        }}
                        className="w-24 p-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400"
                      />
                      <input
                        type="number"
                        placeholder="Stock"
                        value={v.stockCount}
                        onChange={(e) => {
                          const count = Number(e.target.value) || 0;
                          setNewVariants(prev => prev.map((x, idx) => idx === i ? { ...x, stockCount: count } : x));
                        }}
                        className="w-16 p-1 rounded-md bg-slate-950 border border-slate-800 text-[11px] font-mono text-white text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(v.id)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
              >
                Publish Apple Hardware to Mobile Hub
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
