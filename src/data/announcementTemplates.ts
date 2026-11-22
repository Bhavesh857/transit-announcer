export type ValueKind = 'busNumbers' | 'origins' | 'destinations' | 'vias' | 'platforms' | 'section1' | 'section2' | 'section3' | 'section4' | 'section5' | 'section6' | 'section7' | 'section8' | 'section9' | 'section10' | 'notes';
export type SavedValues = Record<ValueKind, string[]>;
export interface Backup extends SavedValues { schemaVersion: 3; exportedAt: string }

export const DEFAULT_VALUES: SavedValues = {
  busNumbers: ['42', '18', '7'],
  origins: [],
  destinations: ['Terminal 1', 'Central Harbor', 'City Hall'],
  vias: ['Airport Express', 'Harbor Line', 'Downtown Loop'],
  platforms: ['1', '2', '3'],
  section1: [],
  section2: [],
  section3: [],
  section4: [],
  section5: [],
  section6: [],
  section7: [],
  section8: [],
  section9: [],
  section10: [],
  notes: ['Platform change', 'Accessible low-floor bus', 'Next stop only'],
};
export const LABELS: Record<ValueKind,string> = {busNumbers:'Bus number',origins:'From',destinations:'To',vias:'Via',platforms:'Platform',section1:'1',section2:'2',section3:'3',section4:'4',section5:'5',section6:'6',section7:'7',section8:'8',section9:'9',section10:'10',notes:'Note'};
const LIMITS: Record<ValueKind,number> = {busNumbers:20,origins:100,destinations:100,vias:100,platforms:30,section1:200,section2:200,section3:200,section4:200,section5:200,section6:200,section7:200,section8:200,section9:200,section10:200,notes:200};
export const STORAGE_KEY = 'transit-announcer.values.v3';
export const LEGACY_STORAGE_KEYS = ['transit-announcer.values.v2','transit-announcer.values.v1'];

export function normalizeValue(value: string): string { return value.trim().replace(/\s+/g, ' '); }
function stripEndingPunctuation(value:string):string { return value.replace(/[.!?।]+$/, ''); }
export function dedupe(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter(value => { const key=value.toLocaleLowerCase(); if(seen.has(key)) return false; seen.add(key); return true; });
}
export function formatTime(time: string): string { return normalizeValue(time); }
export function formatHindiTime(time: string): string {
  const match = /^(\d{2}):(\d{2})$/.exec(normalizeValue(time));
  if(!match) return normalizeValue(time);
  const hours=Number(match[1]);
  const minutes=Number(match[2]);
  const period=hours<4?'रात':hours<12?'सुबह':hours<16?'दोपहर':hours<20?'शाम':'रात';
  return `${period} ${hours%12||12} बजकर ${minutes} मिनट`;
}
export function buildAnnouncement(bus:string,from:string,to:string,via:string,platform:string,time:string,sections:string[],note:string):string {
  const fields = [
    ['Bus number', normalizeValue(bus)], ['From', normalizeValue(from)], ['To', normalizeValue(to)],
    ['Via', normalizeValue(via)], ['Platform', normalizeValue(platform)], ['Time', formatTime(time)],
    ...sections.map((value,index)=>[String(index+1),stripEndingPunctuation(normalizeValue(value))] as const),
    ['Note', stripEndingPunctuation(normalizeValue(note))],
  ] as const;
  return fields.filter(([,value])=>value).map(([label,value])=>`${label}: ${value}.`).join(' ');
}
export function buildHindiSpokenDetails(bus:string,from:string,to:string,via:string,platform:string,time:string,sections:string[],note:string):string {
  const b=normalizeValue(bus), f=normalizeValue(from), t=normalizeValue(to), v=normalizeValue(via), p=normalizeValue(platform), tm=formatHindiTime(time), n=stripEndingPunctuation(normalizeValue(note));
  const extra=sections.map(value=>stripEndingPunctuation(normalizeValue(value))).filter(Boolean);
  if(![b,f,t,v,p,tm,n,...extra].some(Boolean)) return '';
  const parts=['यात्रीगण कृपया ध्यान दें।'];
  if(b) parts.push(`बस नंबर ${b}`);
  if(f) parts.push(`${f} से`);
  if(t) parts.push(`${t} जाने वाली`);
  if(v) parts.push(`वाया ${v}`);
  const departure=[tm?`${tm} पर`:'',p?`प्लेटफॉर्म ${p} से`:'','रवाना होगी।'].filter(Boolean).join(' ');
  parts.push(departure);
  extra.forEach(value=>parts.push(`${value}।`));
  if(n) parts.push(`कृपया ध्यान दें, ${n}।`);
  return parts.join(' ');
}
export function migrateLegacyValues(input:unknown):SavedValues|null {
  if(!input || typeof input!=='object' || Array.isArray(input)) return null;
  const raw=input as Record<string,unknown>;
  const strings=(key:string)=>Array.isArray(raw[key]) ? raw[key].filter((value):value is string=>typeof value==='string').map(normalizeValue).filter(Boolean) : [];
  if(!['busNumbers','routes','origins','destinations','vias','platforms','notes'].some(key=>Array.isArray(raw[key]))) return null;
  return {
    busNumbers:dedupe(strings('busNumbers')),origins:dedupe(strings('origins')),destinations:dedupe(strings('destinations')),
    vias:dedupe([...strings('vias'),...strings('routes')]),platforms:dedupe(strings('platforms')),
    section1:dedupe(strings('section1')),section2:dedupe(strings('section2')),section3:dedupe(strings('section3')),section4:dedupe(strings('section4')),section5:[],section6:[],section7:[],section8:[],section9:[],section10:[],notes:dedupe(strings('notes')),
  };
}
export function createBackup(values:SavedValues):Backup { return {schemaVersion:3,exportedAt:new Date().toISOString(),...values}; }
export function validateBackup(input:unknown):{ok:true;data:Backup}|{ok:false;error:string} {
  if(!input || typeof input!=='object' || Array.isArray(input)) return {ok:false,error:'Backup must be a JSON object.'};
  const raw=input as Record<string,unknown>;
  if(raw.schemaVersion===1||raw.schemaVersion===2){
    const migrated=migrateLegacyValues(raw);
    if(!migrated) return {ok:false,error:`The version ${raw.schemaVersion} backup is invalid.`};
    return {ok:true,data:{schemaVersion:3,exportedAt:typeof raw.exportedAt==='string'&&!Number.isNaN(Date.parse(raw.exportedAt))?new Date(raw.exportedAt).toISOString():new Date().toISOString(),...migrated}};
  }
  if(raw.schemaVersion!==3) return {ok:false,error:'This backup version is not supported.'};
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
  return {ok:true,data:{schemaVersion:3,exportedAt:new Date(raw.exportedAt).toISOString(),...clean}};
}
export function mergeValues(current:SavedValues,incoming:SavedValues):SavedValues {
  return Object.fromEntries((Object.keys(DEFAULT_VALUES) as ValueKind[]).map(kind=>[kind,dedupe([...current[kind],...incoming[kind]])])) as SavedValues;
}
