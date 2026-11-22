import { useMemo, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { ArrowResetRegular } from '@fluentui/react-icons';
import { SavedValues, ValueKind, buildAnnouncement, buildHindiSpokenDetails } from '../data/announcementTemplates';
import { SavedValueField } from './SavedValueField';
import { AnnouncementPreview } from './AnnouncementPreview';
interface Props {values:SavedValues; add:(kind:keyof SavedValues,value:string)=>void}
const SECTION_KINDS=Array.from({length:10},(_,index)=>`section${index+1}` as ValueKind);
export function AnnouncementComposer({values,add}:Props){
 const [bus,setBus]=useState(''); const [from,setFrom]=useState(''); const [to,setTo]=useState(''); const [via,setVia]=useState(''); const [platform,setPlatform]=useState(''); const [time,setTime]=useState(''); const [sections,setSections]=useState(()=>Array(10).fill('') as string[]); const [note,setNote]=useState(''); const [copied,setCopied]=useState(false);
 const text=useMemo(()=>buildAnnouncement(bus,from,to,via,platform,time,sections,note),[bus,from,to,via,platform,time,sections,note]);
 const hindiSpokenText=useMemo(()=>buildHindiSpokenDetails(bus,from,to,via,platform,time,sections,note),[bus,from,to,via,platform,time,sections,note]);
 const setSection=(index:number,value:string)=>setSections(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
 const reset=()=>{setBus('');setFrom('');setTo('');setVia('');setPlatform('');setTime('');setSections(Array(10).fill(''));setNote('');setCopied(false)};
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};
 const saveUsed=()=>{if(bus)add('busNumbers',bus);if(from)add('origins',from);if(to)add('destinations',to);if(via)add('vias',via);if(platform)add('platforms',platform);sections.forEach((value,index)=>{if(value)add(SECTION_KINDS[index],value)});if(note)add('notes',note)};
 return <div className="split"><Card className="panel"><CardHeader header={<Title3>Trip details</Title3>} description={<Text>Fields update the preview instantly.</Text>}/><div className="form-grid"><SavedValueField label="Bus number" value={bus} options={values.busNumbers} onChange={setBus}/><SavedValueField label="From" value={from} options={values.origins} onChange={setFrom}/><SavedValueField label="To" value={to} options={values.destinations} onChange={setTo}/><SavedValueField label="Via" value={via} options={values.vias} onChange={setVia}/><SavedValueField label="Platform" value={platform} options={values.platforms} onChange={setPlatform}/><SavedValueField label="Time" value={time} options={[]} onChange={setTime} type="time"/>{sections.map((value,index)=><SavedValueField key={index} label={String(index+1)} value={value} options={values[SECTION_KINDS[index]]} onChange={next=>setSection(index,next)}/>)}<div className="wide"><SavedValueField label="Note (optional)" value={note} options={values.notes} onChange={setNote}/></div></div><div className="actions"><Button appearance="primary" size="large" disabled={!text} onClick={saveUsed}>Save values</Button><Button size="large" icon={<ArrowResetRegular/>} onClick={reset}>Reset</Button></div></Card><AnnouncementPreview text={text} hindiSpokenText={hindiSpokenText} bus={bus} route={via} copied={copied} onCopy={copy}/></div>;
}
