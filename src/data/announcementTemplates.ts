export type ValueKind = `section${number}`;
export type SavedValues = Partial<Record<ValueKind, string[]>>;
export interface Backup { schemaVersion: 5; exportedAt: string; sections: SavedValues }

export const INITIAL_SECTION_COUNT = 10;
export const sectionKind = (index:number):ValueKind => `section${index+1}`;
export const SECTION_KINDS: ValueKind[] = Array.from({length:INITIAL_SECTION_COUNT},(_,index)=>sectionKind(index));
export const DEFAULT_VALUES: SavedValues = Object.fromEntries(SECTION_KINDS.map(kind=>[kind,[] as string[]]));
export const sectionLabel = (kind:string):string => kind.replace(/^section/,'');
const isSectionKind = (kind:string):kind is ValueKind => /^section[1-9]\d*$/.test(kind);
export const STORAGE_KEY = 'transit-announcer.values.v5';
export const SECTION_COUNT_KEY = 'transit-announcer.section-count.v1';
export function readSectionCount(storage:Pick<Storage,'getItem'>=localStorage):number {
  const count=Number(storage.getItem(SECTION_COUNT_KEY));
  return Number.isInteger(count)&&count>=1&&count<=100?count:INITIAL_SECTION_COUNT;
}
export const LEGACY_STORAGE_KEYS = ['transit-announcer.values.v4','transit-announcer.values.v3','transit-announcer.values.v2','transit-announcer.values.v1'];

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
  const kinds=Object.keys(raw).filter(isSectionKind).sort((a,b)=>Number(sectionLabel(a))-Number(sectionLabel(b)));
  if(!kinds.length) return null;
  return Object.fromEntries(kinds.map(kind=>[kind,dedupe(strings(kind))]));
}
export function createBackup(values:SavedValues):Backup { return {schemaVersion:5,exportedAt:new Date().toISOString(),sections:values}; }
export function validateBackup(input:unknown):{ok:true;data:Backup}|{ok:false;error:string} {
  if(!input || typeof input!=='object' || Array.isArray(input)) return {ok:false,error:'Backup must be a JSON object.'};
  const raw=input as Record<string,unknown>;
  if([1,2,3,4].includes(Number(raw.schemaVersion))){
    const migrated=migrateLegacyValues(raw);
    if(!migrated) return {ok:false,error:`The version ${raw.schemaVersion} backup is invalid.`};
    return {ok:true,data:{schemaVersion:5,exportedAt:typeof raw.exportedAt==='string'&&!Number.isNaN(Date.parse(raw.exportedAt))?new Date(raw.exportedAt).toISOString():new Date().toISOString(),sections:migrated}};
  }
  if(raw.schemaVersion!==5) return {ok:false,error:'This backup version is not supported.'};
  if(typeof raw.exportedAt!=='string'||Number.isNaN(Date.parse(raw.exportedAt))) return {ok:false,error:'The export date is invalid.'};
  if(!raw.sections||typeof raw.sections!=='object'||Array.isArray(raw.sections)) return {ok:false,error:'Backup sections are invalid.'};
  const rawSections=raw.sections as Record<string,unknown>;
  const kinds=Object.keys(rawSections).filter(isSectionKind);
  if(!kinds.length||kinds.length>100) return {ok:false,error:'A backup must contain between 1 and 100 sections.'};
  const clean:SavedValues={};
  for(const kind of kinds){
    const list=rawSections[kind];
    if(!Array.isArray(list)||list.length>500) return {ok:false,error:`Section ${sectionLabel(kind)} must contain at most 500 saved values.`};
    if(list.some(value=>typeof value!=='string')) return {ok:false,error:`Every section ${sectionLabel(kind)} value must be text.`};
    const normalized=(list as string[]).map(normalizeValue);
    if(normalized.some(value=>!value||value.length>200)) return {ok:false,error:`A section ${sectionLabel(kind)} value is empty or too long.`};
    clean[kind]=dedupe(normalized);
  }
  return {ok:true,data:{schemaVersion:5,exportedAt:new Date(raw.exportedAt).toISOString(),sections:clean}};
}
export function mergeValues(current:SavedValues,incoming:SavedValues):SavedValues {
  const kinds=new Set([...Object.keys(current),...Object.keys(incoming)].filter(isSectionKind));
  return Object.fromEntries([...kinds].map(kind=>[kind,dedupe([...(current[kind]||[]),...(incoming[kind]||[])])])) as SavedValues;
}
