import { ChatMessage, Attachment } from '../types/message';

export type ExportFormat = 'txt' | 'csv' | 'json' | 'html' | 'pdf';

export class ExportManager {
  static toTxt(messages: ChatMessage[]): string {
    return messages.map(m => {
      const time = m.timestamp || 'Unknown time';
      const sender = m.sender || 'Unknown sender';
      let txt = `[${time}] ${sender}:`;
      if (m.attachments.length > 0) {
        for (const att of m.attachments) {
          txt += `\n[${att.type.toUpperCase()}] ${att.name}`;
        }
      }
      if (m.text) txt += `\n${m.text}`;
      return txt + '\n';
    }).join('\n');
  }

  static toCsv(messages: ChatMessage[]): string {
    // Neutralize CSV/formula injection (CWE-1236): a field whose first character
    // is one of these is treated as a live formula by Excel/Sheets/LibreOffice,
    // even when quoted. Prefixing with a single-quote defuses that.
    const neutralizeFormula = (v: string): string => (/^[=+\-@]/.test(v) ? `'${v}` : v);

    const rows = [
      ['Timestamp', 'Sender', 'Message', 'Type', 'Attachments'],
      ...messages.map(m => [
        m.timestamp || '',
        m.sender || '',
        m.text || '',
        m.type,
        m.attachments.map(a => `${a.type}:${a.name}`).join('; ')
      ])
    ];
    return rows
      .map(r => r.map(v => `"${neutralizeFormula(v || '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
  }

  static toJson(messages: ChatMessage[]): string {
    return JSON.stringify(messages.map(m => ({
      timestamp: m.timestamp,
      sender: m.sender,
      text: m.text,
      type: m.type,
      attachments: m.attachments.map(a => ({
        name: a.name,
        type: a.type,
        mimeType: a.mimeType,
        size: a.size,
        previewAvailable: a.previewAvailable,
        downloadAvailable: a.downloadAvailable,
        url: a.url
      }))
    })), null, 2);
  }

  static toHtml(messages: ChatMessage[]): string {
    const rows = messages.map(m => {
      const time = this.escapeHtml(m.timestamp || 'Unknown time');
      const sender = this.escapeHtml(m.sender || 'Unknown sender');
      const text = this.escapeHtml(m.text || '');
      const attachments = m.attachments.map(a => {
        return `<span class="att ${a.type}">${a.type}: ${this.escapeHtml(a.name)}</span>`;
      }).join(' ');
      return `
        <tr>
          <td>${time}</td>
          <td>${sender}</td>
          <td>${text} ${attachments}</td>
          <td>${m.type}</td>
        </tr>`;
    }).join('');

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Chat Export</title>
<style>
  body { font-family: system-ui; padding: 2rem; }
  table { width: 100%; border-collapse: collapse; }
  th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
  th { background: #f3f4f6; }
  .att { display: inline-block; background: #e5e7eb; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
</style></head><body>
<h1>Chat Extractor Export</h1>
<table><thead><tr><th>Timestamp</th><th>Sender</th><th>Message</th><th>Type</th></tr></thead>
<tbody>${rows}</tbody></table>
</body></html>`;
  }

  static export(messages: ChatMessage[], format: Exclude<ExportFormat, 'pdf'>): string {
    switch (format) {
      case 'txt': return this.toTxt(messages);
      case 'csv': return this.toCsv(messages);
      case 'json': return this.toJson(messages);
      case 'html': return this.toHtml(messages);
    }
  }

  /**
   * There's no dependency-free way to assemble a PDF file's bytes directly
   * in the browser — that needs a library (e.g. jsPDF) this project's
   * package.json isn't available here to add. Instead, this opens a
   * print-formatted view and triggers the browser's native print dialog,
   * where "Save as PDF" is one of the destinations — no new dependency,
   * and it's the same mechanism most "export to PDF" web features use
   * under the hood.
   */
  static exportPdf(messages: ChatMessage[], title = 'Chat Extractor Export'): boolean {
    const html = this.toHtml(messages).replace('<h1>Chat Extractor Export</h1>', `<h1>${this.escapeHtml(title)}</h1>`);
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return false; // popup blocked
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    // Give the new document a tick to finish laying out before printing.
    setTimeout(() => printWindow.print(), 250);
    return true;
  }

  static download(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private static escapeHtml(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}