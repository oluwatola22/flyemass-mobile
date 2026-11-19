/**
 * FLYEMASS AUTHORITATIVE INTERNATIONALIZATION (i18n) ENGINE
 * Exclusively supports English (EN - Primary) and French (FR - Français).
 */

export type Language = 'EN' | 'FR';

export interface TranslationDict {
  [key: string]: string;
}

export const TRANSLATIONS: Record<Language, TranslationDict> = {
  EN: {
    // Navigation & Tabs
    'nav.home': 'Home',
    'nav.wallets': 'Wallets',
    'nav.cargo': 'Cargo',
    'nav.shop': 'Shop',
    'nav.profile': 'Profile',

    // Route / Header Titles
    'route.home': '',
    'route.wallets': 'Wallets & Multi-Currency',
    'route.logistics': 'Logistics & Shipping',
    'route.shop': 'Apple & Tech Store',
    'route.profile': 'Corporate Profile',
    'route.kyc': 'KYC & Identity Verification',
    'route.history': 'Audit Ledger & History',
    'route.notifications': 'Notification Feed',
    'route.fund': 'Fund Wallet',
    'route.pay': 'Send Money to China (RMB)',
    'route.exchange': 'Currency Swap',
    'route.withdraw': 'Withdraw Naira (NGN)',
    'route.track': 'Cargo Waybill Tracker',
    'route.register-package': 'Register Shipment',
    'route.cart': 'Shopping Cart',
    'route.checkout': 'Secure Wallet Checkout',
    'route.shop-saved': 'Saved Devices & Wishlist',
    'route.shop-compare': 'Specification Comparison',
    'route.shop-orders': 'Order History & Tracking',
    'route.shop-order-detail': 'Order Details',
    'route.product-detail': 'Device Specifications',
    'route.suppliers': 'VIP Supplier Directory',
    'route.agent': 'China Agent & Sourcing Hub',
    'route.procure': 'Direct Quotation Manager',
    'route.hotels': 'China Business Hotels & BNBs',
    'route.hotel-detail': 'Hotel Booking & Voucher',
    'route.hotel-bookings': 'My Hotel Vouchers',
    'route.rentals-apartments': 'Apartments & House Rentals',
    'route.rentals-offices': 'Commercial Office Rentals',
    'route.security': 'Security & Trusted Devices',
    'route.support': 'Trade Help & Concierge',
    'route.support-chat': 'Trade Concierge',
    'route.support-tickets': 'Support Tickets',
    'route.support-ticket-detail': 'Support Ticket Detail',
    'route.support-new-ticket': 'Open Support Ticket',
    'route.terms': 'Terms of Trade Service',
    'route.privacy': 'Privacy Policy & NDPR',
    'route.delete-account': 'Account Deletion Request',

    // Common Actions & Buttons
    'action.fund': 'Fund',
    'action.pay_supplier': 'Pay Supplier',
    'action.fx_swap': 'FX Swap',
    'action.withdraw': 'Withdraw',
    'action.track': 'Track',
    'action.copy': 'Copy',
    'action.copied': 'Copied!',
    'action.all_services': 'All Services',
    'action.view_details': 'View Details',
    'action.save': 'Save Changes',
    'action.cancel': 'Cancel',
    'action.confirm': 'Confirm',
    'action.close': 'Close',

    // Wallet & Balances
    'wallets.multi_currency_vaults': 'Multi-Currency Vaults',
    'wallets.available_balance': 'Available Balance',
    'wallets.instant_actions': 'Instant Actions',
    'wallets.total_portfolio_value': 'Total Portfolio Value',
    'wallets.active': 'ACTIVE',
    'wallets.live_fx': 'Live FX',

    // Logistics & Cargo Tabs
    'logistics.services': 'Services',
    'logistics.my_cargo': 'My Cargo',
    'logistics.hubs': 'Hubs',
    'logistics.estimator': 'Estimator',
    'logistics.all_shipments': 'All Shipments',
    'logistics.active_cargo': 'Active Cargo',
    'logistics.awaiting_payment': 'Awaiting Payment',
    'logistics.in_transit': 'In Transit',
    'logistics.completed': 'Completed',
    'logistics.registered': 'Registered',
    'logistics.quotation_pending': 'Quotation Pending',
    'logistics.paid': 'Paid',
    'logistics.personal_shipping_mark': 'YOUR PERSONAL SHIPPING MARK',
    'logistics.official_marking': 'OFFICIAL CARRIER & CARTON MARKING:',
    'logistics.copy_full_mark': 'Copy Full Mark',

    // Profile & Settings
    'profile.trade_language': 'Trade Language',
    'profile.language_subtitle': 'English (Primary), French (Français)',
    'profile.english': 'English',
    'profile.french': 'Français',
    'profile.security_section': 'Security & Hardware Enclave',
    'profile.concierge_section': 'Concierge & Trade Support',
    'profile.legal_section': 'Legal, Compliance & Governance',
    'profile.security_pin': 'Security Settings & PIN',
    'profile.device_migration': 'Device Migration & Biometrics',
    'profile.live_concierge': 'FlyeMass Live Concierge',
    'profile.tickets_desk': 'Support Tickets Desk',
    'profile.help_center': 'Help Center & Trade FAQs',
    'profile.terms': 'Terms of Trade Service',
    'profile.privacy': 'Privacy Policy & NDPR',
    'profile.delete_account': 'Account Deletion Request',
    'profile.logout': 'Sign Out of Mobile Enclave'
  },
  FR: {
    // Navigation & Tabs
    'nav.home': 'Accueil',
    'nav.wallets': 'Portefeuilles',
    'nav.cargo': 'Fret',
    'nav.shop': 'Boutique',
    'nav.profile': 'Profil',

    // Route / Header Titles
    'route.home': '',
    'route.wallets': 'Portefeuilles & Multi-Devises',
    'route.logistics': 'Logistique & Expédition',
    'route.shop': 'Boutique Apple & Tech',
    'route.profile': 'Profil d\'Entreprise',
    'route.kyc': 'Vérification d\'Identité KYC',
    'route.history': 'Grand Livre & Historique',
    'route.notifications': 'Flux de Notifications',
    'route.fund': 'Approvisionner Portefeuille',
    'route.pay': 'Envoyer des Fonds en Chine (RMB)',
    'route.exchange': 'Échange de Devises',
    'route.withdraw': 'Retirer des Nairas (NGN)',
    'route.track': 'Suivi de Lettre de Voiture',
    'route.register-package': 'Enregistrer un Colis',
    'route.cart': 'Panier d\'Achats',
    'route.checkout': 'Paiement Sécurisé Portefeuille',
    'route.shop-saved': 'Appareils Enregistrés & Favoris',
    'route.shop-compare': 'Comparaison des Spécifications',
    'route.shop-orders': 'Historique des Commandes & Suivi',
    'route.shop-order-detail': 'Détails de la Commande',
    'route.product-detail': 'Spécifications de l\'Appareil',
    'route.suppliers': 'Répertoire des Fournisseurs VIP',
    'route.agent': 'Agent Chine & Hub Sourcing',
    'route.procure': 'Gestionnaire de Devis Directs',
    'route.hotels': 'Hôtels d\'Affaires en Chine & BNBs',
    'route.hotel-detail': 'Réservation d\'Hôtel & Bon',
    'route.hotel-bookings': 'Mes Bons d\'Hôtel',
    'route.rentals-apartments': 'Locations d\'Appartements & Maisons',
    'route.rentals-offices': 'Locations de Bureaux Commerciaux',
    'route.security': 'Sécurité & Appareils de Confiance',
    'route.support': 'Aide au Commerce & Conciergerie',
    'route.support-chat': 'Conciergerie Commerciale',
    'route.support-tickets': 'Tickets de Support',
    'route.support-ticket-detail': 'Détail du Ticket de Support',
    'route.support-new-ticket': 'Ouvrir un Ticket de Support',
    'route.terms': 'Conditions du Service Commercial',
    'route.privacy': 'Politique de Confidentialité & NDPR',
    'route.delete-account': 'Demande de Suppression de Compte',

    // Common Actions & Buttons
    'action.fund': 'Approvisionner',
    'action.pay_supplier': 'Payer Fournisseur',
    'action.fx_swap': 'Échange FX',
    'action.withdraw': 'Retirer',
    'action.track': 'Suivre',
    'action.copy': 'Copier',
    'action.copied': 'Copié !',
    'action.all_services': 'Tous les Services',
    'action.view_details': 'Voir Détails',
    'action.save': 'Enregistrer les Modifications',
    'action.cancel': 'Annuler',
    'action.confirm': 'Confirmer',
    'action.close': 'Fermer',

    // Wallet & Balances
    'wallets.multi_currency_vaults': 'Coffres Multi-Devises',
    'wallets.available_balance': 'Solde Disponible',
    'wallets.instant_actions': 'Actions Instantanées',
    'wallets.total_portfolio_value': 'Valeur Totale du Portefeuille',
    'wallets.active': 'ACTIF',
    'wallets.live_fx': 'Taux FX en Direct',

    // Logistics & Cargo Tabs
    'logistics.services': 'Services',
    'logistics.my_cargo': 'Mes Colis',
    'logistics.hubs': 'Hubs',
    'logistics.estimator': 'Estimateur',
    'logistics.all_shipments': 'Tous les Colis',
    'logistics.active_cargo': 'Colis Actifs',
    'logistics.awaiting_payment': 'En Attente de Paiement',
    'logistics.in_transit': 'En Transit',
    'logistics.completed': 'Terminé',
    'logistics.registered': 'Enregistré',
    'logistics.quotation_pending': 'Devis en Attente',
    'logistics.paid': 'Payé',
    'logistics.personal_shipping_mark': 'VOTRE REPÈRE PERSONNEL D\'EXPÉDITION',
    'logistics.official_marking': 'MARQUAGE OFFICIEL TRANSPORTEUR & CARTON :',
    'logistics.copy_full_mark': 'Copier le Repère Complet',

    // Profile & Settings
    'profile.trade_language': 'Langue Commerciale',
    'profile.language_subtitle': 'English (Principal), Français',
    'profile.english': 'English',
    'profile.french': 'Français',
    'profile.security_section': 'Sécurité & Enclave Matérielle',
    'profile.concierge_section': 'Conciergerie & Support Commercial',
    'profile.legal_section': 'Légal, Conformité & Gouvernance',
    'profile.security_pin': 'Paramètres de Sécurité & Code PIN',
    'profile.device_migration': 'Migration d\'Appareil & Biométrie',
    'profile.live_concierge': 'Concierge FlyeMass en Direct',
    'profile.tickets_desk': 'Bureau des Tickets de Support',
    'profile.help_center': 'Centre d\'Aide & FAQ Commerciales',
    'profile.terms': 'Conditions du Service Commercial',
    'profile.privacy': 'Politique de Confidentialité & NDPR',
    'profile.delete_account': 'Demande de Suppression de Compte',
    'profile.logout': 'Se Déconnecter de l\'Enclave Mobile'
  }
};

/**
 * Translate a key into the given language with English fallback
 */
export function t(key: string, lang: Language = 'EN', fallback?: string): string {
  const currentDict = TRANSLATIONS[lang] || TRANSLATIONS.EN;
  if (currentDict[key]) {
    return currentDict[key];
  }
  // Fallback to English dictionary
  if (TRANSLATIONS.EN[key]) {
    return TRANSLATIONS.EN[key];
  }
  return fallback || key;
}

/**
 * Helper to get translated route title
 */
export function getRouteTitle(route: string, lang: Language = 'EN'): string {
  const key = `route.${route}`;
  return t(key, lang, '');
}
