import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { 
  FileCheck2, 
  Plus, 
  Send, 
  Building, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  Search, 
  ChevronRight, 
  X,
  FileSpreadsheet,
  Lock,
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { AgentRequestDocument } from '../../types';

export const ProcureScreen: React.FC = () => {
  const { navigate, showToast, activeUserId } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [agentRequests, setAgentRequests] = useState<AgentRequestDocument[]>(() => db.getAgentRequests());
  const [acceptingRfq, setAcceptingRfq] = useState<AgentRequestDocument | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
  
  // RFQ Form state
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('Electronics & Parts');
  const [specifications, setSpecifications] = useState('');
  const [productPhotos, setProductPhotos] = useState<string[]>([]);
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [targetQuantity, setTargetQuantity] = useState(500);
  const [targetUnitUSD, setTargetUnitUSD] = useState(15.50);
  const [supplierCity, setSupplierCity] = useState<'Guangzhou' | 'Shenzhen' | 'Yiwu' | 'Foshan'>('Shenzhen');
  const [inspectionRequired, setInspectionRequired] = useState(true);
  const [cantonFairBooth, setCantonFairBooth] = useState('');

  useEffect(() => {
    return db.subscribe(() => {
      const nextReqs = db.getAgentRequests();
      setAgentRequests((prev) => {
        if (
          prev.length === nextReqs.length &&
          prev.every((r, i) => r.id === nextReqs[i]?.id && r.status === nextReqs[i]?.status && r.paymentStatus === nextReqs[i]?.paymentStatus)
        ) {
          return prev;
        }
        return nextReqs;
      });
    });
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setProductPhotos((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAddPhotoUrl = () => {
    if (!newPhotoUrl.trim()) return;
    setProductPhotos((prev) => [...prev, newPhotoUrl.trim()]);
    setNewPhotoUrl('');
  };

  const handleRemovePhoto = (index: number) => {
    setProductPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      showToast('Please specify product name', 'error');
      return;
    }

    try {
      const unitUSD = Number(targetUnitUSD) || 10;
      const unitCNY = Math.round(unitUSD * 7.24 * 100) / 100;
      const qty = Number(targetQuantity) || 100;

      await db.createAgentRequest({
        productName: productName.trim(),
        category,
        specifications: specifications.trim() || undefined,
        referencePhotos: productPhotos,
        sampleImages: productPhotos,
        productUrl: productUrl.trim() || undefined,
        targetQuantity: qty,
        targetUnitUSD: unitUSD,
        targetUnitCNY: unitCNY,
        totalBudgetCNY: Math.round(qty * unitCNY),
        supplierCity,
        inspectionRequired,
        cantonFairBooth: cantonFairBooth.trim() || undefined,
        serviceType: 'Factory Direct RFQ & Procurement',
        serviceKind: 'sourcing',
        userId: activeUserId || 'usr_alade_01'
      });

      setShowModal(false);
      setProductName('');
      setSpecifications('');
      setProductPhotos([]);
      setNewPhotoUrl('');
      setProductUrl('');
      setCantonFairBooth('');
      setAgentRequests(db.getAgentRequests());
      showToast('Factory RFQ submitted to China sourcing desk!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to submit RFQ', 'error');
    }
  };

  const handleAcceptQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingRfq) return;
    if (pinInput.length !== 6) {
      showToast('Please enter your 6-digit transaction PIN', 'error');
      return;
    }

    setIsProcessing(true);
    try {
      await db.acceptAgentQuote(acceptingRfq.id, pinInput, 'USD', activeUserId || 'usr_alade_01');
      showToast(`Quote of $${acceptingRfq.quoteAmountUSD} USD accepted! Funds locked in escrow.`, 'success');
      setAcceptingRfq(null);
      setPinInput('');
      setAgentRequests(db.getAgentRequests());
    } catch (err: any) {
      showToast(err.message || 'Failed to accept quote', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: AgentRequestDocument['status']) => {
    switch (status) {
      case 'po_issued':
      case 'quote_accepted': return { color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', label: 'PO Issued (Escrow Locked)' };
      case 'in_progress': return { color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', label: 'Procurement In Progress' };
      case 'completed': return { color: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300', label: 'Completed & Delivered' };
      case 'quote_ready':
      case 'awaiting_payment': return { color: 'bg-amber-500/10 border-amber-500/30 text-amber-400', label: 'Quote Ready for Review' };
      default: return { color: 'bg-slate-800 border-slate-700 text-slate-300', label: 'Pending Sourcing Review' };
    }
  };

  // Filter requests for active client
  const myRfqs = agentRequests.filter(
    (r) => !r.userId || r.userId === (activeUserId || 'usr_alade_01') || r.userId === 'usr_alade_01'
  );

  return (
    <div className="min-h-full pb-24 bg-slate-950 text-white">
      <Header title="Direct Quotation Manager" />

      <div className="p-4 space-y-4">
        {/* Hero Banner */}
        <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border border-emerald-500/30 flex items-center justify-between shadow-xl">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>China Factory Direct RFQ</span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              Procurement & Quotation Desk
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">
              Direct factory price negotiation by our Guangzhou & Shenzhen native buyers.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 font-bold flex items-center justify-center shadow-lg shadow-emerald-500/20 active:scale-95 transition-all shrink-0 cursor-pointer"
            title="Create RFQ"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Tab switcher: Procure / Agent */}
        <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          <button
            className="py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold shadow-md transition-all"
          >
            Quotation Manager ({myRfqs.length})
          </button>
          <button
            onClick={() => navigate('agent')}
            className="py-2.5 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            Ground Agents & Audits
          </button>
        </div>

        {/* Quotations List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Active Factory RFQs ({myRfqs.length})
            </span>
            <span className="text-[11px] text-emerald-400 font-mono">0% Commission Escrow</span>
          </div>

          {myRfqs.length === 0 ? (
            <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">No Active Factory RFQs</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Submit a Request for Quotation to let our native China procurement team negotiate direct factory wholesale prices.
                </p>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create First RFQ</span>
              </button>
            </div>
          ) : (
            myRfqs.map((rfq) => {
              const badge = getStatusBadge(rfq.status);
              const photos = rfq.referencePhotos || rfq.sampleImages || [];
              const isQuoted = Boolean(rfq.quoteAmountUSD && (rfq.status === 'quote_ready' || rfq.status === 'awaiting_payment' || rfq.status === 'po_issued' || rfq.status === 'in_progress' || rfq.status === 'completed'));

              return (
                <div
                  key={rfq.id}
                  className="p-4 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-white">
                      {rfq.reference || rfq.id.toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-bold ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-extrabold text-white">{rfq.productName}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>Category: <strong className="text-slate-200">{rfq.category}</strong></span>
                      <span>•</span>
                      <span>Hub: <strong className="text-emerald-400">{rfq.supplierCity}</strong></span>
                      <span>•</span>
                      <span>Target: <strong className="text-white">{rfq.targetQuantity.toLocaleString()} units</strong></span>
                      <span>•</span>
                      <span>Target Unit: <strong className="font-mono text-amber-400">${rfq.targetUnitUSD}</strong></span>
                    </div>
                  </div>

                  {/* Specifications Box */}
                  {rfq.specifications && (
                    <div className="p-2.5 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Specifications:</span>
                      <p className="line-clamp-3">{rfq.specifications}</p>
                    </div>
                  )}

                  {/* Reference Product Photos Thumbnails */}
                  {photos.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Uploaded Product Images ({photos.length})</span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {photos.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            alt={`rfq-ref-${i}`}
                            onClick={() => setPreviewPhoto(img)}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-800 cursor-pointer hover:border-emerald-500 transition-all shrink-0 shadow-sm"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Product URL */}
                  {rfq.productUrl && (
                    <a
                      href={rfq.productUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] text-emerald-400 hover:underline truncate max-w-full"
                    >
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">Reference Link: {rfq.productUrl}</span>
                    </a>
                  )}

                  {/* Canton Fair Booth */}
                  {rfq.cantonFairBooth && (
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[10px] text-slate-400">
                      <span className="text-emerald-400 font-bold">Canton Fair Booth: </span>
                      {rfq.cantonFairBooth}
                    </div>
                  )}

                  {/* Formal Official Quote Display Card if quoted */}
                  {isQuoted && (
                    <div className="p-3.5 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-2.5 shadow-inner">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Official China Desk Quotation</span>
                        </span>
                        <span className="text-xs font-mono font-extrabold text-white">
                          ${rfq.quoteAmountUSD} USD
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/80 p-2 rounded-xl border border-slate-800/80">
                        <span>Total Payable:</span>
                        <span className="text-white font-bold">
                          ₦{rfq.quoteAmountNGN?.toLocaleString()} NGN • ¥{rfq.quoteAmountCNY?.toLocaleString()} CNY
                        </span>
                      </div>

                      {rfq.supplierName && (
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400">Negotiated Factory: </span>
                          <strong className="text-white">{rfq.supplierName}</strong>
                        </div>
                      )}

                      {rfq.supplierFindings && (
                        <div className="text-[10px] text-slate-300 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                          <strong className="text-emerald-400 block mb-0.5">Sourcing Findings:</strong>
                          <span>{rfq.supplierFindings}</span>
                        </div>
                      )}

                      {rfq.adminNotes && (
                        <p className="text-[10px] text-slate-400 italic">"{rfq.adminNotes}"</p>
                      )}

                      {rfq.supplierInvoiceUrl && (
                        <a
                          href={rfq.supplierInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold hover:bg-amber-500/20 transition-all"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                          <span>View Official Proforma / Quotation Sheet</span>
                        </a>
                      )}

                      {rfq.assignedAgent && (
                        <p className="text-[9px] text-slate-400">
                          Assigned Inspector: <strong className="text-emerald-400">{rfq.assignedAgent}</strong>
                          {rfq.leadTimeDays && <span> • Lead Time: {rfq.leadTimeDays} days</span>}
                        </p>
                      )}

                      {(rfq.status === 'quote_ready' || rfq.status === 'awaiting_payment') && (
                        <button
                          onClick={() => setAcceptingRfq(rfq)}
                          className="w-full py-2.5 mt-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>Accept Quote & Lock Escrow (${rfq.quoteAmountUSD} USD)</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-500">{new Date(rfq.createdAt).toLocaleDateString()}</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          showToast(`Quotation breakdown for ${rfq.reference || rfq.id} sent to your email`, 'success');
                        }}
                        className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-semibold text-slate-300 transition-all cursor-pointer"
                      >
                        View Sheet
                      </button>

                      <button
                        onClick={() => navigate('support-chat')}
                        className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Chat Agent
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Enlarged Photo Preview Modal */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="relative max-w-lg w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-2xl">
            <button
              onClick={() => setPreviewPhoto(null)}
              className="absolute right-4 top-4 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xs font-bold text-white mb-2">Product Image Preview</h4>
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center max-h-[75vh]">
              <img src={previewPhoto} alt="Product Preview" className="w-full h-auto max-h-[75vh] object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Accept Quote Modal */}
      {acceptingRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative space-y-4">
            <button
              onClick={() => setAcceptingRfq(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-white">Accept Sourcing Quote</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Funds will be held in double-entry escrow and released upon milestone completion.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Product / Assignment:</span>
                <span className="font-semibold text-white">{acceptingRfq.productName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Escrow Required:</span>
                <span className="font-mono font-bold text-emerald-400">${acceptingRfq.quoteAmountUSD} USD</span>
              </div>
              {acceptingRfq.supplierName && (
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Supplier:</span>
                  <span className="text-slate-200">{acceptingRfq.supplierName}</span>
                </div>
              )}
            </div>

            <form onSubmit={handleAcceptQuote} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  6-Digit Transaction PIN
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="Enter 6-digit PIN"
                  className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-center tracking-[0.4em] font-mono text-base text-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? 'Securing Escrow...' : `Confirm & Lock $${acceptingRfq.quoteAmountUSD} Escrow`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RFQ Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-2xl relative space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
            <button
              onClick={() => setShowModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-extrabold text-white">Create Direct Factory RFQ</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Submit product images and target specs to our China factory sourcing desk.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Product Description / Commodity
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. 100W GaN Fast Chargers or 5kW Solar Inverters"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Product Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white outline-none focus:border-emerald-500"
                >
                  <option value="Electronics & Parts">Electronics & Parts</option>
                  <option value="Solar & Renewable Energy">Solar & Renewable Energy</option>
                  <option value="Industrial Machinery & Tools">Industrial Machinery & Tools</option>
                  <option value="Fashion & Apparel">Fashion & Apparel</option>
                  <option value="Building & Hardware Materials">Building & Hardware Materials</option>
                  <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                  <option value="Home & Kitchen Appliances">Home & Kitchen Appliances</option>
                  <option value="General Merchandise">General Merchandise</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Product Specifications & Standards
                </label>
                <textarea
                  value={specifications}
                  onChange={(e) => setSpecifications(e.target.value)}
                  placeholder="Materials, dimensions, certifications (CE/RoHS), packaging, colors, custom branding..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              {/* Product Images Upload */}
              <div className="space-y-2">
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                  Product Images / Reference Photos
                </label>
                
                {/* Thumbnails preview */}
                {productPhotos.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                    {productPhotos.map((photo, index) => (
                      <div key={index} className="relative group shrink-0">
                        <img
                          src={photo}
                          alt={`Uploaded ${index + 1}`}
                          className="w-14 h-14 object-cover rounded-xl border border-slate-800"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(index)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] shadow"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upload action buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="p-2.5 rounded-xl bg-slate-950 border border-dashed border-slate-700 hover:border-emerald-500 flex flex-col items-center justify-center text-center cursor-pointer transition-all">
                    <Upload className="w-4 h-4 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-slate-300">Upload Files</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>

                  <div className="flex flex-col gap-1">
                    <input
                      type="url"
                      value={newPhotoUrl}
                      onChange={(e) => setNewPhotoUrl(e.target.value)}
                      placeholder="Paste image URL..."
                      className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-white outline-none focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPhotoUrl}
                      disabled={!newPhotoUrl.trim()}
                      className="py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 disabled:opacity-40"
                    >
                      Add Photo URL
                    </button>
                  </div>
                </div>
              </div>

              {/* Target Quantity & Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Quantity
                  </label>
                  <input
                    type="number"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Target Unit ($ USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={targetUnitUSD}
                    onChange={(e) => setTargetUnitUSD(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400 outline-none focus:border-emerald-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Product Reference Link (Alibaba / 1688 / Web)
                </label>
                <input
                  type="url"
                  value={productUrl}
                  onChange={(e) => setProductUrl(e.target.value)}
                  placeholder="https://detail.1688.com/offer/..."
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Target Sourcing Region
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['Shenzhen', 'Guangzhou', 'Yiwu', 'Foshan'] as const).map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSupplierCity(c)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        supplierCity === c
                          ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Canton Fair Booth (Optional)
                </label>
                <input
                  type="text"
                  value={cantonFairBooth}
                  onChange={(e) => setCantonFairBooth(e.target.value)}
                  placeholder="e.g. Pazhou Hall 14.1, Booth C02"
                  className="w-full px-3.5 py-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
                <input
                  type="checkbox"
                  id="inspection"
                  checked={inspectionRequired}
                  onChange={(e) => setInspectionRequired(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="inspection" className="text-[11px] text-slate-300 cursor-pointer">
                  Require on-ground factory pre-shipment audit
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Submit RFQ to China Sourcing Team</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
