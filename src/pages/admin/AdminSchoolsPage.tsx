import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { api } from '@/lib/api';
import { School } from '@/types';

const Icon = ({ name, className = '' }: { name: string; className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const NIGERIAN_STATES = [
  'Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno',
  'Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT','Gombe','Imo',
  'Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa',
  'Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba',
  'Yobe','Zamfara',
];

export const AdminSchoolsPage = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    api.get<School[]>('/schools')
      .then(setSchools)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return schools.filter((s) => {
      const matchSearch =
        !search ||
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase()) ||
        (s.address ?? '').toLowerCase().includes(search.toLowerCase());
      const matchState = !stateFilter || s.state === stateFilter;
      const matchType = !typeFilter || s.schoolType === typeFilter;
      return matchSearch && matchState && matchType;
    });
  }, [schools, search, stateFilter, typeFilter]);

  const typeLabel = (t?: string) => {
    if (t === 'public') return 'Public';
    if (t === 'private') return 'Private';
    if (t === 'mission') return 'Mission';
    return 'Unknown';
  };

  const typeColor = (t?: string) => {
    if (t === 'private') return 'bg-primary/5 text-primary';
    if (t === 'mission') return 'bg-secondary/5 text-secondary';
    return 'bg-surface-container text-on-surface-variant';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h2 className="font-headline font-extrabold text-3xl text-primary tracking-tight">
            Schools
          </h2>
          <p className="text-on-surface-variant text-sm mt-1">
            {loading ? '…' : `${schools.length} registered school${schools.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Filters */}
        <div className="ledger-card p-4 flex flex-wrap gap-3">
          <div className="flex-1 min-w-[180px] relative">
            <Icon
              name="search"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-base"
            />
            <input
              type="text"
              placeholder="Search by name, email, address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All States</option>
            {NIGERIAN_STATES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2.5 text-sm bg-surface-container-highest border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Types</option>
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="mission">Mission</option>
          </select>
          {(search || stateFilter || typeFilter) && (
            <button
              onClick={() => { setSearch(''); setStateFilter(''); setTypeFilter(''); }}
              className="px-3 py-2.5 text-sm text-on-surface-variant hover:text-on-surface flex items-center gap-1"
            >
              <Icon name="close" className="text-base" /> Clear
            </button>
          )}
        </div>

        {/* Results count */}
        {(search || stateFilter || typeFilter) && !loading && (
          <p className="text-sm text-on-surface-variant -mt-2">
            Showing {filtered.length} of {schools.length} schools
          </p>
        )}

        {/* Table */}
        <div className="ledger-card overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-12 rounded-lg bg-surface-container-highest animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-16 text-center text-on-surface-variant">
              <Icon name="apartment" className="text-4xl mb-2 opacity-30" />
              <p className="text-sm">No schools match your filters</p>
            </div>
          ) : (
            <ul className="divide-y divide-outline-variant/10">
              {filtered.map((school) => (
                <li key={school.id}>
                  <button
                    onClick={() =>
                      setExpandedId(expandedId === school.id ? null : school.id)
                    }
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-surface-container-low/40 transition-colors"
                  >
                    {/* Logo / Initial */}
                    <div className="w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center bg-primary/5 overflow-hidden">
                      {school.logo ? (
                        <img
                          src={school.logo}
                          alt=""
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <span className="font-headline font-extrabold text-primary text-lg">
                          {school.name[0].toUpperCase()}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-on-surface text-sm truncate">
                        {school.name}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {school.address}
                        {school.state ? ` · ${school.state}` : ''}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${typeColor(school.schoolType)}`}
                    >
                      {typeLabel(school.schoolType)}
                    </span>

                    <span className="text-xs text-on-surface-variant flex-shrink-0 hidden sm:block">
                      {new Date(school.createdAt).toLocaleDateString('en-NG', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })}
                    </span>

                    <Icon
                      name={expandedId === school.id ? 'expand_less' : 'expand_more'}
                      className="text-on-surface-variant flex-shrink-0"
                    />
                  </button>

                  {/* Expanded detail panel */}
                  {expandedId === school.id && (
                    <div className="px-6 pb-5 bg-surface-container-low/30 border-t border-outline-variant/10">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-sm">
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                            Email
                          </p>
                          <p className="text-on-surface">{school.email}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                            Phone
                          </p>
                          <p className="text-on-surface">{school.phoneNumber || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                            Principal
                          </p>
                          <p className="text-on-surface">{school.principalName || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                            State
                          </p>
                          <p className="text-on-surface">{school.state || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                            LGA
                          </p>
                          <p className="text-on-surface">{school.lga || '—'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                            Template
                          </p>
                          <p className="text-on-surface capitalize">{school.templateId}</p>
                        </div>
                        {school.motto && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                              Motto
                            </p>
                            <p className="text-on-surface italic">"{school.motto}"</p>
                          </div>
                        )}
                        {school.website && (
                          <div className="col-span-2 sm:col-span-3">
                            <p className="text-[10px] uppercase tracking-widest font-bold text-on-surface-variant mb-1">
                              Website
                            </p>
                            <a
                              href={school.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary underline"
                            >
                              {school.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};
