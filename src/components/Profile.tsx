import { useEffect, useMemo, useState, useRef } from 'react';
import {
  Star,
  MapPin,
  Calendar,
  Award,
  Thermometer,
  Edit,
  Car,
  Cigarette,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ImageWithFallback } from './figma/ImageWithFallback';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  TRAVEL_STYLE_OPTIONS,
  //TRAVEL_STYLE_TYPES,
  type TravelStyleType,
} from '../constants/travelStyle';
import {
  GENDER_OPTIONS,
  //GENDER_TYPES,
  type GenderType,
} from '../constants/gender';
import { MBTI_OPTIONS, type MbtiType } from '../constants/mbti';
import {
  TENDENCY_OPTIONS,
  type TravelTendencyType,
} from '../constants/travelTendencyType';
import type { UpdateProfileDto } from '../types/updateprofiledto';
import { useAuthStore } from '../store/authStore';

interface Review {
  id: number;
  author: string;
  rating: number;
  comment: string;
  date: string;
  trip: string;
}

interface Trip {
  id: number;
  title: string;
  image: string;
  date: string;
  status: 'completed' | 'recruiting';
}

interface ProfileData {
  nickname: string;
  intro: string;
  description: string;
  gender: GenderType;
  age: number;
  //job: string;
  mbtiTypes: MbtiType;
  smoking: boolean;
  driverLicense: boolean;
  //mannerTemp: number;
  //totalTrips: number;
  //badges: string[];
  travelTendency: TravelTendencyType[];
  travelStyles: TravelStyleType[];
  reviews: Review[];
  trips: Trip[];
  profileImageId: string | null;
}

const EMPTY_PROFILE: ProfileData = {
  nickname: '',
  intro: '',
  description: '',
  gender: '남성',
  age: 28,
  mbtiTypes: 'ENFP',
  smoking: false,
  driverLicense: false,
  travelTendency: [],
  travelStyles: [],
  reviews: [],
  trips: [],
  profileImageId: null,
};

// const MOCK_PROFILE: ProfileData = {
//   name: '바다조아',
//   intro: '바다를 사랑하는 여행러 🌊',
//   description:
//     '안녕하세요! 전국 바다를 여행하며 힐링하는 것을 좋아합니다. 조용히 경치 감상하는 것도 좋아하고, 맛집 탐방도 즐깁니다.',
//   gender: GENDER_TYPES.FEMALE,
//   age: 28,
//   //job: '디자이너',
//   mbti: 'ENFP',
//   //smoking: false,
//   //driverLicense: true,
//   //mannerTemp: 37.8,
//   // totalTrips: 12,
//   //badges: ['인증 회원', '맛집 헌터', '사진 작가'],
//   travelStyle: [
//     TRAVEL_STYLE_TYPES.RELAXED,
//     TRAVEL_STYLE_TYPES.FOODIE,
//     TRAVEL_STYLE_TYPES.NATURE,
//     TRAVEL_STYLE_TYPES.CULTURAL,
//   ],
//   reviews: [
//     {
//       id: 1,
//       author: '여행러버',
//       rating: 5,
//       comment:
//         '정말 좋은 분이었어요! 배려심도 많으시고 여행 계획도 꼼꼼하게 세우셔서 편했습니다.',
//       date: '2025.10.15',
//       trip: '제주도 힐링 여행',
//     },
//     {
//       id: 2,
//       author: '산악인',
//       rating: 5,
//       comment:
//         '시간 약속 잘 지키시고 매너가 좋으신 분입니다. 또 같이 여행하고 싶어요!',
//       date: '2025.09.20',
//       trip: '부산 바다 여행',
//     },
//     {
//       id: 3,
//       author: '도시탐험가',
//       rating: 4,
//       comment: '좋은 추억 만들어주셔서 감사합니다. 사진도 예쁘게 찍어주셨어요!',
//       date: '2025.08.10',
//       trip: '강릉 해변 여행',
//     },
//   ],
//   trips: [
//     {
//       id: 1,
//       title: '부산 해운대 바다 여행',
//       image:
//         'https://images.unsplash.com/photo-1665231342828-229205867d94?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiZWFjaCUyMHBhcmFkaXNlfGVufDF8fHx8MTc2MTg4Mzg2MHww&ixlib=rb-4.1.0&q=80&w=1080',
//       date: '2025.10',
//       status: 'completed' as const,
//     },
//     {
//       id: 2,
//       title: '제주도 힐링 여행',
//       image:
//         'https://images.unsplash.com/photo-1614088459293-5669fadc3448?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmF2ZWwlMjBkZXN0aW5hdGlvbnxlbnwxfHx8fDE3NjE4NjQwNzB8MA&ixlib=rb-4.1.0&q=80&w=1080',
//       date: '2025.11',
//       status: 'recruiting' as const,
//     },
//   ],
// };

interface ProfileProps {
  isLoggedIn: boolean;
  onViewPost: (postId: string) => void;
  userId?: number;
}

export function Profile({
  isLoggedIn,
  onViewPost: _onViewPost,
  userId,
}: ProfileProps) {
  // TODO: 백엔드 연동 시 userId로 사용자 프로필 데이터 가져오기
  // const profile = userId
  //   ? await fetchUserProfile(userId)  // 특정 사용자 프로필 조회
  //   : MOCK_PROFILE;  // 본인 프로필 (userId 없을 때)
  const { user } = useAuthStore();
  const canEditProfile =
    userId == null || (user?.userId != null && String(userId) === user.userId);
  const [profile, setProfile] = useState<ProfileData>(EMPTY_PROFILE);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<ProfileData>(profile);

  //draft: 수정중인 프로필 , profile: 프로필
  const viewData = useMemo(
    () => (isEditing ? draft : profile),
    [isEditing, draft, profile]
  );

  const handleInput =
    // 제네릭 K는 ProfileData 속성만 허용 → 잘못된 키를 컴파일 단계에서 차단
    <K extends keyof ProfileData>(key: K) =>
      (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        // 텍스트 입력인지 체크박스인지에 따라 값 추출 방법이 달라짐
        const value =
          event.target.type === 'checkbox'
            ? (event.target as HTMLInputElement).checked // checkbox → boolean
            : event.target.value; // 나머지 → string
        //prev는 그 순간의 이전 state 값을 React가 넣어 주는 파라미터
        setDraft((prev) => ({
          ...prev,
          [key]:
            // 나이/여행횟수는 숫자 형태로 들고 있어야 하므로 변환
            key === 'age'
              ? Number(value)
              : // 나머지는 ProfileData에서 정해둔 타입으로 캐스팅
                (value as ProfileData[K]),
        }));
      };
  //Select에 한 번만 묶여 있으니 항상 하나만 선택
  const handleGenderChange = (value: GenderType) => {
    setDraft((prev) => ({ ...prev, gender: value }));
  };
  //Select에 한 번만 묶여 있으니 항상 하나만 선택
  const handleMbtiChange = (value: MbtiType) => {
    setDraft((prev) => ({ ...prev, mbtiTypes: value }));
  };

  //여행 성향 버튼을 토글할때 쓰는 함수 draft의 travelStyle 배열을 직접 편집 이미 있으면 제거하고, 없으면 추가
  const handleTravelStyleToggle = (style: TravelStyleType) => {
    setDraft((prev) => {
      const alreadySelected = prev.travelStyles.includes(style);
      return {
        ...prev,
        travelStyles: alreadySelected
          ? prev.travelStyles.filter((item) => item !== style)
          : [...prev.travelStyles, style],
      };
    });
  };

  const handleTravelTendencyToggle = (tendency: TravelTendencyType) => {
    setDraft((prev) => {
      const alreadySelected = prev.travelTendency.includes(tendency);
      return {
        ...prev,
        travelTendency: alreadySelected
          ? prev.travelTendency.filter((item) => item !== tendency)
          : [...prev.travelTendency, tendency],
      };
    });
  };
  const mapDtoToProfile = (
    dto: UpdateProfileDto,
    prev: ProfileData
  ): ProfileData => ({
    ...prev,
    nickname: dto.nickname ?? prev.nickname,
    intro: dto.intro ?? prev.intro,
    description: dto.description ?? prev.description,
    gender: dto.gender ?? prev.gender,
    mbtiTypes: dto.mbtiTypes ?? prev.mbtiTypes,
    travelTendency: dto.travelTendency ?? prev.travelTendency,
    travelStyles: dto.travelStyles ?? prev.travelStyles,
    profileImageId: dto.profileImageId ?? prev.profileImageId,
  });

  //----초기 GET 함수 -----
  useEffect(() => {
    let isMounted = true;

    const fetchProfileData = async () => {
      try {
        const res = await fetch('http://localhost:3000/profile/my', {
          method: 'GET',
          credentials: 'include',
        });
        if (!res.ok) throw new Error(`...`);

        const data: UpdateProfileDto = await res.json();
        console.log(data);
        if (!isMounted) return;

        setProfile((prev) => {
          const next = mapDtoToProfile(data, prev);
          setDraft(next);
          return next;
        });
      } catch (error) {
        console.error('프로필 정보 로딩 중 에러:', error);
      }
    };

    fetchProfileData();
    return () => {
      isMounted = false;
    };
  }, []);

  // ---------사진쪽 변수 명들 --------------------

  const fileInputRef = useRef<HTMLInputElement>(null);
  // url 을 기억함: 마지막 정리 변수
  const profileImagePreviewRef = useRef<string | null>(null);

  // 상태 선언
  //profileImagePreview는 blob: 미리보기를 위한 state.
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [pendingProfileImageFile, setPendingProfileImageFile] =
    useState<File | null>(null);
  // 받은 url 을 담아둠
  const [profileImageRemoteUrl, setProfileImageRemoteUrl] = useState<
    string | null
  >(null);

  //이전 URL을 revoke하고 새 상태를 세팅
  const updateProfileImagePreview = (nextUrl: string | null) => {
    //사진 보이게 하기
    if (
      profileImagePreviewRef.current &&
      profileImagePreviewRef.current !== nextUrl
    ) {
      //이전 URL을 정리
      URL.revokeObjectURL(profileImagePreviewRef.current);
    }
    // 새로운 URL을 반영한다
    profileImagePreviewRef.current = nextUrl;
    setProfileImagePreview(nextUrl);
  };

  // presigned GET URL 받아오기 --- ##파일 가져오기
  useEffect(() => {
    if (!viewData.profileImageId) {
      setProfileImageRemoteUrl(null);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `http://localhost:3000/binary-content/${viewData.profileImageId}/presigned-url`,
          { credentials: 'include' }
        );
        if (!res.ok) throw new Error('presigned GET 요청 실패');
        const { url } = await res.json();
        if (!cancelled) setProfileImageRemoteUrl(url);
      } catch (err) {
        console.error('프로필 이미지 URL 불러오기 실패:', err);
        if (!cancelled) setProfileImageRemoteUrl(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [viewData.profileImageId]);

  // 3) 최종적으로 div에 넘길 주소 계산
  //?? : 왼쪽 값이 null이나 undefined가 아니면 그대로 쓰고, 그렇지 않으면 오른쪽 값을 쓰는 식
  const profileImageUrl = profileImagePreview ?? profileImageRemoteUrl;

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  //url 만 빼와서 저장 -> 프로필 저장 후 db에 넣게
  const handleProfileImageSelected = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setPendingProfileImageFile(file);
    const objectUrl = URL.createObjectURL(file);
    updateProfileImagePreview(objectUrl);
    event.target.value = '';
  };

  //편집중
  const startEditing = () => {
    setDraft(profile);
    setIsEditing(true);
  };
  //편집 취소
  const cancelEditing = () => {
    setDraft(profile);
    setIsEditing(false);
    setPendingProfileImageFile(null);
    updateProfileImagePreview(null);
  };
  //편집 저장
  const saveProfile = async () => {
    let profileImageId = draft.profileImageId;
    // 먼저 사진부터 저장
    try {
      if (pendingProfileImageFile) {
        const file = pendingProfileImageFile;
        const safeFileType = file.type || 'application/octet-stream';

        const presignResponse = await fetch(
          'http://localhost:3000/binary-content/presigned-url',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              fileType: safeFileType,
            }),
          }
        );
        if (!presignResponse.ok) throw new Error('presigned-url 요청 실패');
        const { uploadUrl, binaryContentId } = await presignResponse.json();

        const s3Response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
        });
        if (!s3Response.ok) throw new Error('S3 업로드 실패');
        profileImageId = binaryContentId;
      }
      // 그 뒤에 내용 저장
      const payload: UpdateProfileDto = {
        nickname: draft.nickname,
        description: draft.description,
        intro: draft.intro,
        gender: draft.gender,
        mbtiTypes: draft.mbtiTypes,
        travelStyles: draft.travelStyles,
        travelTendency: draft.travelTendency,
        profileImageId,
      };

      const res = await fetch('http://localhost:3000/profile/my', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const detail = await res.text();
        console.error(res.status, detail);
        throw new Error('업데이트 실패');
      }

      const updatedData: UpdateProfileDto = await res.json();
      setProfile((prev) => {
        const next = mapDtoToProfile(updatedData, prev);
        setDraft(next);
        return next;
      });
      setPendingProfileImageFile(null);
      updateProfileImagePreview(null);

      setIsEditing(false);
    } catch (err) {
      console.error('PATCH 실패:', err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-shrink-0">
            <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500">
              {profileImageUrl ? (
                <ImageWithFallback
                  src={profileImageUrl}
                  alt="Profile"
                  className="w-full h-full object-cover object-center"
                />
              ) : null}
            </div>
            {canEditProfile && isEditing && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageSelected}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={openFilePicker}
                >
                  프로필 사진 변경
                </Button>
              </>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div className="max-w-xl">
                <h2 className="text-gray-900 mb-2">{viewData.nickname}</h2>

                {isEditing ? (
                  <textarea
                    className="w-full min-h-[72px] resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                    value={draft.intro}
                    onChange={handleInput('intro')}
                  />
                ) : (
                  <p className="text-gray-600 mb-3">{viewData.intro}</p>
                )}

                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-gray-900 mb-3">여행 성향</h4>
                  {canEditProfile && isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {TENDENCY_OPTIONS.map(({ value, label }) => {
                        const selected = draft.travelTendency.includes(value);
                        return (
                          <button
                            type="button"
                            key={value}
                            onClick={() => handleTravelTendencyToggle(value)}
                            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                              selected
                                ? 'border-blue-600 bg-blue-50 text-blue-700'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {viewData.travelTendency.length > 0 ? (
                        viewData.travelTendency.map((tendency) => {
                          const label =
                            TENDENCY_OPTIONS.find(
                              (option) => option.value === tendency
                            )?.label ?? tendency;
                          return (
                            <Badge
                              key={tendency}
                              variant="outline"
                              className="text-xs"
                            >
                              {label}
                            </Badge>
                          );
                        })
                      ) : (
                        <span className="text-xs text-gray-400">
                          등록된 여행 성향이 없습니다
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* <div className="flex flex-wrap gap-2">
                  {viewData.badges.map((badge) => (
                    <Badge key={badge} variant="secondary" className="gap-1">
                      <Award className="w-3 h-3" />
                      {badge}
                    </Badge>
                  ))}
                </div> */}
              </div>
              {canEditProfile &&
                (isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={cancelEditing}>
                      취소
                    </Button>
                    <Button
                      onClick={saveProfile}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      저장
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={startEditing}
                  >
                    <Edit className="w-4 h-4" />
                    프로필 수정
                  </Button>
                ))}
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Thermometer className="w-4 h-4 text-blue-600" />
                  {/*<span className="text-blue-600">{viewData.mannerTemp}°C</span> */}
                  <span className="text-blue-600">37.5°C</span>
                </div>
                <div className="text-xs text-gray-600">매너온도</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <MapPin className="w-4 h-4 text-gray-900" />
                  {/* <span className="text-gray-900">{viewData.totalTrips}</span> */}
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

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-gray-900 mb-2">자기소개</h4>
          {canEditProfile && isEditing ? (
            <textarea
              className="w-full min-h-[140px] resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
              value={draft.description}
              onChange={handleInput('description')}
            />
          ) : (
            <p className="text-gray-600 whitespace-pre-line">
              {viewData.description}
            </p>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-gray-900 mb-4">상세 정보</h4>
          {canEditProfile && isEditing ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <label className="space-y-2 text-sm text-gray-700">
                <span>성별</span>
                <Select value={draft.gender} onValueChange={handleGenderChange}>
                  <SelectTrigger className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <SelectValue placeholder="성별을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="min-w-[var(--radix-select-trigger-width)] rounded-lg border border-gray-200 bg-white shadow-md">
                    {GENDER_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="space-y-2 text-sm text-gray-700">
                <span>MBTI</span>
                <Select
                  value={draft.mbtiTypes}
                  onValueChange={handleMbtiChange}
                >
                  <SelectTrigger className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100">
                    <SelectValue placeholder="MBTI를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg  bg-white px-3 text-sm">
                    {MBTI_OPTIONS.map(({ value, label }) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-2 text-sm text-gray-700">
                <span>직업</span>
                <span className="w-full rounded-lg  px-3 py-2 ">디자이너</span>
              </label>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.driverLicense}
                  onChange={handleInput('driverLicense')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>운전면허 있음</span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={draft.smoking}
                  onChange={handleInput('smoking')}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span>흡연자</span>
              </label>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">성별</div>
                  <div className="text-gray-900">{viewData.gender}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">나이</div>
                  <div className="text-gray-900">{viewData.age}세</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">MBTI</div>
                  <div className="text-gray-900">{viewData.mbtiTypes}</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 mb-1">직업</div>
                  <div className="text-gray-900">디자이너</div>
                </div>
              </div>

              <div className="flex gap-4 mt-4">
                <div className="flex items-center gap-2 text-gray-700">
                  <Car className="w-4 h-4" />
                  <span className="text-sm">
                    운전면허: {viewData.driverLicense ? '있음' : '없음'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Cigarette className="w-4 h-4" />
                  <span className="text-sm">
                    흡연: {viewData.smoking ? '흡연' : '비흡연'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 pt-6 border-t">
          <h4 className="text-gray-900 mb-3">여행 스타일</h4>
          {canEditProfile && isEditing ? (
            //전자 : 성향을 선택/토글하는 UI 후자: 선택된 성향들을 배지로 그냥 보여주는 UI
            <div className="flex flex-wrap gap-2">
              {TRAVEL_STYLE_OPTIONS.map(({ value, label }) => {
                const selected = draft.travelStyles.includes(value);
                return (
                  <button
                    type="button"
                    key={value}
                    onClick={() => handleTravelStyleToggle(value)}
                    className={`rounded-full border px-4 py-1 text-sm transition-colors ${
                      selected
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* //style 은 map을 호출할때 map이 순회하면서 넘겨주는 현재 요소에 붙인 이름 */}
              {viewData.travelStyles.map((style) => {
                const label =
                  TRAVEL_STYLE_OPTIONS.find((option) => option.value === style)
                    ?.label ?? style;
                return (
                  <Badge key={style} variant="outline" className="text-sm">
                    {label}
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      </div>

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

        <TabsContent value="trips">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewData.trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onViewPost(trip.id)}
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

        <TabsContent value="posts">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewData.trips
              .filter((t) => t.status === 'recruiting')
              .map((trip) => (
                <div
                  key={trip.id}
                  className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => onViewPost(trip.id)}
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

        <TabsContent value="reviews">
          <div className="space-y-4">
            {viewData.reviews.map((review) => (
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

// select 설명
// Select : 루트 컨테이너. 현재 선택 값, onValueChange 같은 핵심 props는 여기 전달해요.
// SelectTrigger : 화면에 보이는 버튼 영역. 클릭하면 아래 SelectContent가 열립니다. 안쪽의 SelectValue가 실제 표시 텍스트를 렌더링하죠.
// SelectValue : 선택된 값(또는 placeholder)을 보여 주는 자리.
// SelectContent : 드롭다운 팝업 영역. 메뉴 항목들을 이 안에 넣습니다.
// SelectItem : 각각의 항목. value 값이 선택되면 상위 Select로 전달되어 state가 갱신됩니다.
