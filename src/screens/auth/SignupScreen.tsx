import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  User, 
  Calendar, 
  Phone, 
  Mail, 
  Globe, 
  ChevronDown, 
  ChevronLeft, 
  ArrowRight, 
  Search, 
  AlertCircle, 
  Check 
} from 'lucide-react';

interface CountryItem {
  name: string;
  code: string;
  flag: string;
  dialCode: string;
}

const COUNTRIES: CountryItem[] = [
  { name: 'Nigeria', code: 'NG', flag: '🇳🇬', dialCode: '+234' },
  { name: 'China (PRC)', code: 'CN', flag: '🇨🇳', dialCode: '+86' },
  { name: 'United States', code: 'US', flag: '🇺🇸', dialCode: '+1' },
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', dialCode: '+44' },
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', dialCode: '+852' },
  { name: 'Ghana', code: 'GH', flag: '🇬🇭', dialCode: '+233' },
  { name: 'Kenya', code: 'KE', flag: '🇰🇪', dialCode: '+254' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', dialCode: '+27' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', dialCode: '+1' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', dialCode: '+971' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', dialCode: '+49' },
  { name: 'France', code: 'FR', flag: '🇫🇷', dialCode: '+33' },
  { name: 'India', code: 'IN', flag: '🇮🇳', dialCode: '+91' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', dialCode: '+81' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', dialCode: '+65' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', dialCode: '+61' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', dialCode: '+55' },
  { name: 'Egypt', code: 'EG', flag: '🇪🇬', dialCode: '+20' },
  { name: 'Turkey', code: 'TR', flag: '🇹🇷', dialCode: '+90' },
  { name: 'Rwanda', code: 'RW', flag: '🇷🇼', dialCode: '+250' },
  { name: 'Benin', code: 'BJ', flag: '🇧🇯', dialCode: '+229' },
  { name: 'Togo', code: 'TG', flag: '🇹🇬', dialCode: '+228' },
  { name: 'Cameroon', code: 'CM', flag: '🇨🇲', dialCode: '+237' },
  { name: 'Côte d’Ivoire', code: 'CI', flag: '🇨🇮', dialCode: '+225' },
  { name: 'Uganda', code: 'UG', flag: '🇺🇬', dialCode: '+256' },
  { name: 'Tanzania', code: 'TZ', flag: '🇹🇿', dialCode: '+255' }
];

interface FormState {
  firstName: string;
  surname: string;
  otherName: string;
  dateOfBirth: string;
  callingCode: string;
  phoneNumber: string;
  email: string;
  country: string;
  countryCode: string;
}

interface FormErrors {
  firstName?: string;
  surname?: string;
  otherName?: string;
  dateOfBirth?: string;
  phoneNumber?: string;
  email?: string;
  country?: string;
}

export const SignupScreen: React.FC = () => {
  const { navigate, setPendingSignup, pendingSignup, showToast } = useApp();

  // Initialize form with existing pendingSignup if returning from PIN setup
  const [form, setForm] = useState<FormState>(() => {
    if (pendingSignup) {
      return {
        firstName: pendingSignup.firstName || '',
        surname: pendingSignup.surname || '',
        otherName: pendingSignup.otherName || '',
        dateOfBirth: pendingSignup.dateOfBirth || '',
        callingCode: pendingSignup.callingCode || '+234',
        phoneNumber: pendingSignup.phoneNumber || '',
        email: pendingSignup.email || '',
        country: pendingSignup.country || 'Nigeria',
        countryCode: pendingSignup.countryCode || 'NG',
      };
    }
    return {
      firstName: '',
      surname: '',
      otherName: '',
      dateOfBirth: '',
      callingCode: '+234',
      phoneNumber: '',
      email: '',
      country: 'Nigeria',
      countryCode: 'NG',
    };
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isCallingCodeOpen, setIsCallingCodeOpen] = useState(false);
  const [countrySearchQuery, setCountrySearchQuery] = useState('');

  // 18 years age limit
  const maxDobDate = useMemo(() => {
    const today = new Date();
    const d = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    return d.toISOString().split('T')[0];
  }, []);

  // Filtered countries for searchable dropdown
  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return COUNTRIES;
    const q = countrySearchQuery.toLowerCase();
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearchQuery]);

  // Selected Country Object
  const currentCountry = useMemo(() => {
    return (
      COUNTRIES.find((c) => c.name === form.country || c.code === form.countryCode) ||
      COUNTRIES[0]
    );
  }, [form.country, form.countryCode]);

  // Handle Country Selection: Updates Country AND suggests matching international calling code
  const handleSelectCountry = (c: CountryItem) => {
    setForm((prev) => ({
      ...prev,
      country: c.name,
      countryCode: c.code,
      callingCode: c.dialCode, // Auto-suggest calling code based on selected country
    }));
    setIsCountryDropdownOpen(false);
    setCountrySearchQuery('');
    if (errors.country) {
      setErrors((prev) => ({ ...prev, country: undefined }));
    }
  };

  // Handle Calling Code Selection
  const handleSelectCallingCode = (c: CountryItem) => {
    setForm((prev) => ({
      ...prev,
      callingCode: c.dialCode,
    }));
    setIsCallingCodeOpen(false);
  };

  // Validate all fields
  const validate = (): boolean => {
    const errs: FormErrors = {};

    // 1. First Name - Required
    if (!form.firstName.trim()) {
      errs.firstName = 'First name is required';
    } else if (form.firstName.trim().length < 2) {
      errs.firstName = 'First name must be at least 2 characters';
    }

    // 2. Surname - Required
    if (!form.surname.trim()) {
      errs.surname = 'Surname is required';
    } else if (form.surname.trim().length < 2) {
      errs.surname = 'Surname must be at least 2 characters';
    }

    // 3. Other Name - Optional (no validation error)

    // 4. Date of Birth - Required, must be >= 18 years
    if (!form.dateOfBirth) {
      errs.dateOfBirth = 'Date of birth is required';
    } else {
      const dob = new Date(form.dateOfBirth);
      if (isNaN(dob.getTime())) {
        errs.dateOfBirth = 'Please select a valid date of birth';
      } else {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        if (age < 18) {
          errs.dateOfBirth = 'You must be at least 18 years of age to register';
        }
      }
    }

    // 5. Phone Number - Required, international format validation
    const digitsOnly = form.phoneNumber.replace(/\D/g, '');
    if (!digitsOnly) {
      errs.phoneNumber = 'Phone number is required';
    } else if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      errs.phoneNumber = 'Please enter a valid phone number (7-15 digits)';
    }

    // 6. Email Address - Required, email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      errs.email = 'Email address is required';
    } else if (!emailRegex.test(form.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    // 7. Country - Required
    if (!form.country.trim()) {
      errs.country = 'Please select your country of residence';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please correct the highlighted fields before proceeding', 'error');
      return;
    }

    const cleanPhoneDigits = form.phoneNumber.trim().replace(/^0+/, ''); // strip leading zero if present
    const fullPhone = `${form.callingCode} ${cleanPhoneDigits}`;
    const fullName = `${form.firstName.trim()} ${form.otherName.trim() ? form.otherName.trim() + ' ' : ''}${form.surname.trim()}`.trim();

    const pendingData = {
      firstName: form.firstName.trim(),
      surname: form.surname.trim(),
      otherName: form.otherName.trim(),
      fullName,
      dateOfBirth: form.dateOfBirth,
      country: form.country,
      countryCode: form.countryCode,
      callingCode: form.callingCode,
      phone: fullPhone,
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim().toLowerCase(),
      businessName: fullName, // personal account representation
      accountType: 'personal' as const,
    };

    setPendingSignup(pendingData);
    navigate('setup-pin');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-slate-950 text-white">
      <div>
        {/* Sticky Header with Step indicator */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/80 -mx-6 px-6 py-3 mb-6 flex items-center justify-between safe-top shrink-0">
          <button
            type="button"
            onClick={() => navigate('welcome')}
            className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
            STEP 1 OF 2
          </span>
          <div className="w-10" />
        </div>

        {/* Page Title and Description */}
        <div className="space-y-1.5 mb-6">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Create Your FlyeMass Account</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Join FlyeMass to manage your wallets, payments, shipments, and international services.
          </p>
        </div>

        {/* Registration Form - Required Personal Information in Exact Order */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* 1. First Name — Required */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              First Name <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-2xl bg-slate-900/90 border transition-all ${
                errors.firstName
                  ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                  : 'border-slate-800 focus-within:border-emerald-500'
              }`}
            >
              <User className="absolute left-3.5 w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Babatunde"
                value={form.firstName}
                onChange={(e) => {
                  setForm({ ...form, firstName: e.target.value });
                  if (errors.firstName) setErrors({ ...errors, firstName: undefined });
                }}
                className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-xs text-white placeholder-slate-500"
              />
            </div>
            {errors.firstName && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.firstName}</span>
              </p>
            )}
          </div>

          {/* 2. Surname — Required */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Surname <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-2xl bg-slate-900/90 border transition-all ${
                errors.surname
                  ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                  : 'border-slate-800 focus-within:border-emerald-500'
              }`}
            >
              <User className="absolute left-3.5 w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Alade"
                value={form.surname}
                onChange={(e) => {
                  setForm({ ...form, surname: e.target.value });
                  if (errors.surname) setErrors({ ...errors, surname: undefined });
                }}
                className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-xs text-white placeholder-slate-500"
              />
            </div>
            {errors.surname && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.surname}</span>
              </p>
            )}
          </div>

          {/* 3. Other Name — Optional */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                Other Name
              </label>
              <span className="text-[10px] text-slate-400 uppercase font-medium tracking-wide">
                Optional
              </span>
            </div>
            <div className="relative flex items-center rounded-2xl bg-slate-900/90 border border-slate-800 focus-within:border-emerald-500 transition-all">
              <User className="absolute left-3.5 w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="text"
                placeholder="e.g. Olawale (middle name)"
                value={form.otherName}
                onChange={(e) => setForm({ ...form, otherName: e.target.value })}
                className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-xs text-white placeholder-slate-500"
              />
            </div>
          </div>

          {/* 4. Date of Birth — Required, with date picker & 18+ enforcement */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Date of Birth <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-2xl bg-slate-900/90 border transition-all ${
                errors.dateOfBirth
                  ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                  : 'border-slate-800 focus-within:border-emerald-500'
              }`}
            >
              <Calendar className="absolute left-3.5 w-4 h-4 text-slate-500 shrink-0 pointer-events-none" />
              <input
                type="date"
                max={maxDobDate}
                value={form.dateOfBirth}
                onChange={(e) => {
                  setForm({ ...form, dateOfBirth: e.target.value });
                  if (errors.dateOfBirth) setErrors({ ...errors, dateOfBirth: undefined });
                }}
                className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-xs text-white [color-scheme:dark]"
              />
            </div>
            {errors.dateOfBirth ? (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.dateOfBirth}</span>
              </p>
            ) : (
              <p className="mt-1 text-[10px] text-slate-400">
                You must be 18 years or older to hold a FlyeMass account.
              </p>
            )}
          </div>

          {/* 5. Phone Number — Required, with international calling code selector */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Phone Number <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-2xl bg-slate-900/90 border transition-all ${
                errors.phoneNumber
                  ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                  : 'border-slate-800 focus-within:border-emerald-500'
              }`}
            >
              {/* International Calling Code Selector Button */}
              <button
                type="button"
                onClick={() => setIsCallingCodeOpen(!isCallingCodeOpen)}
                className="h-full pl-3 pr-2.5 py-3 border-r border-slate-800 flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
              >
                <span>{currentCountry.flag}</span>
                <span>{form.callingCode}</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <Phone className="ml-3 w-4 h-4 text-slate-500 shrink-0" />
              
              <input
                type="tel"
                placeholder="803 123 4567"
                value={form.phoneNumber}
                onChange={(e) => {
                  setForm({ ...form, phoneNumber: e.target.value });
                  if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: undefined });
                }}
                className="w-full pl-2.5 pr-4 py-3 bg-transparent outline-none text-xs text-white placeholder-slate-500"
              />
            </div>

            {/* Quick Calling Code Dropdown Popover */}
            {isCallingCodeOpen && (
              <div className="mt-1.5 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl max-h-48 overflow-y-auto space-y-1 z-30">
                <p className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Calling Code
                </p>
                {COUNTRIES.map((c) => (
                  <button
                    key={`dial-${c.code}`}
                    type="button"
                    onClick={() => handleSelectCallingCode(c)}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors ${
                      form.callingCode === c.dialCode
                        ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-slate-400 font-mono text-[11px]">{c.dialCode}</span>
                  </button>
                ))}
              </div>
            )}

            {errors.phoneNumber && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.phoneNumber}</span>
              </p>
            )}
          </div>

          {/* 6. Email Address — Required, with email validation */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Email Address <span className="text-emerald-400">*</span>
            </label>
            <div
              className={`relative flex items-center rounded-2xl bg-slate-900/90 border transition-all ${
                errors.email
                  ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                  : 'border-slate-800 focus-within:border-emerald-500'
              }`}
            >
              <Mail className="absolute left-3.5 w-4 h-4 text-slate-500 shrink-0" />
              <input
                type="email"
                placeholder="e.g. babatunde@aladeholding.ng"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className="w-full pl-10 pr-4 py-3 bg-transparent outline-none text-xs text-white placeholder-slate-500"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* 7. Country — Required, with searchable country dropdown and flag */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 uppercase tracking-wider mb-1">
              Country <span className="text-emerald-400">*</span>
            </label>

            {/* Country Selector Trigger */}
            <button
              type="button"
              onClick={() => setIsCountryDropdownOpen(!isCountryDropdownOpen)}
              className={`w-full relative flex items-center justify-between px-3.5 py-3 rounded-2xl bg-slate-900/90 border transition-all text-left ${
                errors.country
                  ? 'border-rose-500/80 ring-1 ring-rose-500/20'
                  : 'border-slate-800 hover:border-slate-700 focus:border-emerald-500'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Globe className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-base shrink-0">{currentCountry.flag}</span>
                <span className="text-xs text-white font-medium truncate">
                  {currentCountry.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({currentCountry.dialCode})
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 transition-transform ${
                  isCountryDropdownOpen ? 'rotate-180 text-emerald-400' : ''
                }`}
              />
            </button>

            {/* Searchable Country Dropdown Popover */}
            {isCountryDropdownOpen && (
              <div className="mt-2 p-2.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-2 z-40">
                {/* Search Input */}
                <div className="relative flex items-center rounded-xl bg-slate-950 border border-slate-800 focus-within:border-emerald-500 px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search country or dial code..."
                    value={countrySearchQuery}
                    onChange={(e) => setCountrySearchQuery(e.target.value)}
                    className="w-full pl-2 bg-transparent outline-none text-xs text-white placeholder-slate-500"
                    autoFocus
                  />
                </div>

                {/* Country List */}
                <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                  {filteredCountries.length > 0 ? (
                    filteredCountries.map((c) => {
                      const isSelected = form.country === c.name;
                      return (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => handleSelectCountry(c)}
                          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs transition-colors ${
                            isSelected
                              ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800/80'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">{c.flag}</span>
                            <span>{c.name}</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                            <span>{c.dialCode}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="py-4 text-center text-xs text-slate-500">
                      No country found matching "{countrySearchQuery}"
                    </div>
                  )}
                </div>
              </div>
            )}

            {errors.country && (
              <p className="mt-1 text-[11px] text-rose-400 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.country}</span>
              </p>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            type="submit"
            className="w-full mt-6 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            <span>Continue to PIN Setup</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Footer Navigation */}
      <div className="pt-6 mt-6 text-center border-t border-slate-900">
        <p className="text-xs text-slate-400">
          Already registered?{' '}
          <button
            type="button"
            onClick={() => navigate('login')}
            className="text-emerald-400 font-bold hover:underline"
          >
            Log In
          </button>
        </p>
      </div>
    </div>
  );
};
