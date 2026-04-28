import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useDataStore } from '@/store/dataStore';
import { api } from '@/lib/api';
import { User, School } from '@/types';

type Step = 'school' | 'admin' | 'template';

const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

export const SignupPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const setSchool = useDataStore((s) => s.setSchool);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentStep, setCurrentStep] = useState<Step>('school');
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'classic' | 'modern' | 'hybrid'>('classic');
  const [logoPreview, setLogoPreview] = useState('');

  const [schoolData, setSchoolData] = useState({
    schoolName: '',
    schoolAddress: '',
    schoolEmail: '',
    phoneNumber: '',
    motto: '',
    logo: '',
    principalName: '',
    website: '',
    state: '',
    lga: '',
    schoolType: 'public' as 'public' | 'private' | 'mission',
  });

  const [adminData, setAdminData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');

  // ── Logo upload ──────────────────────────────────────────────────────────

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors({ ...errors, logo: 'Please select an image file' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors({ ...errors, logo: 'Image must be less than 2MB' });
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setLogoPreview(b64);
      setSchoolData((prev) => ({ ...prev, logo: b64 }));
      setErrors((prev) => ({ ...prev, logo: '' }));
    };
    reader.readAsDataURL(file);
  };

  const removeLogo = () => {
    setLogoPreview('');
    setSchoolData((prev) => ({ ...prev, logo: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Validation ───────────────────────────────────────────────────────────

  const validateSchool = () => {
    const e: Record<string, string> = {};
    if (!schoolData.schoolName.trim()) e.schoolName = 'School name is required';
    if (!schoolData.schoolAddress.trim()) e.schoolAddress = 'Address is required';
    if (!schoolData.schoolEmail.trim()) {
      e.schoolEmail = 'School email is required';
    } else if (!/\S+@\S+\.\S+/.test(schoolData.schoolEmail)) {
      e.schoolEmail = 'Invalid email format';
    }
    if (!schoolData.phoneNumber.trim()) {
      e.phoneNumber = 'Phone number is required';
    }
    if (!schoolData.principalName.trim()) {
      e.principalName = 'Principal name is required';
    }
    if (!schoolData.state) e.state = 'Please select a state';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateAdmin = () => {
    const e: Record<string, string> = {};
    if (!adminData.firstName.trim()) e.firstName = 'First name is required';
    if (!adminData.lastName.trim()) e.lastName = 'Last name is required';
    if (!adminData.email.trim()) {
      e.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(adminData.email)) {
      e.email = 'Invalid email format';
    }
    if (!adminData.password) {
      e.password = 'Password is required';
    } else if (adminData.password.length < 8) {
      e.password = 'Password must be at least 8 characters';
    }
    if (adminData.password !== adminData.confirmPassword) {
      e.confirmPassword = 'Passwords do not match';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Navigation ───────────────────────────────────────────────────────────

  const handleNext = () => {
    if (currentStep === 'school' && validateSchool()) setCurrentStep('admin');
    else if (currentStep === 'admin' && validateAdmin()) setCurrentStep('template');
  };

  const handleBack = () => {
    if (currentStep === 'admin') setCurrentStep('school');
    if (currentStep === 'template') setCurrentStep('admin');
    setErrors({});
  };

  // ── Submit ───────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    setLoading(true);
    setApiError('');
    try {
      // 1. Create the admin user account
      const authRes = await api.post<{ access_token: string; user: User }>(
        '/auth/signup',
        {
          email: adminData.email.trim(),
          password: adminData.password,
          firstName: adminData.firstName.trim(),
          lastName: adminData.lastName.trim(),
          role: 'school_admin',
        },
      );

      // 2. Persist the token so the next request is authenticated
      login(authRes.user, authRes.access_token);

      // 3. Create the school (Zustand persist writes to localStorage synchronously,
      //    so the token is available to api.ts's getToken() now)
      const school = await api.post<School>('/schools', {
        name: schoolData.schoolName.trim(),
        address: schoolData.schoolAddress.trim(),
        email: schoolData.schoolEmail.trim(),
        phoneNumber: schoolData.phoneNumber.trim(),
        motto: schoolData.motto.trim() || undefined,
        logo: schoolData.logo || undefined,
        principalName: schoolData.principalName.trim(),
        website: schoolData.website.trim() || undefined,
        state: schoolData.state || undefined,
        lga: schoolData.lga.trim() || undefined,
        schoolType: schoolData.schoolType,
        templateId: selectedTemplate,
      });

      setSchool({
        id: school.id,
        name: school.name,
        address: school.address,
        email: school.email,
        phoneNumber: school.phoneNumber,
        motto: school.motto,
        logo: school.logo,
        principalName: school.principalName,
        website: school.website,
        state: school.state,
        lga: school.lga,
        schoolType: school.schoolType,
        templateId: school.templateId ?? 'classic',
      });

      navigate('/principal/dashboard');
    } catch (err: any) {
      setApiError(err.message ?? 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────

  const stepIndex = ['school', 'admin', 'template'].indexOf(currentStep);
  const progress = ((stepIndex + 1) / 3) * 100;

  const inputCls = 'w-full border border-outline-variant/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50';
  const errCls = 'mt-1 text-xs text-error';

  const setSchoolField = (field: string, value: string) => {
    setSchoolData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const setAdminField = (field: string, value: string) => {
    setAdminData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary-container rounded-2xl mb-4">
            <span className="text-3xl font-bold text-on-primary font-headline">S</span>
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">Create School Account</h1>
          <p className="text-on-surface-variant">Set up your school on Skora RMS</p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2 text-sm font-medium">
            {['School Info', 'Administrator', 'Template'].map((label, i) => (
              <span
                key={label}
                className={i === stepIndex ? 'text-primary' : 'text-on-surface-variant/50'}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary-container transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="ledger-card p-8">

          {/* ── STEP 1: School Info ── */}
          {currentStep === 'school' && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-on-surface">School Information</h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  This information appears on every student result sheet
                </p>
              </div>

              {/* School name */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  School Name *
                </label>
                <input
                  value={schoolData.schoolName}
                  onChange={(e) => setSchoolField('schoolName', e.target.value)}
                  placeholder="e.g. Government Secondary School, Ikeja"
                  className={inputCls + (errors.schoolName ? ' ring-2 ring-error' : '')}
                />
                {errors.schoolName && <p className={errCls}>{errors.schoolName}</p>}
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  School Address *
                </label>
                <input
                  value={schoolData.schoolAddress}
                  onChange={(e) => setSchoolField('schoolAddress', e.target.value)}
                  placeholder="Full address including street, LGA and State"
                  className={inputCls + (errors.schoolAddress ? ' ring-2 ring-error' : '')}
                />
                {errors.schoolAddress && (
                  <p className={errCls}>{errors.schoolAddress}</p>
                )}
              </div>

              {/* Email and Phone */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    School Email *
                  </label>
                  <input
                    type="email"
                    value={schoolData.schoolEmail}
                    onChange={(e) => setSchoolField('schoolEmail', e.target.value)}
                    placeholder="info@school.edu.ng"
                    className={inputCls + (errors.schoolEmail ? ' ring-2 ring-error' : '')}
                  />
                  {errors.schoolEmail && (
                    <p className={errCls}>{errors.schoolEmail}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={schoolData.phoneNumber}
                    onChange={(e) => setSchoolField('phoneNumber', e.target.value)}
                    placeholder="08012345678"
                    className={inputCls + (errors.phoneNumber ? ' ring-2 ring-error' : '')}
                  />
                  {errors.phoneNumber && (
                    <p className={errCls}>{errors.phoneNumber}</p>
                  )}
                </div>
              </div>

              {/* Principal name */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Principal / Head Teacher Name *
                </label>
                <input
                  value={schoolData.principalName}
                  onChange={(e) => setSchoolField('principalName', e.target.value)}
                  placeholder="e.g. Mrs. Ngozi Adeyemi"
                  className={inputCls + (errors.principalName ? ' ring-2 ring-error' : '')}
                />
                {errors.principalName && (
                  <p className={errCls}>{errors.principalName}</p>
                )}
                <p className="mt-1 text-xs text-on-surface-variant/60">
                  Appears above the principal's signature on result sheets
                </p>
              </div>

              {/* State and LGA */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    State *
                  </label>
                  <select
                    value={schoolData.state}
                    onChange={(e) => setSchoolField('state', e.target.value)}
                    className={inputCls + (errors.state ? ' ring-2 ring-error' : '')}
                  >
                    <option value="">— Select State —</option>
                    {NIGERIAN_STATES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className={errCls}>{errors.state}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    LGA (Optional)
                  </label>
                  <input
                    value={schoolData.lga}
                    onChange={(e) => setSchoolField('lga', e.target.value)}
                    placeholder="Local Government Area"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* School type and website */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    School Type
                  </label>
                  <select
                    value={schoolData.schoolType}
                    onChange={(e) =>
                      setSchoolData((prev) => ({
                        ...prev,
                        schoolType: e.target.value as 'public' | 'private' | 'mission',
                      }))
                    }
                    className={inputCls}
                  >
                    <option value="public">Public / Government</option>
                    <option value="private">Private</option>
                    <option value="mission">Mission / Faith-based</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Website (Optional)
                  </label>
                  <input
                    value={schoolData.website}
                    onChange={(e) => setSchoolField('website', e.target.value)}
                    placeholder="www.school.edu.ng"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Motto */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  School Motto (Optional)
                </label>
                <input
                  value={schoolData.motto}
                  onChange={(e) => setSchoolField('motto', e.target.value)}
                  placeholder="e.g. Knowledge is Power"
                  className={inputCls}
                />
              </div>

              {/* Logo upload */}
              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">
                  School Logo (Optional)
                </label>
                {!logoPreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-outline-variant/50 rounded-xl p-6 text-center cursor-pointer hover:border-primary hover:bg-surface-container-low transition-colors"
                  >
                    <div className="text-4xl mb-2">🏫</div>
                    <p className="text-sm font-medium text-on-surface">
                      Click to upload school logo
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1">
                      PNG, JPG or GIF · Max 2MB · Appears on every result sheet
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-primary/40 rounded-xl p-4 bg-surface-container-low flex items-center gap-4">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-20 h-20 object-contain bg-surface-container-lowest rounded-lg border border-outline-variant/30"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-on-surface">
                        ✓ Logo uploaded
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Will appear on all result sheets
                      </p>
                    </div>
                    <button
                      onClick={removeLogo}
                      className="text-sm text-error hover:text-error/80 font-medium"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {errors.logo && <p className={errCls}>{errors.logo}</p>}
              </div>

              <button
                onClick={handleNext}
                className="btn-primary w-full mt-2 text-sm"
              >
                Next: Administrator Account →
              </button>
            </div>
          )}

          {/* ── STEP 2: Admin Account ── */}
          {currentStep === 'admin' && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-on-surface">
                  Administrator Account
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  This account will have principal / admin access
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    First Name *
                  </label>
                  <input
                    value={adminData.firstName}
                    onChange={(e) => setAdminField('firstName', e.target.value)}
                    placeholder="e.g. Ngozi"
                    className={inputCls + (errors.firstName ? ' ring-2 ring-error' : '')}
                  />
                  {errors.firstName && <p className={errCls}>{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-1.5">
                    Last Name *
                  </label>
                  <input
                    value={adminData.lastName}
                    onChange={(e) => setAdminField('lastName', e.target.value)}
                    placeholder="e.g. Adeyemi"
                    className={inputCls + (errors.lastName ? ' ring-2 ring-error' : '')}
                  />
                  {errors.lastName && <p className={errCls}>{errors.lastName}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminField('email', e.target.value)}
                  placeholder="principal@school.edu.ng"
                  className={inputCls + (errors.email ? ' ring-2 ring-error' : '')}
                />
                {errors.email && <p className={errCls}>{errors.email}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Password *
                </label>
                <input
                  type="password"
                  value={adminData.password}
                  onChange={(e) => setAdminField('password', e.target.value)}
                  placeholder="Minimum 8 characters"
                  className={inputCls + (errors.password ? ' ring-2 ring-error' : '')}
                />
                {errors.password && <p className={errCls}>{errors.password}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-1.5">
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={adminData.confirmPassword}
                  onChange={(e) => setAdminField('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                  className={inputCls + (errors.confirmPassword ? ' ring-2 ring-error' : '')}
                />
                {errors.confirmPassword && (
                  <p className={errCls}>{errors.confirmPassword}</p>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button onClick={handleBack} className="btn-ghost flex-1 text-sm">
                  ← Back
                </button>
                <button onClick={handleNext} className="btn-primary flex-1 text-sm">
                  Next: Choose Template →
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Template ── */}
          {currentStep === 'template' && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-on-surface">
                  Choose Result Template
                </h2>
                <p className="text-sm text-on-surface-variant mt-1">
                  Select the design for all student result sheets
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'classic' as const,
                    name: 'Classic',
                    description: 'Traditional serif, formal borders, black & white',
                    icon: '📄',
                    gradient: 'from-neutral-600 to-neutral-800',
                  },
                  {
                    id: 'modern' as const,
                    name: 'Modern',
                    description: 'Contemporary gradient style, colourful headers',
                    icon: '✨',
                    gradient: 'from-purple-600 to-purple-800',
                  },
                  {
                    id: 'hybrid' as const,
                    name: 'Hybrid',
                    description: 'Professional balanced design',
                    icon: '🎯',
                    gradient: 'from-primary to-primary-container',
                  },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplate(t.id)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      selectedTemplate === t.id
                        ? 'border-primary bg-surface-container-low'
                        : 'border-outline-variant/30 hover:border-primary/40'
                    }`}
                  >
                    <div
                      className={`w-full h-20 bg-gradient-to-br ${t.gradient} rounded-lg mb-3 flex items-center justify-center`}
                    >
                      <span className="text-3xl">{t.icon}</span>
                    </div>
                    <h3 className="font-bold text-on-surface mb-1">{t.name}</h3>
                    <p className="text-xs text-on-surface-variant">{t.description}</p>
                    {selectedTemplate === t.id && (
                      <p className="text-xs text-primary font-bold mt-1">✓ Selected</p>
                    )}
                  </button>
                ))}
              </div>

              {/* Registration summary */}
              <div className="bg-surface-container-low border border-outline-variant/30 rounded-xl p-4 mt-2">
                <h3 className="text-sm font-bold text-on-surface mb-3">
                  Registration Summary
                </h3>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-on-surface">
                  <span className="font-medium text-on-surface-variant">School:</span>
                  <span className="font-semibold">{schoolData.schoolName}</span>

                  <span className="font-medium text-on-surface-variant">Principal:</span>
                  <span>{schoolData.principalName}</span>

                  <span className="font-medium text-on-surface-variant">State:</span>
                  <span>
                    {schoolData.state}
                    {schoolData.lga ? ` · ${schoolData.lga}` : ''}
                  </span>

                  <span className="font-medium text-on-surface-variant">Type:</span>
                  <span className="capitalize">{schoolData.schoolType}</span>

                  <span className="font-medium text-on-surface-variant">Logo:</span>
                  <span>{schoolData.logo ? '✓ Uploaded' : 'Not uploaded'}</span>

                  <span className="font-medium text-on-surface-variant">Motto:</span>
                  <span>{schoolData.motto || '—'}</span>

                  <span className="font-medium text-on-surface-variant">Template:</span>
                  <span className="capitalize font-semibold">{selectedTemplate}</span>
                </div>
              </div>

              {apiError && (
                <p className="text-sm text-error bg-error-container/30 rounded-lg px-4 py-2.5">
                  {apiError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={handleBack} className="btn-ghost flex-1 text-sm">
                  ← Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-primary flex-1 text-sm disabled:opacity-50"
                >
                  {loading ? 'Creating Account...' : 'Create School Account'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sign in link */}
        <div className="text-center mt-6">
          <p className="text-sm text-on-surface-variant">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
