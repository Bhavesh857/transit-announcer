import { useMemo, useState } from 'react';
import { Button, Card, CardHeader, Text, Title3 } from '@fluentui/react-components';
import { AddRegular, ArrowResetRegular, DeleteRegular } from '@fluentui/react-icons';
import { INITIAL_SECTION_COUNT, SavedValues, buildAnnouncement, buildHindiSpokenDetails, sectionKind } from '../data/announcementTemplates';
import { SavedValueField } from './SavedValueField';
import { AnnouncementPreview } from './AnnouncementPreview';
interface Props {values:SavedValues; add:(kind:`section${number}`,value:string)=>void}
export function AnnouncementComposer({values,add}:Props){
 const [sections,setSections]=useState(()=>Array(INITIAL_SECTION_COUNT).fill('') as string[]); const [copied,setCopied]=useState(false);
 const text=useMemo(()=>buildAnnouncement(sections),[sections]);
 const hindiSpokenText=useMemo(()=>buildHindiSpokenDetails(sections),[sections]);
 const setSection=(index:number,value:string)=>setSections(current=>current.map((item,itemIndex)=>itemIndex===index?value:item));
 const reset=()=>{setSections(Array(INITIAL_SECTION_COUNT).fill(''));setCopied(false)};
 const addSection=()=>setSections(current=>[...current,'']);
 const removeSection=()=>setSections(current=>current.length>1?current.slice(0,-1):current);
 const copy=async()=>{try{await navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000)}catch{setCopied(false)}};
 const saveUsed=()=>sections.forEach((value,index)=>{if(value)add(sectionKind(index),value)});
 return <div className="split"><Card className="panel"><CardHeader header={<Title3>Announcement sections</Title3>} description={<Text>Add or remove sections as needed. Speech reads only the values.</Text>}/><div className="form-grid">{sections.map((value,index)=>{const kind=sectionKind(index);return <SavedValueField key={kind} label={String(index+1)} value={value} options={values[kind]||[]} onChange={next=>setSection(index,next)}/>})}</div><div className="actions"><Button size="large" icon={<AddRegular/>} onClick={addSection}>Add section</Button><Button size="large" icon={<DeleteRegular/>} disabled={sections.length===1} onClick={removeSection}>Remove section</Button><Button appearance="primary" size="large" disabled={!text} onClick={saveUsed}>Save values</Button><Button size="large" icon={<ArrowResetRegular/>} onClick={reset}>Reset</Button></div></Card><AnnouncementPreview text={text} hindiSpokenText={hindiSpokenText} copied={copied} onCopy={copy}/></div>;
}
