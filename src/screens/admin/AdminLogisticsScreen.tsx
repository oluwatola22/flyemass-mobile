import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db } from '../../services/db';
import { ShipmentDocument, ShippingCorridor } from '../../types';
import { 
  Truck, 
  Plane, 
  Ship, 
  Search, 
  Plus, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  ArrowRight, 
  AlertCircle, 
  X, 
  Scale, 
  Package, 
  ShieldCheck,
  Edit,
  ExternalLink,
  Building2,
  DollarSign,
  AlertTriangle,
  Key,
  Camera,
  Check,
  Receipt,
  Layers,
  ChevronDown,
  Phone,
  Home,
  UserPlus,
  User,
  RefreshCw,
  Calculator,
  Globe,
  Zap,
  Coins,
  Copy,
  CheckCheck,
  Send,
  Boxes,
  QrCode,
  Tag
} from 'lucide-react';

export const ALL_17_LIFECYCLE_STATUSES = [
  'Package Registered',
  'Created',
  'Package Received',
  'Inspection',
  'Packing',
  'Awaiting Payment',
  'Paid — Preparing for Shipment',
  'Dispatched',
  'In Transit',
  'Customs Clearance',
  'Arrived Destination',
  'Ready for Pickup',
  'Out for Delivery',
  'Delivered',
  'Completed',
  'On Hold',
  'Returned'
] as const;

export const AdminLogisticsScreen: React.FC<{
  initialStatusFilter?: string;
  initialMainTab?: 'cargo' | 'warehouses' | 'rates' | 'consolidation';
}> = ({ initialStatusFilter, initialMainTab = 'cargo' }) => {
  const { showToast, navigate, adminUser } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());

  // Main high-level navigation tabs
  const [activeTab, setActiveTab] = useState<'pipeline' | 'intake' | 'consolidation' | 'dispatch' | 'rates' | 'warehouses'>(() => {
    if (initialMainTab === 'warehouses') return 'warehouses';
    if (initialMainTab === 'rates') return 'rates';
    if (initialMainTab === 'consolidation') return 'consolidation';
    return 'pipeline';
  });

  useEffect(() => {
    if (initialMainTab === 'warehouses') setActiveTab('warehouses');
    else if (initialMainTab === 'rates') setActiveTab('rates');
    else if (initialMainTab === 'consolidation') setActiveTab('consolidation');
  }, [initialMainTab]);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [methodFilter, setMethodFilter] = useState<'all' | 'express' | 'normal'>('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Rate settings & Corridor Formulas state
  const corridors = db.getShippingCorridors();
  const [editingCorridor, setEditingCorridor] = useState<ShippingCorridor | null>(null);

  // Package Creation Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTrackingNumber, setNewTrackingNumber] = useState('');
  const [newTitle, setNewTitle] = useState('Commercial Electronics Consignment');
  const [newReceiver, setNewReceiver] = useState('Chief Babatunde Alade');
  const [newAssignedUserId, setNewAssignedUserId] = useState('usr_alade_01');
  const [newOriginCountry, setNewOriginCountry] = useState<'China'>('China');
  const [newOrigin, setNewOrigin] = useState<string>('Guangzhou');
  const [newMode, setNewMode] = useState<'Air Freight'>('Air Freight');
  const [newWeight, setNewWeight] = useState('15.0');
  const [newTier, setNewTier] = useState<'Express Air' | 'Normal Air'>('Normal Air');

  // Milestone Checkpoint Modal state
  const [milestoneShipment, setMilestoneShipment] = useState<ShipmentDocument | null>(null);
  const [milestoneStatus, setMilestoneStatus] = useState('In Transit');
  const [milestoneLocation, setMilestoneLocation] = useState('Guangzhou Baiyun Airport Terminal 2');
  const [milestoneNotes, setMilestoneNotes] = useState('Cargo palletized and cleared for aviation loading');

  // Assign User Modal state
  const [assignUserShipment, setAssignUserShipment] = useState<ShipmentDocument | null>(null);
  const [targetUserId, setTargetUserId] = useState('usr_alade_01');
  const [targetReceiverName, setTargetReceiverName] = useState('');

  // 1. Intake & Inspection Form State
  const [intakeShipment, setIntakeShipment] = useState<ShipmentDocument | null>(null);
  const [intakeActualWeight, setIntakeActualWeight] = useState('8.5');
  const [intakeLength, setIntakeLength] = useState('40');
  const [intakeWidth, setIntakeWidth] = useState('30');
  const [intakeHeight, setIntakeHeight] = useState('25');
  const [intakeCondition, setIntakeCondition] = useState<'Intact' | 'Re-taped' | 'Repackaged' | 'Wooden crate reinforced'>('Intact');
  const [intakeNotes, setIntakeNotes] = useState('Good factory packaging. Barcode scanned.');
  const [intakePhotos, setIntakePhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80'
  ]);

  // 2. Billing Drawer / Modal
  const [billingShipment, setBillingShipment] = useState<ShipmentDocument | null>(null);
  const [billingRatePerKg, setBillingRatePerKg] = useState('9.50');
  const [billingExtraFeeUSD, setBillingExtraFeeUSD] = useState('0');
  const [billingNotes, setBillingNotes] = useState('Standard airport handling included.');

  // 3. Verify Pickup OTP Modal
  const [otpShipment, setOtpShipment] = useState<ShipmentDocument | null>(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [freightCollectedCheck, setFreightCollectedCheck] = useState(false);

  // 4. Assign Dispatch Rider Modal
  const [riderShipment, setRiderShipment] = useState<ShipmentDocument | null>(null);
  const [riderName, setRiderName] = useState('Sunday Adewale');
  const [riderPhone, setRiderPhone] = useState('+234 802 333 4455');
  const [isAssigningRider, setIsAssigningRider] = useState(false);

  // 5. Doorstep Delivery Modal
  const [doorstepShipment, setDoorstepShipment] = useState<ShipmentDocument | null>(null);
  const [doorstepProofNote, setDoorstepProofNote] = useState('Handed directly to recipient at destination address.');
  const [doorstepFreightCollected, setDoorstepFreightCollected] = useState(false);

  // Warehouse Dock Arrival Check-In State
  const [receivingTrackingInput, setReceivingTrackingInput] = useState('');
  const [isReceivingPackage, setIsReceivingPackage] = useState(false);

  // Consolidation State
  const [selectedConsolParcels, setSelectedConsolParcels] = useState<string[]>([]);
  const [consolContainerCode, setConsolContainerCode] = useState(`FM-CONSOL-AIR-${Date.now().toString().slice(-6)}`);
  const [consolDestinationHub, setConsolDestinationHub] = useState('Lagos MMIA Air Cargo Terminal');
  const [consolMode, setConsolMode] = useState<'air_express' | 'air_regular'>('air_express');
  const [isConsolidating, setIsConsolidating] = useState(false);

  // Split-screen Intake & Check-in panel state
  const [isIntakePanelCollapsed, setIsIntakePanelCollapsed] = useState(false);
  const [intakeMode, setIntakeMode] = useState<'new_shipment' | 'dock_checkin'>('new_shipment');

  // Repackage & Bill Freight Modal State (/admin/shipments/[id]/repackage)
  const [repackageShipmentId, setRepackageShipmentId] = useState<string | null>(null);
  const [repackageTier, setRepackageTier] = useState<'Express Air (48h)' | 'Normal Air (5–7d)'>('Normal Air (5–7d)');
  const [repackageWeightKg, setRepackageWeightKg] = useState<string>('25');
  const [volLength, setVolLength] = useState<string>('40');
  const [volWidth, setVolWidth] = useState<string>('30');
  const [volHeight, setVolHeight] = useState<string>('25');
  const [repackageCurrency, setRepackageCurrency] = useState<'NGN' | 'CNY'>('NGN');
  const [repackageChargeInput, setRepackageChargeInput] = useState<string>('0.00');
  const [repackageCustomerNotes, setRepackageCustomerNotes] = useState<string>('');
  const [repackagePhotos, setRepackagePhotos] = useState<string[]>([]);
  const [isSubmittingRepackage, setIsSubmittingRepackage] = useState(false);

  // Air Shipping Rates & Logistics FX Rates State
  const [expressRateInput, setExpressRateInput] = useState<string>(() => (db.getAirShippingRates().expressRatePerKgUSD ?? 13.00).toFixed(2));
  const [expressHandlingInput, setExpressHandlingInput] = useState<string>(() => (db.getAirShippingRates().expressHandlingFeeUSD ?? 0.00).toFixed(2));
  const [normalRateInput, setNormalRateInput] = useState<string>(() => (db.getAirShippingRates().normalRatePerKgUSD ?? 9.60).toFixed(2));
  const [normalHandlingInput, setNormalHandlingInput] = useState<string>(() => (db.getAirShippingRates().normalHandlingFeeUSD ?? 0.00).toFixed(2));
  const [isUpdatingAirRates, setIsUpdatingAirRates] = useState<boolean>(false);

  const [logisticsUsdToNgnInput, setLogisticsUsdToNgnInput] = useState<string>(() => (db.getLogisticsFxRates().usdToNgn ?? 1400.00).toFixed(2));
  const [logisticsUsdToCnyInput, setLogisticsUsdToCnyInput] = useState<string>(() => (db.getLogisticsFxRates().usdToCny ?? 7.25).toFixed(2));
  const [isUpdatingLogisticsFx, setIsUpdatingLogisticsFx] = useState<boolean>(false);

  useEffect(() => {
    return db.subscribe(() => setDbRev(db.getStateRevision()));
  }, []);

  const dbState = db.getState();

  const allShipmentsList = useMemo(() => {
    return Object.values(dbState.shipments || {}).sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0));
  }, [dbState.shipments]);

  const repackageShipment = useMemo(() => {
    if (!repackageShipmentId) return null;
    return dbState.shipments?.[repackageShipmentId] || allShipmentsList.find(s => s.id === repackageShipmentId || s.platformCode === repackageShipmentId || s.trackingCode === repackageShipmentId || s.trackingNumber === repackageShipmentId) || null;
  }, [repackageShipmentId, dbState.shipments, allShipmentsList]);

  // Pipeline Metrics
  const pipelineMetrics = useMemo(() => {
    let pendingCalc = 0;
    let awaitingPayment = 0;
    let inTransit = 0;
    let delivered = 0;
    let originReceived = 0;
    let consolidating = 0;
    let totalFreightUSD = 0;

    for (const s of allShipmentsList) {
      const st = String(s.currentStatus || s.status || '').toLowerCase();
      const paySt = String(s.paymentStatus || '').toLowerCase();
      const isBilled = Boolean(s.isBilled || (s.freightFeeUSD && Number(s.freightFeeUSD) > 0));

      if (!isBilled && !['delivered', 'completed'].includes(st)) pendingCalc++;
      if (st.includes('awaiting') || paySt === 'awaiting_payment') awaitingPayment++;
      if (['dispatched', 'in_transit', 'in transit', 'customs_clearance', 'customs clearance', 'ready_for_dispatch'].includes(st)) inTransit++;
      if (['delivered', 'completed'].includes(st)) delivered++;
      if (['origin received', 'received_warehouse', 'inspection'].includes(st)) originReceived++;
      if (['packed', 'consolidating'].includes(st)) consolidating++;

      if (s.freightFeeUSD) totalFreightUSD += Number(s.freightFeeUSD);
    }

    return {
      total: allShipmentsList.length,
      pendingCalc,
      awaitingPayment,
      inTransit,
      delivered,
      originReceived,
      consolidating,
      totalFreightUSD
    };
  }, [allShipmentsList]);

  // Filtered Shipments for the Table
  const filteredShipments = useMemo(() => {
    return allShipmentsList.filter((s) => {
      const st = String(s.currentStatus || s.status || '').toLowerCase();
      const paySt = String(s.paymentStatus || '').toLowerCase();
      const isBilled = Boolean(s.isBilled || (s.freightFeeUSD && Number(s.freightFeeUSD) > 0));
      const isExpress = String(s.method || s.shippingMethod || s.shippingMode || s.mode || '').toLowerCase().includes('express');

      // Status Filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'pending_calc' && isBilled) return false;
        if (statusFilter === 'awaiting_payment' && !(st.includes('awaiting') || paySt === 'awaiting_payment')) return false;
        if (statusFilter === 'in_transit' && !['dispatched', 'in_transit', 'in transit', 'customs_clearance', 'customs clearance', 'ready_for_dispatch'].includes(st)) return false;
        if (statusFilter === 'delivered' && !['delivered', 'completed'].includes(st)) return false;
        if (statusFilter === 'received' && !['origin received', 'received_warehouse', 'inspection'].includes(st)) return false;
        if (statusFilter === 'consolidating' && !['packed', 'consolidating'].includes(st)) return false;
      }

      // Method Filter
      if (methodFilter === 'express' && !isExpress) return false;
      if (methodFilter === 'normal' && isExpress) return false;

      // Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          (s.platformCode && s.platformCode.toLowerCase().includes(q)) ||
          (s.trackingCode && s.trackingCode.toLowerCase().includes(q)) ||
          (s.trackingNumber && s.trackingNumber.toLowerCase().includes(q)) ||
          (s.shipmentCode && s.shipmentCode.toLowerCase().includes(q)) ||
          (s.packageDescription && s.packageDescription.toLowerCase().includes(q)) ||
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.chineseCourierTracking && s.chineseCourierTracking.toLowerCase().includes(q)) ||
          (s.receiverName && s.receiverName.toLowerCase().includes(q)) ||
          (s.userId && s.userId.toLowerCase().includes(q)) ||
          ((s as any).shippingMark && (s as any).shippingMark.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allShipmentsList, statusFilter, methodFilter, searchQuery]);

  // Live conversion rates
  const liveAirRates = db.getAirShippingRates();
  const liveLogisticsFx = db.getLogisticsFxRates();
  const usdToNgnRate = liveLogisticsFx.usdToNgn || dbState.system_settings?.rates?.USD_NGN || 1400;
  const usdToCnyRate = liveLogisticsFx.usdToCny || dbState.system_settings?.rates?.USD_CNY || 7.25;

  const tierRatePerKgUSD = repackageTier === 'Express Air (48h)'
    ? (liveAirRates.expressRatePerKgUSD ?? 13.00)
    : (liveAirRates.normalRatePerKgUSD ?? 9.60);
  const tierHandlingFeeUSD = repackageTier === 'Express Air (48h)'
    ? (liveAirRates.expressHandlingFeeUSD ?? 0.00)
    : (liveAirRates.normalHandlingFeeUSD ?? 0.00);
  const tierSuggestedUSD = Number((((parseFloat(repackageWeightKg) || 0) * tierRatePerKgUSD) + tierHandlingFeeUSD).toFixed(2));

  const repackageCalculatedUSD = useMemo(() => {
    const val = parseFloat(repackageChargeInput) || 0;
    if (repackageCurrency === 'NGN') return Number((val / usdToNgnRate).toFixed(2));
    if (repackageCurrency === 'CNY') return Number((val / usdToCnyRate).toFixed(2));
    return Number(val.toFixed(2));
  }, [repackageChargeInput, repackageCurrency, usdToNgnRate, usdToCnyRate]);

  const liveConvertedNGN = Math.round(repackageCalculatedUSD * usdToNgnRate);
  const liveConvertedCNY = Number((repackageCalculatedUSD * usdToCnyRate).toFixed(2));

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    showToast(`Copied #${code} to clipboard!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openRepackageModal = (shp: ShipmentDocument) => {
    setRepackageShipmentId(shp.id);
    const isExpress = String(shp.method || shp.shippingMethod || shp.shippingMode || shp.mode || '').toLowerCase().includes('express');
    setRepackageTier(isExpress ? 'Express Air (48h)' : 'Normal Air (5–7d)');
    const w = shp.billableWeightKg || shp.actualWeightKg || shp.weightKg || 25;
    setRepackageWeightKg(String(w));
    setRepackageCurrency('NGN');
    const defaultNgn = shp.freightFeeNGN ? String(shp.freightFeeNGN) : Math.round(((w * (isExpress ? 13 : 9.6)) + (isExpress ? 5 : 0)) * usdToNgnRate).toString();
    setRepackageChargeInput(defaultNgn);
    setRepackageCustomerNotes(shp.customerNotes || shp.billingNotes || '');
    setRepackagePhotos(Array.isArray(shp.warehousePhotos) ? shp.warehousePhotos : Array.isArray(shp.inspectionPhotos) ? shp.inspectionPhotos : []);
  };

  const closeRepackageModal = () => {
    setRepackageShipmentId(null);
  };

  // 1. Submit Intake & Inspection
  const handleConfirmIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeShipment) return;
    const actKg = parseFloat(intakeActualWeight) || 1;
    const l = parseFloat(intakeLength) || 1;
    const w = parseFloat(intakeWidth) || 1;
    const h = parseFloat(intakeHeight) || 1;
    const cbm = (l * w * h) / 1000000;
    const isAir = (intakeShipment.mode || intakeShipment.shippingMode || '').toLowerCase().includes('air');
    const volumetricKg = isAir ? (l * w * h) / 6000 : cbm * 167;
    const billableKg = Math.max(actKg, volumetricKg);

    try {
      await db.intakeShipment(intakeShipment.id, {
        actualWeightKg: actKg,
        dimensions: { lengthCm: l, widthCm: w, heightCm: h },
        cbm: Number(cbm.toFixed(3)),
        billableWeightKg: Number(billableKg.toFixed(2)),
        inspectionPhotos: intakePhotos,
        inspectionNotes: intakeNotes,
        packagingCondition: intakeCondition
      });
      showToast(`Waybill #${intakeShipment.trackingNumber || intakeShipment.trackingCode} intake saved! Billable: ${billableKg.toFixed(1)}kg`, 'success');
      setIntakeShipment(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Intake failed', 'error');
    }
  };

  // 2. Submit Billing
  const handleConfirmBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billingShipment) return;
    const rate = parseFloat(billingRatePerKg) || 9.50;
    const extra = parseFloat(billingExtraFeeUSD) || 0;
    const billableKg = billingShipment.billableWeightKg || billingShipment.actualWeightKg || billingShipment.weightKg || 5;
    const freightUSD = Number(((billableKg * rate) + extra).toFixed(2));
    const freightNGN = Math.round(freightUSD * usdToNgnRate);
    const freightCNY = Number((freightUSD * usdToCnyRate).toFixed(2));

    try {
      await db.billShipment(billingShipment.id, {
        freightFeeUSD: freightUSD,
        freightFeeNGN: freightNGN,
        freightFeeCNY: freightCNY,
        ratePerKg: rate,
        billingNotes
      });
      showToast(`Shipment billed for ₦${freightNGN.toLocaleString()} (¥${freightCNY} RMB / $${freightUSD} USD)! Status: Awaiting Payment.`, 'success');
      setBillingShipment(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Billing failed', 'error');
    }
  };

  // 3. Verify Pickup OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpShipment) return;
    try {
      const res = await db.verifyPickupOtp(otpShipment.id, enteredOtp, freightCollectedCheck, adminUser?.uid || 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`4-Digit OTP Verified! Parcel released to recipient and marked Completed.`, 'success');
      setOtpShipment(null);
      setEnteredOtp('');
      setFreightCollectedCheck(false);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'OTP verification failed', 'error');
    }
  };

  // 4. Assign Dispatch Courier Rider
  const handleAssignRider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!riderShipment) return;
    setIsAssigningRider(true);
    try {
      const res = await db.assignDeliveryRider(riderShipment.id, riderName, riderPhone, adminUser?.uid || 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Rider ${riderName} assigned! Parcel marked Out for Delivery.`, 'success');
      setRiderShipment(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to assign rider', 'error');
    } finally {
      setIsAssigningRider(false);
    }
  };

  // 5. Confirm Doorstep Delivery
  const handleConfirmDoorstep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doorstepShipment) return;
    try {
      const res = await db.confirmDoorstepDelivery(doorstepShipment.id, doorstepProofNote, doorstepFreightCollected, adminUser?.uid || 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Doorstep delivery confirmed! Package marked Delivered.`, 'success');
      setDoorstepShipment(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Delivery confirmation failed', 'error');
    }
  };

  // 6. Dock Arrival Barcode Scanner Check-In
  const handleCheckInArrival = async (codeToUse?: string) => {
    const codeToScan = (codeToUse || receivingTrackingInput).trim();
    if (!codeToScan) {
      showToast('Please enter or scan a courier tracking barcode, waybill, or FlyeTag', 'error');
      return;
    }
    setIsReceivingPackage(true);
    try {
      const res = await db.markWarehouseArrival(codeToScan, 'Scanned into Guangzhou Warehouse intake dock', adminUser?.uid || 'adm-001');
      if (res && res.error) {
        showToast(res.error, 'error');
        return;
      }
      showToast(`Parcel checked in! Waybill #${res.shipment?.trackingNumber || codeToScan} marked Arrived at China Warehouse.`, 'success');
      setReceivingTrackingInput('');
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Check-in failed', 'error');
    } finally {
      setIsReceivingPackage(false);
    }
  };

  // 7. Consolidation Handler
  const handleConsolidatePackages = async () => {
    if (selectedConsolParcels.length === 0) {
      showToast('Select at least one package to consolidate', 'error');
      return;
    }
    setIsConsolidating(true);
    try {
      const res = await db.consolidateShipments(selectedConsolParcels, consolDestinationHub, consolMode, 'usr_alade_01');
      showToast(`Successfully consolidated ${selectedConsolParcels.length} parcels into master container #${res.consolidation?.containerNumber || consolContainerCode}!`, 'success');
      setSelectedConsolParcels([]);
      setConsolContainerCode(`FM-CONSOL-AIR-${Date.now().toString().slice(-6)}`);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Consolidation failed', 'error');
    } finally {
      setIsConsolidating(false);
    }
  };

  // 8. Submit Repackage & Billing
  const handleSetToAwaitingPayment = async () => {
    if (!repackageShipment) return;
    setIsSubmittingRepackage(true);
    try {
      const feeUSD = repackageCalculatedUSD > 0 ? repackageCalculatedUSD : tierSuggestedUSD;
      const feeNGN = Math.round(feeUSD * usdToNgnRate);
      const feeCNY = Number((feeUSD * usdToCnyRate).toFixed(2));
      await db.repackageAndBillShipment({
        shipmentId: repackageShipment.id,
        freightFeeUSD: feeUSD,
        freightFeeNGN: feeNGN,
        freightFeeCNY: feeCNY,
        freightCurrency: repackageCurrency,
        freightAmount: parseFloat(repackageChargeInput) || (repackageCurrency === 'NGN' ? feeNGN : repackageCurrency === 'CNY' ? feeCNY : feeUSD),
        chargeableWeightKg: parseFloat(repackageWeightKg) || repackageShipment.weightKg || 1,
        shippingTier: repackageTier === 'Express Air (48h)' ? 'EXPRESS (48H)' : 'NORMAL (7-15D)',
        ratePerKg: tierRatePerKgUSD,
        customerNotes: repackageCustomerNotes,
        billingNotes: repackageCustomerNotes,
        warehousePhotos: repackagePhotos,
        inspectionPhotos: repackagePhotos,
        adminId: adminUser?.uid || 'adm-001'
      });
      setDbRev(db.getStateRevision());
      showToast(`Waybill ${repackageShipment.platformCode || repackageShipment.trackingNumber} billed (₦${feeNGN.toLocaleString()} / ¥${feeCNY} RMB) & set to Awaiting Payment!`, 'success');
      closeRepackageModal();
    } catch (err: any) {
      showToast(err.message || 'Failed to bill shipment', 'error');
    } finally {
      setIsSubmittingRepackage(false);
    }
  };

  // 9. Update Rates
  const handleUpdateAirRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingAirRates(true);
    try {
      const expR = parseFloat(expressRateInput) || 13.00;
      const expH = parseFloat(expressHandlingInput) || 0.00;
      const nrmR = parseFloat(normalRateInput) || 9.60;
      const nrmH = parseFloat(normalHandlingInput) || 0.00;

      await db.updateAirShippingRates({
        expressRatePerKgUSD: expR,
        expressHandlingFeeUSD: expH,
        normalRatePerKgUSD: nrmR,
        normalHandlingFeeUSD: nrmH
      }, adminUser?.uid || 'adm-001');

      showToast('Air shipping rates updated across platform!', 'success');
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to update rates', 'error');
    } finally {
      setIsUpdatingAirRates(false);
    }
  };
  const handleUpdateAirShippingRates = handleUpdateAirRates;

  const handleUpdateLogisticsFx = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingLogisticsFx(true);
    try {
      const uNgn = parseFloat(logisticsUsdToNgnInput) || 1400.00;
      const uCny = parseFloat(logisticsUsdToCnyInput) || 7.25;

      await db.updateLogisticsFxRates({
        usdToNgn: uNgn,
        usdToCny: uCny
      }, adminUser?.uid || 'adm-001');

      showToast(`Logistics FX updated: 1 USD = ₦${uNgn} | 1 USD = ¥${uCny}`, 'success');
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to update FX', 'error');
    } finally {
      setIsUpdatingLogisticsFx(false);
    }
  };
  const handleUpdateLogisticsFxRates = handleUpdateLogisticsFx;

  // 10. Issue Waybill
  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isExpress = newTier === 'Express Air';
      const weightVal = parseFloat(newWeight) || 1.0;
      await db.registerShipment({
        userId: newAssignedUserId,
        receiverName: newReceiver,
        originWarehouse: newOrigin,
        destination: 'Lagos, NG',
        weightKg: weightVal,
        actualWeightKg: weightVal,
        billableWeightKg: weightVal,
        method: isExpress ? 'EXPRESS (48H)' : 'NORMAL (7-15D)',
        shippingMethod: isExpress ? 'Express Air' : 'Normal Air',
        shippingMode: isExpress ? 'Air Express' : 'Air Regular',
        mode: newMode,
        packageDescription: newTitle,
        title: newTitle,
        chineseCourierTracking: `SF${Math.floor(10000000 + Math.random() * 90000000)}`
      });
      showToast(`Waybill issued successfully!`, 'success');
      setShowCreateModal(false);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to create waybill', 'error');
    }
  };

  // 11. Assign User to Waybill
  const handleConfirmAssignUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignUserShipment) return;
    try {
      await db.assignShipmentUser(
        assignUserShipment.id,
        targetUserId.trim(),
        targetReceiverName.trim() || undefined,
        adminUser?.uid || 'adm-001'
      );
      showToast(`Waybill successfully assigned to customer ${targetUserId}!`, 'success');
      setAssignUserShipment(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Failed to assign user', 'error');
    }
  };

  // 12. Update Milestone
  const handleConfirmMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!milestoneShipment) return;
    try {
      await db.updateShipmentLifecycle(
        milestoneShipment.id,
        milestoneStatus,
        milestoneLocation,
        milestoneNotes
      );
      showToast(`Milestone logged for #${milestoneShipment.trackingNumber || milestoneShipment.trackingCode}!`, 'success');
      setMilestoneShipment(null);
      setDbRev(db.getStateRevision());
    } catch (err: any) {
      showToast(err.message || 'Milestone update failed', 'error');
    }
  };

  // Real-time lookup of user by unique ID, shipping mark, or name in receiving desk
  const identifiedUser = useMemo(() => {
    const q = receivingTrackingInput.trim().toLowerCase();
    if (!q || q.length < 3) return null;
    return Object.values(dbState.users || {}).find(u =>
      (u.uid && u.uid.toLowerCase() === q) ||
      ((u as any).flyeTag && (u as any).flyeTag.toLowerCase() === q) ||
      ((u as any).shippingMark && (u as any).shippingMark.toLowerCase() === q) ||
      (u.fullName && u.fullName.toLowerCase().includes(q))
    ) || null;
  }, [receivingTrackingInput, dbState.users]);

  const userPendingPreAlerts = useMemo(() => {
    if (!identifiedUser) return [];
    return allShipmentsList.filter(s =>
      s.userId === identifiedUser.uid && (s.currentStatus === 'registered' || s.currentStatus === 'pre_alert')
    );
  }, [identifiedUser, allShipmentsList]);

  const unconsolidatedShipments = useMemo(() => {
    return allShipmentsList.filter((s) => s.status !== 'consolidated' && !s.isConsolidatedParent);
  }, [allShipmentsList]);

  return (
    <AdminLayout activeTab="logistics">
      <div className="space-y-6">
        {/* =====================================================================
            1. EXECUTIVE HEADER & ACTION BAR
           ===================================================================== */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-[#293A52]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#94A3B8] mb-1">
              <button
                type="button"
                onClick={() => navigate('admin-dashboard')}
                className="hover:text-[#4778F5] transition-colors cursor-pointer"
              >
                Command Center
              </button>
              <span>/</span>
              <span className="text-[#4778F5]">Shipping & Cargo Pipeline</span>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] animate-pulse" />
              <h1 className="text-2xl font-extrabold text-[#F8FAFC] tracking-tight">
                China ➔ Nigeria Cargo Pipeline
              </h1>
              <span className="px-2.5 py-0.5 rounded-md bg-[#3867E8]/15 border border-[#4778F5]/30 text-[#4778F5] text-[11px] font-bold uppercase tracking-wider">
                Active Operations
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-1">
              Cross-border cargo pipeline · consolidation, transit, customs and last-mile.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => {
                setNewTrackingNumber(`FM-CAN-LOS-${Math.floor(10000 + Math.random() * 90000)}`);
                setShowCreateModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs shadow-md shadow-[#3867E8]/25 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Issue Waybill</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intake')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B2A40] hover:bg-[#263F78]/50 border border-[#293A52] text-[#CBD5E1] hover:text-[#F8FAFC] font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#22B8CF]" />
              <span>Dock Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1B2A40] hover:bg-[#263F78]/50 border border-[#293A52] text-[#CBD5E1] hover:text-[#F8FAFC] font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Calculator className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span>Air & FX Rates</span>
            </button>
          </div>
        </div>

        {/* =====================================================================
            2. HIGH-LEVEL CLICK-TO-FILTER SUMMARY KPI STRIP
           ===================================================================== */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* 1. TOTAL SHIPMENTS */}
          <div
            onClick={() => {
              setActiveTab('pipeline');
              setStatusFilter('all');
            }}
            className={`p-4 rounded-xl bg-[#1F2937] border cursor-pointer transition-all ${
              activeTab === 'pipeline' && statusFilter === 'all'
                ? 'border-[#3867E8] ring-1 ring-[#3867E8]/40 shadow-md'
                : 'border-[#374151] hover:border-[#4778F5]/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold">
              <span>TOTAL SHIPMENTS</span>
              <Package className="w-3.5 h-3.5 text-[#4778F5]" />
            </div>
            <div className="text-xl font-extrabold text-[#FFFFFF] num-tabular mt-1.5">
              {pipelineMetrics.total}
            </div>
            <div className="text-[10px] text-[#CBD5E1] mt-0.5">All shipments in pipeline</div>
          </div>

          {/* 2. IN TRANSIT */}
          <div
            onClick={() => {
              setActiveTab('pipeline');
              setStatusFilter('in_transit');
            }}
            className={`p-4 rounded-xl bg-[#1F2937] border cursor-pointer transition-all ${
              activeTab === 'pipeline' && statusFilter === 'in_transit'
                ? 'border-[#3867E8] ring-1 ring-[#3867E8]/40 shadow-md'
                : 'border-[#374151] hover:border-[#3867E8]/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold">
              <span>IN TRANSIT</span>
              <Plane className="w-3.5 h-3.5 text-[#4778F5]" />
            </div>
            <div className="text-xl font-extrabold text-[#4778F5] num-tabular mt-1.5">
              {pipelineMetrics.inTransit}
            </div>
            <div className="text-[10px] text-[#CBD5E1] mt-0.5">Air Cargo to Nigeria</div>
          </div>

          {/* 3. DELIVERED */}
          <div
            onClick={() => {
              setActiveTab('pipeline');
              setStatusFilter('delivered');
            }}
            className={`p-4 rounded-xl bg-[#1F2937] border cursor-pointer transition-all ${
              activeTab === 'pipeline' && statusFilter === 'delivered'
                ? 'border-[#10B981] ring-1 ring-[#10B981]/40 shadow-md'
                : 'border-[#374151] hover:border-[#10B981]/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold">
              <span>DELIVERED</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
            </div>
            <div className="text-xl font-extrabold text-[#10B981] num-tabular mt-1.5">
              {pipelineMetrics.delivered}
            </div>
            <div className="text-[10px] text-[#CBD5E1] mt-0.5">Handed over & OTP verified</div>
          </div>

          {/* 4. AWAITING PAYMENT */}
          <div
            onClick={() => {
              setActiveTab('pipeline');
              setStatusFilter('awaiting_payment');
            }}
            className={`p-4 rounded-xl bg-[#1F2937] border cursor-pointer transition-all ${
              activeTab === 'pipeline' && statusFilter === 'awaiting_payment'
                ? 'border-[#F59E0B] ring-1 ring-[#F59E0B]/40 shadow-md'
                : 'border-[#374151] hover:border-[#F59E0B]/50'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-[#94A3B8] font-bold">
              <span>AWAITING PAYMENT</span>
              <DollarSign className="w-3.5 h-3.5 text-[#F59E0B]" />
            </div>
            <div className="text-xl font-extrabold text-[#F59E0B] num-tabular mt-1.5">
              {pipelineMetrics.awaitingPayment}
            </div>
            <div className="text-[10px] text-[#CBD5E1] mt-0.5">
              ₦{Math.round(pipelineMetrics.totalFreightUSD * usdToNgnRate).toLocaleString()} freight billed (≈ ¥{Number((pipelineMetrics.totalFreightUSD * usdToCnyRate).toFixed(1))} RMB)
            </div>
          </div>
        </div>

        {/* =====================================================================
            3. PRIMARY LOGISTICS NAVIGATION TABS (SUB-VIEWS & QUICK JUMPS)
           ===================================================================== */}
        <div className="p-1.5 rounded-2xl bg-[#1F2937] border border-[#374151] flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('pipeline')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'pipeline'
                  ? 'bg-[#3867E8] text-white shadow-md shadow-[#3867E8]/25'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#111827]'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Pipeline Table</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rates')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'rates'
                  ? 'bg-[#3867E8] text-white shadow-md shadow-[#3867E8]/25'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#111827]'
              }`}
            >
              <Calculator className="w-4 h-4 text-[#F59E0B]" />
              <span>Air & FX Rates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('intake')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'intake'
                  ? 'bg-[#3867E8] text-white shadow-md shadow-[#3867E8]/25'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#111827]'
              }`}
            >
              <QrCode className="w-4 h-4 text-[#22B8CF]" />
              <span>Dock Scanner</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'dispatch'
                  ? 'bg-[#3867E8] text-white shadow-md shadow-[#3867E8]/25'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#111827]'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-[#10B981]" />
              <span>Detailed Cards & OTP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('consolidation')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'consolidation'
                  ? 'bg-[#3867E8] text-white shadow-md shadow-[#3867E8]/25'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#111827]'
              }`}
            >
              <Layers className="w-4 h-4 text-[#8B7CF6]" />
              <span>Consolidation</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('warehouses')}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                activeTab === 'warehouses'
                  ? 'bg-[#3867E8] text-white shadow-md shadow-[#3867E8]/25'
                  : 'text-[#94A3B8] hover:text-[#FFFFFF] hover:bg-[#111827]'
              }`}
            >
              <Building2 className="w-4 h-4 text-[#CBD5E1]" />
              <span>Hub Addresses</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2 pr-2 text-xs font-bold text-[#94A3B8]">
            <button
              type="button"
              onClick={() => setActiveTab('warehouses')}
              className="text-[#4778F5] hover:underline cursor-pointer"
            >
              Origin Warehouses
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveTab('dispatch')}
              className="text-[#10B981] hover:underline cursor-pointer"
            >
              Lagos Pickup Hubs
            </button>
          </div>
        </div>

        {/* =====================================================================
            TAB 1: ACTIVE CARGO PIPELINE & SPLIT-SCREEN INTAKE
           ===================================================================== */}
        {activeTab === 'pipeline' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Collapsible Panel: New shipment & Dock Check-In */}
            {!isIntakePanelCollapsed && (
              <div className="lg:col-span-4 space-y-4">
                <div className="p-5 rounded-2xl bg-[#1F2937] border border-[#374151] shadow-xl">
                  <div className="flex items-center justify-between pb-3 border-b border-[#374151]">
                    <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#111827]">
                      <button
                        type="button"
                        onClick={() => setIntakeMode('new_shipment')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          intakeMode === 'new_shipment' ? 'bg-[#3867E8] text-white' : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                        }`}
                      >
                        New shipment
                      </button>
                      <button
                        type="button"
                        onClick={() => setIntakeMode('dock_checkin')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          intakeMode === 'dock_checkin' ? 'bg-[#3867E8] text-white' : 'text-[#94A3B8] hover:text-[#FFFFFF]'
                        }`}
                      >
                        Dock Check-In
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsIntakePanelCollapsed(true)}
                      className="text-[#94A3B8] hover:text-[#FFFFFF] text-xs font-bold px-2 py-1 rounded-lg hover:bg-[#111827] cursor-pointer"
                      title="Collapse Panel"
                    >
                      Hide ✕
                    </button>
                  </div>

                  {intakeMode === 'new_shipment' ? (
                    <form onSubmit={handleCreatePackage} className="space-y-3.5 pt-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[#CBD5E1] font-bold">Air Method:</span>
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#111827]">
                          <button
                            type="button"
                            onClick={() => setNewTier('Normal Air')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                              newTier === 'Normal Air' ? 'bg-[#3867E8] text-white shadow-sm' : 'text-[#94A3B8]'
                            }`}
                          >
                            Normal air
                          </button>
                          <button
                            type="button"
                            onClick={() => setNewTier('Express Air')}
                            className={`px-2.5 py-1 rounded-md text-xs font-bold cursor-pointer transition-all ${
                              newTier === 'Express Air' ? 'bg-[#3867E8] text-white shadow-sm' : 'text-[#94A3B8]'
                            }`}
                          >
                            Express air
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Package Title / Consignment:</label>
                        <input
                          type="text"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          placeholder="e.g. Shoes and bags, electronics..."
                          className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] text-xs outline-none focus:border-[#4778F5]"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5">
                        <div>
                          <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Weight (kg):</label>
                          <input
                            type="number"
                            step="0.1"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] text-xs font-mono outline-none focus:border-[#4778F5]"
                            required
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Destination:</label>
                          <input
                            type="text"
                            value="Lagos, NG"
                            readOnly
                            className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#10B981] font-bold text-xs"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Receiver Name:</label>
                        <input
                          type="text"
                          value={newReceiver}
                          onChange={(e) => setNewReceiver(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] text-xs outline-none focus:border-[#4778F5]"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs transition-all shadow-md cursor-pointer"
                      >
                        Create shipment
                      </button>
                    </form>
                  ) : (
                    <div className="space-y-3 pt-3">
                      <label className="text-xs font-bold text-[#CBD5E1] block">Scan Warehouse Barcode / FlyeTag:</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={receivingTrackingInput}
                          onChange={(e) => setReceivingTrackingInput(e.target.value)}
                          placeholder="e.g. SF12345678, SL-2026..."
                          className="flex-1 px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] text-xs font-mono outline-none focus:border-[#22B8CF]"
                        />
                        <button
                          type="button"
                          onClick={() => handleCheckInArrival()}
                          disabled={isReceivingPackage}
                          className="px-3.5 py-2 rounded-xl bg-[#22B8CF] hover:bg-[#22B8CF]/80 text-[#0B0F19] font-extrabold text-xs cursor-pointer disabled:opacity-50"
                        >
                          Check-In
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Right Panel: All Shipments Master Table */}
            <div className={`${isIntakePanelCollapsed ? 'lg:col-span-12' : 'lg:col-span-8'} space-y-4`}>
              {/* Search Bar & Multi-Filter Header */}
              <div className="p-4 rounded-2xl bg-[#1F2937] border border-[#374151] flex flex-col md:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3 w-full md:w-auto">
                  {isIntakePanelCollapsed && (
                    <button
                      type="button"
                      onClick={() => setIsIntakePanelCollapsed(false)}
                      className="px-3 py-1.5 rounded-xl bg-[#111827] border border-[#374151] text-xs font-bold text-[#CBD5E1] hover:text-white cursor-pointer"
                    >
                      + Intake Form
                    </button>
                  )}
                  <h3 className="text-sm font-extrabold text-[#FFFFFF] whitespace-nowrap">All shipments</h3>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search tracking, user ID, client, mark..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] placeholder-[#94A3B8] outline-none focus:border-[#4778F5] text-xs"
                  />
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      statusFilter === 'all' ? 'bg-[#3867E8] text-white' : 'bg-[#111827] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    All Shipments
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('pending_calc')}
                    title="Pending calculation"
                    aria-label="Pending calculation"
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      statusFilter === 'pending_calc' ? 'bg-[#3867E8] text-white' : 'bg-[#111827] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Pending Calculation
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('awaiting_payment')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      statusFilter === 'awaiting_payment' ? 'bg-[#F59E0B] text-black' : 'bg-[#111827] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Awaiting Payment
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('in_transit')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      statusFilter === 'in_transit' ? 'bg-[#3867E8] text-white' : 'bg-[#111827] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    In Transit
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter('delivered')}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                      statusFilter === 'delivered' ? 'bg-[#10B981] text-white' : 'bg-[#111827] text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    Delivered
                  </button>

                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value as any)}
                    className="px-2.5 py-1 rounded-lg bg-[#111827] border border-[#374151] text-[#CBD5E1] text-xs outline-none cursor-pointer"
                  >
                    <option value="all">All Methods</option>
                    <option value="express">Express air only</option>
                    <option value="normal">Normal air only</option>
                  </select>
                </div>
              </div>

              {/* Shipments Data Table */}
              <div className="rounded-2xl bg-[#1F2937] border border-[#374151] overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table data-testid="master-shipments-table" className="w-full text-left border-collapse text-xs divide-y divide-[#374151]">
                    <thead>
                      <tr className="bg-[#111827] text-[#94A3B8] divide-x divide-[#374151]">
                        <th className="py-4 px-4 font-bold">Waybill & Platform Code</th>
                        <th className="py-4 px-4 font-bold">Customer & Consignment</th>
                        <th className="py-4 px-4 font-bold">Route & Tier</th>
                        <th className="py-4 px-4 font-bold">Weight & CBM</th>
                        <th className="py-4 px-4 font-bold">Billing & Freight</th>
                        <th className="py-4 px-4 font-bold">Status</th>
                        <th className="py-4 px-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#374151]">
                      {filteredShipments.map((shp) => {
                        const isExpress = String(shp.method || shp.shippingMethod || shp.shippingMode || shp.mode || '').toLowerCase().includes('express');
                        const waybillCode = shp.platformCode || shp.trackingCode || shp.trackingNumber;
                        const billable = shp.billableWeightKg || shp.actualWeightKg || shp.weightKg || 1;
                        const isBilled = Boolean(shp.isBilled || (shp.freightFeeUSD && Number(shp.freightFeeUSD) > 0));

                        return (
                          <tr key={shp.id} className="hover:bg-[#111827]/60 transition-colors divide-x divide-[#374151]">
                            {/* 1. Waybill & Platform Code */}
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-[#FFFFFF]">{waybillCode}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyCode(waybillCode)}
                                  className="text-[#94A3B8] hover:text-[#FFFFFF] cursor-pointer"
                                  title="Copy tracking code"
                                >
                                  {copiedCode === waybillCode ? <CheckCheck className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                              <div className="text-[10px] text-[#94A3B8] mt-0.5">
                                {new Date(shp.createdAt || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </div>
                              {shp.chineseCourierTracking && (
                                <div className="text-[10px] font-mono text-[#4778F5] truncate max-w-[130px]">
                                  CN: {shp.chineseCourierTracking}
                                </div>
                              )}
                            </td>

                            {/* 2. Customer & Consignment */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-[#FFFFFF]">{shp.receiverName || 'Chief Babatunde Alade'}</div>
                              <div className="text-[10px] font-mono text-[#CBD5E1]">
                                {(shp as any).shippingMark || `FM/USR-${shp.userId.slice(-4)}`}
                              </div>
                              <div className="text-[10px] text-[#94A3B8] truncate max-w-[140px]">
                                {shp.title || shp.packageDescription || 'Commercial Goods'}
                              </div>
                            </td>

                            {/* 3. Route & Tier */}
                            <td className="py-4 px-4">
                              <div className="text-[11px] font-semibold text-[#FFFFFF]">
                                {shp.originWarehouse || 'Guangzhou'} ➔ {shp.destination || 'Lagos, NG'}
                              </div>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold mt-1 ${
                                isExpress 
                                  ? 'bg-[#3867E8]/15 text-[#4778F5] border border-[#4778F5]/30' 
                                  : 'bg-[#111827] text-[#CBD5E1] border border-[#374151]'
                              }`}>
                                <Plane className="w-3 h-3" />
                                <span>{isExpress ? 'Express Air' : 'Normal Air'}</span>
                              </span>
                            </td>

                            {/* 4. Weight & CBM */}
                            <td className="py-4 px-4">
                              <div className="font-mono font-bold text-[#FFFFFF]">
                                {billable} kg <span className="text-[10px] font-normal text-[#94A3B8]">(billable)</span>
                              </div>
                              <div className="text-[10px] text-[#94A3B8] font-mono mt-0.5">
                                Act: {shp.actualWeightKg || shp.weightKg || billable} kg
                                {shp.cbm ? ` • ${shp.cbm} CBM` : ''}
                              </div>
                            </td>

                            {/* 5. Billing & Freight */}
                            <td className="py-4 px-4">
                              {isBilled ? (
                                <div>
                                  <div className="font-mono font-extrabold text-[#10B981] num-tabular">
                                    ₦{(shp.freightFeeNGN || Math.round((shp.freightFeeUSD || billable * 9.5) * usdToNgnRate)).toLocaleString()}
                                  </div>
                                  <div className="text-[10px] font-mono text-[#CBD5E1]">
                                    ¥{(shp.freightFeeCNY || Number(((shp.freightFeeUSD || billable * 9.5) * usdToCnyRate).toFixed(1))).toLocaleString()} RMB
                                  </div>
                                </div>
                              ) : (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] inline-block">
                                  NOT BILLED
                                </span>
                              )}
                            </td>

                            {/* 6. Lifecycle Status */}
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#111827] border border-[#374151] text-[#CBD5E1] inline-block">
                                {shp.currentStatus || 'Package Registered'}
                              </span>
                            </td>

                            {/* 7. Actions */}
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => openRepackageModal(shp)}
                                  className="px-3 py-1.5 rounded-xl bg-[#D96B16] hover:bg-[#c25e12] text-white font-extrabold text-xs transition-all cursor-pointer shadow-md"
                                  title="Repackage & bill freight"
                                >
                                  BILL / REPACKAGE
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setMilestoneShipment(shp);
                                    setMilestoneStatus(shp.currentStatus || 'In Transit');
                                  }}
                                  className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#263F78]/50 border border-[#374151] text-[#CBD5E1] hover:text-[#FFFFFF] transition-all cursor-pointer"
                                  title="Log milestone status"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setOtpShipment(shp)}
                                  className="p-1.5 rounded-lg bg-[#111827] hover:bg-[#263F78]/50 border border-[#374151] text-[#10B981] transition-all cursor-pointer"
                                  title="Verify pickup OTP counter release"
                                >
                                  <Key className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredShipments.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-[#94A3B8]">
                            No cargo waybills match your active search and status filter criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 2: WAREHOUSE DOCK INTAKE & BARCODE SCANNER
           ===================================================================== */}
        {activeTab === 'intake' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Dock Scanner Station */}
            <div className="p-6 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#293A52]">
                <QrCode className="w-5 h-5 text-[#22B8CF]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#F8FAFC]">China Warehouse Dock Receiving Desk</h3>
                  <p className="text-xs text-[#94A3B8]">Scan Chinese courier tracking barcode or enter FlyeTag / Shipping mark</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    Scan or Input Courier Tracking / Waybill # / Shipping Mark:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={receivingTrackingInput}
                      onChange={(e) => setReceivingTrackingInput(e.target.value)}
                      placeholder="e.g. SF1492049281, FM-CAN-LOS-8924, or usr_alade_01"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] placeholder-[#94A3B8] outline-none focus:border-[#4778F5] text-xs font-mono"
                    />
                    <button
                      type="button"
                      disabled={isReceivingPackage}
                      onClick={() => handleCheckInArrival()}
                      className="px-4 py-2.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs transition-all cursor-pointer shadow-md"
                    >
                      {isReceivingPackage ? 'Checking In...' : 'Mark Arrived'}
                    </button>
                  </div>
                </div>

                {identifiedUser && (
                  <div className="p-4 rounded-xl bg-[#152238] border border-[#22B8CF]/40 space-y-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#22B8CF]">Identified Importer / Account</span>
                      <span className="px-2 py-0.5 rounded-md bg-[#22B8CF]/15 text-[#22B8CF] text-[10px] font-bold">
                        {userPendingPreAlerts.length} Pre-Alerts
                      </span>
                    </div>
                    <div className="text-sm font-extrabold text-[#F8FAFC]">{identifiedUser.fullName}</div>
                    <div className="text-xs text-[#94A3B8] font-mono">
                      Shipping Mark: {(identifiedUser as any).shippingMark || 'FM/USR-8924'} • FlyeTag: {(identifiedUser as any).flyeTag || '@alade'}
                    </div>

                    {userPendingPreAlerts.length > 0 && (
                      <div className="pt-2 border-t border-[#293A52] space-y-1.5">
                        <span className="text-[10px] font-bold uppercase text-[#94A3B8]">Awaiting Dock Check-In:</span>
                        {userPendingPreAlerts.map(pa => (
                          <div key={pa.id} className="flex items-center justify-between text-xs p-2 rounded-lg bg-[#1B2A40]">
                            <span className="font-mono text-[#F8FAFC]">{pa.platformCode || pa.trackingNumber}</span>
                            <button
                              type="button"
                              onClick={() => handleCheckInArrival(pa.trackingNumber || pa.platformCode)}
                              className="px-2 py-1 rounded-md bg-[#10B981] hover:bg-[#10B981]/80 text-white font-bold text-[10px] cursor-pointer"
                            >
                              Check In This Parcel
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Weighing & Dimension Intake Form */}
            <div className="p-6 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#293A52]">
                <Scale className="w-5 h-5 text-[#4778F5]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#F8FAFC]">Weighing & Volumetric Calculation</h3>
                  <p className="text-xs text-[#94A3B8]">Compute dimensional weight with aviation formula (L × W × H / 6000)</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Actual Scale Weight (kg):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={intakeActualWeight}
                      onChange={(e) => setIntakeActualWeight(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs font-mono outline-none focus:border-[#4778F5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Packaging Condition:</label>
                    <select
                      value={intakeCondition}
                      onChange={(e) => setIntakeCondition(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs outline-none focus:border-[#4778F5]"
                    >
                      <option value="Intact">Intact Factory Box</option>
                      <option value="Re-taped">Re-taped & Reinforced</option>
                      <option value="Repackaged">Repackaged</option>
                      <option value="Wooden crate reinforced">Wooden Crate Reinforced</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Length (cm):</label>
                    <input
                      type="number"
                      value={intakeLength}
                      onChange={(e) => setIntakeLength(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Width (cm):</label>
                    <input
                      type="number"
                      value={intakeWidth}
                      onChange={(e) => setIntakeWidth(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-[#94A3B8] block mb-1">Height (cm):</label>
                    <input
                      type="number"
                      value={intakeHeight}
                      onChange={(e) => setIntakeHeight(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Auto Calculated Volumetric Metric Well */}
                <div className="p-3.5 rounded-xl bg-[#152238] border border-[#293A52] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#94A3B8] text-[10px] block">Aviation Volumetric Weight:</span>
                    <span className="font-extrabold text-[#F8FAFC] font-mono text-sm">
                      {((parseFloat(intakeLength) * parseFloat(intakeWidth) * parseFloat(intakeHeight)) / 6000).toFixed(2)} kg
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#94A3B8] text-[10px] block">Billable Weight (Max):</span>
                    <span className="font-extrabold text-[#10B981] font-mono text-base">
                      {Math.max(
                        parseFloat(intakeActualWeight) || 0,
                        (parseFloat(intakeLength) * parseFloat(intakeWidth) * parseFloat(intakeHeight)) / 6000
                      ).toFixed(2)} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 3: CONTAINER CONSOLIDATION
           ===================================================================== */}
        {activeTab === 'consolidation' && (
          <div className="p-6 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#293A52]">
              <div>
                <h3 className="text-sm font-extrabold text-[#F8FAFC]">Container Consolidation Station</h3>
                <p className="text-xs text-[#94A3B8]">Select multiple intake parcels to group into an air flight cargo crate or container</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={consolContainerCode}
                  onChange={(e) => setConsolContainerCode(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono text-xs"
                />
                <button
                  type="button"
                  disabled={isConsolidating || selectedConsolParcels.length === 0}
                  onClick={handleConsolidatePackages}
                  className="px-4 py-1.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  {isConsolidating ? 'Consolidating...' : `Consolidate (${selectedConsolParcels.length})`}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-[#94A3B8]">Unconsolidated Intake Parcels:</span>
              <div className="divide-y divide-[#293A52] rounded-xl bg-[#152238] border border-[#293A52] max-h-96 overflow-y-auto">
                {unconsolidatedShipments.map((s) => {
                  const isChecked = selectedConsolParcels.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSelectedConsolParcels(prev => 
                          isChecked ? prev.filter(id => id !== s.id) : [...prev, s.id]
                        );
                      }}
                      className={`p-3.5 flex items-center justify-between text-xs cursor-pointer transition-colors ${
                        isChecked ? 'bg-[#3867E8]/10' : 'hover:bg-[#1B2A40]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-[#3867E8] cursor-pointer"
                        />
                        <div>
                          <span className="font-mono font-bold text-[#F8FAFC]">{s.platformCode || s.trackingNumber}</span>
                          <span className="text-[#94A3B8] ml-2">• {s.receiverName}</span>
                          <p className="text-[10px] text-[#94A3B8]">{s.title || 'General Cargo'}</p>
                        </div>
                      </div>

                      <div className="text-right font-mono font-bold text-[#F8FAFC]">
                        {s.weightKg || s.actualWeightKg || 5} kg
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 4: LAGOS LAST-MILE DISPATCH & 4-DIGIT OTP HANDOVER
           ===================================================================== */}
        {activeTab === 'dispatch' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 4-Digit Pickup OTP Counter Verification */}
            <div className="p-6 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#293A52]">
                <Key className="w-5 h-5 text-[#10B981]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#F8FAFC]">Lagos Counter Pickup OTP Verification</h3>
                  <p className="text-xs text-[#94A3B8]">Client presents 4-digit security OTP to authorize package release</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Enter 4-Digit Customer OTP:</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full p-3 rounded-xl bg-[#152238] border border-[#293A52] text-center font-mono text-2xl tracking-widest text-[#F8FAFC] outline-none focus:border-[#10B981]"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-[#CBD5E1]">
                  <input
                    type="checkbox"
                    id="freightCollected"
                    checked={freightCollectedCheck}
                    onChange={(e) => setFreightCollectedCheck(e.target.checked)}
                    className="w-4 h-4 rounded text-[#10B981]"
                  />
                  <label htmlFor="freightCollected" className="cursor-pointer">
                    Confirm all applicable freight and delivery fees are settled
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleVerifyOtp}
                  disabled={enteredOtp.length !== 4}
                  className="w-full py-3 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-white font-extrabold text-xs transition-all cursor-pointer disabled:opacity-50 shadow-md"
                >
                  Verify OTP & Release Cargo
                </button>
              </div>
            </div>

            {/* Courier Rider Dispatch Assignment */}
            <div className="p-6 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#293A52]">
                <Truck className="w-5 h-5 text-[#3867E8]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#F8FAFC]">Lagos Doorstep Rider Dispatch</h3>
                  <p className="text-xs text-[#94A3B8]">Assign dispatch dispatch rider for Ikeja, Lekki, or Alaba doorstep deliveries</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Rider Full Name:</label>
                  <input
                    type="text"
                    value={riderName}
                    onChange={(e) => setRiderName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs outline-none focus:border-[#3867E8]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Rider Phone Number:</label>
                  <input
                    type="text"
                    value={riderPhone}
                    onChange={(e) => setRiderPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs font-mono outline-none focus:border-[#3867E8]"
                  />
                </div>

                <div className="p-3 rounded-xl bg-[#152238] border border-[#293A52] text-xs text-[#94A3B8]">
                  Assigning rider automatically updates shipment status to <strong className="text-[#F8FAFC]">Out for Delivery</strong> and sends SMS alert to customer.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            TAB 5: AIR & LOGISTICS FX RATES
           ===================================================================== */}
        {activeTab === 'rates' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Air Cargo Freight Rates */}
            <form onSubmit={handleUpdateAirRates} className="p-6 rounded-2xl bg-[#1F2937] border border-[#374151] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-[#374151]">
                <Calculator className="w-5 h-5 text-[#4778F5]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#FFFFFF]">Air shipping rates</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Air-only freight pricing displayed to every user. Sea freight has been retired. Changes push live instantly.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                      Express Air Shipping
                      <span className="block text-[10px] text-[#94A3B8] font-normal uppercase mt-0.5">
                        PER KILOGRAM (KG) · DELIVERED IN 48 HOURS (2 DAYS)
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={expressRateInput}
                      onChange={(e) => setExpressRateInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-xs outline-none focus:border-[#4778F5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                      Express handling / clearance fee
                      <span className="block text-[10px] text-[#94A3B8] font-normal uppercase mt-0.5">
                        FLAT BASE FEE ADDED TO EVERY EXPRESS QUOTE
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={expressHandlingInput}
                      onChange={(e) => setExpressHandlingInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-xs outline-none focus:border-[#4778F5]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                      Normal Air Shipping
                      <span className="block text-[10px] text-[#94A3B8] font-normal uppercase mt-0.5">
                        PER KILOGRAM (KG) · DELIVERED IN 5-7 WORKING DAYS
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={normalRateInput}
                      onChange={(e) => setNormalRateInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-xs outline-none focus:border-[#4778F5]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                      Normal handling / clearance fee
                      <span className="block text-[10px] text-[#94A3B8] font-normal uppercase mt-0.5">
                        FLAT BASE FEE ADDED TO EVERY NORMAL AIR QUOTE
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={normalHandlingInput}
                      onChange={(e) => setNormalHandlingInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-xs outline-none focus:border-[#4778F5]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingAirRates}
                  className="w-full py-2.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isUpdatingAirRates ? 'Saving...' : 'Update Rates'}
                </button>
              </div>
            </form>

            {/* Logistics FX Rates */}
            <form onSubmit={handleUpdateLogisticsFx} className="p-6 rounded-2xl bg-[#1F2937] border border-[#374151] space-y-4 shadow-xl">
              <div className="flex items-center gap-2 pb-3 border-b border-[#374151]">
                <Coins className="w-5 h-5 text-[#10B981]" />
                <div>
                  <h3 className="text-sm font-extrabold text-[#FFFFFF]">Logistics FX rates</h3>
                  <p className="text-xs text-[#94A3B8]">
                    Independent of the peer-to-peer wallet swap rate. Real-time rates used to convert tariffs into NGN and RMB.
                  </p>
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    Air Freight NGN Clearing Factor
                    <span className="block text-[10px] text-[#94A3B8] font-normal uppercase mt-0.5">
                      NAIRA CLEARING RATE FOR FREIGHT
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={logisticsUsdToNgnInput}
                    onChange={(e) => setLogisticsUsdToNgnInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-xs outline-none focus:border-[#10B981]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">
                    Air Freight CNY Clearing Factor
                    <span className="block text-[10px] text-[#94A3B8] font-normal uppercase mt-0.5">
                      RMB CLEARING RATE FOR FREIGHT
                    </span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={logisticsUsdToCnyInput}
                    onChange={(e) => setLogisticsUsdToCnyInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#111827] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-xs outline-none focus:border-[#10B981]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingLogisticsFx}
                  className="w-full py-2.5 rounded-xl bg-[#10B981] hover:bg-[#10B981]/90 text-white font-extrabold text-xs transition-all cursor-pointer shadow-md disabled:opacity-50"
                >
                  {isUpdatingLogisticsFx ? 'Saving...' : 'Update FX Rates'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================================================================
            TAB 6: CHINA ORIGIN WAREHOUSES
           ===================================================================== */}
        {activeTab === 'warehouses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Guangzhou Main Air Hub',
                city: 'Guangzhou, Guangdong',
                zh: '广东省广州市白云区太和镇永兴工业区18号',
                code: 'CAN-01',
                tel: '+86 20 8743 9922'
              },
              {
                name: 'Yiwu International Trade Hub',
                city: 'Yiwu, Zhejiang',
                zh: '浙江省义乌市北苑街道拥军路88号',
                code: 'YIWU-02',
                tel: '+86 579 8555 8811'
              },
              {
                name: 'Shenzhen Tech Warehouse',
                city: 'Shenzhen, Guangdong',
                zh: '广东省深圳市宝安区福永街道物流园A座',
                code: 'SZX-03',
                tel: '+86 755 2738 6644'
              },
              {
                name: 'Foshan Furniture & Ceramics Hub',
                city: 'Foshan, Guangdong',
                zh: '广东省佛山市顺德区乐从镇钢铁物流区B栋',
                code: 'FOS-04',
                tel: '+86 757 2883 1199'
              },
              {
                name: 'Hong Kong Air Transit Facility',
                city: 'Hong Kong SAR',
                zh: '香港九龍葵涌葵豐街28-36號業豐工業大廈',
                code: 'HKG-05',
                tel: '+852 2399 4411'
              }
            ].map((wh) => (
              <div key={wh.code} className="p-5 rounded-2xl bg-[#1B2A40] border border-[#293A52] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-[#F8FAFC] text-sm">{wh.name}</span>
                  <span className="px-2 py-0.5 rounded-md bg-[#3867E8]/15 text-[#4778F5] font-mono text-[10px] font-bold">
                    {wh.code}
                  </span>
                </div>
                <div className="text-xs text-[#94A3B8]">{wh.city}</div>
                <div className="p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-xs font-mono text-[#CBD5E1]">
                  {wh.zh}
                </div>
                <div className="flex items-center justify-between text-xs text-[#94A3B8] pt-2 border-t border-[#293A52]">
                  <span>Tel: {wh.tel}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(wh.zh)}
                    className="text-[#4778F5] hover:underline font-bold text-[11px] cursor-pointer"
                  >
                    Copy Address
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* =====================================================================
            REPACKAGE & BILL FREIGHT SLIDE-OVER MODAL (/admin/shipments/[id]/repackage)
           ===================================================================== */}
        {repackageShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="w-full max-w-5xl bg-[#1F2937] border border-[#374151] rounded-3xl p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto no-scrollbar">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-[#374151]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#D96B16] animate-pulse" />
                    <h3 className="text-lg font-extrabold text-[#FFFFFF] tracking-tight">
                      Repackage & bill freight
                    </h3>
                    <span className="px-2 py-0.5 rounded-md bg-[#D96B16]/20 border border-[#D96B16]/40 text-[#D96B16] font-mono text-[11px] font-bold">
                      Invoice Total: ₦{liveConvertedNGN.toLocaleString()} (≈ ¥{liveConvertedCNY} RMB)
                    </span>
                    <span className="sr-only">USD invoice value: ${repackageCalculatedUSD.toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-[#94A3B8] mt-0.5">
                    Live warehouse dock billing terminal: measure, photograph, assign air freight tier, and bill customer.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeRepackageModal}
                  className="w-8 h-8 rounded-full bg-[#111827] flex items-center justify-center text-[#94A3B8] hover:text-[#FFFFFF] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Multi-Column Workspace Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Column 1: SHIPMENT, 1-Tap Status, Warehouse Photos, Air Tier & Volumetric Weight (lg:col-span-7) */}
                <div className="lg:col-span-7 space-y-4">
                  {/* SHIPMENT Card */}
                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#374151] space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider">
                        SHIPMENT
                      </span>
                      <div className="text-xs font-mono font-bold text-[#4778F5]">
                        PLATFORM CODE: {repackageShipment.platformCode || repackageShipment.trackingCode || repackageShipment.trackingNumber}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[#94A3B8] block text-[10px]">Client / Recipient:</span>
                        <span className="font-bold text-[#FFFFFF]">{repackageShipment.receiverName || 'Chief Babatunde Alade'}</span>
                      </div>
                      <div>
                        <span className="text-[#94A3B8] block text-[10px]">Route Corridor:</span>
                        <span className="font-bold text-[#10B981]">
                          {repackageShipment.originWarehouse || 'Guangzhou Hub'} ➔ {repackageShipment.destination || 'Lagos, NG'}
                        </span>
                      </div>
                    </div>

                    {/* 1-Tap Status Sync */}
                    <div className="pt-2 border-t border-[#374151]">
                      <span className="text-[10px] font-extrabold text-[#94A3B8] uppercase tracking-wider block mb-1.5">
                        1-Tap Status Sync (Warehouse Progression):
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {[
                          'Package Received',
                          'Inspection',
                          'Packing',
                          'Awaiting Payment',
                          'Dispatched',
                          'In Transit',
                          'Delivered'
                        ].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={async () => {
                              try {
                                await db.updateShipmentLifecycle(repackageShipment.id, st, `Status synchronized to ${st}`, adminUser?.uid || 'adm-001');
                                showToast(`Status synced: ${st}`, 'success');
                                setDbRev(db.getStateRevision());
                              } catch (err: any) {
                                showToast(err.message || 'Status sync failed', 'error');
                              }
                            }}
                            className={`px-2 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                              (repackageShipment.currentStatus || '').toLowerCase() === st.toLowerCase()
                                ? 'bg-[#3867E8] text-white shadow-sm'
                                : 'bg-[#1F2937] text-[#94A3B8] hover:text-[#FFFFFF]'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* WAREHOUSE PHOTOS Card */}
                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#374151] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                          WAREHOUSE PHOTOS
                        </span>
                        <span className="text-[11px] text-[#94A3B8]">
                          Photos appear instantly in the customer's tracking page.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const samplePhotos = [
                            'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80',
                            'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80',
                            'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&w=600&q=80'
                          ];
                          const newPhoto = samplePhotos[repackagePhotos.length % samplePhotos.length];
                          setRepackagePhotos(prev => [...prev, newPhoto]);
                          showToast('Dock photo snapped and added to manifest!', 'success');
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs shadow-sm cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>+ Snap Dock Photo</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                      {repackagePhotos.length > 0 ? (
                        repackagePhotos.map((url, idx) => (
                          <div key={idx} className="relative group shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-[#374151]">
                            <img src={url} alt={`Dock ${idx + 1}`} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setRepackagePhotos(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="w-full py-4 text-center text-xs text-[#94A3B8] border border-dashed border-[#374151] rounded-xl">
                          No photos attached yet. Click "+ Snap Dock Photo" to upload intake inspection previews.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* AIR SHIPPING TIER & Volumetric Weight Card */}
                  <div className="p-4 rounded-2xl bg-[#111827] border border-[#374151] space-y-3">
                    <span className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider block">
                      AIR SHIPPING TIER
                    </span>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setRepackageTier('Normal Air (5–7d)')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          repackageTier === 'Normal Air (5–7d)'
                            ? 'bg-[#3867E8]/15 border-[#4778F5] text-white ring-1 ring-[#4778F5]'
                            : 'bg-[#1F2937] border-[#374151] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <div className="font-extrabold text-xs">Normal Air (5–7d)</div>
                        <div className="text-[10px] text-[#CBD5E1] mt-0.5">Rate: $9.60 / kg</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRepackageTier('Express Air (48h)')}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          repackageTier === 'Express Air (48h)'
                            ? 'bg-[#3867E8]/15 border-[#4778F5] text-white ring-1 ring-[#4778F5]'
                            : 'bg-[#1F2937] border-[#374151] text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        <div className="font-extrabold text-xs text-[#4778F5]">Express Air (48h)</div>
                        <div className="text-[10px] text-[#CBD5E1] mt-0.5">Rate: $13.00 / kg (Priority)</div>
                      </button>
                    </div>

                    <div className="space-y-2 pt-1">
                      <label className="text-xs font-bold text-[#CBD5E1] block">
                        CHARGEABLE WEIGHT (KG)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={repackageWeightKg}
                        onChange={(e) => setRepackageWeightKg(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#1F2937] border border-[#374151] text-[#FFFFFF] font-mono font-bold text-sm outline-none focus:border-[#4778F5]"
                      />

                      {/* Volumetric formula description and interactive calculator */}
                      <div className="p-3 rounded-xl bg-[#1F2937] border border-[#374151] space-y-2">
                        <div className="text-[11px] text-[#94A3B8]">
                          Volumetric weight = L × W × H (cm) ÷ 6000. Enter whichever is higher.
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block">Length (cm):</span>
                            <input
                              type="number"
                              value={volLength}
                              onChange={(e) => setVolLength(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-[#111827] border border-[#374151] text-xs font-mono text-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block">Width (cm):</span>
                            <input
                              type="number"
                              value={volWidth}
                              onChange={(e) => setVolWidth(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-[#111827] border border-[#374151] text-xs font-mono text-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-[#94A3B8] block">Height (cm):</span>
                            <input
                              type="number"
                              value={volHeight}
                              onChange={(e) => setVolHeight(e.target.value)}
                              className="w-full px-2 py-1 rounded bg-[#111827] border border-[#374151] text-xs font-mono text-white"
                            />
                          </div>
                        </div>

                        {(() => {
                          const volW = Number(((parseFloat(volLength) || 0) * (parseFloat(volWidth) || 0) * (parseFloat(volHeight) || 0) / 6000).toFixed(1));
                          return (
                            <div className="flex items-center justify-between text-xs pt-1">
                              <span className="text-[#CBD5E1]">Calculated Volumetric: <strong className="text-[#4778F5]">{volW} kg</strong></span>
                              <button
                                type="button"
                                onClick={() => setRepackageWeightKg(String(volW))}
                                className="px-2.5 py-0.5 rounded bg-[#3867E8] text-white font-bold text-[11px] cursor-pointer"
                              >
                                Apply {volW} kg
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Column 2: FREIGHT CHARGE & NOTES FOR THE CUSTOMER (lg:col-span-5) */}
                <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* FREIGHT CHARGE Card */}
                    <div className="p-4 rounded-2xl bg-[#111827] border border-[#374151] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider">
                          FREIGHT CHARGE
                        </span>
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[#1F2937]">
                          {(['NGN', 'CNY'] as const).map(c => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setRepackageCurrency(c)}
                              className={`px-2.5 py-1 rounded-md text-[10px] font-bold cursor-pointer transition-all ${
                                repackageCurrency === c ? 'bg-[#3867E8] text-white shadow-sm' : 'text-[#94A3B8] hover:text-white'
                              }`}
                            >
                              {c === 'NGN' ? '🇳🇬 NGN (₦)' : '🇨🇳 CNY (¥)'}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <input
                          type="number"
                          step="0.01"
                          value={repackageChargeInput}
                          onChange={(e) => setRepackageChargeInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#1F2937] border border-[#374151] text-[#FFFFFF] font-mono text-xl font-extrabold outline-none focus:border-[#D96B16]"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#CBD5E1] pt-1 border-t border-[#374151]">
                        <div>NGN: ≈ ₦{liveConvertedNGN.toLocaleString()}</div>
                        <div>CNY: ≈ ¥{liveConvertedCNY.toLocaleString()} RMB</div>
                      </div>
                    </div>

                    {/* NOTES FOR THE CUSTOMER Card */}
                    <div className="p-4 rounded-2xl bg-[#111827] border border-[#374151] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-extrabold text-[#94A3B8] uppercase tracking-wider">
                          NOTES FOR THE CUSTOMER
                        </span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {['+ 2 Boxes', '+ Shrink Wrap', '+ Wooden Crate'].map(chip => (
                            <button
                              key={chip}
                              type="button"
                              onClick={() => {
                                setRepackageCustomerNotes(prev => prev ? `${prev}, ${chip.replace('+ ', '')}` : `Repackaged into ${chip.replace('+ ', '')}, fragile handling added.`);
                              }}
                              className="px-2 py-0.5 rounded-md bg-[#1F2937] border border-[#374151] text-[10px] font-bold text-[#CBD5E1] hover:text-white cursor-pointer"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      </div>

                      <textarea
                        rows={4}
                        value={repackageCustomerNotes}
                        onChange={(e) => setRepackageCustomerNotes(e.target.value)}
                        placeholder="Repackaged into 2 boxes, fragile handling added..."
                        className="w-full p-3 rounded-xl bg-[#1F2937] border border-[#374151] text-[#FFFFFF] text-xs outline-none focus:border-[#4778F5] resize-none"
                      />
                    </div>
                  </div>

                  {/* Primary Orange CTA Button */}
                  <button
                    type="button"
                    disabled={isSubmittingRepackage}
                    onClick={handleSetToAwaitingPayment}
                    className="w-full py-3.5 rounded-2xl bg-[#D96B16] hover:bg-[#c25e12] text-white font-extrabold text-sm tracking-wide transition-all cursor-pointer shadow-xl shadow-[#D96B16]/25 disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isSubmittingRepackage ? 'Updating & Notifying Customer...' : 'Set to Awaiting Payment'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            ISSUE WAYBILL MODAL
           ===================================================================== */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <form onSubmit={handleCreatePackage} className="w-full max-w-lg bg-[#1B2A40] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#293A52]">
                <h3 className="text-base font-extrabold text-[#F8FAFC]">Issue New Cargo Waybill</h3>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-full bg-[#152238] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Waybill Number:</label>
                  <input
                    type="text"
                    value={newTrackingNumber}
                    onChange={(e) => setNewTrackingNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] font-mono font-bold text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Package Title / Consignment:</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Origin Hub:</label>
                    <select
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs"
                    >
                      <option value="Guangzhou">Guangzhou Hub</option>
                      <option value="Yiwu">Yiwu Trade Hub</option>
                      <option value="Shenzhen">Shenzhen Tech Hub</option>
                      <option value="Foshan">Foshan Hub</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Tier:</label>
                    <select
                      value={newTier}
                      onChange={(e) => setNewTier(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs"
                    >
                      <option value="Normal Air">Normal Air (5-7d)</option>
                      <option value="Express Air">Express Air (48h)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs transition-all cursor-pointer shadow-md"
                >
                  Confirm & Issue Waybill
                </button>
              </div>
            </form>
          </div>
        )}

        {/* =====================================================================
            MILESTONE CHECKPOINT MODAL
           ===================================================================== */}
        {milestoneShipment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
            <form onSubmit={handleConfirmMilestone} className="w-full max-w-md bg-[#1B2A40] border border-[#293A52] rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#293A52]">
                <h3 className="text-base font-extrabold text-[#F8FAFC]">Update Waypoint Milestone</h3>
                <button
                  type="button"
                  onClick={() => setMilestoneShipment(null)}
                  className="w-8 h-8 rounded-full bg-[#152238] flex items-center justify-center text-[#94A3B8] hover:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Status Checkpoint:</label>
                  <select
                    value={milestoneStatus}
                    onChange={(e) => setMilestoneStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs"
                  >
                    <option value="In Transit">In Transit</option>
                    <option value="Customs Clearance">Customs Clearance (MMIA)</option>
                    <option value="Arrived Destination">Arrived Destination (Lagos Hub)</option>
                    <option value="Ready for Pickup">Ready for Counter Pickup</option>
                    <option value="Out for Delivery">Out for Delivery (Rider)</option>
                    <option value="Delivered">Delivered & Closed</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Location:</label>
                  <input
                    type="text"
                    value={milestoneLocation}
                    onChange={(e) => setMilestoneLocation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#CBD5E1] block mb-1">Waypoint Notes:</label>
                  <textarea
                    rows={2}
                    value={milestoneNotes}
                    onChange={(e) => setMilestoneNotes(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#152238] border border-[#293A52] text-[#F8FAFC] text-xs resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#3867E8] hover:bg-[#4778F5] text-white font-extrabold text-xs transition-all cursor-pointer shadow-md"
                >
                  Save Checkpoint
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
