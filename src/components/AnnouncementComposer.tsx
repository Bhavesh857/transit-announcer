import { useMemo, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { ArrowResetRegular } from '@fluentui/react-icons';
import { SECTION_KINDS, SavedValues, buildAnnouncement, buildHindiSpokenDetails } from '../data/announcementTemplates';
import { SavedValueField } from './SavedValueField';
import { AnnouncementPreview } from './AnnouncementPreview';
interface Props {values:SavedValues; add:(kind:keyof SavedValues,value:string)=>void}
export function AnnouncementComposer({values,add}:Props){
 const [sections,setSections]=useState(()=>Array(10).fill('') as string[]); const [copied,setCopied]=useState(false);
 const text=useMemo(()=>buildAnnouncement(sections),[sections]);
 const hindiSpokenText=useMemo(()=>buildHindiSpokenDetails(sections),[sections]);
 const setSection=(index:number,value:string)=>setSections(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
 const reset=()=>{setSections(Array(10).fill(''));setCopied(false)};
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};
 const saveUsed=()=>sections.forEach((value,index)=>{if(value)add(SECTION_KINDS[index],value)});
 return <div className="split"><Card className="panel"><CardHeader header={<Title3>Announcement sections</Title3>} description={<Text>Enter up to 10 parts. Speech reads only the values.</Text>}/><div className="form-grid">{sections.map((value,index)=><SavedValueField key={index} label={String(index+1)} value={value} options={values[SECTION_KINDS[index]]} onChange={next=>setSection(index,next)}/>)}</div><div className="actions"><Button appearance="primary" size="large" disabled={!text} onClick={saveUsed}>Save values</Button><Button size="large" icon={<ArrowResetRegular/>} onClick={reset}>Reset</Button></div></Card><AnnouncementPreview text={text} hindiSpokenText={hindiSpokenText} copied={copied} onCopy={copy}/></div>;
}
