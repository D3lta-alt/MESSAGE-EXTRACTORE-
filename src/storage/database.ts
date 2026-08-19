import { ChatMessage } from '../types/message';

const DB_NAME = 'chat-extractor';
const DB_VERSION = 1;

export class Database {
  private db: IDBDatabase | null = null;

  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains('messages')) {
          const store = db.createObjectStore('messages', { keyPath: 'id' });
          store.createIndex('conversation', 'conversation');
          store.createIndex('sender', 'sender');
          store.createIndex('timestamp', 'timestamp');
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id' });
        }
      };

      req.onsuccess = () => {
        this.db = req.result;
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  }

  async addMessage(msg: ChatMessage): Promise<void> {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readwrite');
      tx.objectStore('messages').put(msg);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async getMessages(conversation?: string): Promise<ChatMessage[]> {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readonly');
      const store = tx.objectStore('messages');
      const req = conversation
        ? store.index('conversation').getAll(conversation)
        : store.getAll();

      req.onsuccess = () => resolve(req.result as ChatMessage[]);
      req.onerror = () => reject(req.error);
    });
  }

  async countAttachments(): Promise<number> {
    const messages = await this.getMessages();
    return messages.reduce((acc, m) => acc + m.attachments.length, 0);
  }

  async clear(): Promise<void> {
    if (!this.db) await this.open();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('messages', 'readwrite');
      tx.objectStore('messages').clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}