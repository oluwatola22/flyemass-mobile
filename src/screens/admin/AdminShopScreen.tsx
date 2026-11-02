import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { TECH_PRODUCTS } from '../../data/mockData';
import { TechProduct, ShopOrderDocument } from '../../types';
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
  ExternalLink
} from 'lucide-react';

export const AdminShopScreen: React.FC = () => {
  const { showToast } = useApp();
  const [dbState, setDbState] = useState<DatabaseState>(db.getState());
  const [products, setProducts] = useState<TechProduct[]>(() => {
    const list = db.getProducts();
    return list.length > 0 ? list : TECH_PRODUCTS;
  });
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Add Product Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('Apple Vision Pro (512GB)');
  const [newSubtitle, setNewSubtitle] = useState('US Specification • Dual Loop Band');
  const [newCategory, setNewCategory] = useState<'iPhone' | 'Mac' | 'iPad' | 'Watch' | 'Audio'>('iPhone');
  const [newPriceUSD, setNewPriceUSD] = useState('3499');
  const [newStock, setNewStock] = useState('8');

  useEffect(() => {
    return db.subscribe(() => {
      setDbState({ ...db.getState() });
      const current = db.getProducts();
      if (current.length > 0) setProducts(current);
    });
  }, []);

  const ordersList = Object.values(dbState.shop_orders);

  const handleUpdateStock = (productId: string, delta: number) => {
    db.updateProductStock(productId, delta);
    setProducts(db.getProducts());
    showToast('Inventory stock counter updated', 'info');
  };

  const handleUpdateOrderStatus = async (orderId: string, status: ShopOrderDocument['fulfillmentStatus']) => {
    try {
      await db.fulfillShopOrder(orderId, undefined, status, undefined, 'adm-001');
      firebaseSync.recordAudit('Fulfillment Officer', 'ORDER_STATUS_UPDATE', 'shop_orders', orderId, `Marked order as ${status}`);
      showToast(`Order status updated to "${status.toUpperCase()}"!`, 'success');
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Failed to update order', 'error');
    }
  };

  const handleRefundOrder = async (order: ShopOrderDocument) => {
    if (!window.confirm(`Issue authoritative refund for Order #${order.orderNumber || order.id}? ${order.currency} ${order.totalAmount} will be credited to customer wallet and stock restored.`)) return;
    try {
      await db.cancelShopOrder(order.id, 'Refunded by Admin', 'adm-001');
      showToast(`Order refunded and ${order.currency} ${order.totalAmount.toLocaleString()} credited back!`, 'success');
      setDbState({ ...db.getState() });
      setProducts(db.getProducts());
    } catch (e: any) {
      showToast(e.message || 'Failed to refund order', 'error');
    }
  };

  const handleAssignTracking = async (order: ShopOrderDocument) => {
    const tracking = window.prompt(`Enter air cargo tracking number for order #${order.orderNumber || order.id}:`, order.trackingNumber || 'FM-CAN-LOS-89241');
    if (!tracking || !tracking.trim()) return;
    try {
      await db.fulfillShopOrder(order.id, tracking.trim(), 'shipped', 'Assigned via fulfillment console', 'adm-001');
      showToast(`Assigned tracking #${tracking.trim()} and advanced to Shipped!`, 'success');
      setDbState({ ...db.getState() });
    } catch (e: any) {
      showToast(e.message || 'Failed to assign tracking', 'error');
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const usd = parseFloat(newPriceUSD) || 1000;
    const newProd: TechProduct = {
      id: `prod-custom-${Date.now()}`,
      title: newTitle,
      subtitle: newSubtitle,
      category: newCategory,
      priceUSD: usd,
      priceNGN: Math.round(usd * 1485),
      priceCNY: Math.round(usd * 7.24),
      image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=600&q=80',
      rating: 5.0,
      reviewsCount: 1,
      specs: ['HK Specification', 'Factory Sealed', '1-Year Global Apple Warranty'],
      inStock: true,
      stockCount: parseInt(newStock) || 5,
      tag: 'New Arrival',
      colors: [{ name: 'Space Black', hex: '#1E1E22' }],
      storageOptions: ['256GB', '512GB']
    };

    db.addProduct(newProd);
    setProducts(db.getProducts());
    firebaseSync.recordAudit('Shop Manager', 'ADD_PRODUCT', 'products', newProd.id, `Added product ${newTitle}`);
    showToast(`Added ${newTitle} to tech catalog!`, 'success');
    setShowAddModal(false);
  };

  return (
    <AdminLayout activeTab="shop">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Tech Gadget Shop & Inventory</h1>
            <p className="text-xs text-slate-400">
              Manage Apple Hong Kong wholesale stock, multi-currency price catalogs, and customer order fulfillment.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Tech Stock</span>
            </button>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800 w-fit">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'inventory' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Wholesale Catalog ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'orders' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Fulfillment Board ({ordersList.length})
          </button>
        </div>

        {/* 1. INVENTORY CATALOG */}
        {activeTab === 'inventory' && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Wholesale Prices (USD / NGN / CNY)</th>
                    <th className="py-3 px-4">Live Inventory</th>
                    <th className="py-3 px-4 text-right">Stock Adjuster</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {products.map((prod) => (
                    <tr key={prod.id} className="hover:bg-slate-950/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.title}
                            className="w-10 h-10 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-white text-xs">{prod.title}</p>
                            <p className="text-[10px] text-slate-400">{prod.subtitle}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-bold text-slate-300">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-mono font-bold text-emerald-400">${prod.priceUSD.toLocaleString()} USD</p>
                        <p className="font-mono text-[10px] text-slate-300">₦{prod.priceNGN.toLocaleString()} NGN</p>
                        <p className="font-mono text-[9px] text-indigo-300">¥{prod.priceCNY.toLocaleString()} CNY</p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          prod.stockCount > 5 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {prod.stockCount} units available
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStock(prod.id, -1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center font-mono font-bold text-white text-xs">
                            {prod.stockCount}
                          </span>
                          <button
                            onClick={() => handleUpdateStock(prod.id, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. ORDER FULFILLMENT BOARD */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {ordersList.map((ord) => (
              <div
                key={ord.id}
                className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-extrabold text-white text-xs">
                      {ord.orderNumber || ord.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      ord.fulfillmentStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-400' :
                      ord.fulfillmentStatus === 'shipped' ? 'bg-cyan-500/10 text-cyan-400' :
                      'bg-amber-500/10 text-amber-400'
                    }`}>
                      {ord.fulfillmentStatus}
                    </span>
                  </div>

                  <p className="font-mono font-extrabold text-emerald-400 text-sm">
                    ${ord.totalAmount.toLocaleString()} {ord.currency}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300 space-y-1">
                  <p><span className="text-slate-500">Destination:</span> {ord.deliveryAddress}</p>
                  <p><span className="text-slate-500">Items:</span> {ord.items[0]?.product?.title || 'Apple Batch'} ({ord.items.length} line items)</p>
                  <p><span className="text-slate-500">Air Waybill:</span> <strong className="font-mono text-cyan-400">{ord.trackingNumber || 'FM-CAN-LOS-89241'}</strong></p>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAssignTracking(ord)}
                      className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-[10px] font-bold transition-all active:scale-95"
                    >
                      Assign Tracking
                    </button>
                    {ord.fulfillmentStatus !== 'cancelled' && ord.fulfillmentStatus !== 'delivered' && (
                      <button
                        onClick={() => handleRefundOrder(ord)}
                        className="px-2.5 py-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-[10px] font-bold transition-all active:scale-95"
                      >
                        Refund Order
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1.5">
                    {(['processing', 'shipped', 'delivered'] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateOrderStatus(ord.id, st)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold capitalize transition-all border ${
                          ord.fulfillmentStatus === st
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-sm font-extrabold text-white">Add Tech Gadget Stock</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProduct} className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Product Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Subtitle / Specification</label>
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                  >
                    <option value="iPhone">iPhone</option>
                    <option value="Mac">Mac</option>
                    <option value="iPad">iPad</option>
                    <option value="Watch">Watch</option>
                    <option value="Audio">Audio</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Initial Stock</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Wholesale Price ($ USD)</label>
                <input
                  type="number"
                  value={newPriceUSD}
                  onChange={(e) => setNewPriceUSD(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-emerald-400 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all"
              >
                Publish to Mobile Tech Catalog
              </button>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
