import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import SpinWheel from '../components/games/SpinWheel';
import MemoryGame from '../components/games/MemoryGame';
import { Target, Zap, Lock, Copy } from 'lucide-react';
import '@fontsource/work-sans';
import { getMyGamePromos, canPlayGame } from '../services/gamePromoService';

interface PromoCode {
  code: string;
  discount: number;
  description: string;
}

const Games: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);
  const [wonCodes, setWonCodes] = useState<PromoCode[]>([]);
  const [gameEligibility, setGameEligibility] = useState<{ [key: string]: { canPlay: boolean, message: string } }>({});

  const games = [
    {
      id: 'spin-wheel',
      name: 'Spin & Win',
      description: 'Spin the wheel to win amazing discounts!',
      icon: <Target className="w-8 h-8" />,
      color: 'bg-gradient-to-r from-primary-600 to-primary-600'
    },
    {
      id: 'memory-game',
      name: 'Memory Match',
      description: 'Match pairs to unlock special offers!',
      icon: <Zap className="w-8 h-8" />,
      color: 'bg-gradient-to-r from-primary-600 to-primary-600'
    }
  ];

  const handleGameWin = (promoCode: PromoCode) => {
    setWonCodes(prev => [...prev, promoCode]);
    toast.success(`🎉 Congratulations! You won ${promoCode.discount}% off! Code: ${promoCode.code}`);
  };

  const handleBackToGames = () => {
    setSelectedGame(null);
  };

  const renderGame = () => {
    switch (selectedGame) {
      case 'spin-wheel':
        return <SpinWheel onWin={handleGameWin} onBack={handleBackToGames} />;
      // case 'scratch-card':
      //   return <ScratchCard onWin={handleGameWin} onBack={handleBackToGames} />;
      case 'memory-game':
        return <MemoryGame onWin={handleGameWin} onBack={handleBackToGames} />;
      default:
        return null;
    }
  };

  useEffect(() => {
    const fetchPromos = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const result = await getMyGamePromos(token);
      if (result && result.game_plays) {
        setWonCodes(
          result.game_plays.map((gp: any) => ({
            code: gp.promotion.code,
            discount: gp.promotion.discount_value,
            description: gp.promotion.description
          }))
        );
      }
    };
    fetchPromos();
  }, []);

  useEffect(() => {
    const checkAllEligibility = async () => {
      const token = localStorage.getItem('access_token');
      const newEligibility: { [key: string]: { canPlay: boolean, message: string } } = {};
      for (const game of games) {
        if (!token) {
          newEligibility[game.id] = { canPlay: false, message: 'You must be logged in to play.' };
          continue;
        }
        try {
          const res = await canPlayGame(token, game.id === 'memory-game' ? 'match-card' : game.id);
          newEligibility[game.id] = { canPlay: !!res.can_play, message: res.message || (res.can_play ? '' : 'You cannot play this game today.') };
        } catch {
          newEligibility[game.id] = { canPlay: false, message: 'Failed to check eligibility.' };
        }
      }
      setGameEligibility(newEligibility);
    };
    checkAllEligibility();
    // eslint-disable-next-line
  }, []);

  // Animation keyframes (inject into page)
  React.useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes floatCard {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-12px) scale(1.03); box-shadow: 0 8px 32px 0 rgba(24, 0, 172,0.10); }
        100% { transform: translateY(0px); }
      }
      @keyframes fadeInUp {
        0% { opacity: 0; transform: translateY(30px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes confettiMove {
        0% { transform: translateY(0); }
        100% { transform: translateY(40px); }
      }
    `;
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);

  if (selectedGame) {
    return (
      <div className="min-h-screen bg-gray-50 font-['Work_Sans']">
        <div className="mx-auto">
          {renderGame()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white py-12 font-['Work_Sans'] relative overflow-hidden">
      {/* Animated Confetti Background */}
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20 z-0" style={{ animation: 'confettiMove 3s infinite alternate' }} xmlns="http://www.w3.org/2000/svg">
        <circle cx="10%" cy="20%" r="30" fill="#1800AC" />
        <circle cx="80%" cy="10%" r="20" fill="#7561EF" />
        <circle cx="50%" cy="80%" r="25" fill="#3B1EEB" />
        <circle cx="90%" cy="60%" r="15" fill="#14008F" />
        <rect x="20%" y="70%" width="18" height="18" fill="#1800AC" rx="4" />
        <rect x="70%" y="30%" width="12" height="12" fill="#7561EF" rx="3" />
      </svg>
      <div className="container mx-auto mt-12 px-4 max-w-4xl relative z-10">
        {/* Header */}
        <div className="text-center mb-16" style={{ animation: 'fadeInUp 0.8s cubic-bezier(.4,0,.2,1) both' }}>
          <h1 className="text-5xl font-extrabold text-gray-900 mb-3 tracking-tight">
            🎮 Play & Win Rewards
          </h1>
          <p className="text-lg text-gray-700">
            Play exciting games and win promo codes worth up to <span className="text-primary-600 font-semibold">20% off</span> instantly.
          </p>
        </div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {games.map((game, idx) => {
            const eligible = gameEligibility[game.id]?.canPlay !== false;
            return (
              <div
                key={game.id}
                onClick={() => eligible && setSelectedGame(game.id)}
                className={`${game.color} rounded-3xl p-8 cursor-pointer shadow-xl transition hover:scale-105 hover:shadow-2xl border-2 border-primary-200 hover:border-primary-400 relative ${!eligible ? 'opacity-60 pointer-events-none' : ''}`}
                style={{
                  animation: `floatCard 3s ease-in-out ${idx * 0.3}s infinite, fadeInUp 0.8s cubic-bezier(.4,0,.2,1) both`,
                  animationDelay: `${0.2 + idx * 0.15}s, ${0.2 + idx * 0.15}s`
                }}
              >
                <div className="text-white text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="bg-white/30 rounded-full p-4 hover:bg-white/40 transition">
                      {game.icon}
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold mb-1">{game.name}</h3>
                  <p className="text-white/90 text-base">{game.description}</p>
                  <div className="mt-4 text-sm text-white/80 italic">Win up to 20% off!</div>
                </div>
                {!eligible && (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-20 rounded-3xl">
                    <Lock className="w-14 h-14 text-white mb-3" />
                    <div className="text-white text-lg font-bold text-center px-4 drop-shadow-lg">{gameEligibility[game.id]?.message}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Promo Code Section */}
        {wonCodes.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-lg mb-12 border border-primary-100" style={{ animation: 'fadeInUp 0.8s 0.2s cubic-bezier(.4,0,.2,1) both' }}>
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">
              🎉 Your Won Promo Codes
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wonCodes.map((code, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-200 rounded-xl p-4 shadow-sm"
                  style={{ animation: `fadeInUp 0.7s ${0.2 + index * 0.1}s both` }}
                >
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-700 mb-1">{code.discount}% OFF</div>
                    <div className="flex items-center justify-center gap-2 bg-white px-3 py-1 font-mono text-sm font-semibold rounded mb-1 text-gray-800">
                      {code.code}
                      <button
                        type="button"
                        aria-label="Copy promocode"
                        className="ml-1 p-1 rounded hover:bg-green-200 transition"
                        onClick={() => {
                          navigator.clipboard.writeText(code.code);
                          toast.success('Promo code copied!');
                        }}
                      >
                        <Copy className="w-4 h-4 text-green-700" />
                      </button>
                    </div>
                    <div className="text-xs text-gray-600">{code.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions Section */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-primary-100" style={{ animation: 'fadeInUp 0.8s 0.3s cubic-bezier(.4,0,.2,1) both' }}>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">
            How to Play & Win
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {[1, 2, 3].map((step) => (
              <div key={step} style={{ animation: `fadeInUp 0.7s ${0.4 + step * 0.1}s both` }}>
                <div className="bg-primary-600/10 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary-600 font-bold text-lg">{step}</span>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  {step === 1 && 'Choose a Game'}
                  {step === 2 && 'Play & Win'}
                  {step === 3 && 'Use Your Code'}
                </h3>
                <p className="text-base text-gray-600">
                  {step === 1 && 'Pick from our exclusive mini-games.'}
                  {step === 2 && 'Complete the game to earn promo codes.'}
                  {step === 3 && 'Apply them at checkout and save instantly!'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Games;