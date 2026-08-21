import React, { useMemo, useState } from 'react';
import { ChatMessage } from '../../types/message';
import { senderColor, typeBadgeClass } from '../../core/stats';
import { IconChevronLeft, IconChevronRight, IconPaperclip } from '../icons';

const PAGE_SIZE_OPTIONS = [25, 50, 100];

export function DataTable({ messages }: { messages: ChatMessage[] }) {
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(messages.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pageMessages = useMemo(() => messages.slice(currentPage * pageSize, currentPage * pageSize + pageSize), [messages, currentPage, pageSize]);
  const startIdx = messages.length === 0 ? 0 : currentPage * pageSize + 1;
  const endIdx = Math.min(messages.length, currentPage * pageSize + pageSize);
  const goToPage = (p: number) => setPage(Math.max(0, Math.min(pageCount - 1, p)));
  const pageButtons = useMemo(() => {
    const buttons: number[] = [0];
    for (let p = currentPage - 1; p <= currentPage + 1; p++) if (p > 0 && p < pageCount - 1) buttons.push(p);
    if (pageCount > 1) buttons.push(pageCount - 1);
    const out: (number | 'ellipsis')[] = [];
    let prev = -2;
    for (const p of Array.from(new Set(buttons)).sort((a,b)=>a-b)) { if (p - prev > 1) out.push('ellipsis'); out.push(p); prev = p; }
    return out;
  }, [currentPage, pageCount]);

  if (!messages.length) return <div className="ce-empty ce-table-empty"><h2>No messages match right now</h2><p>Try clearing your search or filters.</p></div>;

  return <div>
    <div className="ce-table-wrap">
      <table className="ce-table">
        <thead><tr><th>#</th><th>Timestamp</th><th>Sender</th><th>Message</th><th>Type</th></tr></thead>
        <tbody>{pageMessages.map((m, i) => {
          const color = senderColor(m.sender);
          return <tr key={m.id}>
            <td className="ce-index">{currentPage * pageSize + i + 1}</td>
            <td className="ce-time">{m.timestamp || '—'}</td>
            <td className={color.text}>{m.sender || 'Unknown'}</td>
            <td><div className="ce-message-cell">{m.attachments.length > 0 && <IconPaperclip />}<span>{m.text || m.attachments[0]?.name || '[No content]'}</span></div></td>
            <td><span className={`ce-type-badge ${typeBadgeClass(m.type)}`}>{m.type}</span></td>
          </tr>;
        })}</tbody>
      </table>
    </div>
    <div className="ce-pagination">
      <div className="ce-page-size"><span>Rows per page:</span><select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(0); }}>{PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}</select></div>
      <div className="ce-page-controls"><span>{startIdx}–{endIdx} of {messages.length}</span><button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 0}><IconChevronLeft /></button>{pageButtons.map((p,i)=>p==='ellipsis'?<span key={`e${i}`} className="ce-ellipsis">…</span>:<button key={p} className={p===currentPage?'active':''} onClick={()=>goToPage(p)}>{p+1}</button>)}<button onClick={() => goToPage(currentPage + 1)} disabled={currentPage >= pageCount - 1}><IconChevronRight /></button></div>
    </div>
  </div>;
}
