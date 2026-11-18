import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AdminLayout } from '../../components/admin/AdminLayout';
import { db, DatabaseState } from '../../services/db';
import { BannerDocument, ScreenRoute } from '../../types';
import { 
  Megaphone, 
  Bell, 
  Mail, 
  Send, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  Search, 
  Filter, 
  Smartphone, 
  RefreshCw,
  Users,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  X,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  Image,
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export const AdminCommunicationsScreen: React.FC = () => {
  const { showToast, adminUser } = useApp();
  const [, setDbRev] = useState(() => db.getStateRevision());
  const [activeTab, setActiveTab] = useState<'banners' | 'notifications' | 'emails' | 'campaign'>('banners');

  // Live state synchronization
  useEffect(() => {
    return db.subscribe(() => setDbRev(db.getStateRevision()));
  }, []);

  const dbState = db.getState();

  // Email Logs State
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [loadingEmails, setLoadingEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const fetchEmailLogs = async () => {
    setLoadingEmails(true);
    try {
      const logs = await db.getEmailLogs();
      setEmailLogs(logs);
    } catch {
      showToast('Failed to load email logs', 'error');
    } finally {
      setLoadingEmails(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'emails') {
      fetchEmailLogs();
    }
  }, [activeTab]);

  // -------------------------------------------------------------
  // TAB 1: BANNERS STATE & ACTIONS
  // -------------------------------------------------------------
  const banners = dbState.banners || [];
  const [bannerPlacementFilter, setBannerPlacementFilter] = useState<'all' | 'shop' | 'home'>('all');
  const [editingBanner, setEditingBanner] = useState<BannerDocument | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerForm, setBannerForm] = useState<Partial<BannerDocument>>({
    title: '',
    subtitle: '',
    description: '',
    badge: 'Hong Kong Direct Hub',
    placement: 'shop',
    imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
    destinationRoute: 'shop' as ScreenRoute,
    isActive: true,
    displayOrder: 1
  });

  const handleUploadBannerFile = async (file: File) => {
    setIsUploadingBanner(true);
    try {
      const res = await db.uploadBannerImage(file);
      if (res && res.success) {
        setBannerForm(prev => ({ ...prev, imageUrl: res.url }));
        showToast('Banner image uploaded to Supabase Storage (public.shop_banners)!', 'success');
      } else {
        showToast('Image upload failed, please retry or use URL', 'error');
      }
    } catch {
      showToast('Image upload failed', 'error');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleOpenCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: '',
      subtitle: '',
      description: '',
      badge: bannerPlacementFilter === 'home' ? 'VIP Campaign' : 'Hong Kong Direct Hub',
      placement: bannerPlacementFilter === 'home' ? 'home' : 'shop',
      imageUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
      destinationRoute: (bannerPlacementFilter === 'home' ? 'home' : 'shop') as ScreenRoute,
      isActive: true,
      displayOrder: banners.length + 1
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner: BannerDocument) => {
    setEditingBanner(banner);
    setBannerForm({ 
      ...banner,
      placement: banner.placement || (banner.destinationRoute === 'shop' ? 'shop' : 'home'),
      badge: banner.badge || '',
      subtitle: banner.subtitle || ''
    });
    setIsBannerModalOpen(true);
  };

  const handleMoveBanner = (bannerId: string, direction: 'up' | 'down') => {
    const filtered = (bannerPlacementFilter === 'all' 
      ? banners 
      : banners.filter(b => b.placement === bannerPlacementFilter || (bannerPlacementFilter === 'shop' && b.destinationRoute === 'shop'))
    ).slice().sort((a, b) => a.displayOrder - b.displayOrder);

    const index = filtered.findIndex(b => b.id === bannerId);
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === filtered.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const temp = filtered[index];
    filtered[index] = filtered[targetIndex];
    filtered[targetIndex] = temp;

    const reorderedIds = filtered.map(b => b.id);
    db.reorderBanners(reorderedIds, adminUser?.name || 'Admin Staff');
    showToast(`Banner display priority adjusted (${direction === 'up' ? 'promoted' : 'demoted'})`, 'info');
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.title) {
      showToast('Banner title is required', 'error');
      return;
    }

    const effectivePlacement = bannerForm.placement || (bannerForm.destinationRoute === 'shop' ? 'shop' : 'home');

    if (editingBanner) {
      const updated: BannerDocument = {
        ...editingBanner,
        title: bannerForm.title || editingBanner.title,
        subtitle: bannerForm.subtitle || '',
        badge: bannerForm.badge || '',
        description: bannerForm.description || '',
        placement: effectivePlacement,
        imageUrl: bannerForm.imageUrl || editingBanner.imageUrl,
        destinationRoute: (bannerForm.destinationRoute as ScreenRoute) || editingBanner.destinationRoute,
        isActive: bannerForm.isActive !== undefined ? bannerForm.isActive : editingBanner.isActive,
        displayOrder: Number(bannerForm.displayOrder) || editingBanner.displayOrder
      };
      db.updateBanner(updated, adminUser?.name || 'Admin Staff');
      showToast('Promotional image banner updated & synced live', 'success');
    } else {
      const created: BannerDocument = {
        id: `ban_${Date.now()}`,
        title: bannerForm.title!,
        subtitle: bannerForm.subtitle || '',
        badge: bannerForm.badge || (effectivePlacement === 'shop' ? 'Hong Kong Direct' : 'VIP Campaign'),
        description: bannerForm.description || '',
        placement: effectivePlacement,
        imageUrl: bannerForm.imageUrl || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=1200&q=80',
        destinationRoute: (bannerForm.destinationRoute as ScreenRoute) || (effectivePlacement === 'shop' ? 'shop' : 'home'),
        isActive: bannerForm.isActive !== undefined ? bannerForm.isActive : true,
        displayOrder: Number(bannerForm.displayOrder) || (banners.length + 1)
      };
      db.addBanner(created, adminUser?.name || 'Admin Staff');
      showToast('New dynamic image banner published to mobile storefront', 'success');
    }
    setIsBannerModalOpen(false);
  };

  const handleToggleBannerStatus = (id: string, currentStatus: boolean) => {
    db.toggleBanner(id, !currentStatus, adminUser?.name || 'Admin Staff');
    showToast(`Banner ${!currentStatus ? 'activated live' : 'hidden from app'}`, 'info');
  };

  const handleDeleteBanner = (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotional banner?')) {
      db.deleteBanner(id, adminUser?.name || 'Admin Staff');
      showToast('Banner deleted successfully', 'success');
    }
  };

  // -------------------------------------------------------------
  // TAB 2: IN-APP NOTIFICATIONS STATE & ACTIONS
  // -------------------------------------------------------------
  const notifications = dbState.notifications || [];
  const [notifForm, setNotifForm] = useState({
    title: '',
    message: '',
    type: 'system',
    targetUserId: 'all',
    linkRoute: 'notifications'
  });
  const [sendingNotif, setSendingNotif] = useState(false);

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) {
      showToast('Title and message are required', 'error');
      return;
    }

    setSendingNotif(true);
    const res = await db.sendAdminNotification(
      notifForm.title,
      notifForm.message,
      (notifForm.type as any) || 'system',
      notifForm.targetUserId === 'all' ? undefined : notifForm.targetUserId,
      notifForm.linkRoute,
      adminUser?.name || 'Admin Staff'
    );
    setSendingNotif(false);

    if (res.success) {
      showToast('In-app notification broadcast dispatched successfully!', 'success');
      setNotifForm({
        title: '',
        message: '',
        type: 'system',
        targetUserId: 'all',
        linkRoute: 'notifications'
      });
    } else {
      showToast(res.error || 'Failed to send notification', 'error');
    }
  };

  const handleDeleteNotification = async (id: string) => {
    const res = await db.deleteAdminNotification(id, adminUser?.name || 'Admin Staff');
    if (res.success) {
      showToast('Notification removed', 'info');
    }
  };

  // -------------------------------------------------------------
  // TAB 4: MARKETING EMAIL CAMPAIGN STATE & ACTIONS
  // -------------------------------------------------------------
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    message: '',
    campaignType: 'marketing_broadcast',
    broadcastToAllUsers: true,
    recipientEmail: '',
    recipientName: ''
  });
  const [sendingCampaign, setSendingCampaign] = useState(false);

  const registeredUsers = Object.values(dbState.users || {});

  const handleSendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.subject || !campaignForm.message) {
      showToast('Subject and message are required', 'error');
      return;
    }
    if (!campaignForm.broadcastToAllUsers && !campaignForm.recipientEmail) {
      showToast('Recipient email is required for targeted dispatch', 'error');
      return;
    }

    setSendingCampaign(true);
    const res = await db.sendEmailCampaign({
      subject: campaignForm.subject,
      message: campaignForm.message,
      campaignType: campaignForm.campaignType,
      broadcastToAllUsers: campaignForm.broadcastToAllUsers,
      recipientEmail: campaignForm.recipientEmail,
      recipientName: campaignForm.recipientName,
      adminId: adminUser?.name || 'Admin Marketing Desk'
    });
    setSendingCampaign(false);

    if (res.success) {
      showToast(`Campaign dispatched to ${res.count || 1} recipients!`, 'success');
      setCampaignForm({
        subject: '',
        message: '',
        campaignType: 'marketing_broadcast',
        broadcastToAllUsers: true,
        recipientEmail: '',
        recipientName: ''
      });
      fetchEmailLogs();
      setActiveTab('emails');
    } else {
      showToast(res.error || 'Failed to dispatch email campaign', 'error');
    }
  };

  const filteredEmailLogs = emailLogs.filter(log => {
    if (!emailSearch) return true;
    const q = emailSearch.toLowerCase();
    return (
      (log.recipientEmail && log.recipientEmail.toLowerCase().includes(q)) ||
      (log.customerName && log.customerName.toLowerCase().includes(q)) ||
      (log.subject && log.subject.toLowerCase().includes(q)) ||
      (log.campaignType && log.campaignType.toLowerCase().includes(q)) ||
      (log.reference && log.reference.toLowerCase().includes(q))
    );
  });

  return (
    <AdminLayout activeTab="communications">
      <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Header with Title and Quick Stats */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Communications & Marketing Desk</h1>
                <p className="text-xs text-slate-400">Real-time mobile banners, in-app notifications, and customer trade broadcasts</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenCreateBanner}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>New Mobile Banner</span>
            </button>
            <button
              onClick={() => setActiveTab('campaign')}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 transition-all"
            >
              <Mail className="w-4 h-4 text-indigo-400" />
              <span>Compose Campaign</span>
            </button>
          </div>
        </div>

        {/* Operational Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Home Banners</span>
              <Smartphone className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">{banners.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{banners.filter(b => b.isActive).length} currently active on mobile</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">In-App Alerts</span>
              <Bell className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">{notifications.length}</div>
            <div className="text-[11px] text-slate-400 mt-1">Live customer push messages</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Delivered Receipts</span>
              <Mail className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {Object.keys(dbState.email_receipts || {}).length}
            </div>
            <div className="text-[11px] text-indigo-400 mt-1">100% Delivery SLA</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400 font-medium">Registered Audience</span>
              <Users className="w-4 h-4 text-teal-400" />
            </div>
            <div className="text-xl font-bold text-white">{registeredUsers.length} Merchants</div>
            <div className="text-[11px] text-teal-400 mt-1">Broadcast reachable</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('banners')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'banners'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile Home Banners ({banners.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'notifications'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>In-App Notifications Console ({notifications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('emails')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'emails'
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Mail className="w-4 h-4" />
            <span>Email Delivery Logs</span>
          </button>

          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'campaign'
                ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Trade Email Campaign</span>
          </button>
        </div>

        {/* -------------------------------------------------------------
            TAB 1: BANNERS CONTENT (Admin-Controlled Image Banners)
        ------------------------------------------------------------- */}
        {activeTab === 'banners' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Megaphone className="w-4 h-4 text-emerald-400" />
                  <span>Promotional Banner & Storefront Carousel Management</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Upload and control dynamic rotating image carousels for the Apple & Tech Store and Mobile Home screen with Supabase Storage integration.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleOpenCreateBanner}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>+ Create New Banner</span>
                </button>
              </div>
            </div>

            {/* Placement Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'All Banners', count: banners.length },
                { id: 'shop', label: 'Apple & Tech Store (/shop)', count: banners.filter(b => b.placement === 'shop' || b.destinationRoute === 'shop').length },
                { id: 'home', label: 'Mobile Home Campaigns (/home)', count: banners.filter(b => b.placement === 'home' || (!b.placement && b.destinationRoute !== 'shop')).length }
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setBannerPlacementFilter(pill.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    bannerPlacementFilter === pill.id
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>{pill.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    bannerPlacementFilter === pill.id ? 'bg-emerald-500/25 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {pill.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners
                .filter(b => {
                  if (bannerPlacementFilter === 'all') return true;
                  if (bannerPlacementFilter === 'shop') return b.placement === 'shop' || b.destinationRoute === 'shop';
                  return b.placement === 'home' || (!b.placement && b.destinationRoute !== 'shop');
                })
                .sort((a, b) => a.displayOrder - b.displayOrder)
                .map((banner, idx, arr) => (
                <div
                  key={banner.id}
                  className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all group shadow-xl"
                >
                  <div>
                    {/* Banner Card Image */}
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
                          {banner.placement === 'shop' || banner.destinationRoute === 'shop' ? 'Tech Store' : 'Home'}
                        </span>

                        <span className="px-2 py-0.8 rounded-full bg-slate-950/80 text-slate-300 text-[10px] font-bold border border-slate-700/60">
                          Order #{banner.displayOrder}
                        </span>
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          {banner.badge && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] font-black uppercase">
                              {banner.badge}
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-slate-400">
                            /{banner.destinationRoute || 'shop'}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{banner.title}</h3>
                        {banner.subtitle && (
                          <p className="text-[11px] text-slate-300 line-clamp-1">{banner.subtitle}</p>
                        )}
                      </div>
                    </div>

                    {/* Banner Description */}
                    <div className="p-4 space-y-2">
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {banner.description || banner.subtitle || 'High-fidelity rotating banner for mobile users.'}
                      </p>
                    </div>
                  </div>

                  {/* Banner Controls & Reordering */}
                  <div className="p-4 pt-0 border-t border-slate-800/80 mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleBannerStatus(banner.id, banner.isActive)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          banner.isActive
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}
                      >
                        {banner.isActive ? 'Pause' : 'Publish'}
                      </button>

                      {/* Sorting / Ordering controls */}
                      <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveBanner(banner.id, 'up')}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                          title="Move Earlier in Carousel"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === arr.length - 1}
                          onClick={() => handleMoveBanner(banner.id, 'down')}
                          className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 cursor-pointer"
                          title="Move Later in Carousel"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditBanner(banner)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Edit Banner"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteBanner(banner.id)}
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

        {/* -------------------------------------------------------------
            TAB 2: IN-APP NOTIFICATIONS
        ------------------------------------------------------------- */}
        {activeTab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Compose Form */}
            <div className="lg:col-span-1 p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Broadcast Alert</h3>
                  <p className="text-[11px] text-slate-400">Push to customer header bell & list</p>
                </div>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Notification Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lagos Warehouse Customs Clearance Update"
                    value={notifForm.title}
                    onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Message Body</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Details for merchant regarding rates, shipments, or wallet..."
                    value={notifForm.message}
                    onChange={(e) => setNotifForm({ ...notifForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Category</label>
                    <select
                      value={notifForm.type}
                      onChange={(e) => setNotifForm({ ...notifForm, type: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="system">System Alert</option>
                      <option value="promo">Special Offer</option>
                      <option value="cargo">Cargo / Freight</option>
                      <option value="financial">Wallet / Rates</option>
                      <option value="security">Security Notice</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Deep Link Route</label>
                    <select
                      value={notifForm.linkRoute}
                      onChange={(e) => setNotifForm({ ...notifForm, linkRoute: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                    >
                      <option value="notifications">Notifications Center</option>
                      <option value="logistics">Logistics & Shipments</option>
                      <option value="shop">Apple Gadgets Shop</option>
                      <option value="suppliers">VIP Suppliers</option>
                      <option value="wallet">Wallet Balance</option>
                      <option value="orders">Orders & History</option>
                      <option value="support">Help & Support</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Target Audience</label>
                  <select
                    value={notifForm.targetUserId}
                    onChange={(e) => setNotifForm({ ...notifForm, targetUserId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="all">Global (All Customers & Merchants)</option>
                    {registeredUsers.map(u => (
                      <option key={u.uid} value={u.uid}>
                        {u.fullName} ({u.email || u.phone})
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={sendingNotif}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingNotif ? 'Broadcasting...' : 'Broadcast In-App Alert'}</span>
                </button>
              </form>
            </div>

            {/* Right: Notification Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white">Live Dispatched Alerts ({notifications.length})</h3>
                <span className="text-xs text-slate-400">Rendered in mobile header bell</span>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
                    No in-app notifications have been dispatched yet.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Bell className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs font-bold text-white">{n.title}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-300">
                              {n.type || 'system'}
                            </span>
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {n.timestamp ? new Date(n.timestamp).toLocaleTimeString() : n.time || 'Recent'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{n.message}</p>
                          <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                            <span>Target: <span className="text-slate-300 font-medium">{n.targetUserId || 'All Users'}</span></span>
                            <span>Route: <span className="text-emerald-400 font-medium">/{n.linkRoute || 'notifications'}</span></span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteNotification(n.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 transition-colors shrink-0"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 3: EMAIL DELIVERY LOGS
        ------------------------------------------------------------- */}
        {activeTab === 'emails' && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by recipient, subject, or transaction ref..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={fetchEmailLogs}
                disabled={loadingEmails}
                className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-all self-start md:self-auto"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${loadingEmails ? 'animate-spin' : ''}`} />
                <span>Refresh Delivery Logs</span>
              </button>
            </div>

            <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Recipient</th>
                      <th className="px-5 py-3.5">Subject / Campaign</th>
                      <th className="px-5 py-3.5">Category</th>
                      <th className="px-5 py-3.5">Delivered At</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-right">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEmailLogs.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-slate-500 text-xs">
                          {loadingEmails ? 'Loading email delivery logs...' : 'No email delivery records found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredEmailLogs.map((log, idx) => (
                        <tr key={log.id || idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-4">
                            <div className="font-bold text-white">{log.customerName || 'Merchant'}</div>
                            <div className="text-[11px] text-slate-400">{log.recipientEmail}</div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="font-semibold text-slate-200 line-clamp-1">{log.subject || log.notes || 'Transaction Receipt'}</div>
                            {log.reference && (
                              <div className="text-[10px] font-mono text-indigo-400">{log.reference}</div>
                            )}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300">
                              {log.campaignType || (log.durationDays ? 'VIP Subscription' : 'Transactional')}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 whitespace-nowrap">
                            {log.deliveredAt ? new Date(log.deliveredAt).toLocaleString() : 'Recent'}
                          </td>
                          <td className="px-5 py-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              <span>{log.status || 'delivered'}</span>
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => setSelectedEmail(log)}
                              className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-bold transition-all"
                            >
                              View Payload
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            TAB 4: MARKETING EMAIL CAMPAIGN
        ------------------------------------------------------------- */}
        {activeTab === 'campaign' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Direct Trade Email Broadcast</h3>
                  <p className="text-xs text-slate-400">Send bulk newsletters or targeted trade alerts to merchant inboxes</p>
                </div>
              </div>

              <form onSubmit={handleSendCampaign} className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                  <input
                    type="checkbox"
                    id="broadcastToggle"
                    checked={campaignForm.broadcastToAllUsers}
                    onChange={(e) => setCampaignForm({ ...campaignForm, broadcastToAllUsers: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-900 border-slate-700"
                  />
                  <label htmlFor="broadcastToggle" className="text-xs font-semibold text-slate-200 cursor-pointer">
                    Broadcast to all registered merchants ({registeredUsers.length} total)
                  </label>
                </div>

                {!campaignForm.broadcastToAllUsers && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5">Recipient Email</label>
                      <input
                        type="email"
                        required
                        placeholder="merchant@flyemass.com"
                        value={campaignForm.recipientEmail}
                        onChange={(e) => setCampaignForm({ ...campaignForm, recipientEmail: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-400 block mb-1.5">Merchant Name</label>
                      <input
                        type="text"
                        placeholder="Chief Babatunde"
                        value={campaignForm.recipientName}
                        onChange={(e) => setCampaignForm({ ...campaignForm, recipientName: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Campaign Subject Line</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 136th Canton Fair FlyeMass Logistics & Factory Delegation Pass"
                    value={campaignForm.subject}
                    onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Campaign Type</label>
                  <select
                    value={campaignForm.campaignType}
                    onChange={(e) => setCampaignForm({ ...campaignForm, campaignType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="marketing_broadcast">Promotional & Marketing Campaign</option>
                    <option value="freight_schedule">Holiday Shipping & Vessel Schedule</option>
                    <option value="fx_alert">FX Rate Update / Naira Policy Notice</option>
                    <option value="vip_trade">VIP Supplier Directory Spotlight</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Email Body</label>
                  <textarea
                    required
                    rows={6}
                    placeholder="Dear Merchant, we are pleased to inform you that new Guangzhou sea freight rates have been reduced..."
                    value={campaignForm.message}
                    onChange={(e) => setCampaignForm({ ...campaignForm, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-teal-500 resize-none font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={sendingCampaign}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-500/10 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{sendingCampaign ? 'Dispatching Campaign...' : 'Send Trade Broadcast Email'}</span>
                </button>
              </form>
            </div>

            {/* Email Preview Card */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-400" />
                <span>Live Inbox Email Preview</span>
              </h3>

              <div className="rounded-3xl bg-white text-slate-900 p-6 shadow-2xl border border-slate-200 space-y-4 font-sans">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black flex items-center justify-center text-xs">
                      FM
                    </div>
                    <span className="font-bold text-sm tracking-tight text-slate-800">FlyeMass Global Trade</span>
                  </div>
                  <span className="text-[11px] text-slate-400">noreply@flyemass.com</span>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Subject</span>
                  <div className="text-base font-bold text-slate-900 mt-0.5">
                    {campaignForm.subject || 'Your Trade Announcement Subject Here'}
                  </div>
                </div>

                <div className="py-2 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap min-h-[120px]">
                  {campaignForm.message || 'Write your message in the form on the left to see the live rendering here...'}
                </div>

                <div className="pt-4 border-t border-slate-100 space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-500 leading-relaxed">
                    <strong>Trade Protection Notice:</strong> FlyeMass operates licensed trade settlement, Guangzhou bonded warehousing, and Lagos clearing. For direct China supplier transactions, always coordinate through your FlyeMass account.
                  </div>
                  <div className="text-center text-[10px] text-slate-400">
                    FlyeMass Global Hub — Guangzhou · Yiwu · Lagos
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: CREATE / EDIT BANNER (Dynamic Supabase Storage Image Upload)
        ------------------------------------------------------------- */}
        {isBannerModalOpen && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-start justify-center pt-6 sm:pt-10 p-4 overflow-y-auto">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 my-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Image className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-bold text-white">
                    {editingBanner ? 'Edit Promotional Banner' : 'Create High-Fidelity Banner'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsBannerModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveBanner} className="space-y-4">
                {/* Target Placement */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">Storefront Placement</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, placement: 'shop', destinationRoute: 'shop' as ScreenRoute })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        bannerForm.placement === 'shop' || bannerForm.destinationRoute === 'shop'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Apple & Tech Store</span>
                      </div>
                      {(bannerForm.placement === 'shop' || bannerForm.destinationRoute === 'shop') && (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setBannerForm({ ...bannerForm, placement: 'home', destinationRoute: 'agent' as ScreenRoute })}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                        bannerForm.placement === 'home' && bannerForm.destinationRoute !== 'shop'
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-sm'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Mobile Home Desk</span>
                      </div>
                      {bannerForm.placement === 'home' && bannerForm.destinationRoute !== 'shop' && (
                        <Check className="w-3.5 h-3.5 text-indigo-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Banner Image Upload & Live Preview */}
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1.5">
                    Banner Cover Image (Supabase Storage: <span className="font-mono text-emerald-400">public.shop_banners</span>)
                  </label>
                  
                  {/* Image Live Preview */}
                  {bannerForm.imageUrl && (
                    <div className="relative h-28 w-full rounded-2xl overflow-hidden mb-2.5 border border-slate-800 bg-slate-950 group">
                      <img 
                        src={bannerForm.imageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2.5">
                        <span className="text-[10px] text-slate-300 font-medium line-clamp-1">
                          Preview: {bannerForm.title || 'Untitled Banner'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Dropzone & File Input */}
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <label className={`flex-1 w-full p-3 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950/70 hover:bg-slate-950 flex items-center justify-center gap-2 text-xs text-slate-300 cursor-pointer transition-all ${
                      isUploadingBanner ? 'opacity-60 pointer-events-none' : ''
                    }`}>
                      <UploadCloud className={`w-4 h-4 ${isUploadingBanner ? 'animate-bounce text-emerald-400' : 'text-slate-400'}`} />
                      <span>{isUploadingBanner ? 'Uploading to Supabase Storage...' : 'Upload Image (PNG/JPG/WebP)'}</span>
                      <input 
                        type="file" 
                        accept="image/png,image/jpeg,image/webp,image/jpg" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUploadBannerFile(file);
                        }} 
                      />
                    </label>

                    <div className="w-full sm:w-1/2">
                      <input
                        type="url"
                        placeholder="Or direct image URL..."
                        value={bannerForm.imageUrl}
                        onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Banner Title / Headline</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apple iPhone 16 Pro Max"
                      value={bannerForm.title}
                      onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Badge Tag</label>
                    <input
                      type="text"
                      placeholder="e.g. Hong Kong Direct Hub"
                      value={bannerForm.badge}
                      onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 focus:outline-none focus:border-emerald-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Subtitle / Key Promotion Details</label>
                  <input
                    type="text"
                    placeholder="e.g. Factory Sealed HK Spec • Dual SIM with 2-4 Days Express Air Cargo to Lagos"
                    value={bannerForm.subtitle}
                    onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Target Click Route</label>
                    <select
                      value={bannerForm.destinationRoute}
                      onChange={(e) => setBannerForm({ ...bannerForm, destinationRoute: e.target.value as ScreenRoute })}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="shop">Apple & Tech Store (/shop)</option>
                      <option value="agent">Agent & Sourcing (/agent)</option>
                      <option value="logistics">Logistics & Shipping (/logistics)</option>
                      <option value="suppliers">VIP Verified Suppliers (/suppliers)</option>
                      <option value="hotels">Hotel Bookings (/hotels)</option>
                      <option value="rentals">Apartments & Offices (/rentals)</option>
                      <option value="fund">Fund Wallet (/fund)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Display Priority Order</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={bannerForm.displayOrder}
                      onChange={(e) => setBannerForm({ ...bannerForm, displayOrder: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActiveBanner"
                    checked={bannerForm.isActive}
                    onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 bg-slate-950 border-slate-800 cursor-pointer"
                  />
                  <label htmlFor="isActiveBanner" className="text-xs text-slate-300 font-semibold cursor-pointer">
                    Publish immediately live on customer mobile app
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsBannerModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 hover:brightness-110 cursor-pointer"
                  >
                    {editingBanner ? 'Save Changes' : 'Publish Banner'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------
            MODAL: INSPECT EMAIL RECEIPT PAYLOAD
        ------------------------------------------------------------- */}
        {selectedEmail && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Email Receipt / Delivery Record</h3>
                </div>
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px] block">Recipient</span>
                  <div className="text-white font-semibold">{selectedEmail.customerName} ({selectedEmail.recipientEmail})</div>
                </div>

                {selectedEmail.reference && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">Reference</span>
                    <div className="text-indigo-400 font-mono">{selectedEmail.reference}</div>
                  </div>
                )}

                {selectedEmail.amount && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">Amount Paid</span>
                    <div className="text-emerald-400 font-bold">{selectedEmail.currency || 'USD'} {selectedEmail.amount}</div>
                  </div>
                )}

                {selectedEmail.expirationDate && (
                  <div>
                    <span className="text-slate-500 text-[11px] block">VIP Pass Expiration</span>
                    <div className="text-slate-300">{new Date(selectedEmail.expirationDate).toLocaleString()}</div>
                  </div>
                )}

                {selectedEmail.tradeSafetyNotice && (
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                    <strong>Notice:</strong> {selectedEmail.tradeSafetyNotice}
                  </div>
                )}

                {selectedEmail.body && (
                  <div>
                    <span className="text-slate-500 text-[11px] block mb-1">Message Body</span>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                      {selectedEmail.body}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setSelectedEmail(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
