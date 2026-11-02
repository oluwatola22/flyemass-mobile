import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { CHINA_WAREHOUSES } from '../../data/mockData';
import { 
  Plane, 
  Ship, 
  FileBox, 
  Tag, 
  Scale, 
  ArrowRight, 
  ShieldCheck, 
  CheckCheck, 
  Copy, 
  MapPin, 
  Upload, 
  CheckCircle2, 
  AlertCircle,
  Truck,
  Building,
  Home,
  Package,
  Layers,
  ChevronLeft
} from 'lucide-react';

export const RegisterPackageScreen: React.FC = () => {
  const { registerPackage, goBack, navigate, showToast, userProfile, activeUserId } = useApp();

  // Wizard Step: 1 | 2 | 3 | 4 | 5 (Success Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Step 1: Warehouse & Shipping Mark
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<'wh-gz' | 'wh-yiwu' | 'wh-foshan'>('wh-gz');

  // Step 2: Package details
  const [courierCompany, setCourierCompany] = useState<string>('SF Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('SF18920488219');
  const [packageDescription, setPackageDescription] = useState<string>('100x GaN 65W Fast Chargers & Cables');
  const [cartonsCount, setCartonsCount] = useState<string>('2');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<string>('8.5');
  const [declaredValueRMB, setDeclaredValueRMB] = useState<string>('3200');
  const [supplierName, setSupplierName] = useState<string>('Shenzhen Anker Micro Technology');
  const [invoicePhotoUrl, setInvoicePhotoUrl] = useState<string>('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80');
  const [consolidationPreference, setConsolidationPreference] = useState<'ship_immediately' | 'hold_for_consolidation'>('ship_immediately');
  const [repackagingPreference, setRepackagingPreference] = useState<'standard' | 'bubble_wrap' | 'wooden_crate'>('bubble_wrap');

  // Step 3: Routing & Delivery
  const [destinationCountry, setDestinationCountry] = useState<string>('Nigeria');
  const [shippingMode, setShippingMode] = useState<'Air Express' | 'Air Regular' | 'Sea Freight'>('Air Regular');
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'doorstep'>('pickup');
  const [pickupHub, setPickupHub] = useState<string>('Ikeja MMIA Cargo Hub (Lagos)');
  const [doorstepStreet, setDoorstepStreet] = useState<string>('14 Broad Street, Marina');
  const [doorstepCity, setDoorstepCity] = useState<string>('Lagos Island');
  const [doorstepState, setDoorstepState] = useState<string>('Lagos');
  const [doorstepPhone, setDoorstepPhone] = useState<string>(userProfile?.phone || '+234 803 555 9201');

  const customerShippingMark = `FM / ${activeUserId === 'usr_alade_01' ? 'USR-8924' : (userProfile?.flyeTag?.replace('@', '').toUpperCase() || 'USR-8924')} / ${userProfile?.name || 'Chief Babatunde Alade'}`;

  const currentWarehouse = CHINA_WAREHOUSES.find(w => w.id === selectedWarehouseId) || CHINA_WAREHOUSES[0];

  const handleCopy = (text: string, id: string, msg: string = 'Copied!') => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(msg, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Live estimate calculation
  const weightNum = parseFloat(estimatedWeightKg) || 1;
  const ratePerKg = shippingMode === 'Air Express' ? 11.50 : shippingMode === 'Air Regular' ? 9.50 : 3.50;
  const estimatedFreightUSD = Math.round(weightNum * ratePerKg);
  const estimatedFreightNGN = estimatedFreightUSD * 1485;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        title: packageDescription,
        courierCompany,
        chineseCourierTracking: trackingNumber,
        trackingNumber,
        packageDescription,
        cartonsCount: parseInt(cartonsCount) || 1,
        weightKg: weightNum,
        actualWeightKg: weightNum,
        declaredValueRMB: parseFloat(declaredValueRMB) || 0,
        sender: supplierName,
        originWarehouse: currentWarehouse.city,
        mode: shippingMode,
        shippingMode,
        supplierInvoiceUrl: invoicePhotoUrl,
        consolidationPreference,
        repackagingPreference,
        deliveryType,
        pickupHub: deliveryType === 'pickup' ? pickupHub : undefined,
        doorstepAddress: deliveryType === 'doorstep' ? {
          street: doorstepStreet,
          city: doorstepCity,
          state: doorstepState,
          phone: doorstepPhone
        } : undefined,
        destination: `Nigeria (${deliveryType === 'pickup' ? pickupHub : doorstepCity})`,
        costEstimate: estimatedFreightUSD,
        freightFeeUSD: estimatedFreightUSD,
        freightFeeNGN: estimatedFreightNGN
      };

      const result = await registerPackage(payload);
      setCreatedShipment(result?.shipment || {
        shipmentCode: `SL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        trackingCode: `FMCN${Date.now().toString().slice(-8)}NG`,
        pickupOtp: Math.floor(100000 + Math.random() * 900000).toString(),
        originWarehouse: currentWarehouse.city,
        shippingMode,
        weightKg: weightNum
      });
      setCurrentStep(5);
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Register China Parcel" />

      <div className="p-4 space-y-4">
        {/* Wizard Progress Stepper (Steps 1 to 4) */}
        {currentStep <= 4 && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">Step {currentStep} of 4:</span>
              <span className="text-emerald-400">
                {currentStep === 1 && 'Warehouse & Shipping Mark'}
                {currentStep === 2 && 'Package Details & Invoice'}
                {currentStep === 3 && 'Routing & Lagos Delivery'}
                {currentStep === 4 && 'Review & Freight Estimate'}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div
                  key={step}
                  className={`h-1.5 rounded-full transition-all ${
                    step <= currentStep
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-slate-800'
                  }`}
                />
              ))}
            </div>
          </div>
        )}

        {/* STEP 1: WAREHOUSE & SHIPPING MARK */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs">Essential First Step</h4>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Choose where your supplier is sending the goods. Copy the Chinese address and ensure your personal mark is written on every box!
                </p>
              </div>
            </div>

            {/* Warehouse Selector */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                1. Select China Receiving Warehouse
              </label>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'wh-gz', name: 'Guangzhou', label: 'Air & Sea Hub' },
                  { id: 'wh-yiwu', name: 'Yiwu', label: 'Sea & Small Goods' },
                  { id: 'wh-foshan', name: 'Foshan', label: 'Bulky & Furniture' }
                ].map((wh) => (
                  <button
                    key={wh.id}
                    type="button"
                    onClick={() => setSelectedWarehouseId(wh.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedWarehouseId === wh.id
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-extrabold block">{wh.name}</span>
                    <span className="text-[9px] text-slate-500 block mt-0.5">{wh.label}</span>
                  </button>
                ))}
              </div>

              {/* Chinese Address Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    {currentWarehouse.hubName}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(`${currentWarehouse.recipientZh}\n${currentWarehouse.phone}\n${currentWarehouse.addressZh} (唛头/Mark: ${customerShippingMark})`, 'zh-addr', 'Chinese address copied!')}
                    className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg hover:bg-emerald-500/20 transition-all"
                  >
                    {copiedId === 'zh-addr' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'zh-addr' ? 'Copied' : 'Copy Chinese'}</span>
                  </button>
                </div>
                <div className="text-xs space-y-1 text-slate-300">
                  <p><span className="text-slate-500">收件人:</span> <strong className="text-white">{currentWarehouse.recipientZh}</strong></p>
                  <p><span className="text-slate-500">电话:</span> <span className="font-mono text-emerald-400">{currentWarehouse.phone}</span></p>
                  <p><span className="text-slate-500">详细地址:</span> <span className="text-slate-200">{currentWarehouse.addressZh}</span></p>
                </div>
              </div>
            </div>

            {/* Shipping Mark Card */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-2.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                2. Your Personal Shipping Mark
              </label>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                <p className="font-mono text-xs font-bold text-emerald-400 truncate">
                  {customerShippingMark}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(customerShippingMark, 'mark', 'Shipping Mark copied!')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1 shrink-0"
                >
                  {copiedId === 'mark' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedId === 'mark' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Prompt your supplier: <strong>"Please write this mark on all cartons!"</strong></span>
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <span>Next: Enter Package Details</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* STEP 2: PACKAGE DETAILS */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Domestic China Parcel Information
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Chinese Courier Company
                  </label>
                  <select
                    value={courierCompany}
                    onChange={(e) => setCourierCompany(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="SF Express">SF Express (顺丰速运)</option>
                    <option value="ZTO Express">ZTO Express (中通快递)</option>
                    <option value="YTO Express">YTO Express (圆通速递)</option>
                    <option value="J&T Express">J&T Express (极兔速递)</option>
                    <option value="STO Express">STO Express (申通快递)</option>
                    <option value="Deppon Express">Deppon Express (德邦快递)</option>
                    <option value="Other">Other Chinese Courier</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Chinese Courier Tracking #
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="e.g. SF18920488219"
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Item Description & Contents
                </label>
                <input
                  type="text"
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="e.g. 100x GaN 65W Fast Chargers & USB-C Cables"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Supplier / Factory / Store Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="e.g. Shenzhen Anker Micro Technology"
                  className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Cartons Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cartonsCount}
                    onChange={(e) => setCartonsCount(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Est. Weight (kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={estimatedWeightKg}
                    onChange={(e) => setEstimatedWeightKg(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Value (¥ RMB)
                  </label>
                  <input
                    type="number"
                    value={declaredValueRMB}
                    onChange={(e) => setDeclaredValueRMB(e.target.value)}
                    className="w-full p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>
            </div>

            {/* Warehouse Services & Repackaging */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Consolidation & Packaging Preferences
              </h3>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Consolidation Handling</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConsolidationPreference('ship_immediately')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all ${
                      consolidationPreference === 'ship_immediately'
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    Ship Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => setConsolidationPreference('hold_for_consolidation')}
                    className={`p-2.5 rounded-2xl border text-xs font-bold text-center transition-all ${
                      consolidationPreference === 'hold_for_consolidation'
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    Hold for Consolidation
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Packaging Protection</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'standard', name: 'Standard Check' },
                    { id: 'bubble_wrap', name: 'Bubble Wrap' },
                    { id: 'wooden_crate', name: 'Wooden Crate' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setRepackagingPreference(p.id as any)}
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all ${
                        repackagingPreference === p.id
                          ? 'bg-slate-950 border-cyan-500 text-cyan-400'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Supplier Invoice / Waybill Attachment */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Supplier Invoice / Receipt</label>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={invoicePhotoUrl} alt="Invoice" className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                    <div className="text-[11px]">
                      <p className="font-bold text-slate-200">1688_invoice_receipt.jpg</p>
                      <span className="text-emerald-400 font-semibold">Attached & Verified</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Re-upload photo dialog opened', 'info')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-bold hover:bg-slate-700"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Next: Routing & Hub</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: ROUTING & DELIVERY */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Corridor & Shipping Mode
              </h3>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Destination Country</label>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white flex items-center gap-2">
                  <span>🇳🇬 Nigeria (Lagos Hub)</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1.5">Shipping Speed Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Air Express', name: 'Air Express', time: '3–5 Days', rate: '$11.50/kg', icon: Plane },
                    { id: 'Air Regular', name: 'Air Regular', time: '7–10 Days', rate: '$9.50/kg', icon: Plane },
                    { id: 'Sea Freight', name: 'Sea Freight', time: '25–35 Days', rate: '$280/CBM', icon: Ship }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setShippingMode(m.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all ${
                        shippingMode === m.id
                          ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400'
                      }`}
                    >
                      <m.icon className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-[11px] font-bold block">{m.name}</span>
                      <span className="text-[9px] text-slate-500 block">{m.time}</span>
                      <span className="text-[10px] font-extrabold text-white block mt-0.5">{m.rate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Preference */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1.5">Lagos Delivery Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('pickup')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      deliveryType === 'pickup'
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Building className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">Office Hub Pickup</span>
                      <span className="text-[9px] text-slate-500 block">Collect with 6-digit OTP</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryType('doorstep')}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                      deliveryType === 'doorstep'
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Home className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">Doorstep Delivery</span>
                      <span className="text-[9px] text-slate-500 block">Delivered to your address</span>
                    </div>
                  </button>
                </div>
              </div>

              {deliveryType === 'pickup' ? (
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">Select Pickup Center</label>
                  <select
                    value={pickupHub}
                    onChange={(e) => setPickupHub(e.target.value)}
                    className="w-full p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="Ikeja MMIA Cargo Hub (Lagos)">Ikeja MMIA Cargo Hub (Airport Road)</option>
                    <option value="Trade Fair Complex Hub (Badagry Exp)">Trade Fair Complex Hub (Badagry Exp)</option>
                    <option value="Alaba International Market Terminal">Alaba International Market Terminal</option>
                    <option value="Yaba / Mainland Tech Hub (Herbert Macaulay)">Yaba / Mainland Tech Hub (Herbert Macaulay)</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2.5 pt-1">
                  <div>
                    <label className="text-[10px] font-semibold text-slate-400 block mb-1">Street Address</label>
                    <input
                      type="text"
                      value={doorstepStreet}
                      onChange={(e) => setDoorstepStreet(e.target.value)}
                      placeholder="e.g. 14 Broad Street, Marina"
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">City / LGA</label>
                      <input
                        type="text"
                        value={doorstepCity}
                        onChange={(e) => setDoorstepCity(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Recipient Phone</label>
                      <input
                        type="text"
                        value={doorstepPhone}
                        onChange={(e) => setDoorstepPhone(e.target.value)}
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="w-1/3 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Review & Estimate</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & LIVE ESTIMATE */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Package Pre-Alert Summary
              </h3>

              <div className="divide-y divide-slate-800/80 text-xs space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Shipping Mark</span>
                  <span className="font-mono font-bold text-emerald-400">{customerShippingMark}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Origin Warehouse</span>
                  <span className="font-bold text-white">{currentWarehouse.hubName}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Courier & Tracking #</span>
                  <span className="font-mono text-slate-200">{courierCompany} • {trackingNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Contents</span>
                  <span className="font-bold text-slate-200">{packageDescription}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Cartons / Weight</span>
                  <span className="font-bold text-slate-200">{cartonsCount} carton(s) • {estimatedWeightKg} kg</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Declared Value</span>
                  <span className="font-mono font-bold text-amber-400">¥{declaredValueRMB} RMB</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Shipping Mode</span>
                  <span className="font-bold text-cyan-400">{shippingMode}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Lagos Destination</span>
                  <span className="font-bold text-slate-200">
                    {deliveryType === 'pickup' ? pickupHub : `${doorstepStreet}, ${doorstepCity}`}
                  </span>
                </div>
              </div>

              {/* Live Cost Estimate Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Estimated Freight Total:</span>
                  <span className="text-xl font-extrabold text-emerald-400 num-tabular">
                    ${estimatedFreightUSD.toLocaleString()} USD
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>Naira Equivalent (@ ₦1,485/$):</span>
                  <span className="font-extrabold text-white num-tabular">
                    ₦{estimatedFreightNGN.toLocaleString()} NGN
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1">
                  * Final freight is confirmed after arrival, inspection, and weighing at the China warehouse. You can pay freight via wallet or pay on arrival in Lagos.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-1/3 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Registering Parcel...</span>
                ) : (
                  <>
                    <span>Confirm & Pre-Alert</span>
                    <CheckCheck className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: SUCCESS CONFIRMATION */}
        {currentStep === 5 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Package Pre-Alert Registered
              </span>
              <h2 className="text-xl font-black text-white mt-1">Ready for China Intake</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Our dock team will cross-examine this parcel when received from {courierCompany}.
              </p>
            </div>

            {/* Generated Codes Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Shipment Code</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-emerald-400">
                    {createdShipment?.shipmentCode}
                  </span>
                  <button
                    onClick={() => handleCopy(createdShipment?.shipmentCode, 'c-code', 'Shipment code copied!')}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Consignment Barcode</span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {createdShipment?.trackingCode}
                </span>
              </div>

              {createdShipment?.pickupOtp && (
                <div className="border-t border-slate-800/80 pt-2">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 block">
                    Secure 6-Digit Pickup OTP (For Lagos Release)
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-lg font-black tracking-widest text-white bg-indigo-500/10 px-3 py-1 rounded-xl border border-indigo-500/30">
                      {createdShipment?.pickupOtp}
                    </span>
                    <button
                      onClick={() => handleCopy(createdShipment?.pickupOtp, 'otp', 'Pickup OTP copied!')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Copy OTP
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('track')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                <span>Track Package in Cargo Hub</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setCreatedShipment(null);
                }}
                className="w-full py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all"
              >
                Register Another Parcel
              </button>

              <button
                type="button"
                onClick={() => navigate('logistics')}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 font-medium"
              >
                Back to Logistics Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};