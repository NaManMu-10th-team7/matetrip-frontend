import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { X, Upload, Trash2, Lock } from 'lucide-react';
import { useState } from 'react';
import { Badge } from './ui/badge';

interface EditProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: {
    id: string;
    name: string;
    email?: string;
    profileImage: string;
    intro: string; // shortBio 대신 intro 사용
    description: string; // detailedBio 대신 description 사용
    travelStyles: string[];
  } | null;
}

export function EditProfileModal({ open, onOpenChange, user }: EditProfileModalProps) {
  if (!user) return null;

  const [activeTab, setActiveTab] = useState('edit');
  const [profileImage, setProfileImage] = useState(user.profileImage);
  const [nickname, setNickname] = useState(user.name);
  const [shortBio, setShortBio] = useState(user.intro); // user.intro로 초기화
  const [detailedBio, setDetailedBio] = useState(user.description); // user.description으로 초기화
  const [selectedTravelStyles, setSelectedTravelStyles] = useState<string[]>(user.travelStyles);
  const [selectedTravelPreferences, setSelectedTravelPreferences] = useState<string[]>(['액티브', '문화탐방', '#미식가']);
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 사용 가능한 모든 여행 성향 태그
  const allTags = [
    '계획적인', '즉흥적인', '사진 중시', '맛집 탐방', '액티브',
    '힐링', '문화 체험', '쇼핑', '자연 친화', '도시 탐방',
    '야경 감상', '카페 투어', '역사 탐방', '로컬 체험', '예산 중시',
    '럭셔리', '새벽 일정', '여유로운', '사교적', '조용한'
  ];

  // 여행 스타일 태그
  const allStyleTags = [
    '가족 여행', '전구 여행', '혼자 여행', '로맨스 여행',
    '액티브', '문화탐방', '미식가', '쇼핑', '자연',
    '도시', '힐링', '모험', '사진', '예산중시'
  ];

  const handleImageUpload = () => {
    // S3 업로드 로직 (Mock)
    alert('이미지 업로드 기능은 백엔드 연동 후 구현됩니다.');
  };

  const handleImageDelete = () => {
    setProfileImage('https://images.unsplash.com/photo-1500648767791-00dcc994a43e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwZXJzb24l20포트레이트%7Cperson%20portrait%7Cface&ixlib=rb-4.1.0&q=80&w=1080');
  };

  const handleNicknameCheck = () => {
    // 중복 확인 로직 (Mock)
    alert('사용 가능한 닉네임입니다.');
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTravelStyles(selectedTravelStyles.filter(t => t !== tag));
  };

  const handleAddTag = (tag: string) => {
    if (!selectedTravelStyles.includes(tag)) {
      setSelectedTravelStyles([...selectedTravelStyles, tag]);
    }
  };

  const handleRemovePreference = (preference: string) => {
    setSelectedTravelPreferences(selectedTravelPreferences.filter(p => p !== preference));
  };

  const handleAddPreference = (preference: string) => {
    if (!selectedTravelPreferences.includes(preference)) {
      setSelectedTravelPreferences([...selectedTravelPreferences, preference]);
    }
  };

  const handleSaveProfile = () => {
    alert('프로필이 저장되었습니다.');
    onOpenChange(false);
  };

  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    alert('비밀번호가 변경되었습니다.');
    setIsPasswordModalOpen(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] p-0 overflow-hidden flex flex-col" aria-describedby={undefined}>
          {/* 헤더 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
            <DialogTitle className="text-gray-900">프로필 수정</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 탭 메뉴 */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'edit'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('edit')}
            >
              프로필 수정
            </button>
            <button
              className={`flex-1 py-3 text-center transition-colors ${
                activeTab === 'account'
                  ? 'border-b-2 border-gray-900 text-gray-900'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setActiveTab('account')}
            >
              계정 관리
            </button>
          </div>

          {/* 탭 컨텐츠 */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
            {/* 프로필 수정 탭 */}
            {activeTab === 'edit' && (
              <div className="space-y-6">
                {/* 프로필 사진 */}
                <div className="space-y-4">
                  <div className="flex items-start gap-6">
                    <div className="relative group">
                      <ImageWithFallback
                        src={profileImage}
                        alt="프로필 사진"
                        className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-200 transition-all group-hover:ring-gray-300"
                      />
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
                    </div>
                    <div className="flex-1 flex flex-col gap-3 pt-2">
                      <p className="text-gray-600 text-sm">프로필 사진을 업로드하거나 삭제할 수 있습니다.</p>
                      <div className="flex gap-3">
                        <Button size="default" variant="default" onClick={handleImageUpload} className="flex-1">
                          <Upload className="w-4 h-4 mr-2" />
                          이미지 업로드
                        </Button>
                        <Button size="default" variant="outline" onClick={handleImageDelete}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 닉네임 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">닉네임</Label>
                  <div className="flex gap-2">
                    <Input
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      placeholder="닉네임을 입력하세요"
                      className="flex-1"
                    />
                    <Button size="default" variant="outline" onClick={handleNicknameCheck}>
                      중복 확인
                    </Button>
                  </div>
                </div>

                {/* 한 줄 소개 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">한 줄 소개</Label>
                  <Input
                    value={shortBio}
                    onChange={(e) => setShortBio(e.target.value)}
                    placeholder="한 줄로 자신을 소개해주세요"
                    maxLength={50}
                  />
                  <p className="text-gray-500 text-xs text-right">{shortBio.length}/50</p>
                </div>

                {/* 상세 소개 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">상세 소개</Label>
                  <Textarea
                    value={detailedBio}
                    onChange={(e) => setDetailedBio(e.target.value)}
                    placeholder="자세한 소개를 작성해주세요"
                    rows={6}
                    maxLength={500}
                  />
                  <p className="text-gray-500 text-xs text-right">{detailedBio.length}/500</p>
                </div>

                {/* 여행 스타일 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">여행 스타일</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTravelPreferences.map((preference) => (
                      <Badge
                        key={preference}
                        variant="secondary"
                        className="bg-gray-900 text-white px-3 py-1.5 flex items-center gap-2 rounded-full"
                      >
                        #{preference}
                        <button
                          onClick={() => handleRemovePreference(preference)}
                          className="hover:text-gray-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsStyleModalOpen(true)}
                  >
                    + 추가
                  </Button>
                </div>

                {/* 여행 성향 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">여행 성향</Label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {selectedTravelStyles.map((style) => (
                      <Badge
                        key={style}
                        variant="secondary"
                        className="bg-gray-900 text-white px-3 py-1.5 flex items-center gap-2 rounded-full"
                      >
                        #{style}
                        <button
                          onClick={() => handleRemoveTag(style)}
                          className="hover:text-gray-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTagModalOpen(true)}
                  >
                    + 추가
                  </Button>
                </div>

                {/* 저장 버튼 */}
                <div className="pt-4 border-t">
                  <Button onClick={handleSaveProfile} className="w-full">
                    변경사항 저장
                  </Button>
                </div>
              </div>
            )}

            {/* 계정 관리 탭 */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                {/* 이메일 주소 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">이메일 주소</Label>
                  <Input
                    value={user.email || 'user@example.com'}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-gray-500 text-xs">이메일은 변경할 수 없습니다.</p>
                </div>

                {/* 비밀번호 변경 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">비밀번호</Label>
                  <Button
                    variant="outline"
                    onClick={() => setIsPasswordModalOpen(true)}
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    비밀번호 변경
                  </Button>
                </div>

                {/* 본인 인증 */}
                <div className="space-y-3">
                  <Label className="text-base font-bold">본인 인증</Label>
                  <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-lg flex items-center gap-2">
                    ✅ PASS 본인 인증 완료
                  </div>
                </div>

                {/* 회원 탈퇴 */}
                <div className="pt-8 border-t">
                  <button className="text-gray-400 hover:text-gray-600 text-sm underline">
                    회원 탈퇴
                  </button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* 태그 추가 모달 */}
      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogTitle className="text-gray-900 mb-4">여행 성향 태그 선택</DialogTitle>
          <div className="grid grid-cols-4 gap-3">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  handleAddTag(tag);
                  setIsTagModalOpen(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedTravelStyles.includes(tag)
                    ? 'bg-gray-900 text-white cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={selectedTravelStyles.includes(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 스타일 추가 모달 */}
      <Dialog open={isStyleModalOpen} onOpenChange={setIsStyleModalOpen}>
        <DialogContent className="max-w-2xl" aria-describedby={undefined}>
          <DialogTitle className="text-gray-900 mb-4">여행 선호도 태그 선택</DialogTitle>
          <div className="grid grid-cols-4 gap-3">
            {allStyleTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  handleAddPreference(tag);
                  setIsStyleModalOpen(false);
                }}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedTravelPreferences.includes(tag)
                    ? 'bg-gray-900 text-white cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                disabled={selectedTravelPreferences.includes(tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 변경 모달 */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md" aria-describedby={undefined}>
          <DialogTitle className="text-gray-900 mb-4">비밀번호 변경</DialogTitle>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>현재 비밀번호</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="현재 비밀번호를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>새 비밀번호</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>새 비밀번호 확인</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                취소
              </Button>
              <Button className="flex-1" onClick={handlePasswordChange}>
                변경
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
