import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Lock } from 'lucide-react';
import '@fontsource/work-sans';
import { playSpinWheel, canPlayGame } from '../../services/gamePromoService';

interface PromoCode {
  code: string;
  discount: number;
  description: string;
}

interface SpinWheelProps {
  onWin: (promoCode: PromoCode) => void;
  onBack: () => void;
}

const SpinWheel: React.FC<SpinWheelProps> = ({ onWin, onBack }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [hasSpun, setHasSpun] = useState(false);
  const [wonPrize, setWonPrize] = useState<PromoCode | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canPlay, setCanPlay] = useState<boolean | null>(null);
  const [eligibilityMsg, setEligibilityMsg] = useState<string>('');
  const wheelRef = useRef<HTMLDivElement>(null);

  // Prize segments: 6 are discounts, 2 are 'No Win'
  const prizeSegments = [
    { label: '5% OFF', value: 5 },
    { label: '10% OFF', value: 10 },
    { label: 'No Win', value: null },
    { label: '15% OFF', value: 15 },
    { label: '20% OFF', value: 20 },
    { label: 'No Win', value: null },
    { label: '10% OFF', value: 10 },
    { label: '5% OFF', value: 5 },
  ];
  const prizesCount = prizeSegments.length;

  // For animation only
  const colors = [
    '#1800AC', '#7561EF', '#3B1EEB', '#14008F',
    '#A497F7', '#7561EF', '#3B1EEB', '#1800AC'
  ];

  useEffect(() => {
    const checkEligibility = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setCanPlay(false);
        setEligibilityMsg('You must be logged in to play.');
        return;
      }
      try {
        const res = await canPlayGame(token, 'spin-wheel');
        setCanPlay(!!res.can_play);
        setEligibilityMsg(res.message || (res.can_play ? '' : 'You cannot play this game today.'));
      } catch {
        setCanPlay(false);
        setEligibilityMsg('Failed to check eligibility.');
      }
    };
    checkEligibility();
  }, []);

  const spinWheel = async () => {
    if (isSpinning || hasSpun) return;
    setIsSpinning(true);
    setError(null);
    const token = localStorage.getItem('access_token');
    if (!token) {
      setIsSpinning(false);
      setWonPrize(null);
      setError('You must be logged in to play.');
      return;
    }
    // Call API first to get the result
    let apiResult;
    try {
      apiResult = await playSpinWheel(token);
    } catch (e) {
      setIsSpinning(false);
      setWonPrize(null);
      setError('Failed to connect to server.');
      return;
    }
    // Determine which segment to stop on based on API result
    let resultIndex = null;
    if (apiResult && apiResult.promotion) {
      // Find a segment with this discount value
      const winSegments = prizeSegments.map((p, i) => (p.value === apiResult.promotion.discount_value ? i : null)).filter(i => i !== null);
      resultIndex = winSegments.length > 0 ? winSegments[Math.floor(Math.random() * winSegments.length)] : 0;
    } else {
      // Find a 'No Win' segment
      const noWinSegments = prizeSegments.map((p, i) => (p.value === null ? i : null)).filter(i => i !== null);
      resultIndex = noWinSegments.length > 0 ? noWinSegments[Math.floor(Math.random() * noWinSegments.length)] : 0;
    }
    // Animate wheel to the correct segment
    const spins = 5 + Math.random() * 5;
    const finalRotation = rotation + (spins * 360);
    const prizeAngle = (360 / prizesCount) * resultIndex;
    const finalAngle = finalRotation + prizeAngle;
    setRotation(finalAngle);
    setTimeout(() => {
      setIsSpinning(false);
      setHasSpun(true);
      if (apiResult && apiResult.promotion) {
        const promo = {
          code: apiResult.promotion.code,
          discount: apiResult.promotion.discount_value,
          description: apiResult.promotion.description
        };
        setWonPrize(promo);
        onWin(promo);
      } else if (apiResult && apiResult.message && !apiResult.promotion) {
        setWonPrize(null);
        setError(apiResult.message);
      } else {
        setWonPrize(null);
        setError(apiResult?.error || 'Failed to get promo code.');
      }
    }, 3000);
  };

  const resetWheel = () => {
    setRotation(0);
    setHasSpun(false);
    setIsSpinning(false);
    setWonPrize(null);
    setCopySuccess(false);
    setError(null);
  };

  const handleCopy = () => {
    if (wonPrize) {
      navigator.clipboard.writeText(wonPrize.code);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-['Work_Sans'] bg-gradient-to-br from-primary-50 via-white to-primary-100 relative overflow-hidden py-12">
      {/* Floating confetti background (optional, simple SVGs for now) */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10 z-0" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10%" cy="20%" r="30" fill="#1800AC" />
        <circle cx="80%" cy="10%" r="20" fill="#7561EF" />
        <circle cx="50%" cy="80%" r="25" fill="#3B1EEB" />
        <circle cx="90%" cy="60%" r="15" fill="#14008F" />
      </svg>
      <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-2xl max-w-md w-full mx-4 border border-primary-100 z-10 relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-primary-600 transition-colors font-['Work_Sans']"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Games</span>
          </button>
          <h1 className="text-3xl font-extrabold text-primary-700 font-['Work_Sans'] tracking-tight drop-shadow-sm">Spin & Win</h1>
        </div>

        {/* Wheel Container */}
        <div className="relative mb-8 flex justify-center">
          <div className="relative w-72 h-72 sm:w-80 sm:h-80 mx-auto flex items-center justify-center">
            {/* Glowing Wheel Border */}
            <div className="absolute w-full h-full rounded-full bg-gradient-to-br from-primary-200 via-primary-100 to-white blur-lg opacity-70 animate-pulse z-0"></div>
            {/* SVG Wheel */}
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 320 320"
              className="absolute top-0 left-0 w-full h-full z-10"
              style={{ transform: `rotate(${rotation}deg)`, transition: isSpinning ? 'transform 3s cubic-bezier(0.25, 0.46, 0.45, 0.94)' : 'none' }}
            >
              {prizeSegments.map((segment, i) => {
                const angle = 360 / prizesCount;
                const startAngle = i * angle;
                const endAngle = startAngle + angle;
                const largeArc = angle > 180 ? 1 : 0;
                const radius = 160;
                // Convert polar to cartesian
                const polarToCartesian = (cx: number, cy: number, r: number, a: number) => {
                  const rad = (a - 90) * Math.PI / 180.0;
                  return {
                    x: cx + (r * Math.cos(rad)),
                    y: cy + (r * Math.sin(rad))
                  };
                };
                const start = polarToCartesian(160, 160, radius, endAngle);
                const end = polarToCartesian(160, 160, radius, startAngle);
                const d = [
                  `M 160 160`,
                  `L ${start.x} ${start.y}`,
                  `A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`,
                  'Z'
                ].join(' ');
                // Label position (middle of arc)
                const labelAngle = startAngle + angle / 2;
                const labelPos = polarToCartesian(160, 160, 110, labelAngle);
                return (
                  <g key={i}>
                    <path d={d} fill={colors[i % colors.length]} stroke="#fff" strokeWidth="3" />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="#fff"
                      fontSize="18"
                      fontWeight="bold"
                      transform={`rotate(${labelAngle} ${labelPos.x} ${labelPos.y})`}
                    style={{
                        textShadow: '0 1px 4px rgba(0,0,0,0.18)',
                        fontFamily: 'Work Sans, sans-serif',
                        pointerEvents: 'none'
                      }}
                    >
                      {segment.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Stylish Center Pointer */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 z-20">
              <div className="w-0 h-0 border-l-[18px] border-r-[18px] border-b-[36px] border-l-transparent border-r-transparent border-b-primary-600 drop-shadow-lg animate-bounce"></div>
              <div className="w-4 h-4 bg-white rounded-full border-2 border-primary-400 absolute left-1/2 -translate-x-1/2 -top-2"></div>
            </div>

            {/* Center Circle */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full border-4 border-primary-200 flex items-center justify-center z-20 shadow-md">
              <div className="w-8 h-8 bg-primary-600 rounded-full shadow-inner"></div>
            </div>

            {canPlay === false && (
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-30 rounded-full">
                <Lock className="w-16 h-16 text-white mb-4" />
                <div className="text-white text-lg font-bold text-center px-4 drop-shadow-lg">{eligibilityMsg}</div>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="text-center space-y-4">
          {!hasSpun ? (
            <button
              onClick={spinWheel}
              disabled={isSpinning || canPlay === false}
              className={`w-full py-4 px-8 rounded-2xl text-white font-bold text-lg transition-all duration-300 font-['Work_Sans'] shadow-lg ${
                isSpinning || canPlay === false
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-primary-600 to-primary-600 hover:from-primary-600 hover:to-primary-700 transform hover:scale-105'
              }`}
            >
              {canPlay === false ? 'Locked' : isSpinning ? 'Spinning...' : 'SPIN THE WHEEL!'}
            </button>
          ) : (
            <>
              {/* Overlay for professional win message */}
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="relative bg-gradient-to-br from-white via-primary-50 to-primary-100 rounded-3xl shadow-2xl p-8 max-w-sm w-full border-4 border-primary-200 animate-fadeIn">
                  <div className="flex flex-col items-center">
                    <span className="text-5xl mb-2 animate-bounce">{wonPrize ? '🎊' : '😔'}</span>
                    <h2 className="text-2xl font-bold text-primary-700 mb-2 font-['Work_Sans']">
                      {wonPrize ? 'Congratulations!' : 'Better Luck Next Time!'}
                    </h2>
                    <p className="text-gray-700 mb-4 font-['Work_Sans']">
                      {wonPrize ? "You've won:" : error || 'You did not win a promocode this time.'}
                    </p>
                    {wonPrize && (
                      <div className="bg-white rounded-xl shadow p-4 mb-4 w-full text-center border border-primary-200">
                        <div className="text-3xl font-extrabold text-primary-600 mb-1 font-['Work_Sans']">{wonPrize.discount}% OFF</div>
                        <div className="text-lg font-semibold text-gray-800 mb-1 font-['Work_Sans']">Code: <span className="bg-primary-100 px-2 py-1 rounded font-mono text-primary-700">{wonPrize.code}</span></div>
                        <div className="text-sm text-gray-600 mb-2 font-['Work_Sans']">{wonPrize.description}</div>
                        <button
                          onClick={handleCopy}
                          className="mt-2 px-4 py-2 bg-gradient-to-r from-primary-400 to-primary-600 text-white rounded-lg font-semibold shadow hover:from-primary-500 hover:to-primary-700 transition-all font-['Work_Sans']"
                        >
                          {copySuccess ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                    )}
                    {!wonPrize && (
                      <div className="bg-white rounded-xl shadow p-4 mb-4 w-full text-center border border-primary-200">
                        <div className="text-2xl font-bold text-gray-700 mb-2">No Promo Code Won</div>
                        <div className="text-sm text-gray-600 mb-2">Try again tomorrow for another chance!</div>
                      </div>
                    )}
                    <button
                      onClick={resetWheel}
                      className="w-full py-3 px-6 rounded-xl bg-gray-500 text-white font-semibold hover:bg-gray-600 transition-colors font-['Work_Sans'] mb-2 mt-2"
                    >
                      <RotateCcw className="w-5 h-5 inline mr-2" />
                      Spin Again
                    </button>
                    <button
                      onClick={onBack}
                      className="w-full py-2 px-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-semibold hover:bg-gray-100 transition-colors font-['Work_Sans']"
                    >
                      <ArrowLeft className="w-4 h-4 inline mr-1" />
                      Back to Games
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 p-4 bg-white/60 rounded-xl font-['Work_Sans'] shadow border border-primary-100">
          <h3 className="font-semibold text-primary-700 mb-2 font-['Work_Sans'] flex items-center gap-2">
            <span className="inline-block text-xl">📝</span> How to Play:
          </h3>
          <ul className="text-sm text-gray-700 space-y-2 font-['Work_Sans']">
            <li className="flex items-center gap-2"><span className="text-primary-500">🎯</span> Click <span className="font-bold">SPIN THE WHEEL</span> to start</li>
            <li className="flex items-center gap-2"><span className="text-primary-500">⏳</span> Wait for the wheel to stop spinning</li>
            <li className="flex items-center gap-2"><span className="text-primary-500">📍</span> The pointer will show your prize</li>
            <li className="flex items-center gap-2"><span className="text-primary-500">🏆</span> Win discounts up to <span className="font-bold">20% off!</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SpinWheel; 