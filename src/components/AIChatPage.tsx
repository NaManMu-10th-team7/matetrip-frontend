import { useState, useEffect } from 'react';
import { Search, Plus, Send } from 'lucide-react';
import { Button } from './ui/button';
import client from '../api/client';
import { type Post } from '../types/post';
import { WorkspaceCard } from './WorkspaceCard';

export function AIChatPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'trips'>('all');
  const [chatMessage, setChatMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 채팅 목록 샘플 데이터
  const chatList = [
    { id: '1', title: 'New chat', isActive: true },
    { id: '2', title: '여행 계획 상담', isActive: false },
    { id: '3', title: 'asd', isActive: false },
  ];

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      try {
        const response = await client.get<Post[]>('/posts');
        const sortedPosts = response.data.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setPosts(sortedPosts.slice(0, 8)); // 최대 8개만 표시
      } catch (error) {
        console.error('Failed to fetch posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      // TODO: 백엔드 연동 시 메시지 전송 로직 추가
      console.log('Message sent:', chatMessage);
      setChatMessage('');
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* 왼쪽: 채팅 사이드바 + 대화 영역 */}
      <div className="w-[400px] border-r border-gray-200 flex flex-col">
        {/* 채팅 헤더 */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Chats
              <span className="text-sm font-normal text-gray-500">
                {chatList.length}
              </span>
            </h2>
            <Button className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-full text-sm">
              <Plus className="w-4 h-4 mr-1" />
              New chat
            </Button>
          </div>

          {/* 검색창 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search chat titles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-300"
            />
          </div>

          {/* 탭 */}
          <div className="flex gap-4 mt-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-2 text-sm font-medium ${
                activeTab === 'all'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-2 text-sm font-medium ${
                activeTab === 'trips'
                  ? 'text-gray-900 border-b-2 border-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Trips
            </button>
          </div>
        </div>

        {/* 채팅 목록 */}
        <div className="flex-1 overflow-y-auto">
          {chatList.map((chat) => (
            <button
              key={chat.id}
              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                chat.isActive ? 'bg-gray-100' : ''
              }`}
            >
              <p className="text-sm font-medium text-gray-900">{chat.title}</p>
            </button>
          ))}
        </div>

        {/* 대화 입력창 */}
        <div className="border-t border-gray-200 p-4">
          <div className="bg-blue-50 rounded-lg p-4 mb-3">
            <p className="text-sm text-gray-700 mb-2">안녕하세요! 👋</p>
            <p className="text-sm text-gray-600">
              여행이나 투어에 관한 어떤 정보라도 물어보세요. AI가 맞춤형 추천을 도와드릴게요!
            </p>
          </div>
          <form onSubmit={handleSendMessage} className="relative">
            <input
              type="text"
              placeholder="Ask anything..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Send className="w-5 h-5 text-gray-600" />
            </button>
          </form>
          <p className="text-xs text-gray-500 mt-2 text-center">
            AI can make mistakes. Check important info.
          </p>
        </div>
      </div>

      {/* 오른쪽: 여행 추천 콘텐츠 */}
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">For you</h2>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Explore
              </button>
            </div>
            <p className="text-gray-600">AI 추천 여행지와 동행을 만나보세요</p>
          </div>

          {/* Jump back in 섹션 */}
          <section className="mb-12">
            <h3 className="text-xl font-bold text-gray-900 mb-6">
              Jump back in
            </h3>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-64 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(0, 3).map((post) => (
                  <WorkspaceCard
                    key={post.id}
                    post={post}
                    onClick={() => {
                      // TODO: 게시글 상세 페이지로 이동
                      console.log('Post clicked:', post.id);
                    }}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Get inspired 섹션 */}
          <section>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Get inspired</h3>
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                See all
              </button>
            </div>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-64 bg-gray-200 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.slice(0, 3).map((post) => (
                  <WorkspaceCard
                    key={post.id}
                    post={post}
                    onClick={() => {
                      // TODO: 게시글 상세 페이지로 이동
                      console.log('Post clicked:', post.id);
                    }}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

