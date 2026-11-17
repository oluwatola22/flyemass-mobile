import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { Warehouse, LagosHub } from '../../types';
import { 
  Plane, 
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
  ChevronLeft,
  Globe2,
  FileText
} from 'lucide-react';

export const RegisterPackageScreen: React.FC = () => {
  const { registerPackage, goBack, navigate, showToast, userProfile, activeUserId, warehouses, routeParam } = useApp();

  // Wizard Step: 1 | 2 | 3 | 4 | 5 (Success Confirmation)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [createdShipment, setCreatedShipment] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Step 1: Origin & Receiving Warehouse (China Central Cargo Hubs)
  const [originCountry, setOriginCountry] = useState<'China'>('China');

  // Dynamic active warehouses retrieved from authoritative backend (active only)
  const dbWarehouses = useMemo(() => {
    const list = (warehouses && warehouses.length > 0) ? warehouses : db.getWarehouses(true);
    return list.filter((w) => w.isActive !== false && w.country?.toLowerCase() === 'china');
  }, [warehouses]);

  // Active warehouses matching China central hubs
  const activeWarehouses = useMemo(() => {
    return dbWarehouses.length > 0 ? dbWarehouses : [
      {
        id: 'wh_gz_main',
        name: 'Guangzhou Main Air & Sea Logistics Terminal',
        hubName: 'Guangzhou Main Hub',
        country: 'China',
        province: 'Guangdong Province',
        city: 'Guangzhou',
        fullAddress: 'Room 302, Building B, Shijing International Logistics Park, Baiyun District, Guangzhou, Guangdong Province, China',
        postalCode: '510440',
        phone: '+86 186 2008 9142',
        contactPerson: 'Manager Chen'
      }
    ];
  }, [dbWarehouses]);

  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(() => {
    return activeWarehouses[0]?.id || 'wh_gz_main';
  });

  const activeWarehouseIds = useMemo(() => activeWarehouses.map((w) => w.id).join(','), [activeWarehouses]);

  // Ensure selectedWarehouseId tracks available active warehouses without circular loop
  useEffect(() => {
    if (activeWarehouses.length > 0 && !activeWarehouses.some((w) => w.id === selectedWarehouseId)) {
      setSelectedWarehouseId(activeWarehouses[0].id);
    }
  }, [activeWarehouseIds, selectedWarehouseId]);

  // Scroll to top immediately on screen mount and step advance
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
      try {
        const mainEl = document.querySelector('main');
        if (mainEl) mainEl.scrollTop = 0;
      } catch (_) {}
    }
  }, [currentStep]);

  const currentWarehouse: any = useMemo(() => {
    return activeWarehouses.find((w) => w.id === selectedWarehouseId) || activeWarehouses[0] || {
      id: 'wh_gz_main',
      name: 'Guangzhou Main Warehouse',
      country: 'China',
      province: 'Guangdong Province',
      city: 'Guangzhou',
      fullAddress: 'Room 302, Building B, Shijing International Logistics Park, Baiyun District, Guangzhou, Guangdong Province, China',
      postalCode: '510440',
      phone: '+86 186 2008 9142',
      contactPerson: 'Manager Chen'
    };
  }, [activeWarehouses, selectedWarehouseId]);

  // Step 2 & 3 State
  const [receiverName, setReceiverName] = useState<string>(userProfile?.name || 'Chief Babatunde Alade');
  const [receiverPhone, setReceiverPhone] = useState<string>(userProfile?.phone || '+234 803 555 9201');
  const [courierCompany, setCourierCompany] = useState<string>('SF Express');
  const [trackingNumber, setTrackingNumber] = useState<string>('SF18920488219');
  const [packageDescription, setPackageDescription] = useState<string>('100x GaN 65W Fast Chargers & USB-C Cables');
  const [cartonsCount, setCartonsCount] = useState<string>('2');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState<string>('8.5');
  const [declaredValue, setDeclaredValue] = useState<string>('3200');
  const [supplierName, setSupplierName] = useState<string>('Shenzhen Anker Micro Technology');
  const [expectedArrivalDate, setExpectedArrivalDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  });
  const [lengthCm, setLengthCm] = useState<string>('40');
  const [widthCm, setWidthCm] = useState<string>('30');
  const [heightCm, setHeightCm] = useState<string>('25');
  const [specialInstructions, setSpecialInstructions] = useState<string>('Fragile electronics, keep dry');
  const [repackagingPreference, setRepackagingPreference] = useState<'standard' | 'bubble_wrap' | 'wooden_crate'>('bubble_wrap');
  const [consolidationPreference, setConsolidationPreference] = useState<'ship_immediately' | 'hold_for_consolidation'>('ship_immediately');
  const [invoicePhotoUrl, setInvoicePhotoUrl] = useState<string>('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80');

  // Step 3: Routing & Lagos Delivery
  const [shippingMode, setShippingMode] = useState<'Air Express' | 'Air Regular'>('Air Regular');
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'pickup' | 'delivery'>('pickup');
  const [lagosHubs, setLagosHubs] = useState<LagosHub[]>(() => db.getLagosHubs(true));
  const [selectedHubId, setSelectedHubId] = useState<string>('HUB-IKEJA');
  const [pickupHub, setPickupHub] = useState<string>('Ikeja MMIA Cargo Terminal');
  const [doorstepStreet, setDoorstepStreet] = useState<string>('14 Broad Street, Marina');
  const [doorstepCity, setDoorstepCity] = useState<string>('Lagos Island');
  const [doorstepState, setDoorstepState] = useState<string>('Lagos');
  const [doorstepNotes, setDoorstepNotes] = useState<string>('Call before dispatch');
  const [recipientPhone, setRecipientPhone] = useState<string>(userProfile?.phone || '+234 803 555 9201');

  useEffect(() => {
    let isMounted = true;
    db.lagosHubsQuery(true).then((hubs) => {
      if (isMounted && hubs && hubs.length > 0) {
        setLagosHubs(hubs);
        setSelectedHubId((prevId) => {
          const match = hubs.find(h => h.id === prevId);
          if (match) return prevId;
          return hubs[0].id;
        });
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const uniqueUserId = (userProfile as any)?.shippingMark || userProfile?.flyeTag || (activeUserId === 'usr_alade_01' ? 'FM-USR-8924' : 'FM-USER8921-NG');
  const customerShippingMark = `FM / ${uniqueUserId} / ${userProfile?.name || 'Chief Babatunde Alade'}`;

  const handleCopyWarehouseAddress = (wh: any) => {
    const contactText = wh.contactPerson
      ? `${wh.contactPerson} (Mark: ${customerShippingMark})`
      : `FlyeMass Receiving / ${customerShippingMark}`;

    const formatted = [
      `Warehouse: ${wh.name || wh.hubName}`,
      `Contact / Attn: ${contactText}`,
      `Address: ${wh.fullAddress || wh.addressZh || wh.addressEn}`,
      `City / State: ${wh.city}${wh.province || wh.state ? `, ${wh.province || wh.state}` : ''}`,
      `Country: ${wh.country || 'China'}`,
      wh.postalCode ? `Postal Code: ${wh.postalCode}` : '',
      `Phone: ${wh.phone}`
    ]
      .filter(Boolean)
      .join('\n');

    navigator.clipboard?.writeText(formatted);
    setCopiedId('addr');
    showToast('Warehouse address copied successfully.', 'success');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCopy = (text: string, id: string, msg: string = 'Copied!') => {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    showToast(msg, 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Live pricing & FX synchronization from authoritative database
  const [ratesKey, setRatesKey] = useState<string>(() =>
    JSON.stringify({
      air: db.getAirShippingRates(),
      fx: db.getLogisticsFxRates()
    })
  );

  useEffect(() => {
    return db.subscribe(() => {
      const nextKey = JSON.stringify({
        air: db.getAirShippingRates(),
        fx: db.getLogisticsFxRates()
      });
      setRatesKey((prev) => (prev === nextKey ? prev : nextKey));
    });
  }, []);

  const liveAirRates = useMemo(() => db.getAirShippingRates(), [ratesKey]);
  const liveLogisticsFx = useMemo(() => db.getLogisticsFxRates(), [ratesKey]);

  // Live estimate calculation
  const weightNum = parseFloat(estimatedWeightKg) || 1;
  const isChina = originCountry === 'China';
  const ratePerKg = shippingMode === 'Air Express'
    ? (liveAirRates.expressRatePerKgUSD ?? (isChina ? 13.00 : 13.50))
    : shippingMode === 'Air Regular'
      ? (liveAirRates.normalRatePerKgUSD ?? (isChina ? 9.60 : 11.00))
      : (isChina ? 3.50 : 4.50);
  const handlingFeeUSD = shippingMode === 'Air Express'
    ? (liveAirRates.expressHandlingFeeUSD ?? 0.00)
    : shippingMode === 'Air Regular'
      ? (liveAirRates.normalHandlingFeeUSD ?? 0.00)
      : 0.00;

  const estimatedFreightUSD = Number(((weightNum * ratePerKg) + handlingFeeUSD).toFixed(2));
  const estimatedFreightNGN = Math.round(estimatedFreightUSD * (liveLogisticsFx.usdToNgn || 1400));

  const handleNextStep1 = () => {
    setCurrentStep(2);
  };

  const handleNextStep2 = () => {
    if (!packageDescription.trim()) {
      showToast('Please enter an item description', 'error');
      return;
    }
    if (!trackingNumber.trim()) {
      showToast('Please enter the courier tracking number', 'error');
      return;
    }
    setCurrentStep(3);
  };

  const handleNextStep3 = () => {
    if (fulfillmentMethod === 'delivery' && (!doorstepStreet.trim() || !doorstepCity.trim())) {
      showToast('Please enter your complete doorstep delivery address', 'error');
      return;
    }
    setCurrentStep(4);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const activeHub = lagosHubs.find(h => h.id === selectedHubId) || lagosHubs[0];
      const hubLabel = activeHub?.name || pickupHub || 'Ikeja MMIA Cargo Terminal';
      const secure4DigitOtp = Math.floor(1000 + Math.random() * 9000).toString();

      const payload = {
        warehouseId: currentWarehouse.id,
        originCountry: currentWarehouse.country || originCountry,
        originWarehouse: currentWarehouse.city,
        warehouseSnapshot: {
          id: currentWarehouse.id,
          name: currentWarehouse.name || currentWarehouse.hubName,
          country: currentWarehouse.country || originCountry,
          province: currentWarehouse.province || currentWarehouse.state,
          city: currentWarehouse.city,
          fullAddress: currentWarehouse.fullAddress || currentWarehouse.addressZh || currentWarehouse.addressEn,
          postalCode: currentWarehouse.postalCode,
          phone: currentWarehouse.phone,
          contactPerson: currentWarehouse.contactPerson || currentWarehouse.recipientEn
        },
        shippingMode,
        mode: 'Air Freight',
        courierCompany,
        trackingNumber: trackingNumber.trim(),
        chineseCourierTracking: trackingNumber.trim(),
        packageDescription: packageDescription.trim(),
        title: packageDescription.trim(),
        cartonsCount: parseInt(cartonsCount) || 1,
        weightKg: weightNum,
        actualWeightKg: weightNum,
        dimensions: {
          lengthCm: parseFloat(lengthCm) || 40,
          widthCm: parseFloat(widthCm) || 30,
          heightCm: parseFloat(heightCm) || 25
        },
        declaredValueRMB: parseFloat(declaredValue) || 0,
        sender: supplierName.trim() || (isChina ? 'Chinese Supplier' : 'US Supplier'),
        storeName: supplierName.trim() || (isChina ? 'Chinese Supplier' : 'US Supplier'),
        expectedArrivalDate,
        expectedWarehouseArrival: expectedArrivalDate,
        shippingMark: customerShippingMark,
        userId: activeUserId || (userProfile as any)?.id || (userProfile as any)?.uid || 'usr_alade_01',
        receiverName: receiverName.trim() || userProfile.name,
        customerPhone: recipientPhone.trim() || receiverPhone.trim() || userProfile.phone,
        supplierInvoiceUrl: invoicePhotoUrl,
        consolidationPreference,
        repackagingPreference,
        instructions: specialInstructions.trim(),
        deliveryType: fulfillmentMethod === 'delivery' ? 'doorstep' : 'pickup',
        fulfillmentMethod,
        fulfillment_method: fulfillmentMethod,
        lagosHubId: fulfillmentMethod === 'pickup' ? (activeHub?.id || selectedHubId) : undefined,
        lagos_hub_id: fulfillmentMethod === 'pickup' ? (activeHub?.id || selectedHubId) : undefined,
        lagosHubLabel: fulfillmentMethod === 'pickup' ? hubLabel : undefined,
        lagos_hub_label: fulfillmentMethod === 'pickup' ? hubLabel : undefined,
        pickupHub: fulfillmentMethod === 'pickup' ? hubLabel : undefined,
        doorstepAddress: fulfillmentMethod === 'delivery' ? {
          street: doorstepStreet,
          city: doorstepCity,
          state: doorstepState,
          phone: recipientPhone || receiverPhone,
          notes: doorstepNotes
        } : undefined,
        deliveryAddress: fulfillmentMethod === 'delivery' ? {
          street: doorstepStreet,
          city: doorstepCity,
          state: doorstepState,
          phone: recipientPhone || receiverPhone,
          notes: doorstepNotes
        } : undefined,
        delivery_address: fulfillmentMethod === 'delivery' ? {
          street: doorstepStreet,
          city: doorstepCity,
          state: doorstepState,
          phone: recipientPhone || receiverPhone,
          notes: doorstepNotes
        } : undefined,
        destination: `Nigeria (${fulfillmentMethod === 'pickup' ? hubLabel : doorstepCity})`,
        pickupOtp: secure4DigitOtp,
        costEstimate: estimatedFreightUSD,
        freightFeeUSD: estimatedFreightUSD,
        freightFeeNGN: estimatedFreightNGN
      };

      const result = await registerPackage(payload);
      setCreatedShipment(result?.shipment || {
        shipmentCode: `SL-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        trackingCode: isChina ? `FMCN${Date.now().toString().slice(-8)}` : `FMUS${Date.now().toString().slice(-8)}`,
        pickupOtp: secure4DigitOtp,
        originWarehouse: currentWarehouse.city,
        originCountry,
        shippingMode,
        weightKg: weightNum,
        fulfillmentMethod,
        lagosHubLabel: hubLabel
      });
      setCurrentStep(5);
    } catch (err: any) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-full pb-28 bg-slate-950 text-white">
      <Header title="Register Shipment" />

      {/* Standard Global Logistics Navigation Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800/80 px-4 py-2.5 flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center gap-1.5 text-slate-400">
          <button onClick={() => navigate('logistics')} className="text-emerald-400 font-bold hover:underline cursor-pointer">
            Logistics Hub
          </button>
          <span>/</span>
          <span className="text-white font-semibold">Pre-Alert Shipment</span>
        </div>
        <button
          onClick={() => navigate('track')}
          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[11px] font-bold text-cyan-400 flex items-center gap-1 transition-all cursor-pointer"
        >
          <span>Track Waybills</span>
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Wizard Progress Stepper (Steps 1 to 4) */}
        {currentStep <= 4 && (
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">Step {currentStep} of 4:</span>
              <span className="text-emerald-400">
                {currentStep === 1 && 'Origin & Warehouse'}
                {currentStep === 2 && 'Package Details'}
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

        {/* ======================================================== */}
        {/* STEP 1: ORIGIN & RECEIVING WAREHOUSE */}
        {/* ======================================================== */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-white text-xs">Essential First Step</h4>
                <p className="text-[11px] text-indigo-200 mt-0.5">
                  Choose where your supplier is sending the goods. Copy our hub address and ensure your shipping mark is on outer cartons!
                </p>
              </div>
            </div>

            {/* 1. Country of Origin Selector */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                1. Shipping Origin & Route
              </label>

              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/40 text-left flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🇨🇳</span>
                  <div>
                    <span className="text-xs font-black text-white block">China Central Logistics Terminal</span>
                    <span className="text-[10px] text-emerald-400 font-mono block">Primary Core Route: China ➔ Nigeria</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Guangzhou • Yiwu • Foshan • Shenzhen • Hong Kong</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold font-mono uppercase">
                  Active Origin
                </span>
              </div>
            </div>

            {/* 2. FlyeMass Warehouse Address Section */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-emerald-400" />
                    <span>FlyeMass Warehouse Address</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Official consolidation hub and destination address.
                  </p>
                </div>

                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  {activeWarehouses.length} Active Hubs
                </span>
              </div>

              {/* Warehouse Dropdown / Selector */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                  Select Receiving Warehouse
                </label>
                <select
                  value={selectedWarehouseId}
                  onChange={(e) => setSelectedWarehouseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-medium"
                >
                  {activeWarehouses.map((wh) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.country === 'China' ? '🇨🇳' : wh.country === 'Nigeria' ? '🇳🇬' : '🇺🇸'} {wh.name || wh.hubName} ({wh.city}, {wh.country})
                    </option>
                  ))}
                </select>
              </div>

              {/* Quick Tab Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {activeWarehouses.map((wh) => (
                  <button
                    key={wh.id}
                    type="button"
                    onClick={() => setSelectedWarehouseId(wh.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      selectedWarehouseId === wh.id
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold block truncate">{wh.name || wh.hubName}</span>
                    <span className="text-[10px] text-slate-500 block truncate">{wh.city}, {wh.country}</span>
                  </button>
                ))}
              </div>

              {/* Warehouse Complete Details Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
                  <div>
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <span className="text-sm">{currentWarehouse.country === 'China' ? '🇨🇳' : currentWarehouse.country === 'Nigeria' ? '🇳🇬' : '🇺🇸'}</span>
                      <span>{currentWarehouse.name || currentWarehouse.hubName}</span>
                    </h4>
                    <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                      {currentWarehouse.city}{currentWarehouse.province || currentWarehouse.state ? `, ${currentWarehouse.province || currentWarehouse.state}` : ''} • {currentWarehouse.country}
                    </span>
                  </div>

                  {/* Customer Copy Address Button */}
                  <button
                    type="button"
                    onClick={() => handleCopyWarehouseAddress(currentWarehouse)}
                    className="flex items-center gap-1.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-400 px-3 py-1.5 rounded-xl shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
                  >
                    {copiedId === 'addr' ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedId === 'addr' ? 'Copied!' : 'Copy Address'}</span>
                  </button>
                </div>

                <div className="text-xs space-y-1.5 text-slate-300">
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-semibold w-24 shrink-0">Country:</span>
                    <strong className="text-white">{currentWarehouse.country}</strong>
                  </p>
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-semibold w-24 shrink-0">City:</span>
                    <strong className="text-white">{currentWarehouse.city}</strong>
                  </p>
                  {(currentWarehouse.province || currentWarehouse.state) && (
                    <p className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-semibold w-24 shrink-0">State/Province:</span>
                      <span className="text-slate-200">{currentWarehouse.province || currentWarehouse.state}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-semibold w-24 shrink-0">Address:</span>
                    <span className="text-slate-100 font-sans leading-relaxed select-all">
                      {currentWarehouse.fullAddress || currentWarehouse.addressZh || currentWarehouse.addressEn}
                    </span>
                  </p>
                  {currentWarehouse.postalCode && (
                    <p className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-semibold w-24 shrink-0">Postal Code:</span>
                      <span className="font-mono text-slate-300">{currentWarehouse.postalCode}</span>
                    </p>
                  )}
                  <p className="flex items-start gap-1.5">
                    <span className="text-slate-400 font-semibold w-24 shrink-0">Phone:</span>
                    <span className="font-mono text-emerald-400 font-bold select-all">{currentWarehouse.phone}</span>
                  </p>
                  {(currentWarehouse.contactPerson || currentWarehouse.recipientEn) && (
                    <p className="flex items-start gap-1.5">
                      <span className="text-slate-400 font-semibold w-24 shrink-0">Contact Person:</span>
                      <strong className="text-white">{currentWarehouse.contactPerson || currentWarehouse.recipientEn}</strong>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Shipping Mark Reminder */}
            <div className="p-4 sm:p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl">
              <label className="text-xs font-black uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>3. Your Personal Shipping Mark</span>
              </label>
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="font-mono text-sm sm:text-base font-black text-emerald-400 select-all tracking-tight break-all">
                  {customerShippingMark}
                </p>
                <button
                  type="button"
                  onClick={() => handleCopy(customerShippingMark, 'mark', 'Shipping Mark copied!')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/25 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  {copiedId === 'mark' ? <CheckCheck className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4 stroke-[2.5]" />}
                  <span>{copiedId === 'mark' ? 'Copied!' : 'Copy Full Mark'}</span>
                </button>
              </div>
              <p className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>Tell your supplier: <strong>"Please write this mark on all cartons!"</strong></span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleNextStep1}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Next: Enter Package Details</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 2: PACKAGE DETAILS & INVOICE */}
        {/* ======================================================== */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Package Identification ({originCountry} Origin)
              </h3>

              {/* Personal Shipping Mark Banner */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-950 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Your Dedicated Shipping Mark</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(customerShippingMark, 'mark', 'Shipping mark copied!')}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black text-xs flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                  >
                    {copiedId === 'mark' ? <CheckCheck className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5 stroke-[2.5]" />}
                    <span>{copiedId === 'mark' ? 'Copied!' : 'Copy Mark'}</span>
                  </button>
                </div>
                <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm font-black text-emerald-300 select-all break-all">
                  {customerShippingMark}
                </div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Instruct your supplier/merchant to write this mark on the outside of all parcels for zero-loss automated dock scanning.
                </p>
              </div>


              {/* Receiver Profile Details */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Receiver Full Name
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Receiver Contact Phone
                  </label>
                  <input
                    type="text"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Courier Company & Tracking Number */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Carrier / Courier
                  </label>
                  {isChina ? (
                    <select
                      value={courierCompany}
                      onChange={(e) => setCourierCompany(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="SF Express">SF Express (顺丰速运)</option>
                      <option value="ZTO Express">ZTO Express (中通快递)</option>
                      <option value="YTO Express">YTO Express (圆通速递)</option>
                      <option value="J&T Express">J&T Express (极兔速递)</option>
                      <option value="STO Express">STO Express (申通快递)</option>
                      <option value="Deppon Express">Deppon Express (德邦快递)</option>
                      <option value="Other">Other Chinese Courier</option>
                    </select>
                  ) : (
                    <select
                      value={courierCompany}
                      onChange={(e) => setCourierCompany(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-bold"
                    >
                      <option value="FedEx">FedEx Express</option>
                      <option value="UPS">UPS Ground / Air</option>
                      <option value="USPS">USPS Priority Mail</option>
                      <option value="DHL Express">DHL Express US</option>
                      <option value="Amazon Logistics">Amazon Logistics (TBA)</option>
                      <option value="Other US Carrier">Other US Carrier</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Waybill / Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder={isChina ? "e.g. SF18920488219" : "e.g. 1Z9999999999999999"}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono font-bold outline-none focus:border-emerald-500"
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
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Supplier / Store / Brand Name
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder={isChina ? "e.g. Shenzhen Anker Micro Technology" : "e.g. Apple Store Fifth Ave / Amazon US"}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Expected Warehouse Arrival */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[10px] font-semibold text-slate-400">
                    Expected Warehouse Arrival Date
                  </label>
                  <span className="text-[9px] text-slate-500 font-mono">Dock Pre-Alert</span>
                </div>
                <input
                  type="date"
                  value={expectedArrivalDate}
                  onChange={(e) => setExpectedArrivalDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono outline-none focus:border-emerald-500"
                  required
                />
              </div>

              {/* Quantity, Weight & Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Cartons / Boxes
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cartonsCount}
                    onChange={(e) => setCartonsCount(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500 text-center"
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
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500 text-center"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                    Declared Val ({isChina ? '¥' : '$'})
                  </label>
                  <input
                    type="number"
                    value={declaredValue}
                    onChange={(e) => setDeclaredValue(e.target.value)}
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-bold outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>

              {/* Dimensions (Length, Width, Height) */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Box Dimensions (L × W × H in cm) — Optional
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    value={lengthCm}
                    onChange={(e) => setLengthCm(e.target.value)}
                    placeholder="L (cm)"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 text-center"
                  />
                  <input
                    type="number"
                    value={widthCm}
                    onChange={(e) => setWidthCm(e.target.value)}
                    placeholder="W (cm)"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 text-center"
                  />
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    placeholder="H (cm)"
                    className="w-full p-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 text-center"
                  />
                </div>
              </div>

              {/* Additional Instructions */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">
                  Special Shipping Instructions
                </label>
                <input
                  type="text"
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="e.g. Fragile glass, keep dry, wooden crate required"
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* Packaging Protection & Invoice */}
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Packaging & Supplier Invoice
              </h3>

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
                      className={`p-2 rounded-xl border text-[11px] font-bold text-center transition-all cursor-pointer ${
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

              {/* Invoice Upload Preview */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Supplier Invoice / Receipt</label>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img src={invoicePhotoUrl} alt="Invoice" className="w-10 h-10 rounded-xl object-cover border border-slate-800" />
                    <div className="text-[11px]">
                      <p className="font-bold text-slate-200">commercial_invoice.jpg</p>
                      <span className="text-emerald-400 font-semibold">Attached & Verified</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => showToast('Re-upload photo dialog opened', 'info')}
                    className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 text-[10px] font-bold hover:bg-slate-700 cursor-pointer"
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
                className="w-1/3 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep2}
                className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Next: Routing & Delivery</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 3: ROUTING & LAGOS DELIVERY */}
        {/* ======================================================== */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Corridor & Shipping Mode
              </h3>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1">Destination Country</label>
                <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-bold text-white flex items-center gap-2">
                  <span>🇳🇬 Nigeria (All State Dispatch)</span>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1.5">Shipping Speed Mode</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    {
                      id: 'Air Express',
                      name: 'Air Express',
                      time: '3–5 Days',
                      rate: '₦16,100/kg (≈ ¥83.4)',
                      icon: Plane
                    },
                    {
                      id: 'Air Regular',
                      name: 'Air Regular',
                      time: '7–10 Days',
                      rate: '₦13,300/kg (≈ ¥68.9)',
                      icon: Plane
                    }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setShippingMode(m.id as any)}
                      className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                        shippingMode === m.id
                          ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-sm ring-1 ring-emerald-500/20'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <m.icon className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
                      <span className="text-[11px] font-bold block text-white">{m.name}</span>
                      <span className="text-[9px] text-slate-400 block">{m.time}</span>
                      <span className="text-[10px] font-extrabold text-emerald-400 block mt-0.5">{m.rate}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Delivery Preference */}
              <div>
                <label className="text-[10px] font-semibold text-slate-400 block mb-1.5">Lagos Last-Mile Fulfillment Path</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentMethod('pickup');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      fulfillmentMethod === 'pickup'
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Building className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">Pickup Office</span>
                      <span className="text-[9px] text-slate-500 block">Collect via 4-digit OTP</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFulfillmentMethod('delivery');
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all cursor-pointer ${
                      fulfillmentMethod === 'delivery'
                        ? 'bg-slate-950 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Home className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-xs font-bold block">Doorstep Delivery</span>
                      <span className="text-[9px] text-slate-500 block">Direct courier handover</span>
                    </div>
                  </button>
                </div>
              </div>

              {fulfillmentMethod === 'pickup' ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-semibold text-slate-400 block">
                      Select Lagos Collection Point ({lagosHubs.length} Active Hubs)
                    </label>
                    <span className="text-[9px] text-emerald-400 font-mono">Real-Time Synced</span>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
                    {lagosHubs.map((hub) => {
                      const isSelected = selectedHubId === hub.id;
                      return (
                        <div
                          key={hub.id}
                          onClick={() => {
                            setSelectedHubId(hub.id);
                            setPickupHub(hub.name);
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer text-left ${
                            isSelected
                              ? 'bg-emerald-950/30 border-emerald-500 text-white shadow-sm ring-1 ring-emerald-500/30'
                              : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              {hub.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[9px] font-mono font-bold text-emerald-400">
                              {hub.code}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 leading-snug line-clamp-2">
                            {hub.address}
                          </p>
                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[9px] text-slate-500">
                            <span>{hub.district} • {hub.operatingHours || 'Mon - Sat: 8:00 AM - 6:00 PM'}</span>
                            <span className="font-mono text-emerald-400">{hub.phone}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">City / District</label>
                      <input
                        type="text"
                        value={doorstepCity}
                        onChange={(e) => setDoorstepCity(e.target.value)}
                        placeholder="e.g. Lagos Island"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">State</label>
                      <input
                        type="text"
                        value={doorstepState}
                        onChange={(e) => setDoorstepState(e.target.value)}
                        placeholder="e.g. Lagos"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Recipient Phone</label>
                      <input
                        type="text"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                        placeholder="+234 803 555 9201"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-400 block mb-1">Delivery Notes / Landmark</label>
                      <input
                        type="text"
                        value={doorstepNotes}
                        onChange={(e) => setDoorstepNotes(e.target.value)}
                        placeholder="e.g. Call before dispatch, yellow gate"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
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
                className="w-1/3 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNextStep3}
                className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Review & Estimate</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 4: REVIEW & LIVE ESTIMATE */}
        {/* ======================================================== */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Package Pre-Alert Summary
              </h3>

              <div className="divide-y divide-slate-800/80 text-xs space-y-2">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Route & Origin</span>
                  <span className="font-bold text-white">🇨🇳 China ({currentWarehouse.city}) ➔ 🇳🇬 Nigeria</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Shipping Mark</span>
                  <span className="font-mono font-bold text-emerald-400">{customerShippingMark}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Carrier & Waybill</span>
                  <span className="font-mono text-slate-200">{courierCompany} • {trackingNumber}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Receiver</span>
                  <span className="font-bold text-slate-200">{receiverName} ({recipientPhone || receiverPhone})</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Contents</span>
                  <span className="font-bold text-slate-200">{packageDescription}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Cartons / Weight</span>
                  <span className="font-bold text-slate-200">{cartonsCount} box(es) • {estimatedWeightKg} kg</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Shipping Mode</span>
                  <span className="font-bold text-cyan-400">{shippingMode}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Fulfillment Method</span>
                  <span className="font-bold text-emerald-400">
                    {fulfillmentMethod === 'pickup' ? `Pickup Office (${pickupHub})` : `Doorstep Delivery (${doorstepStreet}, ${doorstepCity})`}
                  </span>
                </div>
                {fulfillmentMethod === 'delivery' && doorstepNotes && (
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Delivery Notes</span>
                    <span className="text-slate-300 italic">{doorstepNotes}</span>
                  </div>
                )}
              </div>

              {/* Live Cost Estimate Card (Naira & RMB Only) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Estimated Freight Total:</span>
                  <span className="text-xl font-extrabold text-emerald-400 num-tabular">
                    ₦{estimatedFreightNGN.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-baseline justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-2">
                  <span>RMB Equivalent (Chinese Yuan):</span>
                  <span className="font-extrabold text-amber-400 num-tabular">
                    ¥{Number((estimatedFreightUSD * (liveLogisticsFx.usdToCny || 7.25)).toFixed(2)).toLocaleString()} RMB
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 pt-1 leading-snug">
                  * Note: Official freight quote will be confirmed upon warehouse arrival, weighing, and inspection. All Nigerian customs duties are included.
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="w-1/3 py-4 rounded-2xl bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs cursor-pointer"
                disabled={isSubmitting}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-2/3 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
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

        {/* ======================================================== */}
        {/* STEP 5: SUCCESS CONFIRMATION */}
        {/* ======================================================== */}
        {currentStep === 5 && (
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-5 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
                Package Pre-Alert Registered
              </span>
              <h2 className="text-xl font-black text-white mt-1">Ready for {originCountry} Intake</h2>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Our warehouse dock in {currentWarehouse.city} will cross-examine this parcel when received from {courierCompany}.
              </p>
            </div>

            {/* Generated Codes Card */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 text-left">
              <div>
                <span className="text-[9px] uppercase font-bold text-slate-500 block">Shipment Reference</span>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-extrabold text-emerald-400">
                    {createdShipment?.shipmentCode}
                  </span>
                  <button
                    onClick={() => handleCopy(createdShipment?.shipmentCode, 'c-code', 'Shipment code copied!')}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 block">FlyeMass Tracking Code</span>
                <span className="font-mono text-xs font-bold text-slate-300">
                  {createdShipment?.trackingCode}
                </span>
              </div>

              {createdShipment?.pickupOtp && (
                <div className="border-t border-slate-800/80 pt-2">
                  <span className="text-[9px] uppercase font-bold text-indigo-400 block">
                    Secure 4-Digit Pickup OTP (For Counter Handover)
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="font-mono text-xl font-black tracking-widest text-white bg-indigo-500/10 px-4 py-1.5 rounded-xl border border-indigo-500/30">
                      OTP: {createdShipment?.pickupOtp}
                    </span>
                    <button
                      onClick={() => handleCopy(createdShipment?.pickupOtp, 'otp', 'Pickup OTP copied!')}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer"
                    >
                      Copy OTP
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Present this 4-digit OTP at {createdShipment?.lagosHubLabel || pickupHub || 'the Lagos station'} to release your package without paperwork.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => navigate('track')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-3 rounded-2xl bg-slate-950 border border-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-800 transition-all cursor-pointer"
              >
                Register Another Parcel
              </button>

              <button
                type="button"
                onClick={() => navigate('logistics')}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-300 font-medium cursor-pointer"
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
