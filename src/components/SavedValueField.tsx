import { Combobox, Field, Input, Option } from '@fluentui/react-components';
interface Props {label:string; value:string; options:string[]; onChange:(value:string)=>void; required?:boolean; type?:'text'|'time'; maxLength?:number}
export function SavedValueField({label,value,options,onChange,required,type='text',maxLength}:Props){
 const id=`value-${label.toLowerCase().replace(/\W/g,'-')}`;
 if(type==='time') return <Field label={label} required={required}><Input id={id} value={value} type="time" onChange={(_,d)=>onChange(d.value)} size="large"/></Field>;
 return <Field label={label} required={required}><Combobox id={id} value={value} freeform size="large" onInput={event=>onChange((event.target as HTMLInputElement).value)} onOptionSelect={(_,data)=>onChange(data.optionText||'')} placeholder={options.length?'Type or choose a saved value':'Type a value'}>{options.map(option=><Option key={option} text={option}>{option}</Option>)}</Combobox></Field>;
}
