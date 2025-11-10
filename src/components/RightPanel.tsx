import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { MessageCircle, Bot } from 'lucide-react';
import { ChatPanel } from './ChatPanel';
import { type ChatMessage } from '../hooks/useChatSocket'; // ChatMessage 타입 import

interface RightPanelProps {
  isOpen: boolean;
  messages: ChatMessage[]; // messages prop 추가
  sendMessage: (message: string) => void; // sendMessage prop 추가
  isChatConnected: boolean; // isChatConnected prop 추가
}

export function RightPanel({
  isOpen,
  messages,
  sendMessage,
  isChatConnected,
}: RightPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col h-full">
        <TabsList className="w-full justify-around rounded-none bg-gray-50 border-b">
          <TabsTrigger value="chat" className="flex-1 gap-2">
            <MessageCircle className="w-4 h-4" />
            <span>채팅 with AI Agent</span>
          </TabsTrigger>
          {/* <TabsTrigger value="agent" className="flex-1 gap-2"> */}
          {/*   <Bot className="w-4 h-4" /> */}
          {/*   <span>AI Agent</span> */}
          {/* </TabsTrigger> */}
        </TabsList>
        <TabsContent value="chat" className="flex-1 overflow-auto m-0">
          <ChatPanel
            messages={messages}
            sendMessage={sendMessage}
            isChatConnected={isChatConnected}
          />
        </TabsContent>
        {/* <TabsContent value="agent" className="h-full m-0 p-4"> */}
        {/*   <div className="h-full flex items-center justify-center text-gray-500"> */}
        {/*     AI Agent (개발 예정) */}
        {/*   </div> */}
        {/* </TabsContent> */}
      </Tabs>
    </div>
  );
}
