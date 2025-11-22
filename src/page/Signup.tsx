import React, { useState } from 'react';
import {
  MapPin,
  Tent,
  Heart,
  Camera,
  Car,
  Sparkles,
  User,
  Utensils,
  ArrowRight,
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  Pen,
  FileText,
} from 'lucide-react';
import axios from 'axios';
import client from '../api/client';
import { MBTI_TYPES } from '../constants/mbti';
import {
  TRAVEL_STYLE_OPTIONS,
  type TravelStyleType,
} from '../constants/travelStyle';
import {
  TRAVEL_TENDENCY_TYPE,
  type TravelTendencyType,
} from '../constants/travelTendencyType';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';

// --- 타입 정의 ---
type TravelTendencyKey = keyof typeof TRAVEL_TENDENCY_TYPE;

interface CategoryItem {
  id: string;
  title: string;
  icon: React.ElementType;
  question: string;
  items: TravelTendencyType[];
}

interface SignupProps {
  onSignup: () => void;
  onLoginClick: () => void;
}

// --- 데이터 정의 ---
const CATEGORIZED_KEYWORDS: CategoryItem[] = [
  {
    id: 'place',
    title: '장소',
    icon: MapPin,
    question: '어떤 여행지를 좋아하시나요?',
    items: [
      '도시',
      '시골',
      '전통도시',
      '휴양도시',
      '항구도시',
      '전통시장',
      '야시장',
      '바다',
      '섬',
      '산',
      '계곡',
      '호수',
    ],
  },
  {
    id: 'activity',
    title: '활동',
    icon: Tent,
    question: '어떤 액티비티를 즐기고 싶으신가요?',
    items: [
      '트레킹',
      '등산',
      '캠핑',
      '자전거',
      '서핑',
      '스노클링',
      '프리다이빙',
      '낚시',
      '스키',
      '스노보드',
      '골프',
      '러닝',
    ],
  },
  {
    id: 'food',
    title: '음식',
    icon: Utensils,
    question: '여행 중 식사는 어떻게 하시겠어요?',
    items: [
      '길거리음식',
      '로컬레스토랑',
      '맛집탐방',
      '카페디저트',
      '비건필요',
      '돼지고기비선호',
      '해산물비선호',
      '매운맛선호',
      '순한맛선호',
      '해산물선호',
      '육류선호',
    ],
  },
  {
    id: 'culture',
    title: '문화',
    icon: Camera,
    question: '관심 있는 문화 생활이 있으신가요?',
    items: [
      '건축물탐방',
      '야경감상',
      '박물관',
      '미술관',
      '유적지탐방',
      '공연뮤지컬',
      '콘서트',
      '스포츠관람',
      '현지축제',
      '놀이공원',
      '아쿠아리움',
      '동물원',
    ],
  },
  {
    id: 'stay',
    title: '숙소',
    icon: Heart,
    question: '편안한 밤을 위해 어디서 머물까요?',
    items: [
      '호텔',
      '리조트',
      '게스트하우스',
      '모텔',
      '펜션',
      '에어비앤비',
      '글램핑',
      '풀빌라',
    ],
  },
  {
    id: 'transport',
    title: '이동/방식',
    icon: Car,
    question: '어떤 이동 수단과 여행 방식을 선호하시나요?',
    items: [
      '렌터카',
      '캠핑카',
      '대중교통',
      '기차여행',
      '오토바이여행',
      '배낭여행',
      '호캉스',
      '운전가능',
    ],
  },
  {
    id: 'etc',
    title: '기타',
    icon: User,
    question: '기타 선호사항이 있나요?',
    items: [
      '소수인원선호',
      '조용한동행선호',
      '수다떠는동행선호',
      '조용한휴식',
      '빡빡한일정',
      '여유로운일정',
      '숙소우선',
      '음식우선',
      '사진촬영',
      '풍경촬영',
      '비흡연',
      '흡연',
      '비음주',
      '음주',
    ],
  },
];

export function Signup({ onSignup, onLoginClick }: SignupProps) {
  const [step, setStep] = useState<number>(1);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('place');
  const [styleError, setStyleError] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    gender: '',
    phone: '',
    mbti: '',
    travelStyles: new Set<TravelStyleType>(),
    tendency: new Set<TravelTendencyType>(),
    intro: '',
    description: '',
  });

  //const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTravelStyle = (style: TravelStyleType) => {
    setFormData((prev) => {
      const newSet = new Set(prev.travelStyles);
      if (newSet.has(style)) {
        newSet.delete(style);
        setStyleError('');
      } else {
        if (newSet.size >= 3) {
          setStyleError('여행 스타일은 3개까지 선택할 수 있습니다.');
          setTimeout(() => setStyleError(''), 3000);
          return prev;
        }
        newSet.add(style);
      }
      return { ...prev, travelStyles: newSet };
    });
  };

  const toggleTravelTendency = (tendency: TravelTendencyType) => {
    setFormData((prev) => {
      const newSet = new Set(prev.tendency);
      if (newSet.has(tendency)) {
        newSet.delete(tendency);
      } else {
        newSet.add(tendency);
      }
      return { ...prev, tendency: newSet };
    });
  };

  const handleNextStep = () => {
    if (step === 2 && formData.travelStyles.size !== 3) {
      setStyleError('여행 스타일 3개를 선택해주세요.');
      setTimeout(() => setStyleError(''), 3000);
      return;
    }
    setStyleError('');
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      return;
    }

    try {
      const requestData = {
        email: formData.email,
        password: formData.password,
        profile: {
          nickname: formData.nickname,
          gender: formData.gender,
          mbtiTypes: formData.mbti,
          travelStyles: formData.travelStyles,
          tendency: formData.tendency,
          intro: formData.intro,
          description: formData.description,
        },
      };
      // db쌓기(임베딩 까지)
      const signupResponse = await client.post('/auth/signup', requestData);

      // 회원가입 성공(201 Created) 후, 바로 로그인 처리
      if (signupResponse.status === 201) {
        const loginResponse = await client.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });

        if (loginResponse.status === 200) {
          // // // 📌메인페이지 가기 전에 임베딩 처리 하기 (matching-profile 에 내용넣기)

          // const userId =
          //   signupResponse.data?.id || loginResponse.data?.user?.id;

          // if (userId) {
          //   const syncPayload = {
          //     //userId,
          //     description: formData.description || '',
          //     // 필요하면 travelStyles / tendency도 추가
          //   };
          //   await client.post('/matching/profile/embedding', syncPayload);
          //   console.log('임베딩 완료!');
          // } else {
          //   throw new Error('Unable to determine userId after signup/login');
          // }

          // summary 랑 embedding 호출
          // 로그인 성공 시 성공 모달을 띄웁니다.
          //setShowSuccessModal(true);
          onSignup();
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // const apiError = error.response.data as ApiErrorResponse;
        // setErrorMessage(apiError.message || '회원가입에 실패했습니다.');
      } else {
        // setErrorMessage('알 수 없는 오류가 발생했습니다.');
      }
      console.error('Signup error:', error);
    }
  };

  // 타이틀 및 설명 텍스트 동적 생성
  const getStepHeader = () => {
    switch (step) {
      case 1:
        return { title: '회원가입', desc: '기본 정보를 입력해주세요.' };
      case 2:
        return {
          title: '회원가입',
          desc: '여행 취향을 분석하여 딱 맞는 친구를 찾아드릴게요.',
        };
      case 3:
        return {
          title: '회원가입',
          desc: '프로필을 완성하고 자신을 소개해 보세요.',
        };
      default:
        return { title: '가입 완료', desc: '' };
    }
  };

  const { title, desc } = getStepHeader();

  const currentTabInfo = CATEGORIZED_KEYWORDS.find(
    (tab) => tab.id === activeTab
  );
  const numRows = currentTabInfo
    ? Math.ceil(currentTabInfo.items.length / 2)
    : 1;

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-lg md:max-w-md">
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative min-h-[560px] flex flex-col">
          {step > 1 && step < 4 && (
            <Button
              variant="ghost"
              onClick={handlePrevStep}
              className="absolute top-8 left-6 text-slate-400 hover:text-slate-800 flex items-center gap-1 text-sm font-bold transition-colors z-10 h-auto p-0"
            >
              <ArrowLeft className="w-4 h-4" />
              이전
            </Button>
          )}

          {step < 4 && (
            <div className="px-5 md:px-6 pt-8 pb-3 bg-white flex flex-col items-center text-center relative">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-blue-200">
                  <MapPin className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  MateTrip
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
                {title}
              </h1>
              <p className="text-slate-500 text-sm mt-1 mb-6">{desc}</p>

              <div className="w-full max-w-xs flex items-center justify-center gap-3">
                <div className="text-blue-600 font-bold text-base whitespace-nowrap">
                  Step {step}
                </div>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${(step / 3) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}

          {step < 4 && (
            <div className="w-full px-6 my-2">
              <div className="border-t border-dashed border-slate-100"></div>
            </div>
          )}

          {step === 1 && (
            <div className="flex-1 px-5 md:px-6 py-5 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-5 max-w-xl mx-auto w-full">
                <div>
                  <Label htmlFor="email" className="font-semibold">
                    이메일
                  </Label>
                  <div className="relative mt-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="font-semibold">
                    비밀번호
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="8자 이상 입력해주세요"
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="font-semibold">
                    비밀번호 확인
                  </Label>
                  <div className="relative mt-2">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="비밀번호를 다시 입력해주세요"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange('confirmPassword', e.target.value)
                      }
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="nickname" className="font-semibold">
                    닉네임
                  </Label>
                  <div className="relative mt-2">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="nickname"
                      type="text"
                      placeholder="사용할 닉네임을 입력해주세요"
                      value={formData.nickname}
                      onChange={(e) =>
                        handleInputChange('nickname', e.target.value)
                      }
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label className="font-semibold">성별</Label>
                  <div className="flex gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Input
                        id="male"
                        type="radio"
                        value="남성"
                        name="gender"
                        checked={formData.gender === '남성'}
                        onChange={(e) =>
                          handleInputChange('gender', e.target.value)
                        }
                        className="h-4 w-4 accent-blue-600"
                      />
                      <Label
                        htmlFor="male"
                        className="cursor-pointer font-normal"
                      >
                        남성
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        id="female"
                        type="radio"
                        value="여성"
                        name="gender"
                        checked={formData.gender === '여성'}
                        onChange={(e) =>
                          handleInputChange('gender', e.target.value)
                        }
                        className="h-4 w-4 accent-blue-600"
                      />
                      <Label
                        htmlFor="female"
                        className="cursor-pointer font-normal"
                      >
                        여성
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 pb-3">
                <Button
                  onClick={handleNextStep}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 h-auto rounded-xl font-bold text-lg shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="px-5 md:px-6 py-5">
                <div className="flex flex-col gap-1 mb-5">
                  <div className="flex items-center justify-start gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Sparkles className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 text-left">
                      여행 스타일 (3개 선택)
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 py-1">
                    나를 가장 잘 표현하는 키워드를 3가지 골라주세요
                  </p>
                </div>

                <div className="flex flex-wrap justify-start gap-2.5">
                  {TRAVEL_STYLE_OPTIONS.map((style) => {
                    const isSelected = formData.travelStyles.has(style.value);
                    return (
                      <Button
                        key={style.value}
                        onClick={() => toggleTravelStyle(style.value)}
                        variant={isSelected ? 'default' : 'outline'}
                        className={`
                          px-3 py-1.5 h-auto rounded-md text-xs font-medium transition-all duration-200 border select-none
                          ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 '
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
                          }
                        `}
                      >
                        {style.label}
                      </Button>
                    );
                  })}
                </div>
                {styleError && (
                  <p className="text-xs text-rose-500 mt-2">{styleError}</p>
                )}
              </div>

              <div className="w-full px-5 md:px-6">
                <div className="border-t border-dashed border-slate-100"></div>
              </div>

              <div className="px-5 md:px-6 pt-6">
                <div className="flex flex-col gap-1 mb-5">
                  <div className="flex items-center justify-start gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <Compass className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 text-left">
                      여행 성향
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 py-1">
                    마음 가는 키워드를 자유롭게 골라주세요.
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row flex-1 px-1 md:px-3 gap-2 md:gap-3 min-h-0">
                <div className="w-full md:w-40 max-w-[150px] shrink-0 bg-slate-100/40 md:rounded-l-2xl mb-4 md:mb-0">
                  <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible scrollbar-hide p-2 md:p-2.5 gap-2">
                    {CATEGORIZED_KEYWORDS.map((tab) => {
                      const isActive = activeTab === tab.id;
                      const Icon = tab.icon;
                      const count = tab.items.filter((k) =>
                        formData.tendency.has(k)
                      ).length;

                      return (
                        <Button
                          key={tab.id}
                          variant="ghost"
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            justify-start h-auto flex items-center gap-2 px-3 py-2 text-sm font-medium transition-all relative text-left md:rounded-l-2xl w-32
                            ${
                              isActive
                                ? 'bg-white text-blue-600 shadow-md shadow-slate-100 z-10'
                                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
                            }
                          `}
                        >
                          <div
                            className={`p-1 rounded-2xl transition-colors ${isActive ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-slate-400'}`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="whitespace-nowrap">{tab.title}</span>
                          {count > 0 && (
                            <span
                              className={`ml-auto w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                            >
                              {count}
                            </span>
                          )}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex-1 min-w-0 py-5 md:py-6 pr-3 pl-0 md:pl-1 bg-white md:rounded-l-2xl">
                  <div className="mb-6 text-left">
                    {currentTabInfo && (
                      <>
                        <h3 className="text-lg font-bold text-slate-900 mb-1">
                          {currentTabInfo.title}
                        </h3>
                        <p className="text-slate-500 text-sm">
                          {currentTabInfo.question}
                        </p>
                      </>
                    )}
                  </div>

                  <div
                    className="animate-in fade-in slide-in-from-right-4 duration-300 h-[250px]"
                    key={activeTab}
                  >
                    <div
                      className="grid grid-cols-2 gap-2.5 h-full"
                      style={{
                        gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
                      }}
                    >
                      {currentTabInfo &&
                        currentTabInfo.items.map((label) => {
                          const isSelected = formData.tendency.has(label);
                          return (
                            <Button
                              key={label}
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() => toggleTravelTendency(label)}
                              className={`
                              relative group py-2 px-2 h-full w-full rounded-md text-sm font-medium transition-all duration-200 border text-center flex items-center justify-center gap-1.5 whitespace-normal
                              ${
                                isSelected
                                  ? 'bg-blue-500 border-blue-500 text-white shadow-md shadow-blue-100'
                                  : 'bg-white text-slate-600 border-slate-100 hover:border-blue-200 hover:bg-blue-50/30'
                              }
                            `}
                            >
                              {label}
                            </Button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full px-6 mt-3">
                <div className="border-t border-dashed border-slate-100"></div>
              </div>

              <div className="px-5 md:px-6 pt-6">
                <div className="flex flex-col gap-1 mb-4">
                  <div className="flex items-center justify-start gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 text-left">
                      MBTI 성격 유형
                    </h2>
                  </div>
                  <p className="text-sm text-slate-500 py-1 pl-1">
                    MBTI를 선택하여 자신을 더 잘 표현해보세요.
                  </p>
                </div>
                <select
                  id="mbti"
                  value={formData.mbti}
                  onChange={(e) => handleInputChange('mbti', e.target.value)}
                  className="w-full mt-1 px-4 py-3 h-auto bg-slate-50/60 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900"
                >
                  <option value="">MBTI를 선택해주세요</option>
                  {MBTI_TYPES.map((mbti) => (
                    <option key={mbti} value={mbti}>
                      {mbti}
                    </option>
                  ))}
                </select>
              </div>

              <div className="px-5 md:px-6 py-7  flex justify-center mt-auto">
                <Button
                  onClick={handleNextStep}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 h-auto rounded-xl font-bold text-lg shadow-md shadow-blue-200 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  다음 단계로
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 px-5 md:px-6 py-6 flex flex-col animate-in fade-in slide-in-from-right-8 duration-500">
              <div className="max-w-xl mx-auto w-full space-y-5">
                <div>
                  <Label htmlFor="intro" className="font-semibold">
                    한줄소개
                  </Label>
                  <div className="relative mt-2">
                    <Pen className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="intro"
                      type="text"
                      placeholder="예) 바다를 사랑하는 여행러 🌊"
                      value={formData.intro}
                      onChange={(e) =>
                        handleInputChange('intro', e.target.value)
                      }
                      className="pl-10"
                      maxLength={50}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description" className="font-semibold">
                    상세소개
                  </Label>
                  <div className="relative mt-2">
                    <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <Textarea
                      id="description"
                      placeholder="자신에 대해 자유롭게 소개해주세요. (여행 스타일, 좋아하는 것 등)"
                      value={formData.description}
                      onChange={(e) =>
                        handleInputChange('description', e.target.value)
                      }
                      className="pl-10 min-h-32"
                    />
                  </div>
                </div>
                <p className="mt-2 text-xs text-slate-400 text-right">
                  * 자세히 적어주실수록, 마음이 딱 맞는 동행을 만날 확률이
                  높아져요!
                </p>
              </div>

              <div className="pt-5">
                <Button
                  onClick={handleSubmit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 h-auto rounded-xl font-bold text-lg  shadow-blue-200 shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  회원가입 완료
                </Button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-10 animate-in zoom-in duration-500">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-8 shadow-inner">
                <Sparkles className="w-12 h-12 text-blue-600" />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">
                가입을 축하합니다!
              </h2>
              <p className="text-slate-500 text-lg max-w-md mb-10 leading-relaxed">
                환영합니다,{' '}
                <span className="text-blue-600 font-bold">
                  {formData.nickname || '여행자'}
                </span>
                님!
                <br />
                이제 <span className="font-bold text-slate-800">MateTrip</span>
                에서
                <br />
                당신만의 여행 메이트를 찾아보세요.
              </p>
              <Button
                onClick={onSignup}
                className="w-full max-w-sm bg-slate-900 text-white py-4 h-auto rounded-xl font-bold text-lg shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1"
              >
                MateTrip 시작하기
              </Button>
              <p className="mt-6 text-center text-sm text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Button
                  type="button"
                  variant="link"
                  onClick={onLoginClick}
                  className="text-blue-600 hover:text-blue-700 font-bold p-0 h-auto"
                >
                  로그인
                </Button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
