import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_VALUES, SavedValues, STORAGE_KEY, ValueKind, dedupe, normalizeValue } from '../data/announcementTemplates';

function readValues(): SavedValues {
  try {
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if(parsed && Object.keys(DEFAULT_VALUES).every(k=>Array.isArray(parsed[k]) && parsed[k].every((v:unknown)=>typeof v==='string'))) return parsed;
  } catch { /* recover using defaults */ }
  return structuredClone(DEFAULT_VALUES);
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
