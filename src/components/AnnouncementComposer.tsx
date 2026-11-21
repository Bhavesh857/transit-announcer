import { useMemo, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { ArrowResetRegular } from '@fluentui/react-icons';
import { SavedValues, buildAnnouncement, buildHindiSpokenDetails, buildSpokenDetails } from '../data/announcementTemplates';
import { SavedValueField } from './SavedValueField';
import { AnnouncementPreview } from './AnnouncementPreview';
interface Props {values:SavedValues; add:(kind:keyof SavedValues,value:string)=>void}
export function AnnouncementComposer({values,add}:Props){
 const [bus,setBus]=useState(''); const [from,setFrom]=useState(''); const [to,setTo]=useState(''); const [via,setVia]=useState(''); const [platform,setPlatform]=useState(''); const [time,setTime]=useState(''); const [note,setNote]=useState(''); const [copied,setCopied]=useState(false);
 const text=useMemo(()=>buildAnnouncement(bus,from,to,via,platform,time,note),[bus,from,to,via,platform,time,note]);
 const spokenText=useMemo(()=>buildSpokenDetails(bus,from,to,via,platform,time,note),[bus,from,to,via,platform,time,note]);
 const hindiSpokenText=useMemo(()=>buildHindiSpokenDetails(bus,from,to,via,platform,time,note),[bus,from,to,via,platform,time,note]);
 const reset=()=>{setBus('');setFrom('');setTo('');setVia('');setPlatform('');setTime('');setNote('');setCopied(false)};
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};
 const saveUsed=()=>{if(bus)add('busNumbers',bus);if(from)add('origins',from);if(to)add('destinations',to);if(via)add('vias',via);if(platform)add('platforms',platform);if(note)add('notes',note)};
 return <div className="split"><Card className="panel"><CardHeader header={<Title3>Trip details</Title3>} description={<Text>Fields update the preview instantly.</Text>}/><div className="form-grid"><SavedValueField label="Bus number" value={bus} options={values.busNumbers} onChange={setBus} maxLength={20}/><SavedValueField label="From" value={from} options={values.origins} onChange={setFrom} maxLength={100}/><SavedValueField label="To" value={to} options={values.destinations} onChange={setTo} maxLength={100}/><SavedValueField label="Via" value={via} options={values.vias} onChange={setVia} maxLength={100}/><SavedValueField label="Platform" value={platform} options={values.platforms} onChange={setPlatform} maxLength={30}/><SavedValueField label="Time" value={time} options={[]} onChange={setTime} type="time"/><div className="wide"><SavedValueField label="Note (optional)" value={note} options={values.notes} onChange={setNote} maxLength={200}/></div></div><div className="actions"><Button appearance="primary" size="large" disabled={!text} onClick={saveUsed}>Save values</Button><Button size="large" icon={<ArrowResetRegular/>} onClick={reset}>Reset</Button></div></Card><AnnouncementPreview text={text} spokenText={spokenText} hindiSpokenText={hindiSpokenText} bus={bus} route={via} copied={copied} onCopy={copy}/></div>;
}
