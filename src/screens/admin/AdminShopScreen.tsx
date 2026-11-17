import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { firebaseSync } from '../../services/firebase';
import { TECH_PRODUCTS } from '../../data/mockData';
import { TechProduct, ShopOrderDocument, ProductVariant, BannerDocument, ScreenRoute } from '../../types';
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
  FileText,
  UploadCloud,
  Image,
  Images,
  Check,
  MoveUp,
  MoveDown,
  Star,
  ArrowUp,
  ArrowDown,
  Edit3
} from 'lucide-react';

export const AdminShopScreen: React.FC = () => {
  const { showToast } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());
  const dbState = db.getState();
  const [products, setProducts] = useState<TechProduct[]>(() => {
    const list = db.getProducts();
    return list.length > 0 ? list : TECH_PRODUCTS;
  });
  
  const [activeTab, setActiveTab] = useState<'fulfillment' | 'catalog' | 'banners' | 'settings'>('fulfillment');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Shop Banners State & Actions (Apple & Tech Store Carousel)
  const [shopBanners, setShopBanners] = useState<BannerDocument[]>(() => db.getAllShopBanners());
  const [showShopBannerModal, setShowShopBannerModal] = useState(false);
  const [editingShopBanner, setEditingShopBanner] = useState<BannerDocument | null>(null);
  const [isUploadingShopBanner, setIsUploadingShopBanner] = useState(false);
  const [shopBannerForm, setShopBannerForm] = useState<Partial<BannerDocument>>({
    title: '',
    subtitle: '',
    badge: 'Hong Kong Direct Hub',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
    destinationRoute: 'shop' as ScreenRoute,
    placement: 'shop',
    displayOrder: 1,
    isActive: true
  });

  useEffect(() => {
    return db.subscribe(() => {
      setShopBanners(db.getAllShopBanners());
    });
  }, []);

  const handleUploadShopBannerFile = async (file: File) => {
    setIsUploadingShopBanner(true);
    try {
      const res = await db.uploadBannerImage(file);
      if (res && res.success) {
        setShopBannerForm(prev => ({ ...prev, imageUrl: res.url }));
        showToast('Banner photo uploaded to Supabase Storage (public.shop_banners)!', 'success');
      } else {
        showToast('Failed to upload banner photo', 'error');
      }
    } catch {
      showToast('Error uploading banner photo', 'error');
    } finally {
      setIsUploadingShopBanner(false);
    }
  };

  const handleOpenAddShopBanner = () => {
    setEditingShopBanner(null);
    setShopBannerForm({
      title: '',
      subtitle: '',
      badge: 'Hong Kong Direct Hub',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
      destinationRoute: 'shop' as ScreenRoute,
      placement: 'shop',
      displayOrder: shopBanners.length + 1,
      isActive: true
    });
    setShowShopBannerModal(true);
  };

  const handleOpenEditShopBanner = (banner: BannerDocument) => {
    setEditingShopBanner(banner);
    setShopBannerForm({ ...banner });
    setShowShopBannerModal(true);
  };

  const handleSaveShopBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopBannerForm.title) {
      showToast('Banner title is required', 'error');
      return;
    }

    if (editingShopBanner) {
      const updated: BannerDocument = {
        ...editingShopBanner,
        title: shopBannerForm.title || editingShopBanner.title,
        subtitle: shopBannerForm.subtitle || '',
        badge: shopBannerForm.badge || '',
        description: shopBannerForm.description || shopBannerForm.subtitle || '',
        placement: 'shop',
        imageUrl: shopBannerForm.imageUrl || editingShopBanner.imageUrl,
        destinationRoute: (shopBannerForm.destinationRoute as ScreenRoute) || 'shop',
        isActive: shopBannerForm.isActive !== undefined ? shopBannerForm.isActive : editingShopBanner.isActive,
        displayOrder: Number(shopBannerForm.displayOrder) || editingShopBanner.displayOrder
      };
      db.updateBanner(updated, 'Admin Shop Manager');
      showToast('Shop image banner updated & synced live', 'success');
    } else {
      const created: BannerDocument = {
        id: `ban_shop_${Date.now()}`,
        title: shopBannerForm.title!,
        subtitle: shopBannerForm.subtitle || '',
        badge: shopBannerForm.badge || 'Hong Kong Direct Hub',
        description: shopBannerForm.description || shopBannerForm.subtitle || '',
        placement: 'shop',
        imageUrl: shopBannerForm.imageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
        destinationRoute: (shopBannerForm.destinationRoute as ScreenRoute) || 'shop',
        isActive: shopBannerForm.isActive !== undefined ? shopBannerForm.isActive : true,
        displayOrder: Number(shopBannerForm.displayOrder) || (shopBanners.length + 1)
      };
      db.addBanner(created, 'Admin Shop Manager');
      showToast('New dynamic image banner published to mobile storefront', 'success');
    }
    setShowShopBannerModal(false);
  };

  const handleToggleShopBanner = (id: string, currentStatus: boolean) => {
    db.toggleBanner(id, !currentStatus, 'Admin Shop Manager');
    showToast(`Banner ${!currentStatus ? 'activated live' : 'hidden from mobile'}`, 'info');
  };

  const handleDeleteShopBanner = (id: string) => {
    if (window.confirm('Delete this shop banner from the mobile storefront?')) {
      db.deleteBanner(id, 'Admin Shop Manager');
      showToast('Banner deleted successfully', 'success');
    }
  };

  const handleMoveShopBanner = (id: string, direction: 'up' | 'down') => {
    const list = shopBanners.slice().sort((a, b) => a.displayOrder - b.displayOrder);
    const index = list.findIndex(b => b.id === id);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === list.length - 1) return;

    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;

    const reorderedIds = list.map(b => b.id);
    db.reorderBanners(reorderedIds, 'Admin Shop Manager');
    showToast(`Banner display priority adjusted (${direction === 'up' ? 'promoted' : 'demoted'})`, 'info');
  };

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
  const [newBrand, setNewBrand] = useState<'Apple' | 'Google Pixel' | 'Samsung'>('Apple');
  const [newModel, setNewModel] = useState('iPhone 16 Pro Max');
  const [newStorage, setNewStorage] = useState('256GB');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80');
  const [newTitle, setNewTitle] = useState('Apple iPhone 16 Pro Max');
  const [newSubtitle, setNewSubtitle] = useState('Desert Titanium • Hong Kong Dual SIM Spec');
  const [newCategory, setNewCategory] = useState<string>('iPhone');
  const [newCondition, setNewCondition] = useState<'Brand New' | 'Refurbished' | 'Fair / Pre-owned'>('Brand New');
  const [newPriceUSD, setNewPriceUSD] = useState('1420');
  const [newPriceNGN, setNewPriceNGN] = useState('2108700');
  const [newPriceRMB, setNewPriceRMB] = useState('10280');
  const [newStock, setNewStock] = useState('12');
  const [newTag, setNewTag] = useState('New Release');
  const [newChip, setNewChip] = useState('Apple A18 Pro (3nm)');
  const [newRAM, setNewRAM] = useState('8GB Unified LPDDR5X');
  const [newDisplay, setNewDisplay] = useState('6.9" Super Retina XDR OLED');
  const [newCamera, setNewCamera] = useState('48MP Fusion + 48MP Ultra-Wide');
  const [newBatteryHealth, setNewBatteryHealth] = useState('100%');
  const [newBiometrics, setNewBiometrics] = useState('Face ID');
  const [newWarranty, setNewWarranty] = useState('1-Year Apple Global Warranty');

  // Edit Product Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editBrand, setEditBrand] = useState('Apple');
  const [editModel, setEditModel] = useState('');
  const [editStorage, setEditStorage] = useState('');
  const [editImage, setEditImage] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editCategory, setEditCategory] = useState('iPhone');
  const [editCondition, setEditCondition] = useState<'Brand New' | 'Refurbished' | 'Fair / Pre-owned'>('Brand New');
  const [editPriceUSD, setEditPriceUSD] = useState('');
  const [editPriceNGN, setEditPriceNGN] = useState('');
  const [editPriceCNY, setEditPriceCNY] = useState('');
  const [editStockCount, setEditStockCount] = useState('');
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [catalogBrandFilter, setCatalogBrandFilter] = useState<'All Brands' | 'Apple' | 'Google Pixel' | 'Samsung'>('All Brands');

  // Multi-Image Gallery State (Add Product)
  const [newImages, setNewImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'
  ]);
  const [manualNewImageUrl, setManualNewImageUrl] = useState('');
  const [isDraggingNew, setIsDraggingNew] = useState(false);
  const [isUploadingNew, setIsUploadingNew] = useState(false);

  // Multi-Image Gallery State (Edit Product)
  const [editImages, setEditImages] = useState<string[]>([]);
  const [manualEditImageUrl, setManualEditImageUrl] = useState('');
  const [isDraggingEdit, setIsDraggingEdit] = useState(false);
  const [isUploadingEdit, setIsUploadingEdit] = useState(false);

  // Variants in Add Product modal
  const [newVariants, setNewVariants] = useState<ProductVariant[]>([
    { id: `v-${Date.now()}-1`, color: 'Desert Titanium', colorHex: '#C2AD97', storage: '256GB', priceAdjustmentNGN: 0, stockCount: 6, isActive: true },
    { id: `v-${Date.now()}-2`, color: 'Desert Titanium', colorHex: '#C2AD97', storage: '512GB', priceAdjustmentNGN: 250000, stockCount: 6, isActive: true }
  ]);

  useEffect(() => {
    return db.subscribe(() => {
      setDbRev(db.getStateRevision());
      const nextState = db.getState();
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
      setDbRev(db.getStateRevision());
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
      setDbRev(db.getStateRevision());
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
      setDbRev(db.getStateRevision());
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
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to save settings', 'error');
    }
  };

  const handleUploadFiles = async (files: FileList | File[], target: 'new' | 'edit') => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(f => f.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(f.name));
    if (validFiles.length === 0) {
      showToast('Please select valid image files (PNG, JPG, WebP)', 'error');
      return;
    }

    if (target === 'new') setIsUploadingNew(true);
    else setIsUploadingEdit(true);

    try {
      const uploadPromises = validFiles.map(file => db.uploadProductImage(file));
      const results = await Promise.all(uploadPromises);
      const successfulUrls = results.map(r => r.url).filter(Boolean);

      if (successfulUrls.length > 0) {
        if (target === 'new') {
          setNewImages(prev => {
            const next = [...prev, ...successfulUrls];
            setNewImage(next[0] || '');
            return next;
          });
        } else {
          setEditImages(prev => {
            const next = [...prev, ...successfulUrls];
            setEditImage(next[0] || '');
            return next;
          });
        }
        showToast(`Uploaded ${successfulUrls.length} image(s) to Supabase Storage!`, 'success');
      }
    } catch {
      showToast('Failed to upload image files', 'error');
    } finally {
      if (target === 'new') setIsUploadingNew(false);
      else setIsUploadingEdit(false);
    }
  };

  const handleAddManualImage = (target: 'new' | 'edit') => {
    const url = target === 'new' ? manualNewImageUrl.trim() : manualEditImageUrl.trim();
    if (!url) {
      showToast('Please enter an image URL', 'error');
      return;
    }
    if (target === 'new') {
      setNewImages(prev => {
        const next = [...prev, url];
        setNewImage(next[0] || '');
        return next;
      });
      setManualNewImageUrl('');
    } else {
      setEditImages(prev => {
        const next = [...prev, url];
        setEditImage(next[0] || '');
        return next;
      });
      setManualEditImageUrl('');
    }
    showToast('Image URL added to gallery!', 'success');
  };

  const handleRemoveImage = (index: number, target: 'new' | 'edit') => {
    if (target === 'new') {
      setNewImages(prev => {
        const next = prev.filter((_, i) => i !== index);
        setNewImage(next[0] || '');
        return next;
      });
    } else {
      setEditImages(prev => {
        const next = prev.filter((_, i) => i !== index);
        setEditImage(next[0] || '');
        return next;
      });
    }
  };

  const handleSetPrimaryImage = (index: number, target: 'new' | 'edit') => {
    if (index === 0) return;
    if (target === 'new') {
      setNewImages(prev => {
        const item = prev[index];
        const next = [item, ...prev.filter((_, i) => i !== index)];
        setNewImage(next[0] || '');
        return next;
      });
    } else {
      setEditImages(prev => {
        const item = prev[index];
        const next = [item, ...prev.filter((_, i) => i !== index)];
        setEditImage(next[0] || '');
        return next;
      });
    }
    showToast('Primary cover image updated', 'success');
  };

  const handleBrandChange = (brand: 'Apple' | 'Google Pixel' | 'Samsung') => {
    setNewBrand(brand);
    if (brand === 'Google Pixel') {
      const pixelGallery = [
        'https://images.unsplash.com/photo-1598327105666-5b89351aff97?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80'
      ];
      setNewImages(pixelGallery);
      setNewModel('Pixel 9 Pro XL');
      setNewCategory('Google Pixel');
      setNewTitle('Google Pixel 9 Pro XL');
      setNewSubtitle('Obsidian Black • Google Tensor G4 • Super Actua OLED');
      setNewChip('Google Tensor G4 (Titan M2)');
      setNewRAM('16GB LPDDR5X');
      setNewDisplay('6.8" Super Actua LTPO OLED (1-120Hz)');
      setNewCamera('50MP Main + 48MP Ultra-Wide + 48MP Telephoto');
      setNewWarranty('1-Year Official Google Limited Warranty');
      setNewBiometrics('In-display Fingerprint & Face Unlock');
      setNewImage(pixelGallery[0]);
      setNewPriceUSD('1099');
      setNewPriceNGN('1632000');
      setNewPriceRMB('7950');
    } else if (brand === 'Samsung') {
      const samsungGallery = [
        'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1580910051074-3eb694886505?auto=format&fit=crop&w=600&q=80'
      ];
      setNewImages(samsungGallery);
      setNewModel('Galaxy S24 Ultra');
      setNewCategory('Samsung');
      setNewTitle('Samsung Galaxy S24 Ultra');
      setNewSubtitle('Titanium Gray • 12GB RAM • Galaxy AI & S-Pen');
      setNewChip('Qualcomm Snapdragon 8 Gen 3 for Galaxy');
      setNewRAM('12GB LPDDR5X');
      setNewDisplay('6.8" Flat QHD+ Dynamic AMOLED 2X');
      setNewCamera('200MP Quad Camera System');
      setNewWarranty('1-Year Samsung Global Warranty');
      setNewBiometrics('Ultrasonic Fingerprint');
      setNewImage(samsungGallery[0]);
      setNewPriceUSD('1299');
      setNewPriceNGN('1929000');
      setNewPriceRMB('9400');
    } else {
      const appleGallery = [
        'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=600&q=80'
      ];
      setNewImages(appleGallery);
      setNewModel('iPhone 16 Pro Max');
      setNewCategory('iPhone');
      setNewTitle('Apple iPhone 16 Pro Max');
      setNewSubtitle('Desert Titanium • Hong Kong Dual SIM Spec');
      setNewChip('Apple A18 Pro (3nm)');
      setNewRAM('8GB Unified LPDDR5X');
      setNewDisplay('6.9" Super Retina XDR OLED');
      setNewCamera('48MP Fusion + 48MP Ultra-Wide');
      setNewWarranty('1-Year Apple Global Warranty');
      setNewBiometrics('Face ID');
      setNewImage(appleGallery[0]);
      setNewPriceUSD('1420');
      setNewPriceNGN('2108700');
      setNewPriceRMB('10280');
    }
  };

  const handleOpenEditProduct = (prod: TechProduct) => {
    setEditingProductId(prod.id);
    const prodGallery = Array.isArray(prod.images) && prod.images.length > 0 
      ? prod.images.filter(Boolean) 
      : (prod.image ? [prod.image] : []);
    setEditImages(prodGallery);
    setEditImage(prodGallery[0] || prod.image || '');
    setEditBrand(prod.brand || (prod.title.includes('Pixel') ? 'Google Pixel' : prod.title.includes('Samsung') ? 'Samsung' : 'Apple'));
    setEditModel(prod.model || prod.title.replace('Apple ', '').replace('Google ', '').replace('Samsung ', ''));
    setEditStorage(prod.storage || prod.storageOptions?.[0] || '256GB');
    setEditTitle(prod.title);
    setEditSubtitle(prod.subtitle || '');
    setEditCategory(prod.category);
    setEditCondition(prod.condition || 'Brand New');
    setEditPriceUSD(String(prod.priceUSD));
    setEditPriceNGN(String(prod.priceNGN));
    setEditPriceCNY(String(prod.priceRMB || prod.priceCNY || Math.round(prod.priceUSD * (rates.USD_CNY || 7.24))));
    setEditStockCount(String(prod.stockCount));
    setShowEditModal(true);
  };

  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProductId) return;
    setIsUpdatingProduct(true);
    try {
      const usd = parseFloat(editPriceUSD) || 1000;
      const ngn = parseFloat(editPriceNGN) || Math.round(usd * (rates.USD_NGN || 1485));
      const cny = parseFloat(editPriceCNY) || Math.round(usd * (rates.USD_CNY || 7.24));
      const stock = parseInt(editStockCount) || 0;
      const finalEditGallery = editImages.length > 0 ? editImages.filter(Boolean) : (editImage ? [editImage] : []);

      db.updateProduct(editingProductId, {
        brand: editBrand,
        model: editModel,
        storage: editStorage,
        image: finalEditGallery[0] || editImage,
        images: finalEditGallery,
        title: editTitle.trim(),
        subtitle: editSubtitle.trim(),
        category: editCategory,
        condition: editCondition,
        priceUSD: usd,
        priceNGN: ngn,
        priceCNY: cny,
        priceRMB: cny,
        stockCount: stock,
        inStock: stock > 0
      });

      firebaseSync.recordAudit('Shop Manager', 'UPDATE_PRODUCT', 'products', editingProductId, `Updated product & prices for ${editTitle}`);
      showToast(`Product "${editTitle}" updated successfully!`, 'success');
      setShowEditModal(false);
      setProducts(db.getProducts());
    } catch (err: any) {
      showToast(err.message || 'Failed to update product', 'error');
    } finally {
      setIsUpdatingProduct(false);
    }
  };

  const handleDeleteProduct = (productId: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}" from the Apple tech catalog?`)) return;
    db.deleteProduct(productId);
    firebaseSync.recordAudit('Shop Manager', 'DELETE_PRODUCT', 'products', productId, `Deleted product ${title}`);
    showToast(`Product "${title}" removed from catalog`, 'success');
    setProducts(db.getProducts());
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
    const rmb = parseFloat(newPriceRMB) || Math.round(usd * (rates.USD_CNY || 7.24));
    const totalVariantStock = newVariants.reduce((sum, v) => sum + (v.stockCount || 0), 0);
    const initialStock = totalVariantStock > 0 ? totalVariantStock : (parseInt(newStock) || 5);
    const finalAddGallery = newImages.length > 0 ? newImages.filter(Boolean) : (newImage ? [newImage] : []);
    const primaryImage = finalAddGallery[0] || newImage || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=600&q=80';

    const newProd: TechProduct = {
      id: `prod-${newBrand.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      brand: newBrand,
      model: newModel,
      storage: newStorage,
      title: newTitle,
      subtitle: newSubtitle,
      category: newCategory,
      condition: newCondition,
      priceUSD: usd,
      priceNGN: ngn,
      priceCNY: rmb,
      priceRMB: rmb,
      image: primaryImage,
      images: finalAddGallery,
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
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'banners' ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Images className="w-3.5 h-3.5" />
            <span>Shop Banners Carousel ({shopBanners.length})</span>
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
          <div className="space-y-4">
            {/* Brand Filter Pills for Admin */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex gap-2">
                {(['All Brands', 'Apple', 'Google Pixel', 'Samsung'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setCatalogBrandFilter(b)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      catalogBrandFilter === b
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Showing {products.filter((p) => catalogBrandFilter === 'All Brands' || p.brand === catalogBrandFilter || (catalogBrandFilter === 'Apple' && !p.brand)).length} devices
              </span>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Brand, Device & Specs</th>
                      <th className="py-3 px-4">Category & Condition</th>
                      <th className="py-3 px-4">Catalog Pricing (USD / NGN / RMB)</th>
                      <th className="py-3 px-4">Variants & Stock</th>
                      <th className="py-3 px-4 text-right">Inventory Adjuster</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {products
                      .filter((prod) => {
                        if (catalogBrandFilter === 'All Brands') return true;
                        if (catalogBrandFilter === 'Apple') return prod.brand === 'Apple' || (!prod.brand && !prod.title.includes('Pixel') && !prod.title.includes('Samsung'));
                        if (catalogBrandFilter === 'Google Pixel') return prod.brand === 'Google Pixel' || prod.category === 'Google Pixel' || prod.title.includes('Pixel');
                        if (catalogBrandFilter === 'Samsung') return prod.brand === 'Samsung' || prod.category === 'Samsung' || prod.title.includes('Samsung') || prod.title.includes('Galaxy');
                        return true;
                      })
                      .map((prod) => {
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
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[9px] font-extrabold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                      {prod.brand || 'Apple'}
                                    </span>
                                    {prod.storage && (
                                      <span className="text-[9px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                        {prod.storage}
                                      </span>
                                    )}
                                  </div>
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
                              <p className="text-[9px] text-indigo-300">¥{(prod.priceRMB || prod.priceCNY || Math.round(prod.priceUSD * 7.24)).toLocaleString()} RMB</p>
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
                          <div className="flex items-center justify-end gap-2">
                            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(prod.id, -1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                                title="Decrease stock"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center font-mono font-bold text-white text-xs">
                                {prod.stockCount}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateStock(prod.id, 1)}
                                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold cursor-pointer"
                                title="Increase stock"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenEditProduct(prod)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs flex items-center gap-1 transition-all cursor-pointer"
                              title="Edit product and prices"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id, prod.title)}
                              className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition-all cursor-pointer"
                              title="Delete product"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
          </div>
        )}

        {/* TAB 2.5: SHOP BANNERS CAROUSEL MANAGEMENT */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                  <Images className="w-5 h-5 text-emerald-400" />
                  <span>Apple & Tech Store Image Carousel Management</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Upload and control dynamic rotating image banners with instant Supabase Storage (public.shop_banners) and real-time storefront synchronization.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddShopBanner}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Upload / Add Shop Banner</span>
              </button>
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {shopBanners
                .slice()
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((banner, idx, arr) => (
                  <div
                    key={banner.id}
                    className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group shadow-xl"
                  >
                    <div>
                      {/* Banner Image Preview */}
                      <div className="relative h-44 w-full overflow-hidden bg-slate-950">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

                        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            banner.isActive 
                              ? 'bg-emerald-500/90 text-slate-950 shadow-md shadow-emerald-500/20' 
                              : 'bg-slate-800/90 text-slate-400'
                          }`}>
                            {banner.isActive ? 'Active on App' : 'Draft / Paused'}
                          </span>

                          <span className="px-2 py-0.8 rounded-full bg-slate-950/80 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                            Order #{banner.displayOrder}
                          </span>
                        </div>

                        <div className="absolute bottom-3 left-3 right-3">
                          {banner.badge && (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase mb-1">
                              {banner.badge}
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-white line-clamp-1">{banner.title}</h3>
                          {banner.subtitle && (
                            <p className="text-[11px] text-slate-300 line-clamp-1">{banner.subtitle}</p>
                          )}
                        </div>
                      </div>

                      {/* Banner Description */}
                      <div className="p-4 space-y-1">
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                          {banner.description || banner.subtitle || 'High-fidelity rotating banner for mobile tech storefront.'}
                        </p>
                      </div>
                    </div>

                    {/* Banner Controls & Reordering */}
                    <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleShopBanner(banner.id, banner.isActive)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            banner.isActive
                              ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {banner.isActive ? 'Pause' : 'Publish'}
                        </button>

                        {/* Reorder Buttons */}
                        <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveShopBanner(banner.id, 'up')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                            title="Move Earlier in Carousel"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === arr.length - 1}
                            onClick={() => handleMoveShopBanner(banner.id, 'down')}
                            className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                            title="Move Later in Carousel"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEditShopBanner(banner)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                          title="Edit Banner"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteShopBanner(banner.id)}
                          className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                          title="Delete Banner"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
              {/* Brand, Model & Storage Selector */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Brand</label>
                  <select
                    value={newBrand}
                    onChange={(e) => handleBrandChange(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Google Pixel">Google Pixel</option>
                    <option value="Samsung">Samsung</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    placeholder="e.g. Pixel 9 Pro XL"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Storage Capacity</label>
                  <input
                    type="text"
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    placeholder="e.g. 256GB / 512GB"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Product Image Gallery & Multi-Upload Component */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-emerald-400" />
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider">
                      Product Image Gallery & Angles
                    </label>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {newImages.length} Image{newImages.length !== 1 ? 's' : ''} (Multi-Upload)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Upload multiple hardware photos (front, back, sides, variant colors) directly to Supabase Storage or add direct URLs.
                </p>

                {/* Dropzone / File Picker */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingNew(true); }}
                  onDragLeave={() => setIsDraggingNew(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingNew(false);
                    if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files, 'new');
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingNew 
                      ? 'border-emerald-400 bg-emerald-500/10' 
                      : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60'
                  }`}
                  onClick={() => {
                    const el = document.getElementById('new-file-input');
                    if (el) el.click();
                  }}
                >
                  <input
                    id="new-file-input"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files && handleUploadFiles(e.target.files, 'new')}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UploadCloud className={`w-6 h-6 ${isUploadingNew ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-200">
                      {isUploadingNew ? 'Uploading to Supabase Storage...' : 'Drop phone photos here or click to browse'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports PNG, JPG, WebP • Auto-synced to Supabase Storage bucket
                    </span>
                  </div>
                </div>

                {/* Dynamic "+ Add Image URL / Upload" Repeater */}
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    value={manualNewImageUrl}
                    onChange={(e) => setManualNewImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManualImage('new'); } }}
                    placeholder="Or paste external image URL (e.g. https://...)"
                    className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-white outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddManualImage('new')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition-all border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Image URL / Upload</span>
                  </button>
                </div>

                {/* Hidden / Synced input for test compatibility */}
                <input
                  type="hidden"
                  value={newImage}
                  onChange={(e) => setNewImage(e.target.value)}
                />

                {/* Image Gallery Cards */}
                {newImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
                    {newImages.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className={`relative group rounded-xl overflow-hidden border bg-slate-900 aspect-square ${
                          idx === 0 ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800'
                        }`}
                      >
                        <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Cover Badge */}
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 bg-emerald-500 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded shadow flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Main
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx, 'new')}
                            title="Set as Main Cover"
                            className="absolute top-1 left-1 bg-black/70 hover:bg-emerald-500 text-white hover:text-slate-950 text-[9px] font-semibold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Main
                          </button>
                        )}

                        {/* Angle index label */}
                        <span className="absolute bottom-1 left-1 bg-black/60 text-slate-300 text-[8px] px-1 rounded">
                          #{idx + 1}
                        </span>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx, 'new')}
                          title="Remove image"
                          className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

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

              <div className="grid grid-cols-4 gap-2.5">
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
                    <option value="Google Pixel">Google Pixel</option>
                    <option value="Samsung">Samsung</option>
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
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white outline-none"
                    required
                  />
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

              {/* Pricing (USD, NGN, RMB) */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Base Price ($ USD)</label>
                  <input
                    type="number"
                    value={newPriceUSD}
                    onChange={(e) => {
                      setNewPriceUSD(e.target.value);
                      const usd = parseFloat(e.target.value) || 0;
                      setNewPriceNGN(String(Math.round(usd * (rates.USD_NGN || 1485))));
                      setNewPriceRMB(String(Math.round(usd * (rates.USD_CNY || 7.24))));
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

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Base Price (¥ RMB)</label>
                  <input
                    type="number"
                    value={newPriceRMB}
                    onChange={(e) => setNewPriceRMB(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-indigo-300 outline-none"
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

      {/* EDIT APPLE PRODUCT & PRICES MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-white">Edit Apple Product & Pricing</h3>
                <p className="text-[10px] text-slate-400">Update hardware details, multi-currency prices, and inventory stock</p>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditModal(false)} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3.5 text-xs">
              {/* Brand, Model & Storage */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Brand</label>
                  <select
                    value={editBrand}
                    onChange={(e) => setEditBrand(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-bold outline-none focus:border-emerald-500"
                  >
                    <option value="Apple">Apple</option>
                    <option value="Google Pixel">Google Pixel</option>
                    <option value="Samsung">Samsung</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Model Name</label>
                  <input
                    type="text"
                    value={editModel}
                    onChange={(e) => setEditModel(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Storage Capacity</label>
                  <input
                    type="text"
                    value={editStorage}
                    onChange={(e) => setEditStorage(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Product Image Gallery & Multi-Upload Component (Edit) */}
              <div className="space-y-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5 text-emerald-400" />
                    <label className="text-[10px] font-bold text-white uppercase tracking-wider">
                      Product Image Gallery & Angles
                    </label>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {editImages.length} Image{editImages.length !== 1 ? 's' : ''} (Multi-Upload)
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Update hardware photos (front, back, sides, variant colors) directly to Supabase Storage or add direct URLs.
                </p>

                {/* Dropzone / File Picker */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingEdit(true); }}
                  onDragLeave={() => setIsDraggingEdit(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingEdit(false);
                    if (e.dataTransfer.files) handleUploadFiles(e.dataTransfer.files, 'edit');
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDraggingEdit 
                      ? 'border-emerald-400 bg-emerald-500/10' 
                      : 'border-slate-800 hover:border-emerald-500/50 bg-slate-900/60'
                  }`}
                  onClick={() => {
                    const el = document.getElementById('edit-file-input');
                    if (el) el.click();
                  }}
                >
                  <input
                    id="edit-file-input"
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={(e) => e.target.files && handleUploadFiles(e.target.files, 'edit')}
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <UploadCloud className={`w-6 h-6 ${isUploadingEdit ? 'text-emerald-400 animate-bounce' : 'text-slate-400'}`} />
                    <span className="text-xs font-semibold text-slate-200">
                      {isUploadingEdit ? 'Uploading to Supabase Storage...' : 'Drop phone photos here or click to browse'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Supports PNG, JPG, WebP • Auto-synced to Supabase Storage bucket
                    </span>
                  </div>
                </div>

                {/* Dynamic "+ Add Image URL / Upload" Repeater */}
                <div className="flex gap-2 items-center pt-1">
                  <input
                    type="text"
                    value={manualEditImageUrl}
                    onChange={(e) => setManualEditImageUrl(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddManualImage('edit'); } }}
                    placeholder="Or paste external image URL (e.g. https://...)"
                    className="flex-1 p-2 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-white outline-none focus:border-emerald-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddManualImage('edit')}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-[11px] flex items-center gap-1 shrink-0 active:scale-95 transition-all border border-slate-700"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Add Image URL / Upload</span>
                  </button>
                </div>

                {/* Hidden / Synced input for test compatibility */}
                <input
                  type="hidden"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                />

                {/* Image Gallery Cards */}
                {editImages.length > 0 && (
                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 pt-2">
                    {editImages.map((imgUrl, idx) => (
                      <div 
                        key={idx} 
                        className={`relative group rounded-xl overflow-hidden border bg-slate-900 aspect-square ${
                          idx === 0 ? 'border-emerald-500 ring-1 ring-emerald-500/50' : 'border-slate-800'
                        }`}
                      >
                        <img src={imgUrl} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Cover Badge */}
                        {idx === 0 ? (
                          <span className="absolute top-1 left-1 bg-emerald-500 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded shadow flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            Main
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx, 'edit')}
                            title="Set as Main Cover"
                            className="absolute top-1 left-1 bg-black/70 hover:bg-emerald-500 text-white hover:text-slate-950 text-[9px] font-semibold px-1 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Set Main
                          </button>
                        )}

                        {/* Angle index label */}
                        <span className="absolute bottom-1 left-1 bg-black/60 text-slate-300 text-[8px] px-1 rounded">
                          #{idx + 1}
                        </span>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx, 'edit')}
                          title="Remove image"
                          className="absolute top-1 right-1 bg-red-500/90 text-white p-1 rounded-full opacity-80 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Product Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="iPhone">iPhone</option>
                    <option value="MacBook">MacBook</option>
                    <option value="iPad">iPad</option>
                    <option value="AirPods">AirPods</option>
                    <option value="Apple Watch">Apple Watch</option>
                    <option value="Google Pixel">Google Pixel</option>
                    <option value="Samsung">Samsung</option>
                    <option value="Accessories">Accessories</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Condition</label>
                  <select
                    value={editCondition}
                    onChange={(e) => setEditCondition(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="Refurbished">Refurbished</option>
                    <option value="Fair / Pre-owned">Fair / Pre-owned</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={editStockCount}
                    onChange={(e) => setEditStockCount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono font-bold text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Multi-Currency Pricing Inputs */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                  Multi-Currency Pricing Matrix
                </span>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">US Dollar ($ USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={editPriceUSD}
                      onChange={(e) => {
                        setEditPriceUSD(e.target.value);
                        const usd = parseFloat(e.target.value) || 0;
                        setEditPriceNGN(String(Math.round(usd * (rates.USD_NGN || 1485))));
                        setEditPriceCNY(String(Math.round(usd * (rates.USD_CNY || 7.24))));
                      }}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-emerald-400 text-xs outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Naira (₦ NGN)</label>
                    <input
                      type="number"
                      value={editPriceNGN}
                      onChange={(e) => setEditPriceNGN(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-white text-xs outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Yuan (¥ CNY)</label>
                    <input
                      type="number"
                      value={editPriceCNY}
                      onChange={(e) => setEditPriceCNY(e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-900 border border-slate-800 font-mono font-bold text-indigo-300 text-xs outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingProduct}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 active:scale-98 transition-all disabled:opacity-50"
                >
                  {isUpdatingProduct ? 'Saving Updates...' : 'Save Product & Prices'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL: CREATE / EDIT SHOP BANNER */}
      {showShopBannerModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-6 sm:pt-10 p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Images className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">
                  {editingShopBanner ? 'Edit Apple Storefront Banner' : 'Upload New Shop Banner'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowShopBannerModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShopBanner} className="space-y-4">
              {/* Banner Cover Image & Supabase Upload */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                  Banner Cover Image (Supabase Storage: <span className="font-mono text-emerald-400">public.shop_banners</span>)
                </label>

                {shopBannerForm.imageUrl && (
                  <div className="relative h-28 w-full rounded-2xl overflow-hidden mb-2.5 border border-slate-800 bg-slate-950">
                    <img 
                      src={shopBannerForm.imageUrl} 
                      alt="Banner Preview" 
                      className="w-full h-full object-cover" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                      <span className="text-[10px] text-slate-300 font-medium line-clamp-1">
                        Preview: {shopBannerForm.title || 'Untitled Banner'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <label className={`flex-1 w-full p-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/70 hover:bg-slate-950 flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer transition-all ${
                    isUploadingShopBanner ? 'opacity-60 pointer-events-none' : ''
                  }`}>
                    <UploadCloud className={`w-4 h-4 ${isUploadingShopBanner ? 'animate-bounce text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isUploadingShopBanner ? 'Uploading to Supabase Storage...' : 'Upload Image (PNG/JPG/WebP)'}</span>
                    <input 
                      type="file" 
                      accept="image/png,image/jpeg,image/webp,image/jpg" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUploadShopBannerFile(file);
                      }} 
                    />
                  </label>

                  <div className="w-full sm:w-1/2">
                    <input
                      type="url"
                      placeholder="Or direct image URL..."
                      value={shopBannerForm.imageUrl}
                      onChange={(e) => setShopBannerForm({ ...shopBannerForm, imageUrl: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Banner Headline</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple iPhone 16 Pro Max"
                    value={shopBannerForm.title}
                    onChange={(e) => setShopBannerForm({ ...shopBannerForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Badge Tag</label>
                  <input
                    type="text"
                    placeholder="e.g. Hong Kong Direct Hub"
                    value={shopBannerForm.badge}
                    onChange={(e) => setShopBannerForm({ ...shopBannerForm, badge: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-1">Subtitle / Key Promotion Specs</label>
                <input
                  type="text"
                  placeholder="e.g. Factory Sealed HK Spec • Dual SIM with 2-4 Days Express Air Cargo to Lagos"
                  value={shopBannerForm.subtitle}
                  onChange={(e) => setShopBannerForm({ ...shopBannerForm, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Action Link / Route</label>
                  <select
                    value={shopBannerForm.destinationRoute}
                    onChange={(e) => setShopBannerForm({ ...shopBannerForm, destinationRoute: e.target.value as ScreenRoute })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="shop">Apple & Tech Store (/shop)</option>
                    <option value="cart">Cart & Checkout (/cart)</option>
                    <option value="logistics">Logistics & Air Cargo (/logistics)</option>
                    <option value="suppliers">VIP Verified Suppliers (/suppliers)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Rotation Order</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={shopBannerForm.displayOrder}
                    onChange={(e) => setShopBannerForm({ ...shopBannerForm, displayOrder: parseInt(e.target.value) || 1 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveShopBanner"
                  checked={shopBannerForm.isActive}
                  onChange={(e) => setShopBannerForm({ ...shopBannerForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 cursor-pointer"
                />
                <label htmlFor="isActiveShopBanner" className="text-xs text-slate-300 font-semibold cursor-pointer">
                  Display active in customer mobile app carousel
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowShopBannerModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
                >
                  {editingShopBanner ? 'Save Changes' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};
