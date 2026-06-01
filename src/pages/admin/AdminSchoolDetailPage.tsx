import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

type Tab = 'overview' | 'batches';

interface SchoolDetail {
  id: string;
  name: string;
  address: string;
  email: string;
  phoneNumber: string;
  principalName: string;
  motto: string;
  logo: string;
  website: string;
  state: string;
  lga: string;
  schoolType: string;
  templateId: string;
  currentTerm: string;
  currentAcademicYear: string;
  portalCode: string;
  createdAt: string;
  stats: { teacherCount: number; classCount: number; studentCount: number };
}

interface Batch {
  id: string;
  quantity: number;
  totalAmount: number;
  status: 'pending_payment' | 'active' | 'exhausted';
  term: string;
  academicYear: string;
  paymentReference?: string;
  notes?: string;
  requestedAt: string;
  activatedAt?: string;
}

const TERM_LABELS: Record<string, string> = {
  first: '1st Term',
  second: '2nd Term',
  third: '3rd Term',
};

const statusBadge = (status: Batch['status']) => {
  if (status === 'pending_payment')
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed-dim/20 text-on-tertiary-container">Pending</span>;
  if (status === 'active')
    return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-container/40 text-on-secondary-container">Active</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">Exhausted</span>;
};

export const AdminSchoolDetailPage = () => {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [school, setSchool] = useState<SchoolDetail | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!schoolId) return;
    setLoading(true);
    setError(null);
    api.get<{ school: SchoolDetail; batches: Batch[] }>(`/admin/schools/${schoolId}`)
      .then(({ school: s, batches: b }) => { setSchool(s); setBatches(b); })
      .catch(() => setError('Failed to load school details. Check your connection and try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [schoolId]);

  const totalRevenue = batches
    .filter((b) => b.status !== 'pending_payment')
    .reduce((s, b) => s + b.totalAmount, 0);

  const activeBatch = batches.find((b) => b.status === 'active');

  const Field = ({ label, value }: { label: string; value?: string | null }) => (
    <div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">{label}</p>
      <p className="text-sm text-on-surface">{value || '—'}</p>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">

        {/* Back */}
        <button
          onClick={() => navigate('/admin/schools')}
          className="flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <Icon name="arrow_back" className="text-base" /> Back to Schools
        </button>

        {/* Error */}
        {error && (
          <div className="ledger-card p-4 border-l-4 border-error flex items-center gap-3">
            <Icon name="error" className="text-error text-base flex-shrink-0" />
            <p className="text-sm text-on-surface flex-1">{error}</p>
            <button onClick={load} className="px-3 py-1.5 rounded-lg bg-error text-on-error text-sm font-semibold hover:bg-error/90 transition-colors flex-shrink-0">
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            <div className="h-28 rounded-2xl bg-surface-container-highest animate-pulse" />
            <div className="h-48 rounded-2xl bg-surface-container-highest animate-pulse" />
          </div>
        ) : school ? (
          <>
            {/* School header card */}
            <div className="ledger-card p-6 flex items-start gap-5 flex-wrap sm:flex-nowrap">
              <div className="w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center bg-primary/5 overflow-hidden border border-outline-variant/10">
                {school.logo ? (
                  <img src={school.logo} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span className="font-headline font-extrabold text-primary text-2xl">
                    {school.name[0].toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-headline font-extrabold text-2xl text-primary tracking-tight truncate">
                      {school.name}
                    </h2>
                    <p className="text-sm text-on-surface-variant mt-0.5">
                      {school.address}{school.state ? ` · ${school.state}` : ''}
                    </p>
                    {school.motto && (
                      <p className="text-xs text-on-surface-variant/60 italic mt-1">"{school.motto}"</p>
                    )}
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 capitalize ${
                    school.schoolType === 'private' ? 'bg-primary/5 text-primary' :
                    school.schoolType === 'mission' ? 'bg-secondary/5 text-secondary' :
                    'bg-surface-container text-on-surface-variant'
                  }`}>
                    {school.schoolType}
                  </span>
                </div>

                {/* Summary stats row */}
                <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-outline-variant/10">
                  {[
                    { label: 'Teachers', value: school.stats?.teacherCount ?? 0, icon: 'person' },
                    { label: 'Classes', value: school.stats?.classCount ?? 0, icon: 'school' },
                    { label: 'Students', value: school.stats?.studentCount ?? 0, icon: 'group' },
                    { label: 'Revenue', value: `₦${totalRevenue.toLocaleString()}`, icon: 'payments' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2">
                      <Icon name={s.icon} className="text-primary text-sm" />
                      <div>
                        <p className="text-xs font-bold text-on-surface">{s.value}</p>
                        <p className="text-[10px] text-on-surface-variant">{s.label}</p>
                      </div>
                    </div>
                  ))}
                  {school.portalCode && (
                    <div className="flex items-center gap-2">
                      <Icon name="qr_code" className="text-primary text-sm" />
                      <div>
                        <p className="text-xs font-mono font-bold text-on-surface tracking-widest">{school.portalCode}</p>
                        <p className="text-[10px] text-on-surface-variant">Portal Code</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active batch banner */}
            {activeBatch && (
              <div className="ledger-card p-4 border-l-4 border-secondary flex items-center gap-3">
                <Icon name="style" className="text-secondary text-base flex-shrink-0" />
                <p className="text-sm text-on-surface flex-1">
                  <span className="font-bold">Active batch:</span> {activeBatch.quantity.toLocaleString()} PINs for {TERM_LABELS[activeBatch.term] ?? activeBatch.term} · {activeBatch.academicYear}
                </p>
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
              {(['overview', 'batches'] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors capitalize ${
                    tab === t
                      ? 'bg-primary text-on-primary'
                      : 'bg-surface-container-highest text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {t === 'batches' ? `Batches (${batches.length})` : 'Overview'}
                </button>
              ))}
            </div>

            {/* Overview tab */}
            {tab === 'overview' && (
              <div className="ledger-card p-6 grid grid-cols-2 sm:grid-cols-3 gap-5">
                <Field label="Principal" value={school.principalName} />
                <Field label="Email" value={school.email} />
                <Field label="Phone" value={school.phoneNumber} />
                <Field label="State" value={school.state} />
                <Field label="LGA" value={school.lga} />
                <Field label="Template" value={school.templateId} />
                <Field label="Current Term" value={TERM_LABELS[school.currentTerm] ?? school.currentTerm} />
                <Field label="Academic Year" value={school.currentAcademicYear} />
                <Field label="Registered" value={new Date(school.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' })} />
                {school.website && (
                  <div className="col-span-2 sm:col-span-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">Website</p>
                    <a href={school.website} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline">
                      {school.website}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Batches tab */}
            {tab === 'batches' && (
              <div className="ledger-card overflow-hidden">
                {batches.length === 0 ? (
                  <div className="p-16 text-center text-on-surface-variant">
                    <Icon name="style" className="text-4xl mb-2 opacity-30" />
                    <p className="text-sm">No batches requested yet</p>
                  </div>
                ) : (
                  <>
                    {/* Totals row */}
                    <div className="px-6 py-4 bg-surface-container-low/50 border-b border-outline-variant/10 flex flex-wrap gap-6">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Total Batches</p>
                        <p className="font-bold text-on-surface mt-0.5">{batches.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Total PINs</p>
                        <p className="font-bold text-on-surface mt-0.5">{batches.reduce((s, b) => s + b.quantity, 0).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant">Total Revenue</p>
                        <p className="font-bold text-secondary mt-0.5">₦{totalRevenue.toLocaleString()}</p>
                      </div>
                    </div>

                    <ul className="divide-y divide-outline-variant/10">
                      {batches.map((batch) => (
                        <li key={batch.id} className="px-6 py-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-on-surface text-sm">
                                {TERM_LABELS[batch.term] ?? batch.term} · {batch.academicYear}
                              </p>
                              {statusBadge(batch.status)}
                            </div>
                            <p className="text-xs text-on-surface-variant mt-0.5">
                              {batch.quantity.toLocaleString()} PINs · ₦{batch.totalAmount.toLocaleString()}
                              {batch.paymentReference ? ` · Ref: ${batch.paymentReference}` : ''}
                            </p>
                            {batch.notes && (
                              <p className="text-xs text-on-surface-variant/60 italic mt-0.5">{batch.notes}</p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0 text-xs text-on-surface-variant">
                            <p>Requested {new Date(batch.requestedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            {batch.activatedAt && (
                              <p className="text-secondary font-medium mt-0.5">
                                Activated {new Date(batch.activatedAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
          </>
        ) : null}
      </div>
    </DashboardLayout>
  );
};
