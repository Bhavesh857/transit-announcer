import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { CopyRegular, CheckmarkCircleRegular, Speaker2Regular, StopRegular } from '@fluentui/react-icons';
interface Props {text:string; spokenText:string; bus:string; route:string; copied:boolean; onCopy:()=>void}
export function AnnouncementPreview({text,spokenText,bus,route,copied,onCopy}:Props){
 const [speaking,setSpeaking]=useState(false);
 const speechSupported=typeof window!=='undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
 const words=text ? text.split(/\s+/).length : 0;
 useEffect(()=>()=>{if(speechSupported) window.speechSynthesis.cancel()},[speechSupported]);
 const speak=()=>{
  if(!speechSupported || !spokenText) return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(spokenText);
  utterance.lang=document.documentElement.lang||'en-US';
  utterance.rate=0.9;
  utterance.onstart=()=>setSpeaking(true);
  utterance.onend=()=>setSpeaking(false);
  utterance.onerror=()=>setSpeaking(false);
  window.speechSynthesis.speak(utterance);
 };
 const stop=()=>{window.speechSynthesis.cancel();setSpeaking(false)};
 return <Card className="panel preview-panel"><CardHeader header={<Title3>Passenger preview</Title3>} description={<Text>{text?'Ready to announce':'Enter trip details'}</Text>}/><div className="announcement" aria-live="polite" aria-atomic="true"><div><div className="eyebrow">{[route,bus&&`Bus ${bus}`].filter(Boolean).join(' · ')||'Your announcement'}</div><p>{text||'Your announcement will appear here as you type.'}</p></div><Text className="muted">{text?`${words} words · Clear`:'Live preview'}</Text></div><div className="actions"><Button appearance="primary" size="large" icon={copied?<CheckmarkCircleRegular/>:<CopyRegular/>} disabled={!text} onClick={onCopy}>{copied?'Copied':'Copy announcement'}</Button>{speechSupported?<Button size="large" icon={speaking?<StopRegular/>:<Speaker2Regular/>} disabled={!spokenText} onClick={speaking?stop:speak}>{speaking?'Stop speaking':'Speak announcement'}</Button>:<Text role="status" className="muted">Speech is not supported by this browser.</Text>}</div></Card>;
}
