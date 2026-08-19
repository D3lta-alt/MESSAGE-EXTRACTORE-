// src/popup/components/JsonView.tsx
import React from 'react';
import { ChatMessage } from '../../types/message';

interface JsonViewProps {
  messages: ChatMessage[];
}

export function JsonView({ messages }: JsonViewProps) {
  return (
    <pre style={{ whiteSpace: 'pre-wrap', maxHeight: '500px', overflowY: 'auto' }}>
      {JSON.stringify(messages, null, 2)}
    </pre>
  );
}