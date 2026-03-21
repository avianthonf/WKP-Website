import type React from 'react';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { Activity, ChefHat, Mail, Phone, Shield, UserCircle2, Users } from 'lucide-react';
import { MotionSurface } from '@/components/MotionSurface';
import type { StaffMember } from '@/types';

export const dynamic = 'force-dynamic';

const statusStyles: Record<StaffMember['status'], { label: string; background: string; color: string }> = {
  active: {
    label: 'Active',
    background: '#dcfce7',
    color: '#166534',
  },
  off_shift: {
    label: 'Off shift',
    background: '#f3f4f6',
    color: '#4b5563',
  },
  on_call: {
    label: 'On call',
    background: '#dbeafe',
    color: '#1d4ed8',
  },
  offline: {
    label: 'Offline',
    background: '#fee2e2',
    color: '#991b1b',
  },
};

export default async function StaffPage() {
  const supabase = supabaseAdmin;

  let staff: StaffMember[] = [];
  let loadError: string | null = null;

  try {
    const { data: staffRows, error } = await supabase
      .from('staff_members')
      .select('*')
      .order('order_index', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    staff = (staffRows || []) as StaffMember[];
  } catch (error: any) {
    loadError = error?.message || 'Failed to load staff records';
  }

  const activeCount = staff.filter((person) => person.status === 'active').length;
  const onShiftCount = staff.filter((person) => person.is_on_shift).length;
  const contactCount = staff.filter((person) => person.phone || person.email).length;

  return (
    <div className="space-y-8 reveal-stagger">
      <header className="page-header">
        <div>
          <p className="mono-label">Operations team</p>
          <h1 className="page-title">Staff</h1>
          <p className="page-subtitle">A live roster backed by Supabase for shift ownership and contact visibility.</p>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MotionSurface hoverLift={-3} hoverScale={1.01}>
          <InfoCard title="Active staff" value={`${activeCount}`} icon={<Users size={16} />} />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.04}>
          <InfoCard title="On shift" value={`${onShiftCount}`} icon={<Activity size={16} />} />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.08}>
          <InfoCard title="Contacts" value={`${contactCount}`} icon={<Mail size={16} />} />
        </MotionSurface>
      </section>

      <MotionSurface as="section" className="card card-premium p-7" delay={0.08}>
        <div className="flex items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
          <div>
            <p className="mono-label text-[10px]">Team roster</p>
            <h2 className="mt-1 text-xl font-semibold" style={{ color: 'var(--ink)' }}>
              Who&apos;s on duty
            </h2>
          </div>
          <div className="dashboard-meter" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="mt-7 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {staff.map((person, index) => {
            const status = statusStyles[person.status];

            return (
              <MotionSurface
                key={person.id}
                as="article"
                className="card rounded-[1.2rem] border border-[var(--border-default)] p-6 shadow-none transition-transform hover:-translate-y-1"
                hoverLift={-4}
                hoverScale={1.01}
                delay={(index % 4) * 0.04}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[rgba(232,84,10,0.1)] text-[var(--ember)]">
                      {person.initials}
                    </div>
                    <div>
                      <h3 className="font-semibold" style={{ color: 'var(--ink)' }}>
                        {person.name}
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--stone)' }}>
                        {person.role}
                      </p>
                    </div>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--surface-secondary)]" style={{ color: 'var(--stone)' }}>
                    {person.role.toLowerCase().includes('kitchen') ? <ChefHat size={16} /> : <UserCircle2 size={16} />}
                  </span>
                </div>

                <div className="mt-5 flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em]" style={{ background: status.background, color: status.color }}>
                  <span>{status.label}</span>
                  <span>{person.is_on_shift ? 'On shift' : 'Off shift'}</span>
                </div>

                <div className="mt-5 rounded-2xl bg-[var(--surface-secondary)] px-4 py-3.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span style={{ color: 'var(--stone)' }}>Shift</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>
                      {formatShift(person.shift_start, person.shift_end)}
                    </span>
                  </div>
                </div>

                <div className="mt-4 grid gap-2.5 text-sm">
                  <ContactLine icon={<Phone size={14} />} value={person.phone || 'Not added'} />
                  <ContactLine icon={<Mail size={14} />} value={person.email || 'Not added'} />
                </div>
              </MotionSurface>
            );
          })}
        </div>

        {staff.length === 0 && (
        <div className="empty-state mt-6 border border-dashed border-[var(--border-default)] bg-[var(--surface-primary)] p-10">
            <Shield size={40} className="empty-state-icon" />
            <div className="max-w-xl">
              <h3 className="mb-2 text-lg font-medium" style={{ color: 'var(--ink)' }}>
                No staff records yet
              </h3>
              <p className="text-sm" style={{ color: 'var(--stone)' }}>
                Create and seed the `staff_members` table to make this roster live. The attached migration adds the schema and starter records.
              </p>
            </div>
          </div>
        )}

        {loadError && (
          <p className="mt-4 text-sm" style={{ color: '#b91c1c' }}>
            Staff roster could not be loaded from Supabase: {loadError}
          </p>
        )}
      </MotionSurface>

      <section className="grid gap-4 md:grid-cols-3">
        <MotionSurface hoverLift={-3} hoverScale={1.01}>
          <InfoCard title="Call support" value="+91 99999 00000" icon={<Phone size={16} />} />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.04}>
          <InfoCard title="Team inbox" value="team@wekneadpizza.com" icon={<Mail size={16} />} />
        </MotionSurface>
        <MotionSurface hoverLift={-3} hoverScale={1.01} delay={0.08}>
          <InfoCard title="Coverage" value="Shift-aware roster" icon={<Users size={16} />} />
        </MotionSurface>
      </section>
    </div>
  );
}

function InfoCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="card card-premium p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[rgba(232,84,10,0.1)] text-[var(--ember)]">
          {icon}
        </div>
        <div>
          <p className="mono-label text-[10px]">{title}</p>
          <div className="mt-1 text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            {value}
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactLine({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2" style={{ color: 'var(--stone)' }}>
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-[var(--border-default)]">
        {icon}
      </span>
      <span className="truncate">{value}</span>
    </div>
  );
}

function formatShift(start?: string | null, end?: string | null) {
  if (!start && !end) {
    return 'Not scheduled';
  }

  const displayStart = start || 'Not set';
  const displayEnd = end || 'Not set';
  return `${displayStart} - ${displayEnd}`;
}
