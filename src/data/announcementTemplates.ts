export type ValueKind = 'busNumbers' | 'origins' | 'destinations' | 'vias' | 'platforms' | 'notes';
export type SavedValues = Record<ValueKind, string[]>;
export interface Backup extends SavedValues { schemaVersion: 2; exportedAt: string }

export const DEFAULT_VALUES: SavedValues = {
  busNumbers: ['42', '18', '7'],
  origins: [],
  destinations: ['Terminal 1', 'Central Harbor', 'City Hall'],
  vias: ['Airport Express', 'Harbor Line', 'Downtown Loop'],
  platforms: ['1', '2', '3'],
  notes: ['Platform change', 'Accessible low-floor bus', 'Next stop only'],
};
export const LABELS: Record<ValueKind,string> = {busNumbers:'Bus number',origins:'From',destinations:'To',vias:'Via',platforms:'Platform',notes:'Note'};
const LIMITS: Record<ValueKind,number> = {busNumbers:20,origins:100,destinations:100,vias:100,platforms:30,notes:200};
export const STORAGE_KEY = 'transit-announcer.values.v2';
export const LEGACY_STORAGE_KEY = 'transit-announcer.values.v1';

export function normalizeValue(value: string): string { return value.trim().replace(/\s+/g, ' '); }
function stripEndingPunctuation(value:string):string { return value.replace(/[.!?।]+$/, ''); }
export function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => { const key=value.toLocaleLowerCase(); if(seen.has(key)) return false; seen.add(key); return true; });
}
export function formatTime(time: string): string { return normalizeValue(time); }
export function formatHindiTime(time: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(normalizeValue(time));
  return match ? `${Number(match[1])} बजकर ${Number(match[2])} मिनट` : normalizeValue(time);
}
export function buildAnnouncement(bus:string,from:string,to:string,via:string,platform:string,time:string,note:string):string {
  const fields = [
    ['Bus number', normalizeValue(bus)], ['From', normalizeValue(from)], ['To', normalizeValue(to)],
    ['Via', normalizeValue(via)], ['Platform', normalizeValue(platform)], ['Time', formatTime(time)], ['Note', stripEndingPunctuation(normalizeValue(note))],
  ] as const;
  return fields.filter(([,value])=>value).map(([label,value])=>`${label}: ${value}.`).join(' ');
}
export function buildSpokenDetails(bus:string,from:string,to:string,via:string,platform:string,time:string,note:string):string {
  return buildAnnouncement(bus,from,to,via,platform,time,note);
}
export function buildHindiSpokenDetails(bus:string,from:string,to:string,via:string,platform:string,time:string,note:string):string {
  const fields = [
    ['बस नंबर',normalizeValue(bus)], ['कहाँ से',normalizeValue(from)], ['कहाँ तक',normalizeValue(to)],
    ['वाया',normalizeValue(via)], ['प्लेटफॉर्म',normalizeValue(platform)], ['समय',formatHindiTime(time)], ['सूचना',stripEndingPunctuation(normalizeValue(note))],
  ] as const;
  return fields.filter(([,value])=>value).map(([label,value])=>`${label}: ${value}।`).join(' ');
}
export function migrateLegacyValues(input:unknown):SavedValues|null {
  if(!input || typeof input!=='object' || Array.isArray(input)) return null;
  const raw=input as Record<string,unknown>;
  const strings=(key:string)=>Array.isArray(raw[key]) ? raw[key].filter((value):value is string=>typeof value==='string').map(normalizeValue).filter(Boolean) : [];
  if(!['busNumbers','routes','destinations','notes'].some(key=>Array.isArray(raw[key]))) return null;
  return {busNumbers:dedupe(strings('busNumbers')),origins:[],destinations:dedupe(strings('destinations')),vias:dedupe(strings('routes')),platforms:[],notes:dedupe(strings('notes'))};
}
export function createBackup(values:SavedValues):Backup { return {schemaVersion:2,exportedAt:new Date().toISOString(),...values}; }
export function validateBackup(input:unknown):{ok:true;data:Backup}|{ok:false;error:string} {
  if(!input || typeof input!=='object' || Array.isArray(input)) return {ok:false,error:'Backup must be a JSON object.'};
  const raw=input as Record<string,unknown>;
  if(raw.schemaVersion===1){
    const migrated=migrateLegacyValues(raw);
    if(!migrated) return {ok:false,error:'The version 1 backup is invalid.'};
    return {ok:true,data:{schemaVersion:2,exportedAt:typeof raw.exportedAt==='string'&&!Number.isNaN(Date.parse(raw.exportedAt))?new Date(raw.exportedAt).toISOString():new Date().toISOString(),...migrated}};
  }
  if(raw.schemaVersion!==2) return {ok:false,error:'This backup version is not supported.'};
  if(typeof raw.exportedAt!=='string' || Number.isNaN(Date.parse(raw.exportedAt))) return {ok:false,error:'The export date is invalid.'};
  const clean={} as SavedValues;
  for(const kind of Object.keys(LIMITS) as ValueKind[]){
    const list=raw[kind];
    if(!Array.isArray(list)||list.length>500) return {ok:false,error:`${LABELS[kind]} values must be an array of at most 500 items.`};
    if(list.some(value=>typeof value!=='string')) return {ok:false,error:`Every ${LABELS[kind].toLowerCase()} value must be text.`};
    const normalized=(list as string[]).map(normalizeValue);
    if(normalized.some(value=>!value||value.length>LIMITS[kind])) return {ok:false,error:`A ${LABELS[kind].toLowerCase()} value is empty or too long.`};
    clean[kind]=dedupe(normalized);
  }
  return {ok:true,data:{schemaVersion:2,exportedAt:new Date(raw.exportedAt).toISOString(),...clean}};
}
export function mergeValues(current:SavedValues,incoming:SavedValues):SavedValues {
  return Object.fromEntries((Object.keys(DEFAULT_VALUES) as ValueKind[]).map(kind=>[kind,dedupe([...current[kind],...incoming[kind]])])) as SavedValues;
}
