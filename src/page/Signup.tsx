import React, { useState } from 'react';
import {
  Check,
  MapPin,
  Tent,
  Heart,
  Camera,
  Car,
  Sparkles,
  User,
  Utensils,
  ChevronDown,
  ArrowRight,
  Compass,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Smile,
  ArrowLeft,
  Pencil,
  FileText,
} from 'lucide-react';
import axios from 'axios';
import client from '../api/client';
import { MBTI_TYPES } from '../constants/mbti';
import { TRAVEL_STYLE_OPTIONS } from '../constants/travelStyle';
import { TRAVEL_TENDENCY_TYPE } from '../constants/travelTendencyType';
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
  items: TravelTendencyKey[];
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
      'CITY',
      'RURAL',
      'TRADITIONAL_CITY',
      'RESORT_CITY',
      'PORT_TOWN',
      'TRADITIONAL_MARKET',
      'NIGHT_MARKET',
      'BEACH',
      'ISLAND',
      'MOUNTAIN',
      'VALLEY',
      'LAKE',
    ],
  },
  {
    id: 'activity',
    title: '활동',
    icon: Tent,
    question: '어떤 액티비티를 즐기고 싶으신가요?',
    items: [
      'TREKKING',
      'MOUNTAINEERING',
      'CAMPING',
      'CYCLING',
      'SURFING',
      'SNORKELING',
      'FREEDIVING',
      'FISHING',
      'SKIING',
      'SNOWBOARDING',
      'GOLF',
      'RUNNING',
    ],
  },
  {
    id: 'food',
    title: '음식',
    icon: Utensils,
    question: '여행 중 식사는 어떻게 하시겠어요?',
    items: [
      'STREET_FOOD',
      'LOCAL_RESTAURANT',
      'FOODIE_TOUR',
      'CAFE_DESSERT',
      'VEGAN_FRIENDLY',
      'NO_PORK',
      'NO_SEAFOOD',
      'SPICY_FOOD_PREF',
      'MILD_FOOD_PREF',
      'SEAFOOD_PREF',
      'MEAT_PREF',
    ],
  },
  {
    id: 'culture',
    title: '문화',
    icon: Camera,
    question: '관심 있는 문화 생활이 있으신가요?',
    items: [
      'ARCHITECTURE_TOUR',
      'NIGHT_VIEW',
      'MUSEUM',
      'GALLERY',
      'HERITAGE_TOUR',
      'MUSICAL_SHOW',
      'CONCERT',
      'SPORTS_VIEWING',
      'LOCAL_FESTIVAL',
      'AMUSEMENT_PARK',
      'AQUARIUM',
      'ZOO',
    ],
  },
  {
    id: 'stay',
    title: '숙소',
    icon: Heart,
    question: '편안한 밤을 위해 어디서 머물까요?',
    items: [
      'HOTEL',
      'RESORT',
      'GUESTHOUSE',
      'MOTEL',
      'PENSION',
      'AIRBNB',
      'GLAMPING',
      'PRIVATE_POOL_VILLA',
    ],
  },
  {
    id: 'transport',
    title: '이동/방식',
    icon: Car,
    question: '어떤 이동 수단과 여행 방식을 선호하시나요?',
    items: [
      'TRANSPORT_RENTAL_CAR',
      'CAMPER_VAN',
      'PUBLIC_TRANSPORT',
      'TRAIN_TRIP',
      'MOTORCYCLE_TRIP',
      'BACKPACKING',
      'HOTEL_STAYCATION',
      'CAN_DRIVE',
    ],
  },
  {
    id: 'etc',
    title: '기타',
    icon: User,
    question: '기타 선호사항이 있나요?',
    items: [
      'SMALL_GROUP_PREFERRED',
      'QUIET_COMPANION_PREFERRED',
      'TALKATIVE_COMPANION_PREFERRED',
      'QUIET_RELAXATION',
      'PACKED_SCHEDULE',
      'LEISURELY_SCHEDULE',
      'SPEND_ON_LODGING',
      'SPEND_ON_FOOD',
      'PHOTOGRAPHY',
      'LANDSCAPE_PHOTOGRAPHY',
      'NON_SMOKER',
      'SMOKER',
      'NON_DRINKING',
      'DRINKS_ALCOHOL',
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

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nickname: '',
    gender: '',
    mbti: '',
    travelStyles: new Set<string>(),
    tendencies: new Set<string>(),
    introOneLine: '',
    introDetail: '',
  });

  const handleInputChange = (
    field: keyof typeof formData,
    value: string | boolean
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetChange = (
    field: 'travelStyles' | 'tendencies',
    value: string
  ) => {
    setFormData((prev) => {
      const newSet = new Set(prev[field]);
      if (newSet.has(value)) {
        newSet.delete(value);
      } else {
        if (field === 'travelStyles' && newSet.size >= 3) {
          setStyleError('여행 스타일은 3개만 선택할 수 있어요.');
          return prev;
        }
        newSet.add(value);
      }

      if (field === 'travelStyles') {
        setStyleError('');
      }
      return { ...prev, [field]: newSet };
    });
  };

  const currentTabInfo = CATEGORIZED_KEYWORDS.find((t) => t.id === activeTab);

  const numRows = currentTabInfo
    ? Math.ceil(currentTabInfo.items.length / 2)
    : 1;

  const handleNext = () => {
    if (step === 2 && formData.travelStyles.size !== 3) {
      setStyleError('여행 스타일을 3개 선택해주세요.');
      return;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('비밀번호가 일치하지 않습니다.');
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
          travelStyles: Array.from(formData.travelStyles),
          tendency: Array.from(formData.tendencies),
          intro: formData.introOneLine,
          description: formData.introDetail,
        },
      };

      const signupResponse = await client.post('/auth/signup', requestData);

      if (signupResponse.status === 201) {
        const loginResponse = await client.post('/auth/login', {
          email: formData.email,
          password: formData.password,
        });

        if (loginResponse.status === 200) {
          handleNext(); // to Step 4
        }
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        alert(error.response.data.message || '회원가입에 실패했습니다.');
      } else {
        alert('알 수 없는 오류가 발생했습니다.');
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

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md md:max-w-lg">
        <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl overflow-hidden border border-slate-100 relative min-h-[560px] flex flex-col">
          {step > 1 && step < 4 && (
            <Button
              variant="ghost"
              onClick={handleBack}
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
                    style={{ width: `${((step - 1) / 3) * 100}%` }}
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    이메일
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        handleInputChange('email', e.target.value)
                      }
                      placeholder="example@email.com"
                      className="w-full pl-12 pr-4 py-3.5 h-auto bg-slate-50/60 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    비밀번호
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      placeholder="8자 이상 입력해주세요"
                      className="w-full pl-12 pr-12 py-3.5 h-auto bg-slate-50/60 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    비밀번호 확인
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Check className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        handleInputChange('confirmPassword', e.target.value)
                      }
                      placeholder="비밀번호를 다시 입력해주세요"
                      className="w-full pl-12 pr-12 py-3.5 h-auto bg-slate-50/60 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
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
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    닉네임
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Smile className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) =>
                        handleInputChange('nickname', e.target.value)
                      }
                      placeholder="사용할 닉네임을 입력해주세요"
                      className="w-full pl-12 pr-4 py-3.5 h-auto bg-slate-50/60 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    성별
                  </label>
                  <div className="flex gap-6">
                    {['남성', '여성'].map((g) => (
                      <label
                        key={g}
                        className="flex items-center gap-2 cursor-pointer group"
                      >
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${formData.gender === g ? 'border-blue-600' : 'border-slate-300 group-hover:border-blue-400'}`}
                        >
                          {formData.gender === g && (
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          )}
                        </div>
                        <input
                          type="radio"
                          name="gender"
                          value={g}
                          checked={formData.gender === g}
                          onChange={(e) =>
                            handleInputChange('gender', e.target.value)
                          }
                          className="hidden"
                        />
                        <span
                          className={`text-base font-medium transition-colors ${formData.gender === g ? 'text-blue-900' : 'text-slate-500'}`}
                        >
                          {g}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-6 pb-3">
                <Button
                  onClick={handleNext}
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
                    <h2 className="text-xl font-extrabold text-slate-900 text-left">
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
                        onClick={() =>
                          handleSetChange('travelStyles', style.value)
                        }
                        variant={isSelected ? 'default' : 'outline'}
                        className={`
                          px-4 py-1.5 h-auto rounded-xl text-sm font-medium transition-all duration-200 border select-none
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
                    <h2 className="text-xl font-extrabold text-slate-900 text-left">
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
                        formData.tendencies.has(k)
                      ).length;

                      return (
                        <Button
                          key={tab.id}
                          variant="ghost"
                          onClick={() => setActiveTab(tab.id)}
                          className={`
                            justify-start h-auto flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition-all relative text-left md:rounded-l-2xl w-32
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
                        <h3 className="text-xl font-bold text-slate-900 mb-1">
                          {currentTabInfo.title}
                        </h3>
                        <p className="text-slate-500 text-sm">
                          {currentTabInfo.question}
                        </p>
                      </>
                    )}
                  </div>

                  <div
                    className="animate-in fade-in slide-in-from-right-4 duration-300 h-[300px]"
                    key={activeTab}
                  >
                    <div
                      className="grid grid-cols-2 gap-2.5 h-full"
                      style={{
                        gridTemplateRows: `repeat(${numRows}, minmax(0, 1fr))`,
                      }}
                    >
                      {currentTabInfo &&
                        currentTabInfo.items.map((itemKey) => {
                          const label = TRAVEL_TENDENCY_TYPE[itemKey];
                          const isSelected = formData.tendencies.has(itemKey);
                          return (
                            <Button
                              key={itemKey}
                              variant={isSelected ? 'default' : 'outline'}
                              onClick={() =>
                                handleSetChange('tendencies', itemKey)
                              }
                              className={`
                              relative group py-2 px-2 h-full w-full rounded-xl text-sm font-medium transition-all duration-200 border text-center flex items-center justify-center gap-1.5 whitespace-normal
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

              <div className="w-full px-6 mt-6">
                <div className="border-t border-dashed border-slate-100"></div>
              </div>

              <div className="px-5 md:px-6 pt-6">
                <div className="flex flex-col gap-1 mb-4">
                  <div className="flex items-center justify-start gap-2">
                    <div className="p-2 bg-blue-50 rounded-full">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900 text-left">
                      MBTI (선택)
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

              <div className="px-5 md:px-6 py-5 bg-white border-t border-slate-50 flex justify-center mt-auto">
                <Button
                  onClick={handleNext}
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
                  <label className="block text-lg font-bold text-slate-800 mb-3">
                    한줄소개
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Pencil className="h-5 w-5 text-slate-400" />
                    </div>
                    <Input
                      type="text"
                      value={formData.introOneLine}
                      onChange={(e) =>
                        handleInputChange('introOneLine', e.target.value)
                      }
                      placeholder="예) 바다를 사랑하는 여행러 🌊"
                      className="w-full pl-12 pr-4 py-3.5 h-auto bg-slate-50/30 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-bold text-slate-800 mb-3">
                    상세소개
                  </label>
                  <div className="relative">
                    <div className="absolute top-4 left-4 pointer-events-none">
                      <FileText className="h-5 w-5 text-slate-400" />
                    </div>
                    <Textarea
                      value={formData.introDetail}
                      onChange={(e) =>
                        handleInputChange('introDetail', e.target.value)
                      }
                      rows={6}
                      placeholder="자신에 대해 자유롭게 소개해 주세요. (여행 스타일, 좋아하는 것 등)"
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50/30 border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-medium text-slate-900 placeholder-slate-400 resize-none leading-relaxed"
                    />
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
