import type { MappedHhResume } from '@interface';

export type { MappedHhResume };

type HhNamed = { id?: string; name?: string } | string | null | undefined;

function named(v: HhNamed): string {
    if (!v) return '';
    if (typeof v === 'string') return v.trim();
    return String(v.name || v.id || '').trim();
}

function joinNames(list: HhNamed[] | undefined): string {
    if (!Array.isArray(list) || list.length === 0) return '';
    return list.map(named).filter(Boolean).join(', ');
}

function fullName(r: Record<string, unknown>): string {
    const parts = [r.last_name, r.first_name, r.middle_name]
        .map((x) => (typeof x === 'string' ? x.trim() : ''))
        .filter(Boolean);
    if (parts.length) return parts.join(' ');
    const title = typeof r.title === 'string' ? r.title.trim() : '';
    return title || 'Без имени';
}

function pickContact(r: Record<string, unknown>): MappedHhResume['contacts'] {
    const contacts = Array.isArray(r.contact) ? r.contact : [];
    let phone = '';
    let email = '';
    let site = '';
    for (const raw of contacts) {
        const c = raw as {
            type?: HhNamed;
            value?: string;
            contact_value?: string;
            links?: Array<{ url?: string }>;
        };
        const typeId = named(c.type).toLowerCase();
        const value = String(c.value || c.contact_value || '').trim();
        if (!phone && (typeId.includes('phone') || typeId.includes('cell') || typeId === 'mobile')) {
            phone = value;
        } else if (!email && typeId.includes('email') && value.includes('@')) {
            email = value;
        } else if (!site && (typeId.includes('site') || typeId.includes('portfolio'))) {
            site = value || c.links?.[0]?.url || '';
        }
    }
    if (!email && typeof r.email === 'string') email = r.email.trim();
    if (!phone) phone = '—';
    return {
        phone,
        email: email || undefined,
        personal_site: site || undefined,
    };
}

function pickSkills(r: Record<string, unknown>): MappedHhResume['skills'] {
    const out: MappedHhResume['skills'] = [];
    const set = Array.isArray(r.skill_set) ? r.skill_set : [];
    for (const s of set) {
        const name = typeof s === 'string' ? s.trim() : named(s as HhNamed);
        if (name) out.push({ skill_name: name, proficiency_level: '' });
    }
    const skills = Array.isArray(r.skills) ? r.skills : [];
    for (const s of skills) {
        const row = s as { name?: string; skill_name?: string; level?: HhNamed };
        const name = String(row.skill_name || row.name || '').trim();
        if (!name) continue;
        out.push({ skill_name: name, proficiency_level: named(row.level) });
    }
    return out;
}

function pickExperience(r: Record<string, unknown>): MappedHhResume['workExperience'] {
    const exp = Array.isArray(r.experience) ? r.experience : [];
    return exp.map((raw) => {
        const e = raw as {
            company?: string;
            position?: string;
            start?: string | null;
            end?: string | null;
            description?: string;
        };
        return {
            company_name: String(e.company || '').trim() || '—',
            position: String(e.position || '').trim() || '—',
            start_date: e.start || null,
            end_date: e.end || null,
            description: String(e.description || '').trim(),
        };
    });
}

function tripReady(r: Record<string, unknown>): boolean {
    const v = r.business_trip_readiness as HhNamed;
    const id = named(v).toLowerCase();
    return id === 'ready' || id.includes('готов');
}

/** Map first HH resume object (api.hh.ru shape) into local resume sections. */
export function mapHhResume(raw: Record<string, unknown>): MappedHhResume {
    return {
        resume: {
            full_name: fullName(raw),
            position: typeof raw.title === 'string' ? raw.title.trim() : undefined,
            employment_type: joinNames(raw.employments as HhNamed[]) || named(raw.employment as HhNamed) || undefined,
            work_schedule: joinNames(raw.schedules as HhNamed[]) || named(raw.schedule as HhNamed) || undefined,
            travel_time: named(raw.travel_time as HhNamed) || undefined,
            business_trip_readiness: tripReady(raw),
        },
        contacts: pickContact(raw),
        skills: pickSkills(raw),
        workExperience: pickExperience(raw),
    };
}
