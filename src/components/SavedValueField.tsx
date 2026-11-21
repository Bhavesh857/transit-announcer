import { Field, Input } from '@fluentui/react-components';
interface Props {label:string; value:string; options:string[]; onChange:(value:string)=>void; required?:boolean; type?:'text'|'time'; maxLength?:number}
export function SavedValueField({label,value,options,onChange,required,type='text',maxLength}:Props){
 const id=`value-${label.toLowerCase().replace(/\W/g,'-')}`;
 return <Field label={label} required={required}><Input id={id} list={`${id}-list`} value={value} type={type} maxLength={maxLength} onChange={(_,d)=>onChange(d.value)} size="large" autoComplete="off"/><datalist id={`${id}-list`}>{options.map(o=><option key={o} value={o}/>)}</datalist></Field>;
}
