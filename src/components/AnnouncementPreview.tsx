import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { CopyRegular, CheckmarkCircleRegular, Speaker2Regular, StopRegular } from '@fluentui/react-icons';
interface Props {text:string; spokenText:string; hindiSpokenText:string; bus:string; route:string; copied:boolean; onCopy:()=>void}
type SpeechLanguage='en-US'|'hi-IN';
export function AnnouncementPreview({text,spokenText,hindiSpokenText,bus,route,copied,onCopy}:Props){
 const [speaking,setSpeaking]=useState<SpeechLanguage|null>(null);
 const speechSupported=typeof window!=='undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
 const words=text ? text.split(/\s+/).length : 0;
 useEffect(()=>()=>{if(speechSupported) window.speechSynthesis.cancel()},[speechSupported]);
 const speak=(speechText:string,language:SpeechLanguage)=>{
  if(!speechSupported || !speechText) return;
  window.speechSynthesis.cancel();
  const utterance=new SpeechSynthesisUtterance(speechText);
  utterance.lang=language;
  utterance.rate=language==='hi-IN'?0.82:0.9;
  utterance.pitch=language==='hi-IN'?1.03:1;
  const voices=window.speechSynthesis.getVoices();
  const languageVoices=voices.filter(voice=>voice.lang.toLowerCase().startsWith(language.slice(0,2).toLowerCase()));
  const preferredVoice=languageVoices.find(voice=>/natural|neural|online|google|microsoft|swara|madhur/i.test(voice.name))||languageVoices.find(voice=>!voice.localService)||languageVoices[0];
  if(preferredVoice) utterance.voice=preferredVoice;
  utterance.onstart=()=>setSpeaking(language);
  utterance.onend=()=>setSpeaking(null);
  utterance.onerror=()=>setSpeaking(null);
  window.speechSynthesis.speak(utterance);
 };
 const stop=()=>{window.speechSynthesis.cancel();setSpeaking(null)};
 return <Card className="panel preview-panel"><CardHeader header={<Title3>Passenger preview</Title3>} description={<Text>{text?'Ready to announce':'Enter trip details'}</Text>}/><div className="announcement" aria-live="polite" aria-atomic="true"><div><div className="eyebrow">{[route,bus&&`Bus ${bus}`].filter(Boolean).join(' · ')||'Your announcement'}</div><p>{text||'Your announcement will appear here as you type.'}</p></div><Text className="muted">{text?`${words} words · Clear`:'Live preview'}</Text></div><div className="actions"><Button appearance="primary" size="large" icon={copied?<CheckmarkCircleRegular/>:<CopyRegular/>} disabled={!text} onClick={onCopy}>{copied?'Copied':'Copy announcement'}</Button>{speechSupported?<>{speaking?<Button size="large" icon={<StopRegular/>} onClick={stop}>Stop speaking</Button>:<><Button size="large" icon={<Speaker2Regular/>} disabled={!spokenText} onClick={()=>speak(spokenText,'en-US')}>Speak English</Button><Button size="large" icon={<Speaker2Regular/>} disabled={!hindiSpokenText} onClick={()=>speak(hindiSpokenText,'hi-IN')}>हिंदी में सुनें</Button></>}</>:<Text role="status" className="muted">Speech is not supported by this browser.</Text>}</div></Card>;
}
