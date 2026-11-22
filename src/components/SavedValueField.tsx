import { Field, Input } from '@fluentui/react-components';
interface Props {label:string; value:string; options:string[]; onChange:(value:string)=>void}
export function SavedValueField({label,value,options,onChange}:Props){
 const id=`value-section-${label}`;
 return <Field label={label}><Input id={id} value={value} onChange={(_,data)=>onChange(data.value)} size="large" placeholder="Type a value"/><select className="saved-value-select" value="" onChange={event=>{if(event.target.value)onChange(event.target.value)}} aria-label={`Choose saved value for section ${label}`}><option value="">{options.length?'Choose saved value…':'No saved values yet'}</option>{options.map(option=><option key={option} value={option}>{option}</option>)}</select></Field>;
}
