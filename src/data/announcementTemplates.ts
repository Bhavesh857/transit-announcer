export type ValueKind = 'section1' | 'section2' | 'section3' | 'section4' | 'section5' | 'section6' | 'section7' | 'section8' | 'section9' | 'section10';
export type SavedValues = Record<ValueKind, string[]>;
export interface Backup extends SavedValues { schemaVersion: 4; exportedAt: string }

export const SECTION_KINDS: ValueKind[] = Array.from({length:10},(_,index)=>`section${index+1}` as ValueKind);
export const DEFAULT_VALUES: SavedValues = Object.fromEntries(SECTION_KINDS.map(kind=>[kind,[] as string[]])) as unknown as SavedValues;
export const LABELS: Record<ValueKind,string> = Object.fromEntries(SECTION_KINDS.map((kind,index)=>[kind,String(index+1)])) as Record<ValueKind,string>;
const LIMITS: Record<ValueKind,number> = Object.fromEntries(SECTION_KINDS.map(kind=>[kind,200])) as Record<ValueKind,number>;
export const STORAGE_KEY = 'transit-announcer.values.v4';
export const LEGACY_STORAGE_KEYS = ['transit-announcer.values.v3','transit-announcer.values.v2','transit-announcer.values.v1'];

export function normalizeValue(value: string): string { return value.trim().replace(/\s+/g, ' '); }
function stripEndingPunctuation(value:string):string { return value.replace(/[.!?।]+$/, ''); }
export function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => { const key=value.toLocaleLowerCase(); if(seen.has(key)) return false; seen.add(key); return true; });
}
export function buildAnnouncement(sections:string[]):string {
  return sections.map((value,index)=>[String(index+1),stripEndingPunctuation(normalizeValue(value))] as const).filter(([,value])=>value).map(([label,value])=>`${label}: ${value}.`).join(' ');
}
export function buildHindiSpokenDetails(sections:string[]):string {
  const values=sections.map(value=>stripEndingPunctuation(normalizeValue(value))).filter(Boolean);
  return values.map(value=>`${value}।`).join(' ');
}
export function migrateLegacyValues(input:unknown):SavedValues|null {
  if(!input || typeof input!=='object' || Array.isArray(input)) return null;
  const raw=input as Record<string,unknown>;
  const strings=(key:string)=>Array.isArray(raw[key]) ? raw[key].filter((value):value is string=>typeof value==='string').map(normalizeValue).filter(Boolean) : [];
  if(!SECTION_KINDS.some(key=>Array.isArray(raw[key]))) return null;
  return Object.fromEntries(SECTION_KINDS.map(kind=>[kind,dedupe(strings(kind))])) as SavedValues;
}
export function createBackup(values:SavedValues):Backup { return {schemaVersion:4,exportedAt:new Date().toISOString(),...values}; }
export function validateBackup(input:unknown):{ok:true;data:Backup}|{ok:false;error:string} {
  if(!input || typeof input!=='object' || Array.isArray(input)) return {ok:false,error:'Backup must be a JSON object.'};
  const raw=input as Record<string,unknown>;
  if(raw.schemaVersion===1||raw.schemaVersion===2||raw.schemaVersion===3){
    const migrated=migrateLegacyValues(raw);
    if(!migrated) return {ok:false,error:`The version ${raw.schemaVersion} backup is invalid.`};
    return {ok:true,data:{schemaVersion:4,exportedAt:typeof raw.exportedAt==='string'&&!Number.isNaN(Date.parse(raw.exportedAt))?new Date(raw.exportedAt).toISOString():new Date().toISOString(),...migrated}};
  }
  if(raw.schemaVersion!==4) return {ok:false,error:'This backup version is not supported.'};
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
  return {ok:true,data:{schemaVersion:4,exportedAt:new Date(raw.exportedAt).toISOString(),...clean}};
}
export function mergeValues(current:SavedValues,incoming:SavedValues):SavedValues {
  return Object.fromEntries((Object.keys(DEFAULT_VALUES) as ValueKind[]).map(kind=>[kind,dedupe([...current[kind],...incoming[kind]])])) as SavedValues;
}
