import { useMemo, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { ArrowResetRegular } from '@fluentui/react-icons';
import { SavedValues, buildAnnouncement, buildSpokenDetails } from '../data/announcementTemplates';
import { SavedValueField } from './SavedValueField';
import { AnnouncementPreview } from './AnnouncementPreview';
interface Props {values:SavedValues; add:(kind:keyof SavedValues,value:string)=>void}
export function AnnouncementComposer({values,add}:Props){
 const [bus,setBus]=useState(''); const [route,setRoute]=useState(''); const [time,setTime]=useState(''); const [destination,setDestination]=useState(''); const [note,setNote]=useState(''); const [copied,setCopied]=useState(false);
 const text=useMemo(()=>buildAnnouncement(bus,route,time,destination,note),[bus,route,time,destination,note]);
 const spokenText=useMemo(()=>buildSpokenDetails(bus,route,time,destination,note),[bus,route,time,destination,note]);
 const reset=()=>{setBus('');setRoute('');setTime('');setDestination('');setNote('');setCopied(false)};
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};
 const saveUsed=()=>{if(bus)add('busNumbers',bus);if(route)add('routes',route);if(destination)add('destinations',destination);if(note)add('notes',note)};
 return <div className="split"><Card className="panel"><CardHeader header={<Title3>Trip details</Title3>} description={<Text>Fields update the preview instantly.</Text>}/><div className="form-grid"><SavedValueField label="Bus number" value={bus} options={values.busNumbers} onChange={setBus} maxLength={20}/><SavedValueField label="Route" value={route} options={values.routes} onChange={setRoute} maxLength={100}/><SavedValueField label="Time" value={time} options={[]} onChange={setTime} type="time"/><SavedValueField label="Destination" value={destination} options={values.destinations} onChange={setDestination} maxLength={100}/><div className="wide"><SavedValueField label="Note (optional)" value={note} options={values.notes} onChange={setNote} maxLength={200}/></div></div><div className="actions"><Button appearance="primary" size="large" disabled={!text} onClick={saveUsed}>Save values</Button><Button size="large" icon={<ArrowResetRegular/>} onClick={reset}>Reset</Button></div></Card><AnnouncementPreview text={text} spokenText={spokenText} bus={bus} route={route} copied={copied} onCopy={copy}/></div>;
}
