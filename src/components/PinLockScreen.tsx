import React, { useState, useEffect } from 'react';
import { useInventory } from '../context/InventoryContext.tsx';
import { 
  KeyRound, 
  Delete, 
  AlertCircle,
  ShieldCheck
} from 'lucide-react';

export const PinLockScreen: React.FC = () => {
  const { unlockWithPin, settings } = useInventory();
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [shake, setShake] = useState(false);

  const maxDigits = 6;

  const handleKeyPress = (num: string) => {
    if (isChecking) return;
    if (pin.length < maxDigits) {
      setErrorMsg('');
      const nextPin = pin + num;
      setPin(nextPin);
      if (nextPin.length === maxDigits) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    if (isChecking) return;
    setErrorMsg('');
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (isChecking) return;
    setErrorMsg('');
    setPin('');
  };

  const verifyPin = async (pinToTest: string) => {
    setIsChecking(true);
    const result = await unlockWithPin(pinToTest);
    setIsChecking(false);

    if (!result.success) {
      setErrorMsg(result.error || 'PIN Keamanan salah!');
      setShake(true);
      setTimeout(() => {
        setShake(false);
        setPin('');
      }, 500);
    }
  };

  // Keyboard support for typing digits directly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isChecking) return;
      if (/^[0-9]$/.test(e.key)) {
        if (pin.length < maxDigits) {
          setErrorMsg('');
          const next = pin + e.key;
          setPin(next);
          if (next.length === maxDigits) {
            verifyPin(next);
          }
        }
      } else if (e.key === 'Backspace') {
        handleDelete();
      } else if (e.key === 'Enter' && pin.length >= 4) {
        verifyPin(pin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pin, isChecking]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-yellow-950/90 via-slate-950 to-amber-950/80 text-white select-none overflow-y-auto">
      {/* Background ambient warm yellow glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />

      <div className={`relative w-full max-w-sm bg-slate-900/95 backdrop-blur-xl border border-yellow-500/20 rounded-3xl p-6 sm:p-7 shadow-2xl flex flex-col items-center transition-all ${
        shake ? 'animate-bounce text-amber-400' : ''
      }`}>
        {/* Brand & Security Badge with uploaded Logo */}
        <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-[#FEF9C3] p-1.5 shadow-xl shadow-amber-500/20 mb-3 border border-yellow-200 flex items-center justify-center overflow-hidden">
          <img 
            src="/assets/aistudio/WhatsApp_Image_2026-10-20_at_14.00.08_44e1b065.jpeg" 
            alt="STZ Stok Logo" 
            className="w-full h-full object-contain"
          />
        </div>

        <h1 className="text-lg sm:text-xl font-black text-white text-center tracking-tight">
          {settings.profile.storeName || 'STZ Stok'}
        </h1>
        <p className="text-xs text-amber-300/90 text-center mt-0.5 mb-4 font-medium">
          System Rekap Barang Keluar / Masuk
        </p>

        {/* Lock Icon & Instructions */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 rounded-full border border-amber-400/30 text-xs font-semibold text-amber-200 mb-4">
          <KeyRound className="w-3.5 h-3.5 text-amber-400" />
          <span>Ketik 6 Digit PIN Masuk</span>
        </div>

        {/* 6 PIN Dots Display */}
        <div className="flex items-center justify-center gap-2.5 sm:gap-3 mb-3 h-10">
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  isFilled
                    ? 'bg-amber-400 border-yellow-300 scale-110 shadow-lg shadow-amber-400/50'
                    : 'border-slate-700 bg-slate-800/80'
                }`}
              />
            );
          })}
        </div>

        {/* Status / Error message */}
        {isChecking ? (
          <div className="text-xs text-amber-300 font-bold mb-3 flex items-center gap-1.5 animate-pulse">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Memverifikasi PIN...</span>
          </div>
        ) : errorMsg ? (
          <div className="flex items-center gap-1.5 text-xs text-rose-300 font-semibold mb-3 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/30">
            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        ) : (
          <div className="h-4 mb-3" />
        )}

        {/* Numeric Keypad Grid */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px] mb-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              disabled={isChecking}
              onClick={() => handleKeyPress(digit)}
              className="h-13 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-extrabold text-xl border border-slate-700/60 transition-all shadow-sm flex items-center justify-center active:scale-95"
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Clear, 0, Backspace */}
          <button
            type="button"
            disabled={isChecking}
            onClick={handleClear}
            className="h-13 sm:h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-bold border border-slate-700/30 transition-all flex items-center justify-center"
          >
            Hapus
          </button>

          <button
            type="button"
            disabled={isChecking}
            onClick={() => handleKeyPress('0')}
            className="h-13 sm:h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 text-white font-extrabold text-xl border border-slate-700/60 transition-all shadow-sm flex items-center justify-center active:scale-95"
          >
            0
          </button>

          <button
            type="button"
            disabled={isChecking}
            onClick={handleDelete}
            className="h-13 sm:h-14 rounded-2xl bg-slate-800/40 hover:bg-slate-800 text-slate-400 hover:text-amber-400 text-sm font-bold border border-slate-700/30 transition-all flex items-center justify-center active:scale-95"
            title="Backspace"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
