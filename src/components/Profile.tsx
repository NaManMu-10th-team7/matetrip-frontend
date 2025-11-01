import {
  Star,
  MapPin,
  Calendar,
  Users,
  Award,
  Thermometer,
  Edit,
  Briefcase,
  Car,
  Cigarette,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Separator } from './ui/separator';

const MOCK_PROFILE = {
  name: '바다조아',
  bio: '바다를 사랑하는 여행러 🌊',
  description:
    '안녕하세요! 전국 바다를 여행하며 힐링하는 것을 좋아합니다. 조용히 경치 감상하는 것도 좋아하고, 맛집 탐방도 즐깁니다.',
  gender: '여성',
  age: 28,
  job: '디자이너',
  mbti: 'ENFP',
  smoking: false,
  driverLicense: true,
  mannerTemp: 37.8,
  totalTrips: 12,
  badges: ['인증 회원', '맛집 헌터', '사진 작가'],
  travelStyle: ['힐링', '맛집투어', '사진', '조용한 여행'],
  reviews: [
    {
      id: 1,
      author: '여행러버',
      rating: 5,
      comment:
        '정말 좋은 분이었어요! 배려심도 많으시고 여행 계획도 꼼꼼하게 세우셔서 편했습니다.',
      date: '2025.10.15',
      trip: '제주도 힐링 여행',
    },
    {
      id: 2,
      author: '산악인',
      rating: 5,
      comment:
        '시간 약속 잘 지키시고 매너가 좋으신 분입니다. 또 같이 여행하고 싶어요!',
      date: '2025.09.20',
      trip: '부산 바다 여행',
    },
    {
      id: 3,
      author: '도시탐험가',
      rating: 4,
      comment: '좋은 추억 만들어주셔서 감사합니다. 사진도 예쁘게 찍어주셨어요!',
      date: '2025.08.10',
      trip: '강릉 해변 여행',
    },
  ],
  trips: [
    {
      id: 1,
      title: '부산 해운대 바다 여행',
      image:
        'https://images.unsplash.com/photo-1665231342828-229205867d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHBhcmFkaXNlfGVufDF8fHx8MTc2MTg4Mzg2MHww&ixlib=rb-4.1.0&q=80&w=1080',
      date: '2025.10',
      status: 'completed',
    },
    {
      id: 2,
      title: '제주도 힐링 여행',
      image:
        'https://images.unsplash.com/photo-1614088459293-5669fadc3448?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbnxlbnwxfHx8fDE3NjE4NjQwNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
      date: '2025.11',
      status: 'recruiting',
    },
  ],
};

interface ProfileProps {
  isLoggedIn: boolean;
  onViewPost: (postId: number) => void;
}

export function Profile({ isLoggedIn, onViewPost }: ProfileProps) {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Avatar */}
          <div className="flex-shrink-0">
            <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-white shadow-lg" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-gray-900 mb-2">{MOCK_PROFILE.name}</h2>
                <p className="text-gray-600 mb-3">{MOCK_PROFILE.bio}</p>
                <div className="flex flex-wrap gap-2">
                  {MOCK_PROFILE.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="gap-1">
                      <Award className="w-3 h-3" />
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button variant="outline" className="gap-2">
                <Edit className="w-4 h-4" />
                프로필 수정
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-600">
                    {MOCK_PROFILE.mannerTemp}°C
                  </span>
                </div>
                <div className="text-xs text-gray-600">매너온도</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-gray-900" />
                  <span className="text-gray-900">
                    {MOCK_PROFILE.totalTrips}
                  </span>
                </div>
                <div className="text-xs text-gray-600">여행 횟수</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-gray-900">4.8</span>
                </div>
                <div className="text-xs text-gray-600">평균 평점</div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-gray-900 mb-2">자기소개</h4>
          <p className="text-gray-600">{MOCK_PROFILE.description}</p>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-gray-900 mb-4">상세 정보</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">성별</div>
              <div className="text-gray-900">{MOCK_PROFILE.gender}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">나이</div>
              <div className="text-gray-900">{MOCK_PROFILE.age}세</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">MBTI</div>
              <div className="text-gray-900">{MOCK_PROFILE.mbti}</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-500 mb-1">직업</div>
              <div className="text-gray-900">{MOCK_PROFILE.job}</div>
            </div>
          </div>

          <div className="flex gap-4 mt-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Car className="w-4 h-4" />
              <span className="text-sm">
                운전면허: {MOCK_PROFILE.driverLicense ? '있음' : '없음'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Cigarette className="w-4 h-4" />
              <span className="text-sm">
                흡연: {MOCK_PROFILE.smoking ? '흡연' : '비흡연'}
              </span>
            </div>
          </div>
        </div>

        {/* Travel Style */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-gray-900 mb-3">여행 스타일</h4>
          <div className="flex flex-wrap gap-2">
            {MOCK_PROFILE.travelStyle.map((style) => (
              <Badge key={style} variant="outline" className="text-sm">
                {style}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="trips" className="w-full">
        <TabsList className="w-full bg-white border rounded-lg mb-6">
          <TabsTrigger value="trips" className="flex-1">
            여행 기록
          </TabsTrigger>
          <TabsTrigger value="posts" className="flex-1">
            동행 찾기
          </TabsTrigger>
          <TabsTrigger value="reviews" className="flex-1">
            받은 리뷰
          </TabsTrigger>
          {isLoggedIn && (
            <TabsTrigger value="settings" className="flex-1">
              내 정보
            </TabsTrigger>
          )}
        </TabsList>

        {/* Trip History */}
        <TabsContent value="trips">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PROFILE.trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="relative h-48">
                  <ImageWithFallback
                    src={trip.image}
                    alt={trip.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge
                    className={`absolute top-3 right-3 ${
                      trip.status === 'completed'
                        ? 'bg-gray-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {trip.status === 'completed' ? '완료' : '모집중'}
                  </Badge>
                </div>
                <div className="p-4">
                  <h4 className="text-gray-900 mb-2">{trip.title}</h4>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>{trip.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Posts - 동행 찾기 */}
        <TabsContent value="posts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {MOCK_PROFILE.trips
              .filter((t) => t.status === 'recruiting')
              .map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="relative h-48">
                    <ImageWithFallback
                      src={trip.image}
                      alt={trip.title}
                      className="w-full h-full object-cover"
                    />
                    <Badge className="absolute top-3 right-3 bg-blue-600">
                      모집중
                    </Badge>
                  </div>
                  <div className="p-4">
                    <h4 className="text-gray-900 mb-2">{trip.title}</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>{trip.date}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <div className="space-y-4">
            {MOCK_PROFILE.reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm border p-6"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full" />
                    <div>
                      <div className="text-gray-900">{review.author}</div>
                      <div className="text-sm text-gray-600">{review.date}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[...Array(review.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{review.comment}</p>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{review.trip}</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Settings - 내 정보 */}
        {isLoggedIn && (
          <TabsContent value="settings">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-gray-900 mb-6">비밀번호 변경</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    새 비밀번호
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  비밀번호 변경
                </Button>
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
