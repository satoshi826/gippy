import {Template} from '../Template'
export default function Page({name}: {name: string}) {
  return <Template src={name}/>
}