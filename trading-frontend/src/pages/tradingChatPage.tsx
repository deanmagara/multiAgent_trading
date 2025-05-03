import { useChatbot } from '../services/chatbot';
import { ChatWindow } from '../components/chatWindow';

export function TradingChatPage() {
  const { messages, handleSend } = useChatbot();
  
  return (
    <div>
      <h2>Trading Assistant</h2>
      <ChatWindow messages={messages} onSend={handleSend} />
    </div>
  );
}