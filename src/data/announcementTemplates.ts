export type ValueKind = 'busNumbers' | 'routes' | 'destinations' | 'notes';
export type SavedValues = Record<ValueKind, string[]>;
export interface Backup extends SavedValues { schemaVersion: 1; exportedAt: string }

export const DEFAULT_VALUES: SavedValues = {
  busNumbers: ['42', '18', '7'],
  routes: ['Airport Express', 'Harbor Line', 'Downtown Loop'],
  destinations: ['Terminal 1', 'Central Harbor', 'City Hall'],
  notes: ['Platform change', 'Accessible low-floor bus', 'Next stop only'],
};
export const LABELS: Record<ValueKind,string> = {busNumbers:'Bus number',routes:'Route',destinations:'Destination',notes:'Note'};
const LIMITS: Record<ValueKind,number> = {busNumbers:20,routes:100,destinations:100,notes:200};
export const STORAGE_KEY = 'transit-announcer.values.v1';

export function normalizeValue(value: string): string { return value.trim().replace(/\s+/g, ' '); }
export function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => { const key=value.toLocaleLowerCase(); if(seen.has(key)) return false; seen.add(key); return true; });
}
export function buildAnnouncement(bus: string, route: string, time: string, destination: string, note: string): string {
  const b=normalizeValue(bus), r=normalizeValue(route), t=normalizeValue(time), d=normalizeValue(destination), n=normalizeValue(note);
  if (![b,r,t,d].some(Boolean) && !n) return '';
  const subject = b ? `This is bus ${b}` : 'This bus';
  const routePart = r ? ` on the ${r}` : '';
  const destinationPart = d ? ` to ${d}` : '';
  const timePart = t ? `, departing at ${t}` : '';
  const main = `${subject}${routePart}${destinationPart}${timePart}.`;
  return n ? `${main} Please note: ${n.replace(/[.!?]+$/, '')}.` : main;
}
export function buildSpokenDetails(bus: string, route: string, time: string, destination: string, note: string): string {
  const fields = [
    ['Bus number', bus],
    ['Route', route],
    ['Time', time],
    ['Destination', destination],
    ['Note', note],
  ] as const;
  return fields
    .map(([label, value]) => [label, normalizeValue(value)] as const)
    .filter(([, value]) => value)
    .map(([label, value]) => `${label}: ${value}.`)
    .join(' ');
}
export function createBackup(values: SavedValues): Backup { return {schemaVersion:1,exportedAt:new Date().toISOString(),...values}; }
export function validateBackup(input: unknown): {ok:true; data:Backup}|{ok:false; error:string} {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {ok:false,error:'Backup must be a JSON object.'};
  const raw=input as Record<string,unknown>;
  if(raw.schemaVersion!==1) return {ok:false,error:'This backup version is not supported.'};
  if(typeof raw.exportedAt!=='string' || Number.isNaN(Date.parse(raw.exportedAt))) return {ok:false,error:'The export date is invalid.'};
  const clean={} as SavedValues;
  for(const kind of Object.keys(LIMITS) as ValueKind[]){
    const list=raw[kind];
    if(!Array.isArray(list) || list.length>500) return {ok:false,error:`${LABELS[kind]} values must be an array of at most 500 items.`};
    if(list.some(v=>typeof v!=='string')) return {ok:false,error:`Every ${LABELS[kind].toLowerCase()} value must be text.`};
    const normalized=(list as string[]).map(normalizeValue);
    if(normalized.some(v=>!v || v.length>LIMITS[kind])) return {ok:false,error:`A ${LABELS[kind].toLowerCase()} value is empty or too long.`};
    clean[kind]=dedupe(normalized);
  }
  return {ok:true,data:{schemaVersion:1,exportedAt:new Date(raw.exportedAt).toISOString(),...clean}};
}
export function mergeValues(current:SavedValues, incoming:SavedValues):SavedValues {
  return Object.fromEntries((Object.keys(DEFAULT_VALUES) as ValueKind[]).map(k=>[k,dedupe([...current[k],...incoming[k]])])) as SavedValues;
}
