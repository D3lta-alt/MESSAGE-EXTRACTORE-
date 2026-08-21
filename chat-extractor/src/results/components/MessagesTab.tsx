import React, { useMemo, useState } from 'react';
import { ChatMessage, MessageType } from '../../types/message';
import { DataTable } from './DataTable';
import { ExportFormatsPanel, PreviewPanel } from './ExportPanels';
import { IconSearch, IconFilter, IconTable, IconChat, IconBraces, IconUsers, IconPaperclip } from '../icons';
import { senderColor } from '../../core/stats';

type ViewMode = 'table' | 'chat' | 'json';
function matchesSearch(message: ChatMessage, query: string) { const q=query.toLowerCase(); return !!(message.sender?.toLowerCase().includes(q) || message.text?.toLowerCase().includes(q) || message.attachments.some(a=>a.name.toLowerCase().includes(q))); }

export function MessagesTab({ messages, conversationTitle }: { messages: ChatMessage[]; conversationTitle: string }) {
  const [view,setView]=useState<ViewMode>('table'); const [search,setSearch]=useState(''); const [typeFilter,setTypeFilter]=useState<Set<MessageType>>(new Set()); const [filterOpen,setFilterOpen]=useState(false);
  const availableTypes=useMemo(()=>Array.from(new Set(messages.map(m=>m.type))).sort(),[messages]);
  const filtered=useMemo(()=>messages.filter(m=>(!search||matchesSearch(m,search))&&(typeFilter.size===0||typeFilter.has(m.type))),[messages,search,typeFilter]);
  const toggleType=(t:MessageType)=>setTypeFilter(prev=>{const n=new Set(prev);n.has(t)?n.delete(t):n.add(t);return n;});
  return <div className="ce-messages">
    <div className="ce-toolbar">
      <div className="ce-search"><IconSearch/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search messages..."/><span>{filtered.length !== messages.length ? `${filtered.length} matches` : `${messages.length.toLocaleString()} messages`}</span></div>
      <div className="ce-view-switcher">{([{mode:'table',icon:<IconTable/>,label:'Table View'},{mode:'chat',icon:<IconChat/>,label:'Chat View'},{mode:'json',icon:<IconBraces/>,label:'JSON View'}] as const).map(x=><button key={x.mode} className={view===x.mode?'active':''} onClick={()=>setView(x.mode)}>{x.icon}<span>{x.label}</span></button>)}</div>
      <div className="ce-filter-wrap"><button className={typeFilter.size?'ce-filter active':'ce-filter'} onClick={()=>setFilterOpen(v=>!v)}><IconFilter/>Filter{typeFilter.size?` (${typeFilter.size})`:''}</button>{filterOpen&&<div className="ce-filter-menu"><strong>MESSAGE TYPE</strong>{availableTypes.map(t=><label key={t}><input type="checkbox" checked={typeFilter.has(t)} onChange={()=>toggleType(t)}/><span>{t}</span></label>)}{typeFilter.size>0&&<button className="ce-clear-filter" onClick={()=>setTypeFilter(new Set())}>Clear filters</button>}</div>}</div>
    </div>
    {view==='table'&&<DataTable messages={filtered}/>} 
    {view==='chat'&&<div className="ce-chat-list">{filtered.length===0?<div className="ce-empty"><p>No messages match right now.</p></div>:filtered.map(m=>{const c=senderColor(m.sender);return <article key={m.id} className="ce-chat-message"><div className="ce-chat-meta"><IconUsers/><strong className={c.text}>{m.sender||'Unknown'}</strong><time>{m.timestamp||''}</time></div>{m.text&&<p>{m.text}</p>}{m.attachments.map(a=><div className="ce-chat-attachment" key={a.id}><IconPaperclip/>{a.name}</div>)}</article>})}</div>}
    {view==='json'&&<pre className="ce-json">{JSON.stringify(filtered,null,2)}</pre>}
    <div className="ce-bottom-grid"><PreviewPanel messages={filtered}/><ExportFormatsPanel messages={filtered} conversationTitle={conversationTitle}/></div>
  </div>;
}
