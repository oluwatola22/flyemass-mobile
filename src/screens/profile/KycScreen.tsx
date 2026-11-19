import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { Header } from '../../components/layout/Header';
import { db } from '../../services/db';
import { KycIdType, KycStatus, KycSubmissionDocument } from '../../types';
import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertCircle,
  UploadCloud,
  FileText,
  Image as ImageIcon,
  Trash2,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Lock,
  Building2,
  Check,
  RefreshCw,
  Eye,
  X,
  FileCheck,
  Camera,
  RotateCcw,
  Sparkles,
  Scan
} from 'lucide-react';

const ID_TYPES: { type: KycIdType; label: string; placeholder: string; helper: string }[] = [
  {
    type: 'NIN',
    label: 'National Identification Number (NIN)',
    placeholder: 'e.g. 12345678901 (11 digits)',
    helper: '11-digit national identity number issued by NIMC'
  },
  {
    type: 'Drivers_License',
    label: "Driver's License Number",
    placeholder: 'e.g. AAA 123456 01',
    helper: 'FRSC-issued Nigerian Driver\'s License'
  },
  {
    type: 'International_Passport',
    label: 'International Passport Number',
    placeholder: 'e.g. A12345678',
    helper: 'Standard 9-character Nigerian e-Passport Number'
  },
  {
    type: 'Voters_Card',
    label: "Voter's Card Number (VIN)",
    placeholder: 'e.g. 90F5 B123 4567 8901 234',
    helper: '19-character alphanumeric Voter Identification Number'
  }
];

export const KycScreen: React.FC = () => {
  const { userProfile, activeUserId, navigate, showToast, t } = useApp();

  const [kycData, setKycData] = useState<{
    status: KycStatus;
    verifiedBadge: boolean;
    submission?: KycSubmissionDocument;
    rejectionReason?: string;
  }>(() => db.getKycStatus(activeUserId));

  const [isResubmitting, setIsResubmitting] = useState(false);
  
  // Guided Two-Step Wizard State (1: ID Details & Document, 2: Live Circular Selfie)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Identity & Document Details
  const [legalName, setLegalName] = useState(userProfile?.name || 'Chief Babatunde Alade');
  const [selectedIdType, setSelectedIdType] = useState<KycIdType>('NIN');
  const [idNumber, setIdNumber] = useState('');
  const [frontDocUrl, setFrontDocUrl] = useState<string>('');
  const [frontDocName, setFrontDocName] = useState<string>('');
  const [backDocUrl, setBackDocUrl] = useState<string>('');
  const [backDocName, setBackDocName] = useState<string>('');

  // Step 2: Live Circular Selfie Capture
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedSelfieUrl, setCapturedSelfieUrl] = useState<string>('');
  const [isCapturing, setIsCapturing] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Sync latest status from server
  const loadStatus = async () => {
    const res = await db.fetchKycStatus(activeUserId);
    if (res.success) {
      setKycData({
        status: res.kycStatus,
        verifiedBadge: res.verifiedBadge,
        submission: res.submission,
        rejectionReason: res.rejectionReason
      });
      if (res.submission) {
        if (!legalName) setLegalName(res.submission.fullLegalName);
        if (!idNumber) setIdNumber(res.submission.idNumber);
        if (res.submission.idType) setSelectedIdType(res.submission.idType);
        if (res.submission.documentFrontUrl && !frontDocUrl) {
          setFrontDocUrl(res.submission.documentFrontUrl);
          setFrontDocName(res.submission.documentFileName || 'front_document.jpg');
        }
        if (res.submission.documentBackUrl && !backDocUrl) {
          setBackDocUrl(res.submission.documentBackUrl);
          setBackDocName('back_document.jpg');
        }
        if (res.submission.selfiePhotoUrl && !capturedSelfieUrl) {
          setCapturedSelfieUrl(res.submission.selfiePhotoUrl);
        }
      }
    }
  };

  useEffect(() => {
    loadStatus();
    const unsub = db.subscribe(() => {
      setKycData(db.getKycStatus(activeUserId));
    });
    return () => unsub();
  }, [activeUserId]);

  // Clean up camera stream tracks when unmounting or leaving Step 2
  const stopCameraStream = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  // Initialize camera when entering Step 2 if selfie not yet captured
  useEffect(() => {
    if (currentStep === 2 && !capturedSelfieUrl) {
      startCamera();
    } else if (currentStep === 1) {
      stopCameraStream();
    }
  }, [currentStep, capturedSelfieUrl]);

  const startCamera = async () => {
    stopCameraStream();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 720 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera initialization error:', err);
      setCameraError('Unable to access front camera. Please check camera permissions in your settings.');
      setIsCameraActive(false);
    }
  };

  const handleCaptureSelfie = () => {
    if (!videoRef.current) return;
    setIsCapturing(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current || document.createElement('canvas');
      const size = Math.min(video.videoWidth || 480, video.videoHeight || 480);
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Crop centered square from video feed
        const startX = ((video.videoWidth || size) - size) / 2;
        const startY = ((video.videoHeight || size) - size) / 2;
        
        // Horizontal flip for natural selfie orientation
        ctx.translate(size, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
        setCapturedSelfieUrl(dataUrl);
        stopCameraStream();
        showToast('Live selfie captured successfully!', 'success');
      }
    } catch (err: any) {
      showToast('Failed to snapshot selfie frame', 'error');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleRetakeSelfie = () => {
    setCapturedSelfieUrl('');
    startCamera();
  };

  const handleUseSimulatedSelfie = () => {
    // High-resolution realistic circular selfie for testing/demo environments
    const sampleSelfie = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80';
    setCapturedSelfieUrl(sampleSelfie);
    stopCameraStream();
    showToast('Simulated live selfie snapshot loaded', 'info');
  };

  const activeIdConfig = ID_TYPES.find(i => i.type === selectedIdType) || ID_TYPES[0];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isFront: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Document size exceeds 10MB limit', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (isFront) {
        setFrontDocUrl(result);
        setFrontDocName(file.name);
        showToast('Front document uploaded successfully', 'success');
      } else {
        setBackDocUrl(result);
        setBackDocName(file.name);
        showToast('Back document uploaded successfully', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSampleUpload = (isFront: boolean) => {
    if (isFront) {
      setFrontDocUrl('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
      setFrontDocName('nin_slip_government_scan.jpg');
      showToast('Sample government document scan loaded', 'info');
    } else {
      setBackDocUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80');
      setBackDocName('nin_slip_reverse_signature.jpg');
      showToast('Sample reverse document loaded', 'info');
    }
  };

  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!legalName.trim()) {
      showToast('Full Legal Name is mandatory', 'error');
      return;
    }
    if (!idNumber.trim()) {
      showToast('Please enter your Government ID Number', 'error');
      return;
    }
    if (!frontDocUrl) {
      showToast('Front document scan is required for Step 1', 'error');
      return;
    }
    setCurrentStep(2);
  };

  const handleFinalSubmit = async () => {
    if (!legalName.trim() || !idNumber.trim() || !frontDocUrl) {
      showToast('Step 1 details are missing. Please complete ID details.', 'error');
      setCurrentStep(1);
      return;
    }
    if (!capturedSelfieUrl) {
      showToast('Live circular selfie is mandatory for Step 2 verification', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await db.submitKyc({
        userId: activeUserId,
        fullLegalName: legalName.trim(),
        idType: selectedIdType,
        idNumber: idNumber.trim(),
        documentFrontUrl: frontDocUrl,
        documentBackUrl: backDocUrl || undefined,
        documentFileName: frontDocName || 'identity_document.jpg',
        selfiePhotoUrl: capturedSelfieUrl,
        selfieCapturedAt: Date.now()
      });

      if (res.success) {
        showToast('KYC documents & Live Selfie submitted successfully for compliance review', 'success');
        setIsResubmitting(false);
        setCurrentStep(1);
        stopCameraStream();
        await loadStatus();
      } else {
        showToast(res.error || 'Failed to submit KYC', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Submission error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulate = async (status: KycStatus) => {
    setKycData(prev => ({
      ...prev,
      status,
      verifiedBadge: status === 'verified',
      rejectionReason: status === 'rejected' ? 'Government ID photo and selfie facial features showed a mismatch. Please upload flat clear scans.' : undefined
    }));
    setIsResubmitting(false);
    showToast(`Simulated status: ${status.toUpperCase()}`, 'info');

    try {
      const res = await db.simulateKycStatus(activeUserId, status);
      if (res.success) {
        await loadStatus();
      }
    } catch (_) {}
  };

  const isFormVisible = kycData.status === 'unverified' || kycData.status === 'rejected' || isResubmitting;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-white min-h-screen">
      <Header
        title="KYC & Identity Verification"
        showBack
        onBack={() => {
          stopCameraStream();
          navigate('profile');
        }}
      />

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6 max-w-xl mx-auto w-full pb-28">
        
        {/* Compliance Regulation Overview Banner */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 shadow-xl space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                AML & Regulatory Tier Compliance
              </h2>
              <p className="text-xs text-slate-400">
                Central Bank of Nigeria & Biometric Facial Verification Standards
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed pt-1 border-t border-slate-800/80">
            To unlock full NUBAN withdrawals and China supplier payouts, FlyeMass accounts require verification of a primary Nigerian government identity (NIN, Driver's License, Passport, or Voter's Card) combined with a genuine live circular selfie verification.
          </p>
        </div>

        {/* Real-time Status Banner */}
        {kycData.status === 'verified' && (
          <div className="p-5 rounded-3xl bg-emerald-950/40 border border-emerald-500/30 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block">
                    Identity & Liveness Verified
                  </span>
                  <span className="text-sm font-semibold text-white">
                    Enterprise Tier 3 Active
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                Withdrawals Unlocked
              </span>
            </div>

            {/* Side-by-Side Visual Confirmation on Profile */}
            <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={kycData.submission?.selfiePhotoUrl || capturedSelfieUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'}
                  alt="Verified Live Selfie"
                  className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500/60 shadow-lg"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center text-slate-950 font-bold text-[10px]">
                  ✓
                </span>
              </div>
              <div className="flex-1 min-w-0 text-xs space-y-1 text-slate-300">
                <p className="font-bold text-white text-sm truncate">
                  {kycData.submission?.fullLegalName || userProfile.name}
                </p>
                <p className="text-emerald-400 font-medium">
                  {kycData.submission?.idTypeLabel || 'National Identification Number (NIN)'}
                </p>
                <p className="font-mono text-slate-400 text-[11px]">
                  {kycData.submission?.idNumber ? `ID: ••••${kycData.submission.idNumber.slice(-4)}` : 'ID: ••••6102'}
                </p>
              </div>
            </div>

            <p className="text-[11px] text-emerald-400/90 leading-tight">
              ✓ Unrestricted daily NUBAN bank payouts & China RMB transfers are active.
            </p>
          </div>
        )}

        {kycData.status === 'pending' && (
          <div className="p-5 rounded-3xl bg-amber-950/40 border border-amber-500/30 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block">
                    Under Compliance Review
                  </span>
                  <span className="text-sm font-semibold text-white">
                    Facial Liveness & ID Match Verification
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold">
                Pending Approval
              </span>
            </div>

            {/* Assets Under Inspection Preview */}
            <div className="bg-slate-900/80 rounded-2xl p-3 border border-slate-800 flex items-center gap-3">
              {kycData.submission?.selfiePhotoUrl && (
                <img
                  src={kycData.submission.selfiePhotoUrl}
                  alt="Round Face Selfie"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-amber-500/50 shrink-0"
                />
              )}
              <div className="flex-1 text-xs space-y-1 text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="font-semibold text-white">{kycData.submission?.fullLegalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Document:</span>
                  <span className="text-white">{kycData.submission?.idTypeLabel || kycData.submission?.idType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Submitted:</span>
                  <span className="text-slate-400">{new Date(kycData.submission?.submittedAt || Date.now()).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setIsResubmitting(true);
                setCurrentStep(1);
              }}
              className="text-xs text-amber-400 hover:text-amber-300 underline font-medium cursor-pointer"
            >
              Need to update submitted ID details or live selfie?
            </button>
          </div>
        )}

        {kycData.status === 'rejected' && (
          <div className="p-5 rounded-3xl bg-rose-950/40 border border-rose-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block">
                    Verification Disapproved
                  </span>
                  <span className="text-sm font-semibold text-white">
                    Action Required
                  </span>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                Gated
              </span>
            </div>

            <div className="bg-rose-950/60 rounded-2xl p-3 border border-rose-500/20 text-xs space-y-1 text-slate-200">
              <span className="text-rose-300 font-semibold block">Compliance Officer Feedback:</span>
              <p className="text-slate-200 italic">
                "{kycData.rejectionReason || 'Document photo was blurry or selfie facial features did not match registered government ID.'}"
              </p>
            </div>

            <p className="text-xs text-slate-300">
              Please inspect the feedback above and complete the two-step verification with a clear flat scan and well-lit circular selfie.
            </p>
          </div>
        )}

        {kycData.status === 'unverified' && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Verification Status: Unverified</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Your account currently has restricted access. You will not be able to withdraw Naira funds or pay Chinese suppliers until KYC verification and facial selfie verification are submitted and approved.
            </p>
          </div>
        )}

        {/* GUIDED TWO-STEP FORM WORKFLOW */}
        {isFormVisible && (
          <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 shadow-2xl">
            
            {/* Step Wizard Header */}
            <div className="border-b border-slate-800 pb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Two-Step Identity Verification
                </span>
                <span className="text-xs font-mono text-slate-400 font-semibold">
                  Step {currentStep} of 2
                </span>
              </div>

              {/* Progress Bar */}
              <div className="grid grid-cols-2 gap-2">
                <div 
                  onClick={() => setCurrentStep(1)}
                  className={`h-2 rounded-full cursor-pointer transition-all ${
                    currentStep === 1 ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-emerald-500/40'
                  }`}
                  title="Step 1: ID Card Details"
                />
                <div 
                  onClick={() => {
                    if (frontDocUrl && legalName.trim() && idNumber.trim()) {
                      setCurrentStep(2);
                    } else {
                      showToast('Please complete Step 1 details first', 'info');
                    }
                  }}
                  className={`h-2 rounded-full cursor-pointer transition-all ${
                    currentStep === 2 ? 'bg-emerald-500 shadow-md shadow-emerald-500/30' : 'bg-slate-800'
                  }`}
                  title="Step 2: Live Circular Selfie"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-medium">
                <span className={currentStep === 1 ? 'text-white font-bold' : 'text-slate-400'}>
                  1. ID Card & Details
                </span>
                <span className={currentStep === 2 ? 'text-white font-bold' : 'text-slate-400'}>
                  2. Live Circular Selfie
                </span>
              </div>
            </div>

            {/* ======================================================== */}
            {/* STEP 1: IDENTITY DETAILS & GOVERNMENT ID CARD UPLOAD */}
            {/* ======================================================== */}
            {currentStep === 1 && (
              <form onSubmit={handleProceedToStep2} className="space-y-5">
                {/* Full Legal Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Full Legal Name <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="First Middle Surname (as on ID)"
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                  <p className="text-[11px] text-slate-500">
                    Must match the legal name on your government identification.
                  </p>
                </div>

                {/* ID Type Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Government ID Type <span className="text-emerald-400">*</span>
                  </label>
                  <select
                    value={selectedIdType}
                    onChange={(e) => setSelectedIdType(e.target.value as KycIdType)}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors cursor-pointer"
                  >
                    {ID_TYPES.map((t) => (
                      <option key={t.type} value={t.type} className="bg-slate-900 text-white">
                        {t.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">{activeIdConfig.helper}</p>
                </div>

                {/* ID Number */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {activeIdConfig.label} <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder={activeIdConfig.placeholder}
                    className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-sm font-mono focus:outline-none focus:border-emerald-500 transition-colors"
                    required
                  />
                </div>

                {/* Document Scans Upload */}
                <div className="space-y-4 pt-1">
                  <span className="text-xs font-semibold text-slate-300 block">
                    Upload Government ID Card Scan
                  </span>

                  {/* Front Document */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        Front Side Scan / Photo <span className="text-emerald-400">*</span>
                      </span>
                      {!frontDocUrl && (
                        <button
                          type="button"
                          onClick={() => handleSampleUpload(true)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          Use Demo NIN Scan
                        </button>
                      )}
                    </div>

                    {frontDocUrl ? (
                      <div className="relative p-3 rounded-2xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={frontDocUrl}
                            alt="Front ID Preview"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer"
                            onClick={() => setPreviewImage(frontDocUrl)}
                          />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-white truncate">{frontDocName || 'Front Document'}</p>
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Ready for verification
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(frontDocUrl)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="View Full Resolution"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFrontDocUrl('');
                              setFrontDocName('');
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => frontInputRef.current?.click()}
                        className="p-4 rounded-2xl bg-slate-950 border-2 border-dashed border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                      >
                        <UploadCloud className="w-7 h-7 text-slate-500 group-hover:text-emerald-400 transition-colors mb-1.5" />
                        <p className="text-xs font-semibold text-slate-300 group-hover:text-white">
                          Click to upload Front ID Card photo
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          PNG, JPG, or PDF up to 10MB
                        </p>
                        <input
                          ref={frontInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, true)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>

                  {/* Back Document (Optional) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-medium">
                        Reverse Side Scan (Optional for Passport, Required for License)
                      </span>
                      {!backDocUrl && (
                        <button
                          type="button"
                          onClick={() => handleSampleUpload(false)}
                          className="text-[11px] text-emerald-400 hover:text-emerald-300 cursor-pointer"
                        >
                          Use Demo Reverse Scan
                        </button>
                      )}
                    </div>

                    {backDocUrl ? (
                      <div className="relative p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <img
                            src={backDocUrl}
                            alt="Back ID Preview"
                            className="w-12 h-12 rounded-xl object-cover border border-slate-700 shrink-0 cursor-pointer"
                            onClick={() => setPreviewImage(backDocUrl)}
                          />
                          <div className="truncate">
                            <p className="text-xs font-semibold text-white truncate">{backDocName || 'Back Document'}</p>
                            <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                              <Check className="w-3 h-3" /> Attached
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPreviewImage(backDocUrl)}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                            title="View Full Resolution"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setBackDocUrl('');
                              setBackDocName('');
                            }}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors"
                            title="Remove Document"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => backInputRef.current?.click()}
                        className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800/80 hover:border-slate-700 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
                      >
                        <UploadCloud className="w-6 h-6 text-slate-600 group-hover:text-slate-400 transition-colors mb-1" />
                        <p className="text-xs text-slate-400 group-hover:text-slate-300">
                          Upload reverse side (optional)
                        </p>
                        <input
                          ref={backInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, false)}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 1 Continue CTA */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={!legalName.trim() || !idNumber.trim() || !frontDocUrl}
                    className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-emerald-500/20 cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Continue to Face Verification</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* STEP 2: LIVE CIRCULAR ("ROUND FACE") SELFIE CAPTURE */}
            {/* ======================================================== */}
            {currentStep === 2 && (
              <div className="space-y-6">
                
                {/* Guidance Header */}
                <div className="text-center space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-1">
                    <Scan className="w-3.5 h-3.5" />
                    <span>Facial Liveness Check</span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    Capture Your Live Circular Selfie
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Position your face inside the illuminated circle in good lighting. Live camera snapshot only (no gallery uploads).
                  </p>
                </div>

                {/* Circular Camera Viewport Container */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className="relative w-64 h-64 sm:w-72 sm:h-72 flex items-center justify-center">
                    
                    {/* Animated Outer Illumination Guide Ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-emerald-400/50 animate-[spin_20s_linear_infinite] pointer-events-none" />
                    <div className="absolute -inset-1 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />

                    {/* Circular Mask Viewport */}
                    <div className="w-60 h-60 sm:w-68 sm:h-68 rounded-full overflow-hidden bg-slate-950 border-4 border-emerald-500 shadow-[0_0_35px_rgba(16,185,129,0.3)] relative flex items-center justify-center">
                      
                      {capturedSelfieUrl ? (
                        /* Frozen Cropped Circular Preview */
                        <img
                          src={capturedSelfieUrl}
                          alt="Captured Round Face Selfie"
                          className="w-full h-full object-cover"
                        />
                      ) : isCameraActive ? (
                        /* Live Front Camera Stream */
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover scale-x-[-1]"
                        />
                      ) : (
                        /* Loading / Error Fallback */
                        <div className="p-4 text-center space-y-2">
                          {cameraError ? (
                            <>
                              <Camera className="w-8 h-8 text-amber-400 mx-auto" />
                              <p className="text-xs text-amber-300">{cameraError}</p>
                              <button
                                type="button"
                                onClick={startCamera}
                                className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-white font-semibold hover:bg-slate-700"
                              >
                                Retry Camera
                              </button>
                            </>
                          ) : (
                            <>
                              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
                              <p className="text-xs text-slate-400">Initializing front camera...</p>
                            </>
                          )}
                        </div>
                      )}

                      {/* Subtle Centering Crosshair / Oval Guide (Only when live video active) */}
                      {!capturedSelfieUrl && isCameraActive && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                          <div className="w-44 h-52 rounded-[45%] border border-emerald-400/30 border-dashed" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Instructional Subtitle */}
                  <p className="text-[11px] text-slate-400 mt-3 font-medium text-center">
                    {capturedSelfieUrl 
                      ? '✓ Live circular selfie captured cleanly'
                      : 'Position face upright inside the frame and look directly at camera'}
                  </p>
                </div>

                {/* Hidden canvas for snapshot cropping */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Capture & Action Controls */}
                <div className="space-y-3 pt-1">
                  {!capturedSelfieUrl ? (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleCaptureSelfie}
                        disabled={!isCameraActive || isCapturing}
                        className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/25 active:scale-95 transition-all cursor-pointer"
                      >
                        <Camera className="w-5 h-5" />
                        <span>Capture Live Selfie</span>
                      </button>

                      {/* Demo Fallback for environments with blocked webcam */}
                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={handleUseSimulatedSelfie}
                          className="text-xs text-slate-400 hover:text-emerald-400 underline cursor-pointer"
                        >
                          Use Demo Circular Face Snapshot (Testing)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/30 active:scale-95 transition-all cursor-pointer"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting KYC & Selfie Verification...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-5 h-5" />
                            Submit KYC for Verification
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleRetakeSelfie}
                        disabled={isSubmitting}
                        className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Retake Selfie Snapshot</span>
                      </button>
                    </div>
                  )}

                  {/* Return to Step 1 Button */}
                  <button
                    type="button"
                    onClick={() => {
                      stopCameraStream();
                      setCurrentStep(1);
                    }}
                    disabled={isSubmitting}
                    className="w-full py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer text-center"
                  >
                    ← Back to Step 1: ID Card Details
                  </button>
                </div>

              </div>
            )}

          </div>
        )}

        {/* Demo Simulator Control Bar (Allows testing unverified, pending, verified, rejected on demand) */}
        <div className="p-4 rounded-3xl bg-slate-900/60 border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Testing & Demo Simulator
            </span>
            <span className="text-[10px] text-slate-500">Realtime Compliance State</span>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => handleSimulate('unverified')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                kycData.status === 'unverified'
                  ? 'bg-slate-800 border-slate-600 text-white'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Simulate: Unverified
            </button>
            <button
              onClick={() => handleSimulate('pending')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                kycData.status === 'pending'
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Simulate: Pending
            </button>
            <button
              onClick={() => handleSimulate('verified')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                kycData.status === 'verified'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Simulate: Verified
            </button>
            <button
              onClick={() => handleSimulate('rejected')}
              className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                kycData.status === 'rejected'
                  ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Simulate: Rejected
            </button>
          </div>
        </div>

      </div>

      {/* Image Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">Document Scan Preview</span>
              <button 
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950">
              <img
                src={previewImage}
                alt="Document Full Preview"
                className="max-h-[60vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KycScreen;
