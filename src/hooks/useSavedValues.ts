import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_VALUES, LEGACY_STORAGE_KEY, SavedValues, STORAGE_KEY, ValueKind, dedupe, migrateLegacyValues, normalizeValue } from '../data/announcementTemplates';

function readValues(): SavedValues {
  try {
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(parsed && Object.keys(DEFAULT_VALUES).every(k=>Array.isArray(parsed[k]) && parsed[k].every((v:unknown)=>typeof v==='string'))) return parsed;
    const legacy=JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY) || 'null');
    const migrated=migrateLegacyValues(legacy);
    if(migrated) return mergeWithDefaults(migrated);
  } catch { /* recover using defaults */ }
  return structuredClone(DEFAULT_VALUES);
}
function mergeWithDefaults(values:SavedValues):SavedValues {
  return Object.fromEntries((Object.keys(DEFAULT_VALUES) as ValueKind[]).map(kind=>[kind,dedupe([...DEFAULT_VALUES[kind],...values[kind]])])) as SavedValues;
}
export function useSavedValues(){
  const [values,setValuesState]=useState<SavedValues>(readValues);
  useEffect(()=>localStorage.setItem(STORAGE_KEY,JSON.stringify(values)),[values]);
  const setValues=useCallback((next:SavedValues)=>setValuesState(next),[]);
  const addValue=useCallback((kind:ValueKind,value:string)=>{const clean=normalizeValue(value);if(clean)setValuesState(v=>({...v,[kind]:dedupe([...v[kind],clean])}));},[]);
  const removeValue=useCallback((kind:ValueKind,value:string)=>setValuesState(v=>({...v,[kind]:v[kind].filter(x=>x!==value)})),[]);
  const resetValues=useCallback(()=>setValuesState(structuredClone(DEFAULT_VALUES)),[]);
  return {values,setValues,addValue,removeValue,resetValues};
}
