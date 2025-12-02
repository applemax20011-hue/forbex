import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import LandingPage from "./LandingPage";
import confetti from 'canvas-confetti';
import "./App.css";

// ===== Константы =====
// где-то рядом с импортами

const TABS = [
  { id: 1, labelRu: "Главная", labelEn: "Home", icon: "🏠" },
  { id: 2, labelRu: "Торговля", labelEn: "Trade", icon: "📈" },
  { id: 3, labelRu: "Кошелёк", labelEn: "Wallet", icon: "👛" },
  { id: 4, labelRu: "История", labelEn: "History", icon: "📜" },
  { id: 5, labelRu: "Профиль", labelEn: "Profile", icon: "👤" },
];

const INITIAL_COINS = [
  { symbol: "BTC", name: "Bitcoin", price: 97320, change: "+3.2%", volume: "34.1B" },
  { symbol: "ETH", name: "Ethereum", price: 3270, change: "+1.8%", volume: "18.4B" },
  { symbol: "LTC", name: "Litecoin", price: 84, change: "-0.3%", volume: "410M" },
  { symbol: "ADA", name: "Cardano", price: 0.52, change: "+0.7%", volume: "980M" },
  { symbol: "DOT", name: "Polkadot", price: 7.4, change: "+1.1%", volume: "610M" },
  { symbol: "MATIC", name: "Polygon", price: 0.89, change: "-0.5%", volume: "520M" },
  { symbol: "AVAX", name: "Avalanche", price: 29.1, change: "+2.4%", volume: "430M" },
  { symbol: "UNI", name: "Uniswap", price: 11.2, change: "+0.3%", volume: "210M" },
  { symbol: "XRP", name: "XRP", price: 0.81, change: "+0.9%", volume: "1.7B" },
  { symbol: "DOGE", name: "Dogecoin", price: 0.18, change: "-1.1%", volume: "890M" },
  { symbol: "SHIB", name: "Shiba Inu", price: 0.000029, change: "+4.5%", volume: "390M" },
  { symbol: "TON", name: "Toncoin", price: 6.25, change: "+4.5%", volume: "520M" },
  { symbol: "BNB", name: "BNB", price: 612, change: "+0.4%", volume: "2.9B" },
  { symbol: "TRX", name: "TRON", price: 0.14, change: "+0.2%", volume: "730M" },
  { symbol: "SOL", name: "Solana", price: 192, change: "-0.7%", volume: "4.2B" },
  { symbol: "LINK", name: "Chainlink", price: 19.4, change: "+2.1%", volume: "360M" },
];

const COIN_ICONS = {
  BTC: "₿",
  ETH: "Ξ",
  LTC: "Ł",
  ADA: "A",
  DOT: "•",
  MATIC: "M",
  AVAX: "A",
  UNI: "U",
  XRP: "✕",
  DOGE: "Ð",
  SHIB: "🐶",
  TON: "TON",
  BNB: "BNB",
  TRX: "T",
  SOL: "S",
  LINK: "🔗",
};

const STORAGE_KEYS = {
  user: "forbex_user",
  password: "forbex_password",
  remember: "forbex_remember",
  balance: "forbex_balance",
  walletHistory: "forbex_wallet_history",
  loginHistory: "forbex_login_history",
  settings: "forbex_settings",
  tradeHistory: "forbex_trade_history",
  registrationTs: "forbex_registration_ts",
  stats: "forbex_stats",            // для активных юзеров и сделок
};

// Курс для отображения баланса. Поставь свой.
const USD_RATE = 100; // 1 USD = 100 RUB
// где-то сверху файла, рядом с константами
const MIN_LOGIN_OVERLAY_MS = 1000; // 1.2 секунды, можешь поставить 2000
// --- НОВОЕ: Регулярки для проверки (только латиница, цифры, символы) ---
const ONLY_LATIN_REGEX = /^[a-zA-Z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]*$/;
const NO_CYRILLIC_REGEX = /[а-яА-ЯёЁ]/;

// ===== Supabase (frontend) =====
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const MAIN_ADMIN_TG_ID = Number(import.meta.env.VITE_MAIN_ADMIN_ID || "0");

function toDisplayCurrency(amountRub, currency) {
  if (typeof amountRub !== "number" || Number.isNaN(amountRub)) return 0;

  if (currency === "USD") {
    return amountRub / USD_RATE; // было 500 000 RUB → 5 000 USD (если курс 100)
  }
  // по умолчанию RUB
  return amountRub;
}

function FoxBackground() {
  return (
    <div className="fox-bg-root">
      <div className="fox-bg-noise" />
      <div className="fox-bg-glow fox-bg-glow-top" />
      <div className="fox-bg-glow fox-bg-glow-bottom" />
      <div className="fox-bg-orbit fox-bg-orbit-1">
        <div className="fox-bg-grid" />
      </div>
      <div className="fox-bg-orbit fox-bg-orbit-2" />
    </div>
  );
}

function Shell({ children, theme = "fox", className = "" }) { // <--- Добавили className
  const isFox = theme === "fox";
  return (
    // Добавляем className в div
    <div className={`page-root theme-${theme} ${className}`}> 
      {isFox && <FoxBackground />}
      <div className="app-container">{children}</div>
    </div>
  );
}
// Компонент для плавной анимации чисел
function AnimatedNumber({ value, currency, rate = 1 }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    let start = displayValue;
    const end = value;
    if (start === end) return;

    const duration = 1000; // длительность анимации 1 сек
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Функция плавности (easeOutQuart)
      const ease = 1 - Math.pow(1 - progress, 4);
      
      const current = start + (end - start) * ease;
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value]);

  // Форматируем для отображения
  const formatted = toDisplayCurrency(displayValue, currency).toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return <span className="tabular-nums">{formatted}</span>;
}
function ScenarioLightweightChart({ points, scenario, progress }) {
  const svgRef = useRef(null);

  const processed = useMemo(() => {
    if (!Array.isArray(points) || points.length === 0) return null;

    const ratio = progress == null ? 1 : progress;
    const visibleCount = Math.max(2, Math.floor(points.length * ratio));
    const data = points.slice(0, visibleCount);

    const values = data.map((p) => p.value);
    const times = data.map((p) => p.time);

    const minV = Math.min(...values);
    const maxV = Math.max(...values);
    const minT = Math.min(...times);
    const maxT = Math.max(...times);
    // Добавляем отступы сверху/снизу, чтобы график не прилипал к краям
    const padding = (maxV - minV) * 0.1; 
    const vRange = (maxV - minV) + padding * 2 || 1;
    const tRange = maxT - minT || 1;

    const width = 100; // viewBox width
    const height = 100; // viewBox height

    // Генерация линии
    const linePoints = data.map((p) => {
      const x = ((p.time - minT) / tRange) * width;
      // учитываем padding
      const y = height - ((p.value - (minV - padding)) / vRange) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ");

    // Генерация заливки (Area)
    // Начинаем снизу-слева, идем по линии, заканчиваем снизу-справа
    const firstX = ((data[0].time - minT) / tRange) * width;
    const lastX = ((data[data.length - 1].time - minT) / tRange) * width;
    
    const areaPath = `M ${firstX},${height} ${data.map(p => {
       const x = ((p.time - minT) / tRange) * width;
       const y = height - ((p.value - (minV - padding)) / vRange) * height;
       return `L ${x.toFixed(2)},${y.toFixed(2)}`;
    }).join(" ")} L ${lastX},${height} Z`;

    // Координаты последней точки для кружочка
    const lastPoint = data[data.length - 1];
    const dotX = ((lastPoint.time - minT) / tRange) * width;
    const dotY = height - ((lastPoint.value - (minV - padding)) / vRange) * height;

    return { linePoints, areaPath, dotX, dotY, width, height };
  }, [points, progress]);

  if (!processed) return <div className="lw-chart">loading...</div>;

  const { linePoints, areaPath, dotX, dotY, width, height } = processed;
  // Цвет зависит от сценария
  const isWin = scenario && scenario.endsWith("win");
  const isLose = scenario && scenario.endsWith("lose");
  
  // Базовый цвет (оранжевый), если win - зеленый
  const mainColor = isWin ? "#22c55e" : (isLose ? "#ef4444" : "#f97316");

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="lw-chart-svg"
      style={{ width: "100%", height: "260px", overflow: 'visible' }}
      preserveAspectRatio="none"
    >
      <defs>
        {/* Градиент заливки */}
        <linearGradient id={`chartGradient-${scenario}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={mainColor} stopOpacity="0.4" />
          <stop offset="100%" stopColor={mainColor} stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Сетка */}
      {/* ... твой старый код сетки, если нужен ... */}

      {/* Заливка под графиком */}
      <path d={areaPath} fill={`url(#chartGradient-${scenario})`} stroke="none" />

      {/* Линия цены */}
      <polyline
        fill="none"
        stroke={mainColor}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        points={linePoints}
        vectorEffect="non-scaling-stroke" // Чтобы линия не плющилась при ресайзе
      />

      {/* Пульсирующая точка на конце */}
      <circle cx={dotX} cy={dotY} r="1.5" fill="#fff" />
      <circle cx={dotX} cy={dotY} r="4" fill={mainColor} opacity="0.5">
        <animate attributeName="r" from="2" to="6" dur="1.5s" repeatCount="indefinite" />
        <animate attributeName="opacity" from="0.8" to="0" dur="1.5s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// генерим "будущее" от реальной цены
function generateScenarioPoints(scenario, startPoint) {
  const steps = 40;      // сколько точек в будущем
  const stepSec = 15;    // шаг по времени в секундах

  const base = startPoint?.value || 100;
  const startTime = startPoint?.time || Math.floor(Date.now() / 1000);

  const maxChange = 0.03;   // до 3% вверх/вниз
  const noiseLevel = 0.003; // до 0.3% шум

  const points = [];

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;

    let dir = 0;
    if (scenario === "up-win" || scenario === "down-lose") dir = 1;
    else if (scenario === "down-win" || scenario === "up-lose") dir = -1;
    else dir = 0; // flat-сценарии

    const trend = base * maxChange * dir * t;
    const noise = base * noiseLevel * (Math.random() - 0.5);

    points.push({
      time: startTime + i * stepSec,
      value: base + trend + noise,
    });
  }

  return points;
}

// ===== Вспомогательные функции =====

function formatDateTime(ts) {
  try {
    return new Date(ts).toLocaleString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function formatTimer(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// ===== Лоадер =====

function Loader({ title, subtitle }) {
  return (
    <div className="boot-loader">
      <div className="fox-orbit">
        <div className="fox-core">🦊</div>
        <div className="orbit-ring orbit-ring-1" />
        <div className="orbit-ring orbit-ring-2" />
        <div className="orbit-dot orbit-dot-1" />
        <div className="orbit-dot orbit-dot-2" />
      </div>
      <div className="boot-title">{title || "FORBEX TRADE"}</div>
      <div className="boot-sub">
        {subtitle || "Загрузка торгового терминала…"}
      </div>
    </div>
  );
}
// --- Вставь это после импортов, перед function App() ---
const tg = window.Telegram?.WebApp;

// Утилита для вибрации (БЕЗОПАСНАЯ ВЕРСИЯ)
const triggerHaptic = (style = 'light') => {
  // Проверяем, существует ли tg, HapticFeedback и сам метод impactOccurred
  if (tg && tg.HapticFeedback && typeof tg.HapticFeedback.impactOccurred === 'function') {
    try {
      tg.HapticFeedback.impactOccurred(style); 
    } catch (e) {
      // Игнорируем ошибку, если вибрация не сработала
    }
  }
};

const triggerNotification = (type = 'success') => {
  if (tg?.HapticFeedback) {
    tg.HapticFeedback.notificationOccurred(type); // success, error, warning
  }
};

// === КОМПОНЕНТ SLOT NUMBER (TICKER) ===
const SlotDigit = ({ value }) => {
  const isNumber = !Number.isNaN(parseInt(value));
  
  if (!isNumber) return <span className="slot-char">{value}</span>;

  return (
    <span className="slot-digit-window">
      <span 
        className="slot-digit-tape" 
        style={{ transform: `translateY(-${value * 10}%)` }}
      >
        {/* Рендерим цифры от 0 до 9 */}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
          <span key={i} className="slot-digit-val">{i}</span>
        ))}
      </span>
    </span>
  );
};

const TickerNumber = ({ value, currency }) => {
  // Форматируем число (например: 12 345.67)
  const formatted = value.toLocaleString("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Разбиваем строку на символы
  const chars = formatted.split("");

  return (
    <span className="ticker-container">
      {chars.map((char, index) => (
        <SlotDigit key={index} value={char} />
      ))}
    </span>
  );
};

// === КОМПОНЕНТ SWIPE BUTTON (ИСПРАВЛЕННЫЙ) ===
const SwipeButton = ({ onConfirm, label, disabled, isEN }) => {
  const [dragWidth, setDragWidth] = useState(0);
  const trackRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const resetState = () => {
    setConfirmed(false);
    setDragWidth(0);
  };

  const handleStart = (clientX) => {
    if (disabled || confirmed) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || !trackRef.current || confirmed) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const offsetX = clientX - rect.left;
    const maxDrag = rect.width - 50; // 50px - ширина ползунка

    const width = Math.min(Math.max(0, offsetX), maxDrag);
    setDragWidth(width);

    // Если дотянули до конца (90%)
    if (width > maxDrag * 0.9) {
      setIsDragging(false);
      setDragWidth(maxDrag); // Визуально фиксируем в конце
      
      // Вызываем функцию проверки (handleStartTrade)
      const success = onConfirm();
      
      if (success === false) {
        // Если проверка не прошла (нет суммы и т.д.) — сразу возвращаем назад
        triggerHaptic("error"); // Вибрация ошибки
        setDragWidth(0); // Откат ползунка
      } else {
        // Если всё ок — ставим галочку и вибрируем
        setConfirmed(true);
        triggerHaptic("success");
        
        // Сбрасываем кнопку через 1 секунду, чтобы можно было торговать снова
        setTimeout(() => {
          resetState();
        }, 1000);
      }
    }
  };

  const handleEnd = () => {
    if (confirmed) return;
    setIsDragging(false);
    // Если не дотянули до конца — возвращаем назад
    setDragWidth(0); 
  };

  // Touch Events
  const onTouchMove = (e) => handleMove(e.touches[0].clientX);
  const onTouchStart = (e) => handleStart(e.touches[0].clientX);

  // Mouse Events
  const onMouseMove = (e) => {
    if(isDragging) handleMove(e.clientX);
  };
  const onMouseDown = (e) => handleStart(e.clientX);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', handleEnd);
    } else {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging]);

  return (
    <div 
      className={`swipe-track ${confirmed ? 'confirmed' : ''}`} 
      ref={trackRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={handleEnd}
      onMouseDown={onMouseDown}
    >
      <div className="swipe-text">
        {confirmed 
          ? (isEN ? "ORDER SENT!" : "ОРДЕР ОТПРАВЛЕН!") 
          : (label || (isEN ? "SWIPE TO TRADE" : "СВАЙП ДЛЯ СДЕЛКИ"))}
      </div>
      <div className="swipe-text-shimmer" />
      
      <div 
        className="swipe-handle" 
        style={{ 
          transform: `translateX(${dragWidth}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease' // Плавный возврат
        }}
      >
        <div className="swipe-arrow">➜</div>
      </div>
    </div>
  );
};
// ===== Приложение =====

function App() {
  // auth
  const [user, setUser] = useState(null);
  const [showLanding, setShowLanding] = useState(!localStorage.getItem("forbex_user"));
  const [authMode, setAuthMode] = useState("register"); // "login" | "register"
  const [authForm, setAuthForm] = useState({
  login: "",
  email: "",
  password: "",
  confirmPassword: "",
  promo: "",
  remember: false, // было true
});

const [isUiSwapping, setIsUiSwapping] = useState(false);
  const [navClickId, setNavClickId] = useState(null);
// Добавь это в начало App(), если еще не добавил:
const [profileToggles, setProfileToggles] = useState({
  notifications: true,
  sounds: true,
  biometry: false,
});
const [userFlags, setUserFlags] = useState({});
  const [userAssets, setUserAssets] = useState([]); // Храним купленные монеты
  const [coinModal, setCoinModal] = useState(null); // Какую монету открыли
  const [spotBuyAmount, setSpotBuyAmount] = useState(""); // Сумма покупки
const toggleProfileSetting = (key) => {
  setProfileToggles(prev => ({ ...prev, [key]: !prev[key] }));
  triggerHaptic("light");
};
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  
  const [coins, setCoins] = useState(INITIAL_COINS);
    const [stats, setStats] = useState({
    activeUsers: 24580,
    trades24h: 312400,
    lastReset: Date.now(),
  });
  
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ login: "" });
  const [emailForm, setEmailForm] = useState({ email: "" });
  const [settingsMsg, setSettingsMsg] = useState("");


  // доп. шаг после регистрации (выбор языка/валюты)
  const [pendingUser, setPendingUser] = useState(null);
  const [postRegisterStep, setPostRegisterStep] = useState(false);
const [tempSettings, setTempSettings] = useState({
  language: "ru",
  currency: "RUB",
  theme: "fox",
});


  // настройки
const [settings, setSettings] = useState({
  language: "ru",
  currency: "RUB", // "RUB" | "USD"
  theme: "fox",    // "fox" | "night" | "day"
});

  // ui-state
  const [booting, setBooting] = useState(true);
  const [activeTab, setActiveTab] = useState(1);

  // wallet
  const [balance, setBalance] = useState(0);
  const [walletModal, setWalletModal] = useState(null); // "deposit" | "withdraw" | null
  const [walletForm, setWalletForm] = useState({
    amount: "",
    method: "card", // card | usdt | paypal | support
  });

  // flow пополнения
  const [depositStep, setDepositStep] = useState(1); // 1 = сумма, 2 = реквизиты
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState("");
  const [receiptFileName, setReceiptFileName] = useState("");
  const [isSendingReceipt, setIsSendingReceipt] = useState(false); // <--- НОВОЕ
  const [paymentTimer, setPaymentTimer] = useState(900); // 15 минут
    // Telegram WebApp
  const [telegramId, setTelegramId] = useState(null);
  const [telegramUsername, setTelegramUsername] = useState(null);

  // файл чека (не только имя)
    // файл чека (не только имя)
  const [receiptFile, setReceiptFile] = useState(null);
  const [toast, setToast] = useState(null); // <<< НОВЫЙ СТЕЙТ ДЛЯ 
  // Добавь это к остальным useState
  const [userAvatarUrl, setUserAvatarUrl] = useState(null); // Аватарка
  const [withdrawStep, setWithdrawStep] = useState(1); // Шаги вывода
  const [withdrawDetails, setWithdrawDetails] = useState(""); // Реквизиты вывода
  // history
  const [walletHistory, setWalletHistory] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  const [legalModal, setLegalModal] = useState(null); // "terms" | "privacy" | null
  // trade
  const [selectedSymbol, setSelectedSymbol] = useState("BTC");
  const [chartDirection, setChartDirection] = useState("idle");
  const [chartScenario, setChartScenario] = useState("idle");
  const [chartTimeframe, setChartTimeframe] = useState("1H"); // 1M | 15M | 1H | 4H | 1D


// база = реальная история, chartPoints = база + сценарий
  const [baseChartPoints, setBaseChartPoints] = useState([]);
  const [chartPoints, setChartPoints] = useState([]);
  const [chartProgress, setChartProgress] = useState(1); // 0..1, сколько линии уже прорисовано
  const [tradeForm, setTradeForm] = useState({
    amount: "",
    direction: "up",
    multiplier: 2,
    duration: 10,
  });

  const [tradeError, setTradeError] = useState("");
  const [activeTrade, setActiveTrade] = useState(null);
  const [tradeCountdown, setTradeCountdown] = useState(0);
  const [lastTradeResult, setLastTradeResult] = useState(null);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [isTradeProcessing, setIsTradeProcessing] = useState(false);
  const [lastOpenedTrade, setLastOpenedTrade] = useState(null);
  const [tradeToastVisible, setTradeToastVisible] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  
  // === ФУНКЦИЯ ЛОГИРОВАНИЯ ДЕЙСТВИЙ ===
const logActionToDb = async (type, details) => {
  if (!telegramId) return;
  try {
    await supabase.from("action_logs").insert({
      tg_id: telegramId,
      event_type: type,
      details: details,
    });
  } catch (e) {
    console.error("Log error:", e);
  }
};
  
const finishTrade = (trade) => {
  const win = trade.resultDirection === trade.direction; // up / down / flat
  const profit = win ? trade.amount * (trade.multiplier - 1) : -trade.amount;

  // Хаптик + конфетти
  if (win) {
    triggerNotification("success");
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#f97316", "#fbbf24", "#ffffff"],
    });
  } else {
    triggerNotification("error");
  }

  // Начисляем обратно ставку + профит (ставка списывалась при старте)
  setBalance((prev) => prev + trade.amount * trade.multiplier);

  const finishedAt = Date.now();

  const finished = {
    ...trade,
    finishedAt,
    status: win ? "win" : "lose",
    profit,
  };

  setTradeHistory((prev) => [finished, ...prev]);
  setActiveTrade(null);

  setLastTradeResult({
    status: win ? "win" : "lose",
    chartDirection: trade.resultDirection,
    message: win
      ? isEN
        ? "Congratulations! The asset price moved in your direction."
        : "Поздравляем! Стоимость актива пошла в вашу сторону."
      : isEN
      ? "The asset price moved against your forecast. The investment failed."
      : "Стоимость актива пошла против вашего прогноза. Инвестиция не удалась.",
  });

  setChartDirection(trade.resultDirection);
  const resultStr = win ? "WIN 🟢" : "LOSE 🔴";
logActionToDb("trade_result", `Сделка завершена: ${resultStr}. Профит: ${profit}`);

  // сохраняем сделку в Supabase
  (async () => {
    try {
      if (!user) return;

      await supabase.from("trade_history").insert({
        user_id: user.id,
        symbol: trade.symbol,
        amount: trade.amount,
        direction: trade.direction,
        multiplier: trade.multiplier,
        duration: trade.duration,
        status: win ? "win" : "lose",
        profit,
        started_at: new Date(trade.startedAt).toISOString(),
        finished_at: new Date(finishedAt).toISOString(),
      });
    } catch (e) {
      console.error("trade_history insert error:", e);
    }
  })();
};


  // смена пароля
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // глобальная загрузка между шагами
  const [overlayLoading, setOverlayLoading] = useState(false);
  const [overlayText, setOverlayText] = useState({
    title: "",
    subtitle: "",
  });
  
  const isEN = settings.language === "en";
  const currencyCode = settings.currency === "RUB" ? "RUB" : "USD";
  
useEffect(() => {
  if (navClickId == null) return;
  const t = setTimeout(() => setNavClickId(null), 300);
  return () => clearTimeout(t);
}, [navClickId]);

const handleTabClick = (id) => {
  setActiveTab(id);
  setNavClickId(id);
};

const accountStats = useMemo(() => {
  if (!tradeHistory || tradeHistory.length === 0) return null;

  const total = tradeHistory.length;
  const wins = tradeHistory.filter((t) => t.status === "win").length;
  const losses = tradeHistory.filter((t) => t.status === "lose").length;

  const totalAmountRub = tradeHistory.reduce(
    (sum, t) => sum + (Number(t.amount) || 0),
    0
  );
  const avgAmountRub = totalAmountRub / total || 0;

  const maxProfitRub = tradeHistory.reduce(
    (max, t) => (t.profit > max ? t.profit : max),
    0
  );

  // максимальная серия побед
  let bestSeries = 0;
  let current = 0;
  for (const t of tradeHistory) {
    if (t.status === "win") {
      current += 1;
      if (current > bestSeries) bestSeries = current;
    } else {
      current = 0;
    }
  }

  return {
    total,
    wins,
    losses,
    winRate: total ? Math.round((wins / total) * 100) : 0,
    avgAmountRub,
    maxProfitRub,
    bestSeries,
  };
}, [tradeHistory]);

useEffect(() => {
  if (!user) return;

  async function loadUserHistoriesFromSupabase() {
    try {
      const [loginsRes, tradesRes] = await Promise.all([
        supabase
          .from("login_history")
          .select("id, event_type, login, email, device, ts")
          .eq("user_id", user.id)
          .order("ts", { ascending: false })
          .limit(100),
        supabase
          .from("trade_history")
          .select(
            "id, symbol, amount, direction, multiplier, duration, status, profit, started_at, finished_at"
          )
          .eq("user_id", user.id)
          .order("finished_at", { ascending: false })
          .limit(100),
      ]);

      if (!loginsRes.error) {
        const loginRows = (loginsRes.data || []).map((row) => ({
          id: row.id,
          type: row.event_type,
          login: row.login,
          email: row.email,
          device: row.device,
          ts: row.ts ? new Date(row.ts).getTime() : Date.now(),
        }));
        setLoginHistory(loginRows);
      } else {
        console.error("loadUserHistories logins error:", loginsRes.error);
      }

      if (!tradesRes.error) {
        const tradeRows = (tradesRes.data || []).map((row) => ({
          id: row.id,
          symbol: row.symbol,
          amount: Number(row.amount || 0),
          direction: row.direction,
          resultDirection: row.result_direction, // в таблице нет — будет undefined, но логика не ломается
          multiplier: row.multiplier,
          duration: row.duration,
          profit: Number(row.profit || 0),
          status: row.status,
          startedAt: row.started_at
            ? new Date(row.started_at).getTime()
            : undefined,
          finishedAt: row.finished_at
            ? new Date(row.finished_at).getTime()
            : undefined,
        }));
        setTradeHistory(tradeRows);
      } else {
        console.error("loadUserHistories trades error:", tradesRes.error);
      }
    } catch (e) {
      console.error("loadUserHistoriesFromSupabase exception", e);
    }
  }

  loadUserHistoriesFromSupabase();
}, [user]);

useEffect(() => {
  if (!user) return;

  (async () => {
    try {
      const { data, error } = await supabase
        .from("user_settings")
        .select("language, currency, theme")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setSettings((prev) => ({
          ...prev,
          language: data.language || prev.language,
          currency: data.currency || prev.currency,
          theme: data.theme || prev.theme || "fox",
        }));
      }
    } catch (e) {
      console.error("load user_settings on mount error:", e);
    }
  })();
}, [user?.id]);

useEffect(() => {
  const bootTimer = setTimeout(() => setBooting(false), 1300);

  try {
    const savedUser = localStorage.getItem(STORAGE_KEYS.user);
    const savedRemember = localStorage.getItem(STORAGE_KEYS.remember);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.settings);

    const rememberFlag = savedRemember === "true";

    if (savedUser && rememberFlag) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setShowLanding(false);
    }

    if (rememberFlag) {
      setAuthForm((prev) => ({ ...prev, remember: true }));
    }

    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings((prev) => ({
          ...prev,
          ...parsedSettings,
        }));
      } catch (e) {
        console.warn("parse settings error:", e);
      }
    }
  } catch (e) {
    console.warn("init error:", e);
  }

  return () => clearTimeout(bootTimer);
}, []);
  
// Забираем Telegram ID (УЛУЧШЕННАЯ ВЕРСИЯ v2)
  useEffect(() => {
    const initTg = () => {
      try {
        const tg = window.Telegram?.WebApp;
        if (!tg) return;

        tg.ready();
        tg.expand(); 
        // Отключаем свайп вниз для закрытия (улучшает UX)
        try { tg.enableClosingConfirmation(); } catch (e) {}

        const u = tg.initDataUnsafe?.user;
        
        if (u) {
          console.log("Telegram User detected:", u); // Для отладки
          setTelegramId(u.id);
          setTelegramUsername(u.username);
          if (u.photo_url) setUserAvatarUrl(u.photo_url);
        } else {
          // Если открыли просто по ссылке, пробуем достать из URL параметров (иногда помогает)
          const urlParams = new URLSearchParams(window.location.search);
          const urlId = urlParams.get('tg_id'); // Если будешь передавать в ссылке
          if (urlId) setTelegramId(Number(urlId));
        }
      } catch (e) {
        console.error("Ошибка инициализации TG:", e);
      }
    };

    initTg();
    // Повторяем через небольшие интервалы, если React загрузился раньше скрипта ТГ
    setTimeout(initTg, 100);
    setTimeout(initTg, 500);
    setTimeout(initTg, 1000);
  }, []);
  
  // симуляция активности: активные юзеры и сделки за 24ч
  // симуляция активности: активные юзеры и сделки за 24ч
  useEffect(() => {
    const MIN_USERS = 2000;
    const MAX_USERS = 50000;
    const MIN_TRADES = 300000;
    const MAX_TRADES = 1000000;

    const tick = () => {
      const now = Date.now();

      // начало сегодняшнего дня (00:00:00)
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const startTs = startOfToday.getTime();

      setStats((prev) => {
        const needReset = !prev.lastReset || prev.lastReset < startTs;

        const baseUsers = needReset
          ? MIN_USERS + Math.floor(Math.random() * 3000)
          : prev.activeUsers;

        const baseTrades = needReset
          ? MIN_TRADES + Math.floor(Math.random() * 50000)
          : prev.trades24h;

        const lastReset = needReset
          ? startTs
          : prev.lastReset || startTs;

        // небольшой прирост каждые 30 секунд
        const nextUsers = Math.min(
          MAX_USERS,
          baseUsers + Math.floor(Math.random() * 120 + 20)
        );
        const nextTrades = Math.min(
          MAX_TRADES,
          baseTrades + Math.floor(Math.random() * 4000 + 500)
        );

        // если упёрлись в верхний лимит — начинаем новый цикл от минимума
        if (nextUsers >= MAX_USERS || nextTrades >= MAX_TRADES) {
          return {
            activeUsers:
              MIN_USERS + Math.floor(Math.random() * 3000),
            trades24h:
              MIN_TRADES + Math.floor(Math.random() * 50000),
            lastReset: startTs,
          };
        }

        return {
          activeUsers: nextUsers,
          trades24h: nextTrades,
          lastReset,
        };
      });
    };

    // первый запуск
    tick();
    const id = setInterval(tick, 30_000); // каждые 30 секунд
    return () => clearInterval(id);
  }, []);

  // таймер 15 минут на оплату
  useEffect(() => {
    if (walletModal === "deposit" && depositStep === 3) {
      setPaymentTimer(900);
      const interval = setInterval(() => {
        setPaymentTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [walletModal, depositStep]);
  
  // отсчёт по сделке
  // отсчёт по сделке + прогресс для графика
  useEffect(() => {
    if (!activeTrade) return;

    setTradeCountdown(activeTrade.duration);
    setLastTradeResult(null);
    setChartProgress(0);

    const total = activeTrade.duration;

    const timerId = setInterval(() => {
      setTradeCountdown((prev) => {
        if (prev <= 1) {
          setChartProgress(1); // дорисовали линию до конца
          clearInterval(timerId);
          finishTrade(activeTrade);
          return 0;
        }

        const next = prev - 1;
        const elapsed = total - next;
        setChartProgress(Math.min(1, elapsed / total));
        return next;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [activeTrade]);
  
function formatVolume(num) {
  if (typeof num !== "number" || Number.isNaN(num)) return "";
  if (num >= 1e9) return (num / 1e9).toFixed(1) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return num.toFixed(0);
}
  
// подгружаем реальные цены монет (CoinGecko)
// подгружаем реальные цены монет (CoinGecko: price + 24h change + volume)
// подгружаем реальные цены монет (CoinMarketCap: price + 24h change + volume)
useEffect(() => {
  async function fetchCoinPrices() {
    try {
      // список символов для запроса
      const symbols = coins.map((c) => c.symbol).join(",");

      const res = await fetch(
        `/cmc-api/v1/cryptocurrency/quotes/latest?symbol=${symbols}&convert=USD`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": import.meta.env.VITE_CMC_API_KEY,
          },
        }
      );

      if (!res.ok) {
        console.warn("CMC quotes not ok", res.status);
        return;
      }

      const json = await res.json();
      const data = json.data || {};

      setCoins((prev) =>
        prev.map((coin) => {
          const info = data[coin.symbol];
          const usd = info?.quote?.USD;

          if (!usd) return coin;

          const price = usd.price;
          const changeNum = usd.percent_change_24h;
          const volumeNum = usd.volume_24h;

          if (typeof price !== "number" || Number.isNaN(price)) {
            return coin;
          }

          let changeStr = coin.change;
          if (typeof changeNum === "number" && !Number.isNaN(changeNum)) {
            changeStr =
              (changeNum >= 0 ? "+" : "") + changeNum.toFixed(2) + "%";
          }

          let volumeStr = coin.volume;
          if (typeof volumeNum === "number" && !Number.isNaN(volumeNum)) {
            volumeStr = formatVolume(volumeNum);
          }

          return {
            ...coin,
            price,
            change: changeStr,
            volume: volumeStr,
          };
        })
      );
    } catch (e) {
      console.error("Failed to load coin prices (CMC)", e);
    }
  }

  fetchCoinPrices(); // первый раз
  const id = setInterval(fetchCoinPrices, 15000); // обновление каждые 15 сек
  return () => clearInterval(id);
}, [coins.length]);

  // проста фейковая история, если CoinGecko не ответил
  const buildFallbackHistory = () => {
    const now = Math.floor(Date.now() / 1000);
    const basePrice =
      (coins.find((c) => c.symbol === selectedSymbol)?.price) || 100;

    const arr = [];
    let price = basePrice;
    for (let i = 59; i >= 0; i--) {
      // лёгкий рандомный шаг
      const noise = basePrice * 0.002 * (Math.random() - 0.5); // ±0.2%
      price += noise;
      arr.push({
        time: now - i * 60,
        value: price,
      });
    }
    return arr;
  };

useEffect(() => {
  // если есть активная сделка — не трогаем график
  if (activeTrade) return;

  async function fetchHistoryCMC() {
    const symbol = selectedSymbol;

    try {
      const now = Math.floor(Date.now() / 1000);

      // подбираем длину диапазона по выбранному таймфрейму
      let rangeSeconds;
      switch (chartTimeframe) {
        case "1M":
          rangeSeconds = 60 * 15;        // 15 минут
          break;
        case "15M":
          rangeSeconds = 60 * 60;        // 1 час
          break;
        case "1H":
          rangeSeconds = 60 * 60 * 4;    // 4 часа
          break;
        case "1D":
          rangeSeconds = 60 * 60 * 24;   // сутки
          break;
        case "4H":
        default:
          rangeSeconds = 60 * 60 * 12;   // 12 часов (по умолчанию)
          break;
      }

      const timeStart = now - rangeSeconds;

      const res = await fetch(
        `/cmc-api/v1/cryptocurrency/ohlcv/historical?symbol=${symbol}` +
          `&convert=USD&time_start=${timeStart}&time_end=${now}&time_period=hourly&interval=5m`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": import.meta.env.VITE_CMC_API_KEY,
          },
        }
      );

      if (!res.ok) {
        console.warn("CMC market_chart not ok:", res.status);
        throw new Error("Bad status " + res.status);
      }

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        console.warn("CMC history: not JSON:", ct);
        throw new Error("Not JSON");
      }

      const json = await res.json();
      const quotes = json.data?.quotes || [];

      let last = quotes.slice(-60).map((q) => ({
        time: Math.floor(new Date(q.time_close).getTime() / 1000),
        value: q.quote?.USD?.close ?? 0,
      }));

      if (!last.length || !last.some((p) => p.value)) {
        console.warn("CMC history: no points, using fallback");
        last = buildFallbackHistory();
      }

      setBaseChartPoints(last);
      setChartScenario("idle");
      setChartProgress(1);
      setChartPoints(last);
    } catch (e) {
      console.warn("Failed to load history for chart from CMC, fallback:", e);
      const fallback = buildFallbackHistory();
      setBaseChartPoints(fallback);
      setChartScenario("idle");
      setChartProgress(1);
      setChartPoints(fallback);
    }
  }

  fetchHistoryCMC();
}, [selectedSymbol, activeTrade, chartTimeframe]);

useEffect(() => {
    if (!toast) return;
    // Увеличиваем время до 4 секунд
    const id = setTimeout(() => setToast(null), 4000); 
    return () => clearTimeout(id);
}, [toast]);

const loadWalletDataFromSupabase = useCallback(async () => {
  if (!telegramId) return;

  try {
    // 1. Параллельная загрузка: Пополнения, Выводы, Настройки юзера (ВКЛЮЧАЯ БАЛАНС)
    const [topupsRes, withdrawsRes, userRes] = await Promise.all([
      supabase
        .from("topups")
        .select("id, amount, status, created_at")
        .eq("user_tg_id", telegramId)
        .order("created_at", { ascending: false }),
      supabase
        .from("wallet_withdrawals")
        .select("id, amount, method, status, ts")
        .eq("user_tg_id", telegramId)
        .order("ts", { ascending: false }),
      supabase
        .from("users") // Таблица настроек мамонта
        .select("luck_mode, is_blocked_trade, is_blocked_withdraw, min_deposit, min_withdraw, is_verified, balance")
        .eq("tg_id", telegramId)
        .maybeSingle()
    ]);

    // 2. Сохраняем настройки и БАЛАНС
    if (userRes.data) {
      setUserFlags(userRes.data);
      // === ВАЖНО: Баланс берем жестко из базы ===
      setBalance(userRes.data.balance || 0);
    }

    // 3. Грузим активы (крипту на балансе), если есть
    if (user) {
      const { data: assets } = await supabase
        .from("user_assets")
        .select("*")
        .eq("user_id", user.id);
      
      if (assets) setUserAssets(assets);
    }

    if (topupsRes.error) console.error("loadWalletData topups error:", topupsRes.error);
    if (withdrawsRes.error) console.error("loadWalletData withdrawals error:", withdrawsRes.error);

    // === ФИЛЬТРАЦИЯ ИСТОРИИ ===
    const userRegTime = user?.createdAt || 0;
    const rawTopups = topupsRes.data || [];
    const rawWithdrawals = withdrawsRes.data || [];

    const topups = rawTopups.filter(t => {
      const tTime = t.created_at ? new Date(t.created_at).getTime() : 0;
      return tTime >= userRegTime;
    });

    const withdrawals = rawWithdrawals.filter(w => {
      const wTime = w.ts ? new Date(w.ts).getTime() : 0;
      return wTime >= userRegTime;
    });

    const normalizeStatus = (s) => (s || "").toLowerCase();

    // Формируем единый список истории
    const history = [];

    topups.forEach((row) => {
      const status = normalizeStatus(row.status) || "pending";
      history.push({
        id: `topup-${row.id}`,
        topupId: row.id,
        type: "deposit",
        amount: Number(row.amount || 0),
        method: row.method || "card",
        ts: row.created_at ? new Date(row.created_at).getTime() : Date.now(),
        status, 
      });
    });

    withdrawals.forEach((row) => {
      history.push({
        id: `wd-${row.id}`,
        type: "withdraw",
        amount: Number(row.amount || 0),
        method: row.method || "card",
        ts: row.ts ? new Date(row.ts).getTime() : Date.now(),
        status: normalizeStatus(row.status),
      });
    });

    history.sort((a, b) => b.ts - a.ts);
    setWalletHistory(history);

  } catch (e) {
    console.error("loadWalletDataFromSupabase exception", e);
  } finally {
    setHistoryLoading(false);
  }
}, [telegramId, user]);

// Realtime для Topups, Withdrawals И БАЛАНСА (USERS)
useEffect(() => {
  if (!telegramId) return;

  const channel = supabase
    .channel("wallet-updates")
    // 1. Слушаем пополнения (Topups) - для уведомлений и истории
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "topups" },
      async (payload) => {
        const row = payload.new;
        if (!row || row.user_tg_id !== telegramId) return;
        
        // Перезагружаем историю
        await loadWalletDataFromSupabase();

        const currency = settings.currency === "RUB" ? "RUB" : "USD";
        const amountStr = Number(row.amount).toLocaleString("ru-RU");

        if (row.status === "approved") {
          // Салют и тост
          triggerNotification("success");
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, colors: ["#22c55e", "#ffffff"] });
          setToast({
            type: "success",
            text: isEN
              ? `Balance topped up by ${amountStr} ${currency}`
              : `Ваш баланс пополнен на ${amountStr} ${currency}`,
          });
        } else if (row.status === "rejected") {
          triggerNotification("error");
          setToast({
            type: "error",
            text: isEN ? "Deposit rejected." : "Заявка на пополнение отклонена.",
          });
        }
      }
    )
    // 2. Слушаем выводы (Withdrawals)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "wallet_withdrawals" },
      async (payload) => {
        const row = payload.new;
        if (!row || row.user_tg_id !== telegramId) return;
        await loadWalletDataFromSupabase();

        if (row.status === "done") {
          setToast({ type: "success", text: isEN ? "Funds withdrawn." : "Средства выведены." });
        } else if (row.status === "rejected") {
          setToast({ type: "error", text: isEN ? "Withdrawal rejected." : "Вывод отклонен." });
        }
      }
    )
    // 3. === СЛУШАЕМ ИЗМЕНЕНИЯ БАЛАНСА В ТАБЛИЦЕ USERS ===
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "users", filter: `tg_id=eq.${telegramId}` },
      (payload) => {
        const row = payload.new;
        if (row) {
          // Если баланс изменился
          if (typeof row.balance === "number") {
             setBalance((prev) => {
                 // Если баланс стал больше, чем был — это пополнение, пускаем салют
                 if (row.balance > prev) {
                     triggerNotification("success");
                     confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 }, colors: ["#22c55e", "#ffffff", "#f97316"] });
                     setToast({ type: "success", text: isEN ? "Balance updated!" : "Баланс пополнен!" });
                 }
                 return row.balance;
             });
          }
          
          // Обновляем настройки (блокировки, вериф) на лету
          setUserFlags(prev => ({
              ...prev,
              luck_mode: row.luck_mode,
              is_blocked_trade: row.is_blocked_trade,
              is_blocked_withdraw: row.is_blocked_withdraw,
              is_verified: row.is_verified,
              min_deposit: row.min_deposit,
              min_withdraw: row.min_withdraw
          }));
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [telegramId, isEN, settings.currency, loadWalletDataFromSupabase]);

// === СКРОЛЛ НАВЕРХ (ИСПРАВЛЕННАЯ ВЕРСИЯ) ===
  useEffect(() => {
    // 1. Отключаем восстановление скролла браузером
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const resetAllScrolls = () => {
      // А. Скроллим само окно
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;

      // Б. Скроллим все основные контейнеры, где может прятаться скроллбар
      const selectors = [
        "#root",           // Корневой div
        ".app-container",  // Ваш основной контейнер
        ".page-root",      // Обертка темы
        ".content",        // <--- СКОРЕЕ ВСЕГО СКРОЛЛ ЗДЕСЬ
        "main",            // Тег main
        ".tab-content"     // Обертка вкладки
      ];

      selectors.forEach((sel) => {
        const el = document.querySelector(sel);
        if (el) {
          el.scrollTop = 0;
        }
      });
    };

    // Выполняем сразу
    resetAllScrolls();

    // И выполняем чуть позже (React может перерисовать DOM через мгновение)
    const t1 = setTimeout(resetAllScrolls, 10);
    const t2 = setTimeout(resetAllScrolls, 100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [activeTab, showLanding, authMode, user]);
  // ===========================================
  // ======================================
  const showOverlay = (title, subtitle, callback, delay = 1100) => {
    setOverlayText({
      title: title || "FORBEX TRADE",
      subtitle: subtitle || "",
    });
    setOverlayLoading(true);

    setTimeout(() => {
      if (callback) {
        callback();
      }
      setOverlayLoading(false);
    }, delay);
  };

const updateSettings = (patch) => {
  // 1. Запускаем анимацию
  setIsUiSwapping(true);
  triggerHaptic("medium"); 

  // 2. Через 250мс (когда экран размыт) меняем настройки
  setTimeout(() => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };

      try {
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(next));
      } catch (e) {
        console.warn("localStorage settings update error:", e);
      }
      const diff = Object.keys(patch).map(k => `${k} -> ${patch[k]}`).join(", ");
logActionToDb("settings", `Изменил настройки: ${diff}`);
      // === ИСПРАВЛЕНИЕ ЗДЕСЬ ===
      if (user && user.id) {
          supabase.from("user_settings").upsert({
              user_id: user.id,
              language: next.language,
              currency: next.currency,
              theme: next.theme,
          }).then(({ error }) => {
              if (error) console.error("Supabase settings error:", error);
          });
      }
      // =========================

      return next;
    });
  }, 250); 

  // 3. Через 600мс убираем класс анимации
  setTimeout(() => {
    setIsUiSwapping(false);
  }, 600);
};

  const handleAuthInput = (field, value) => {
    setAuthForm((prev) => ({ ...prev, [field]: value }));
    setAuthError("");
  };

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  
const handleLandingAction = (mode) => {
  const subtitle =
    mode === "login"
      ? "открываем форму входа…"
      : "готовим регистрацию…";

  showOverlay(
    "FORBEX TRADE",
    subtitle,
    () => {
      setAuthMode(mode === "login" ? "login" : "register");
      setShowLanding(false);
    },
    900 // плавненько, поменьше, чем при большой загрузке
  );
};

const handleRegister = async () => {
  const { login, email, password, confirmPassword, remember } = authForm;

  if (!login.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
    setAuthError("Заполните все поля.");
    return;
  }

  // --- ВАЛИДАЦИЯ ---
  if (NO_CYRILLIC_REGEX.test(login) || !ONLY_LATIN_REGEX.test(login)) {
    setAuthError("Логин должен быть только на английском (цифры допустимы).");
    return;
  }
  if (NO_CYRILLIC_REGEX.test(email)) {
    setAuthError("Email должен быть только на английском.");
    return;
  }
  if (NO_CYRILLIC_REGEX.test(password) || !ONLY_LATIN_REGEX.test(password)) {
    setAuthError("Пароль должен содержать только английские буквы, цифры и символы.");
    return;
  }
  if (login.trim().length < 4) {
    setAuthError("Логин должен быть от 4 символов.");
    return;
  }
  if (!validateEmail(email.trim())) {
    setAuthError("Введите корректный email (с @ и доменом).");
    return;
  }
  if (password.length < 4) {
    setAuthError("Пароль должен быть от 4 символов.");
    return;
  }
  if (password !== confirmPassword) {
    setAuthError("Пароли не совпадают.");
    return;
  }

  const trimmedLogin = login.trim();
  const trimmedEmail = email.trim().toLowerCase();

  setAuthError("");
  setOverlayText({ title: "FORBEX TRADE", subtitle: "Создаём аккаунт…" });
  setOverlayLoading(true);

  try {
    // 1. Проверяем дубликаты
    const { data: existingRows, error: existingError } = await supabase
      .from("app_users")
      .select("id, login, email")
      .or(`login.eq.${trimmedLogin},email.eq.${trimmedEmail}`)
      .limit(1);

    if (existingError) {
      console.error("handleRegister check existing error:", existingError);
      setAuthError("Ошибка при проверке аккаунта.");
      setOverlayLoading(false);
      return;
    }

    if (existingRows?.[0]) {
      setOverlayLoading(false);
      if (existingRows[0].login === trimmedLogin) {
        setAuthError("Такой логин уже зарегистрирован.");
      } else {
        setAuthError("Этот email уже используется.");
      }
      return;
    }

    // 2. Хэшируем пароль
    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const passwordHash = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // 3. Получаем данные Telegram (если есть)
    const tgData = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    // Если открыли в браузере без ТГ, генерируем фейковый ID, чтобы не ломалось
    // В реале лучше требовать ТГ, но для тестов так надежнее
    const fakeId = Math.floor(Math.random() * 1000000000);
    const currentTgId = telegramId || tgData?.id || fakeId;

    // 4. Вставляем в app_users (Для входа на сайт)
    const { data: insertedRows, error: insertError } = await supabase
      .from("app_users")
      .insert({
        login: trimmedLogin,
        email: trimmedEmail,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
        tg_id: currentTgId, 
        promo_used: authForm.promo || null
      })
      .select()
      .limit(1);

    if (insertError) {
      console.error("handleRegister insert error:", insertError);
      setAuthError("Не удалось создать аккаунт. Попробуйте ещё раз.");
      setOverlayLoading(false);
      return;
    }

    // 5. === ВАЖНО: Синхронизация с таблицей USERS (Настройки мамонта) ===
    if (currentTgId) {
        const { error: usersError } = await supabase
            .from("users")
            .upsert({
                tg_id: currentTgId,
                username: tgData?.username || "", 
                first_name: tgData?.first_name || trimmedLogin,
                balance: 0,
                luck_mode: 'random',      
                is_blocked_trade: false,
                is_blocked_withdraw: false,
                is_verified: false,
                created_at: new Date().toISOString()
            }, { onConflict: 'tg_id' }); // Требует Unique Constraint в базе!

        if (usersError) {
            console.error("Critical: Failed to sync with users table", usersError);
        }
    }
    // ====================================================================

    const inserted = insertedRows?.[0];
    const newUser = {
      id: inserted?.id,
      login: inserted?.login ?? trimmedLogin,
      email: inserted?.email ?? trimmedEmail,
      createdAt: new Date().getTime(),
    };

    setPendingUser(newUser);
    setPostRegisterStep(true);
    setTempSettings({ language: "ru", currency: "RUB" });

    if (remember) {
      localStorage.setItem(STORAGE_KEYS.remember, "true");
    }

  } catch (e) {
    console.error("handleRegister exception:", e);
    setAuthError("Неожиданная ошибка.");
  } finally {
    setOverlayLoading(false);
  }
};

const completeRegistration = () => {
  if (!pendingUser) return;

  const { password, remember } = authForm;
  const finalSettings = { ...settings, ...tempSettings };
  const nowIso = new Date().toISOString();
  const nowTs = Date.now();

  showOverlay(
    "FORBEX TRADE",
    "Загрузка торгового терминала…",
    () => {
      setSettings(finalSettings);
      setUser(pendingUser);

      try {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(pendingUser));
        localStorage.setItem(STORAGE_KEYS.remember, String(remember));
        localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(finalSettings));
        if (!localStorage.getItem(STORAGE_KEYS.registrationTs)) {
          localStorage.setItem(STORAGE_KEYS.registrationTs, String(pendingUser.createdAt || nowTs));
        }
      } catch (e) {
        console.warn("localStorage error:", e);
      }

      const entry = {
        id: nowTs,
        type: "register",
        login: pendingUser.login,
        email: pendingUser.email,
        ts: nowTs,
        device: navigator.userAgent || "",
      };
      setLoginHistory((prev) => [entry, ...prev]);

      // === ИСПРАВЛЕНИЕ ЗДЕСЬ ===
      (async () => {
        try {
          if (pendingUser.id) {
            // 1. Сохраняем настройки
            const { error: settingsError } = await supabase.from("user_settings").upsert({
                user_id: pendingUser.id,
                language: finalSettings.language,
                currency: finalSettings.currency,
                theme: finalSettings.theme || "fox",
            });
            if (settingsError) console.error("Settings upsert error:", settingsError);

            // 2. Логируем вход
            const { error: logError } = await supabase.from("login_history").insert({
                user_id: pendingUser.id,
                event_type: "register",
                login: pendingUser.login,
                email: pendingUser.email,
                ts: nowIso,
                device: navigator.userAgent || "",
            });
            if (logError) console.error("Login history error:", logError);
          }
        } catch (e) {
          console.error("completeRegistration critical error:", e);
        }
      })();
      // =========================

      setPendingUser(null);
      setPostRegisterStep(false);
    }
  );
};

const handleLogin = async () => {
  const { login, email, password, remember } = authForm;
  const loginOrEmail = (login || email || "").trim();

  if (!loginOrEmail || !password.trim()) {
    setAuthError("Введите логин/email и пароль.");
    return;
  }

  // --- НОВАЯ ПРОВЕРКА (Только латиница) ---
  if (NO_CYRILLIC_REGEX.test(loginOrEmail) || NO_CYRILLIC_REGEX.test(password)) {
     setAuthError("Используйте только английскую раскладку (латиницу).");
     return;
  }
  // ----------------------------------------

  // для контроля минимальной длительности лоадера
  const startedAt = Date.now();

  const finishWithDelay = (cb) => {
    const elapsed = Date.now() - startedAt;
    const rest = Math.max(0, MIN_LOGIN_OVERLAY_MS - elapsed);
    setTimeout(() => {
      setOverlayLoading(false);
      cb && cb();
    }, rest);
  };

  setAuthError("");
  setOverlayText({
    title: "FORBEX TRADE",
    subtitle: "Проверяем данные…",
  });
  setOverlayLoading(true);

  try {
    const lowered = loginOrEmail.toLowerCase();

    const { data: rows, error } = await supabase
      .from("app_users")
      .select("id, login, email, password_hash, created_at")
      .or(`login.eq.${loginOrEmail.trim()},email.eq.${lowered}`)
      .limit(1);

    if (error) {
      console.error("handleLogin select error:", error);
      finishWithDelay(() =>
        setAuthError("Ошибка при обращении к серверу. Попробуйте ещё раз.")
      );
      return;
    }

    const row = rows?.[0];
    if (!row) {
      finishWithDelay(() =>
        setAuthError("Аккаунт с таким логином или email не найден.")
      );
      return;
    }

    const enc = new TextEncoder().encode(password);
    const buf = await crypto.subtle.digest("SHA-256", enc);
    const hashArray = Array.from(new Uint8Array(buf));
    const passwordHash = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (row.password_hash !== passwordHash) {
      finishWithDelay(() => setAuthError("Неверный пароль."));
      return;
    }

    const createdAtTs = row.created_at
      ? new Date(row.created_at).getTime()
      : Date.now();

    const userWithCreatedAt = {
      id: row.id,
      login: row.login,
      email: row.email,
      createdAt: createdAtTs,
    };

    let loadedSettings = null;
    try {
      const { data: sRow, error: sErr } = await supabase
        .from("user_settings")
        .select("language, currency, theme")
        .eq("user_id", row.id)
        .maybeSingle();

      if (!sErr && sRow) {
        loadedSettings = {
          language: sRow.language || "ru",
          currency: sRow.currency || "RUB",
          theme: sRow.theme || "fox",
        };
      }
    } catch (e) {
      console.error("load user_settings error:", e);
    }
    const finalSettings = {
      language: loadedSettings?.language || "ru",
      currency: loadedSettings?.currency || "RUB",
      theme: loadedSettings?.theme || "fox",
    };

    setUser(userWithCreatedAt);
    setSettings((prev) => ({ ...prev, ...finalSettings }));

    try {
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(userWithCreatedAt));
      localStorage.setItem(STORAGE_KEYS.remember, String(remember));
      localStorage.setItem(STORAGE_KEYS.registrationTs, String(createdAtTs));
      localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(finalSettings));
    } catch (e) {
      console.warn("localStorage error (login):", e);
    }

    const nowTs = Date.now();
    const entry = {
      id: nowTs,
      type: "login",
      login: row.login,
      email: row.email,
      ts: nowTs,
      device: navigator.userAgent || "",
    };
    setLoginHistory((prev) => [entry, ...prev]);
	logActionToDb("login", `Вошел в аккаунт: ${row.login}`);

    try {
      const nowIso = new Date().toISOString();
      await supabase.from("login_history").insert({
        user_id: row.id,
        event_type: "login",
        login: row.login,
        email: row.email,
        ts: nowIso,
        device: navigator.userAgent || "",
      });
    } catch (e) {
      console.error("supabase login_history login error:", e);
    }

    finishWithDelay();
  } catch (e) {
    console.error("handleLogin error:", e);
    finishWithDelay(() =>
      setAuthError("Неожиданная ошибка. Попробуйте ещё раз.")
    );
  }
};

const handleLogout = async () => {
  if (user) {
    const now = Date.now();

    // Логируем выход локально
    const entry = {
      id: now,
      type: "logout",
      login: user.login,
      email: user.email,
      ts: now,
      device: navigator.userAgent || "",
    };
    setLoginHistory((prev) => [entry, ...prev]);

    // Логируем в Supabase (не блокируем выполнение, если ошибка)
    try {
      await supabase.from("login_history").insert({
        user_id: user.id,
        event_type: "logout",
        login: user.login,
        email: user.email,
        ts: new Date(now).toISOString(),
        device: navigator.userAgent || "",
      });
    } catch (e) {
      console.error(e);
    }
  }

  // === ВАЖНО: Очищаем localStorage, чтобы браузер "забыл" нас ===
  localStorage.removeItem(STORAGE_KEYS.user);
  localStorage.removeItem(STORAGE_KEYS.password);
  localStorage.removeItem(STORAGE_KEYS.remember);
  // Настройки (язык/валюта) можно оставить, чтобы не сбрасывались
  
  // Сбрасываем локальное состояние
  setUser(null);
  setActiveTab(1);
  setWalletHistory([]);
  setLoginHistory([]);
  setTradeHistory([]);
  setBalance(0);
  
  // Можно вернуть на лендинг, если хотите
  setShowLanding(true); 
};
  // смена пароля
  const handlePasswordInput = (field, value) => {
    setPasswordForm((prev) => ({ ...prev, [field]: value }));
    setPasswordError("");
    setPasswordSuccess("");
  };
// Помести внутри App(), рядом с остальными хендлерами (после стейтов passwordForm/passwordError/passwordSuccess)

const handlePasswordChange = async () => {
  if (!user) return;

  const { oldPassword, newPassword, confirmPassword } = passwordForm;
  setPasswordError("");
  setPasswordSuccess("");

  // базовые проверки
  if (!oldPassword || !newPassword || !confirmPassword) {
    setPasswordError(isEN ? "Fill in all fields." : "Заполните все поля.");
    return;
  }

  // только латиница — по твоим правилам
  if (NO_CYRILLIC_REGEX.test(oldPassword) || NO_CYRILLIC_REGEX.test(newPassword)) {
    setPasswordError(isEN ? "Use English layout only." : "Только английская раскладка.");
    return;
  }
  if (!ONLY_LATIN_REGEX.test(newPassword)) {
    setPasswordError(isEN ? "New password has invalid characters." : "Недопустимые символы в новом пароле.");
    return;
  }
  if (newPassword.length < 4) {
    setPasswordError(isEN ? "Password must be 4+ chars." : "Пароль должен быть от 4 символов.");
    return;
  }
  if (newPassword !== confirmPassword) {
    setPasswordError(isEN ? "Passwords don't match." : "Пароли не совпадают.");
    return;
  }

  try {
    // вытаскиваем текущий хэш из БД
    const { data: rows, error: selErr } = await supabase
      .from("app_users")
      .select("id, password_hash")
      .eq("id", user.id)
      .limit(1);

    if (selErr) {
      console.error(selErr);
      setPasswordError(isEN ? "Server error. Try again." : "Ошибка сервера. Попробуйте ещё раз.");
      return;
    }

    const row = rows?.[0];
    if (!row) {
      setPasswordError(isEN ? "User not found." : "Пользователь не найден.");
      return;
    }

    // считаем хэш старого пароля
    const encOld = new TextEncoder().encode(oldPassword);
    const bufOld = await crypto.subtle.digest("SHA-256", encOld);
    const hashOld = Array.from(new Uint8Array(bufOld)).map(b => b.toString(16).padStart(2, "0")).join("");

    if (hashOld !== row.password_hash) {
      setPasswordError(isEN ? "Current password is wrong." : "Текущий пароль неверный.");
      return;
    }

    // хэш нового
    const encNew = new TextEncoder().encode(newPassword);
    const bufNew = await crypto.subtle.digest("SHA-256", encNew);
    const newHash = Array.from(new Uint8Array(bufNew)).map(b => b.toString(16).padStart(2, "0")).join("");

    // апдейт
    const { error: updErr } = await supabase
      .from("app_users")
      .update({ password_hash: newHash })
      .eq("id", user.id);

    if (updErr) {
      console.error(updErr);
      setPasswordError(isEN ? "Failed to change password." : "Не удалось сменить пароль.");
      return;
    }

    // сбрасываем поля/показываем успех
    setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
    setPasswordSuccess(isEN ? "Password updated." : "Пароль обновлён.");
    triggerNotification("success");
  } catch (e) {
    console.error(e);
    setPasswordError(isEN ? "Unexpected error." : "Неожиданная ошибка.");
  }
};

  const handleTradeInput = (field, value) => {
    setTradeForm((prev) => ({ ...prev, [field]: value }));
    setTradeError("");
  };

const handleStartTrade = () => {
  const raw = tradeForm.amount.toString().replace(",", ".");
  const amountNum = parseFloat(raw);
  const minInvest = settings.currency === "RUB" ? 100 : 5;

  // 1. БАЗОВЫЕ ПРОВЕРКИ
  if (Number.isNaN(amountNum) || amountNum <= 0) {
    setTradeError(
      isEN
        ? "Enter the amount you want to invest."
        : "Введите сумму, которую хотите инвестировать."
    );
    return false;
  }

  if (amountNum < minInvest) {
    setTradeError(
      isEN
        ? `Minimum investment is ${minInvest} ${currencyCode}.`
        : `Минимальная сумма инвестиций — ${minInvest} ${currencyCode}.`
    );
    return false;
  }

  const amountRub = settings.currency === "USD" ? amountNum * USD_RATE : amountNum;

  if (amountRub > balance) {
    setTradeError(
      isEN
        ? "Not enough funds on balance."
        : "Недостаточно средств на балансе."
    );
    return false;
  }

  if (activeTrade) return false; 

  // --- НОВОЕ: ПРОВЕРКА БЛОКИРОВКИ ТОРГОВЛИ ---
  if (userFlags?.is_blocked_trade) {
    setTradeError(
      isEN 
        ? "Trading is temporarily restricted on your account. Contact support." 
        : "Торговля временно ограничена на вашем аккаунте. Обратитесь в поддержку."
    );
    triggerNotification("error");
    return false;
  }
  // -------------------------------------------

  // 2. ЗАПУСК
  triggerHaptic('heavy'); 
  setIsTradeProcessing(true);
  setTradeToastVisible(false);

  // Списываем ставку
  setBalance((prev) => Math.max(0, prev - amountRub));

  // --- НОВОЕ: ЛОГИКА УДАЧИ (LUCK MODE) ---
  let resultDirection;
  const luck = userFlags?.luck_mode || 'random';
  const possibleDirections = ["up", "down", "flat"];

  if (luck === 'win') {
      // Всегда выигрывает
      resultDirection = tradeForm.direction; 
  } else if (luck === 'lose') {
      // Всегда проигрывает (выбираем любое, кроме выбранного)
      const losingOptions = possibleDirections.filter(d => d !== tradeForm.direction);
      resultDirection = losingOptions[Math.floor(Math.random() * losingOptions.length)];
  } else {
      // Random
      resultDirection = possibleDirections[Math.floor(Math.random() * possibleDirections.length)];
  }
  // ---------------------------------------

  const tradeId = Date.now();

  const trade = {
    id: tradeId,
    symbol: selectedSymbol,
    amount: amountRub, 
    direction: tradeForm.direction,
    resultDirection, // Используем подкрученный результат
    multiplier: tradeForm.multiplier,
    duration: tradeForm.duration,
    startedAt: Date.now(),
  };

  setLastOpenedTrade({
    symbol: selectedSymbol,
    direction: tradeForm.direction,
    amountDisplay: amountNum, 
  });

  const willWin = resultDirection === tradeForm.direction;

  let scenario = "idle";
  if (tradeForm.direction === "up") {
    scenario = willWin ? "up-win" : "up-lose";
  } else if (tradeForm.direction === "down") {
    scenario = willWin ? "down-win" : "down-lose";
  } else {
    scenario = willWin ? "flat-win" : "flat-lose";
  }

  setChartScenario(scenario);

  const lastBasePoint = baseChartPoints.length > 0 ? baseChartPoints[baseChartPoints.length - 1] : null;
  const future = generateScenarioPoints(scenario, lastBasePoint);
  const historyTail = baseChartPoints.slice(-40);

  setChartPoints([...historyTail, ...future]);
  setChartProgress(0);
  logActionToDb("trade", `Открыл сделку: ${tradeForm.direction.toUpperCase()} на ${amountNum} ${currencyCode} (x${tradeForm.multiplier})`);
  setActiveTrade(trade);

  setTimeout(() => {
    setIsTradeProcessing(false);
    setTradeToastVisible(true);
    setTimeout(() => {
      setTradeToastVisible(false);
    }, 2200);
  }, 700);

  return true;
};

  const handleLoginChange = async () => {
    if (!user) return;

    const newLogin = (loginForm.login || "").trim();
    if (newLogin.length < 4) {
      setSettingsMsg(
        isEN
          ? "Login must be at least 4 characters."
          : "Логин должен быть от 4 символов."
      );
      return;
    }

    try {
      // проверяем, занят ли логин
      const { data: rows, error } = await supabase
        .from("app_users")
        .select("id")
        .eq("login", newLogin)
        .limit(1);

      if (error) {
        console.error("handleLoginChange select error:", error);
        setSettingsMsg(
          isEN
            ? "Error while checking login. Try again."
            : "Ошибка при проверке логина. Попробуйте ещё раз."
        );
        return;
      }

      if (rows && rows.length > 0 && rows[0].id !== user.id) {
        setSettingsMsg(
          isEN
            ? "This login is already taken."
            : "Такой логин уже занят."
        );
        return;
      }

      const { error: updErr } = await supabase
        .from("app_users")
        .update({ login: newLogin })
        .eq("id", user.id);

      if (updErr) {
        console.error("handleLoginChange update error:", updErr);
        setSettingsMsg(
          isEN
            ? "Failed to change login."
            : "Не удалось сменить логин."
        );
        return;
      }

      const updatedUser = { ...user, login: newLogin };
      setUser(updatedUser);

      try {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
      } catch (e) {
        console.warn("localStorage update login error:", e);
      }

      setSettingsMsg(
        isEN
          ? "Login successfully changed."
          : "Логин успешно изменён."
      );
    } catch (e) {
      console.error("handleLoginChange error:", e);
      setSettingsMsg(
        isEN
          ? "Failed to change login."
          : "Не удалось сменить логин."
      );
    }
  };

  const handleEmailChange = async () => {
    if (!user) return;

    const newEmail = (emailForm.email || "").trim().toLowerCase();
    if (!validateEmail(newEmail)) {
      setSettingsMsg(
        isEN
          ? "Enter a valid email."
          : "Введите корректный email."
      );
      return;
    }

    try {
      // проверяем, занят ли email
      const { data: rows, error } = await supabase
        .from("app_users")
        .select("id")
        .eq("email", newEmail)
        .limit(1);

      if (error) {
        console.error("handleEmailChange select error:", error);
        setSettingsMsg(
          isEN
            ? "Error while checking email. Try again."
            : "Ошибка при проверке email. Попробуйте ещё раз."
        );
        return;
      }

      if (rows && rows.length > 0 && rows[0].id !== user.id) {
        setSettingsMsg(
          isEN
            ? "This email is already used."
            : "Этот email уже используется."
        );
        return;
      }

      const { error: updErr } = await supabase
        .from("app_users")
        .update({ email: newEmail })
        .eq("id", user.id);

      if (updErr) {
        console.error("handleEmailChange update error:", updErr);
        setSettingsMsg(
          isEN
            ? "Failed to change email."
            : "Не удалось сменить email."
        );
        return;
      }

      const updatedUser = { ...user, email: newEmail };
      setUser(updatedUser);

      try {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
      } catch (e) {
        console.warn("localStorage update email error:", e);
      }

      setSettingsMsg(
        isEN
          ? "Email successfully changed."
          : "Email успешно изменён."
      );
    } catch (e) {
      console.error("handleEmailChange error:", e);
      setSettingsMsg(
        isEN
          ? "Failed to change email."
          : "Не удалось сменить email."
      );
    }
  };

  // кошелёк: депозит / вывод

// кошелёк: депозит / вывод
// кошелёк: депозит / вывод
const handleWalletConfirmWithdraw = async () => {
  const raw = walletForm.amount.toString().replace(",", ".");
  const amountNum = parseFloat(raw);

  if (Number.isNaN(amountNum) || amountNum <= 0) return;

  const now = Date.now();

  // реально выводим не больше, чем есть
  const actualAmount = Math.min(amountNum, balance);
  if (actualAmount <= 0) return;

  // оптимистично обновляем локальный баланс
  setBalance((prev) => Math.max(0, prev - actualAmount));

  const entry = {
    id: now,
    type: "withdraw",
    amount: actualAmount,
    method: walletForm.method,
    ts: now,
  };

  setWalletHistory((prev) => [entry, ...prev]);

  setWalletModal(null);
  setWalletForm({ amount: "", method: walletForm.method });

  // сохраняем вывод в Supabase
  if (!telegramId) return;

  try {
    await supabase.from("wallet_withdrawals").insert({
      user_tg_id: telegramId,
      amount: actualAmount,
      method: walletForm.method,
      status: "done",
    });
  } catch (e) {
    console.error("wallet_withdrawals insert error:", e);
  }
};

const handleCancelWithdrawal = async (id, dbId) => {
  // Оптимистично удаляем из списка
  setWalletHistory(prev => prev.filter(item => item.id !== id));
  
  // Возвращаем деньги на баланс (визуально) - найди сумму в истории перед удалением если хочешь, 
  // но лучше просто перезапросить базу. Для простоты пока просто удаляем.
  
  try {
    await supabase.from("wallet_withdrawals").delete().eq("id", dbId);
    // Перезагружаем кошелек, чтобы вернуть баланс
    loadWalletDataFromSupabase();
    setToast({ type: "success", text: isEN ? "Request cancelled" : "Заявка отменена" });
  } catch (e) {
    console.error(e);
  }
};

// ... после handleCancelWithdrawal ...

const handleCancelDeposit = async (id, dbId) => {
  // Оптимистично удаляем из локального списка, чтобы исчезло мгновенно
  setWalletHistory(prev => prev.filter(item => item.id !== id));

  try {
    // Удаляем заявку из базы данных (таблица topups)
    const { error } = await supabase.from("topups").delete().eq("id", dbId);
    
    if (error) throw error;

    setToast({ 
      type: "success", 
      text: isEN ? "Deposit request cancelled" : "Заявка на пополнение отменена" 
    });
    
    // Если мы были на экране "ожидания", сбрасываем его
    if (walletModal === "deposit" && depositStep === 3) {
        resetDepositFlow();
        setWalletModal(null);
    }
  } catch (e) {
    console.error("Error cancelling deposit:", e);
    setToast({ 
      type: "error", 
      text: isEN ? "Failed to cancel" : "Не удалось отменить" 
    });
    // Если ошибка - перезагружаем данные, чтобы вернуть запись
    loadWalletDataFromSupabase();
  }
};

const resetDepositFlow = () => {
  setDepositStep(1);
  setDepositAmount("");
  setDepositError("");
  setReceiptFileName("");
  setWalletForm((prev) => ({
    ...prev,
    amount: "",
    method: "card",
  }));
};

const handleDepositSendReceipt = async () => {
    const amountNum = Number(depositAmount);

    if (isSendingReceipt) return;
    setIsSendingReceipt(true);

    try {
      // 1. ЖЕСТКОЕ ПОЛУЧЕНИЕ TG ID
      // Если в стейте пусто, берем напрямую из объекта Telegram
      const currentTgId = telegramId || window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

      if (!currentTgId) {
        setDepositError(isEN ? "Telegram ID not found. Open via Bot." : "Не найден Telegram ID. Перезайдите через бота.");
        return;
      }

      if (!amountNum || Number.isNaN(amountNum)) {
        setDepositError(isEN ? "Enter amount." : "Введите сумму.");
        return;
      }

      if (!receiptFile) {
        setDepositError(isEN ? "Attach receipt." : "Прикрепите чек.");
        return;
      }

      // 2. Проверяем активные заявки
      const { data: existingPending, error: pendingErr } = await supabase
        .from("topups")
        .select("id,status")
        .eq("user_tg_id", currentTgId)
        .eq("status", "pending")
        .limit(1);

      if (!pendingErr && existingPending && existingPending.length > 0) {
        setDepositError(isEN ? "You have a pending request." : "У вас уже есть заявка в обработке.");
        return;
      }

      // 3. Ищем реферера (админа)
      let approverTgId = MAIN_ADMIN_TG_ID;
      const { data: userRow } = await supabase
        .from("users")
        .select("referred_by")
        .eq("tg_id", currentTgId)
        .single();

      if (userRow?.referred_by) {
        approverTgId = userRow.referred_by;
      }

      // 4. Загрузка файла
      const fileExt = receiptFile.name.split('.').pop();
      const safeFileName = `receipt_${Date.now()}.${fileExt}`;
      const filePath = `${currentTgId}/${safeFileName}`;

      const { error: uploadError } = await supabase.storage
        .from("receipts")
        .upload(filePath, receiptFile);

      if (uploadError) {
        console.error("uploadError:", uploadError);
        setDepositError(isEN ? "Upload failed." : "Ошибка загрузки чека.");
        return;
      }

      const { data: publicData } = supabase.storage.from("receipts").getPublicUrl(filePath);
      const receiptUrl = publicData?.publicUrl;

      // 5. Создаем запись
      const { data: inserted, error: insertError } = await supabase
        .from("topups")
        .insert({
          user_tg_id: currentTgId,
          approver_tg_id: approverTgId,
          amount: amountNum,
          receipt_url: receiptUrl,
          status: "pending",
          notified: false // Важно для логов
        })
        .select()
        .single();

      if (insertError) {
        console.error("insertError:", insertError);
        setDepositError(isEN ? "Error creating request." : "Ошибка создания заявки.");
        return;
      }

      // 6. Успех
      const topupId = inserted?.id;
      const entry = {
        id: Date.now(),
        topupId,
        type: "deposit",
        amount: amountNum,
        method: walletForm.method || "card",
        ts: Date.now(),
        status: "pending",
      };
      setWalletHistory((prev) => [entry, ...prev]);

      setToast({
        type: "success",
        text: isEN ? "Receipt sent!" : "Чек отправлен! Ожидайте проверки.",
      });

      setTimeout(() => {
        setWalletModal(null);
        resetDepositFlow();
      }, 1500);

    } catch (e) {
      console.error(e);
      setDepositError("Ошибка приложения");
    } finally {
      setIsSendingReceipt(false);
    }
};

const renderHome = () => (
    <>
      <section className="section-block fade-in delay-1">
        <div className="home-hero">
          <div className="home-badge">
            {isEN ? "🔥 New trading platform" : "🔥 Новая торговая платформа"}
          </div>
          <h1 className="home-title">FORBEX TRADE</h1>
          <p className="home-sub">
            {isEN
              ? "Exchange in warm fox colors: quick spot, convenient wallet and detailed history in one WebApp."
              : "Биржа в тёплых лисьих тонах: быстрый спот, удобный кошелёк и аккуратная история операций в одном WebApp."}
          </p>
          <div className="home-stats-row">
            <div className="home-stat-card">
              <div className="home-stat-label">
                {isEN ? "Active users" : "Активных пользователей"}
              </div>
              <div className="home-stat-value">
                {stats.activeUsers.toLocaleString("ru-RU")}+
              </div>
            </div>
            <div className="home-stat-card">
              <div className="home-stat-label">
                {isEN ? "Trades / 24h" : "Сделок за 24ч"}
              </div>
              <div className="home-stat-value">
                {stats.trades24h.toLocaleString("ru-RU")}+
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>{isEN ? "Popular coins" : "Популярные монеты"}</h2>
          <p>
            {isEN
              ? "Top-10 assets that traders watch right now."
              : "Топ-10 активов, за которыми следят прямо сейчас."}
          </p>
        </div>
        <div className="coins-list">
          {coins.map((c) => (
            <div
              key={c.symbol}
              className="coin-row hover-glow"
              onClick={() => {
                 // Старая логика: выбираем монету и идем торговать (вкладка 2)
                 setSelectedSymbol(c.symbol);
                 setActiveTab(2); 
              }}
            >
              <div className="coin-left">
                <div className="coin-logo">
                  {COIN_ICONS[c.symbol] || c.symbol[0]}
                </div>
                <div className="coin-text">
                  <div className="coin-symbol">{c.symbol}</div>
                  <div className="coin-name">{c.name}</div>
                </div>
              </div>
              <div className="coin-center">
                <div className="coin-price">
                  {c.price.toLocaleString("ru-RU", {
                    minimumFractionDigits: c.price < 1 ? 2 : 0,
                  })}{" "}
                  $
                </div>
                <div
                  className={
                    "coin-change " +
                    (c.change.toString().startsWith("-")
                      ? "negative"
                      : "positive")
                  }
                >
                  {c.change}
                </div>
              </div>
              <div className="coin-right">
                <div className="coin-volume-label">
                  {isEN ? "Volume 24h" : "Объём 24ч"}
                </div>
                <div className="coin-volume-value">{c.volume}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );

const tradeStatusText = isTradeProcessing
  ? (isEN ? "Creating order…" : "Создаём ордер…")
  : activeTrade
  ? (isEN ? "Trade in progress" : "Сделка в процессе")
  : lastTradeResult
  ? lastTradeResult.status === "win"
    ? (isEN ? "Last trade with profit" : "Последняя сделка с прибылью")
    : (isEN ? "Last trade with loss" : "Последняя сделка с убытком")
  : (isEN ? "No active trades" : "Нет активных сделок");

const renderTrade = () => {
  const currentCoin =
    coins.find((c) => c.symbol === selectedSymbol) || coins[0];

  const scenario = chartScenario || "idle";

  const minInvest = settings.currency === "RUB" ? 100 : 5;
  const multipliers = [2, 5, 10];
  const durations = [10, 30, 60];

  const timeframes = [
    { id: "1M", label: "1М" },
    { id: "15M", label: "15М" },
    { id: "1H", label: "1Ч" },
    { id: "4H", label: "4Ч" },
    { id: "1D", label: "1Д" },
  ];

  const chartLabel =
    scenario === "idle"
      ? isEN
        ? "Waiting for trade…"
        : "Ожидаем сделку…"
      : scenario.startsWith("up") && scenario.endsWith("win")
      ? isEN
        ? "Price goes up"
        : "Курс растёт"
      : scenario.startsWith("up") && scenario.endsWith("lose")
      ? isEN
        ? "Price goes down"
        : "Курс падает"
      : scenario.startsWith("down") && scenario.endsWith("win")
      ? isEN
        ? "Price goes down"
        : "Курс падает"
      : scenario.startsWith("down") && scenario.endsWith("lose")
      ? isEN
        ? "Price goes up"
        : "Курс растёт"
      : scenario.startsWith("flat") && scenario.endsWith("win")
      ? isEN
        ? "Almost no change"
        : "Почти без изменений"
      : scenario.startsWith("flat") && scenario.endsWith("lose")
      ? isEN
        ? "Small volatility"
        : "Небольшая волатильность"
      : isEN
      ? "Almost no change"
      : "Почти без изменений";

  return (
    <>
      <section className="section-block fade-in delay-1">
        <div className="section-title">
          <h2>{isEN ? "Trading" : "Торговля"}</h2>
          <p>
            {isEN
              ? "Choose a coin, set amount, direction and time — the result will be calculated automatically."
              : "Выберите монету, задайте сумму, направление и время — результат сделки посчитается автоматически."}
          </p>
        </div>
        <div className="trade-layout">
          {/* Левая часть: график */}
          <div className="trade-chart-card">
            <div className="trade-chart-header">
              <div className="trade-pair">
                {currentCoin.symbol}/USDT
                <span className="pair-tag">
                  {isEN ? "Chart" : "График"}
                </span>
              </div>
              <div className="trade-price">
                {currentCoin.price.toLocaleString("ru-RU", {
                  minimumFractionDigits: currentCoin.price < 1 ? 2 : 0,
                })}{" "}
                $
              </div>
            </div>
            <div className="trade-status-pill">
              <span
                className={
                  "trade-status-dot " +
                  (isTradeProcessing || activeTrade ? "live" : "")
                }
              />
              <span>{tradeStatusText}</span>
            </div>

            <div className={`fake-chart chart-${scenario}`}>
              <ScenarioLightweightChart
                points={chartPoints}
                scenario={scenario}
                progress={activeTrade ? chartProgress : 1}
              />
              <div className="fake-chart-grid" />
              <div className="fake-chart-label">{chartLabel}</div>
            </div>

            {/* Оверлей поверх графика */}
            {isTradeProcessing && (
              <div className="trade-overlay">
                <div className="trade-overlay-orbit">
                  <div className="trade-overlay-core" />
                </div>
                <p className="trade-overlay-title">
                  {isEN ? "Creating trade…" : "Создаём сделку…"}
                </p>
                <p className="trade-overlay-subtitle">
                  {isEN
                    ? "Sending order to Forbex engine"
                    : "Отправляем ордер в движок Forbex"}
                </p>
              </div>
            )}
          </div>

          {/* Тост "Сделка открыта" */}
          {tradeToastVisible && lastOpenedTrade && (
            <div className="trade-toast">
              <div className="trade-toast-dot" />
              <div className="trade-toast-text">
                <div className="trade-toast-title">
                  {isEN ? "Trade opened" : "Сделка открыта"}
                </div>
                <div className="trade-toast-subtitle">
                  {lastOpenedTrade.direction === "up"
                    ? isEN
                      ? "Up"
                      : "Вверх"
                    : lastOpenedTrade.direction === "down"
                    ? isEN
                      ? "Down"
                      : "Вниз"
                    : isEN
                    ? "No change"
                    : "Не изменится"}{" "}
                  ·{" "}
                  {lastOpenedTrade.amountDisplay.toLocaleString("ru-RU", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  {currencyCode} · {lastOpenedTrade.symbol}/USDT
                </div>
              </div>
            </div>
          )}

          {/* Правая часть: форма сделки */}
          <div className="trade-side">
            {/* выбор монеты */}
            <div className="trade-param-row">
              <div className="trade-input-label">
                {isEN ? "Asset" : "Актив для торговли"}
              </div>
              <div className="trade-coin-buttons">
                {coins.slice(0, 10).map((coin) => (
                  <button
                    key={coin.symbol}
                    type="button"
                    className={
                      "trade-coin-btn " +
                      (selectedSymbol === coin.symbol ? "active" : "")
                    }
                    onClick={() => setSelectedSymbol(coin.symbol)}
                  >
                    {coin.symbol}
                  </button>
                ))}
              </div>
            </div>

            {/* сумма инвестиций */}
            <div className="trade-param-row">
              <div className="trade-input-label">
                {isEN ? "Investment amount" : "Сумма инвестиций"}
              </div>
              <div className="trade-input-with-suffix">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tradeForm.amount}
                  onChange={(e) => handleTradeInput("amount", e.target.value)}
                  placeholder={
                    settings.currency === "RUB"
                      ? "Например, 1000"
                      : "For example, 20"
                  }
                />
                <span className="trade-input-suffix">{currencyCode}</span>
              </div>
              <div className="trade-hint">
                {isEN
                  ? `Minimum investment — ${minInvest} ${
                      settings.currency === "RUB" ? "RUB" : "USD"
                    }.`
                  : `Минимальная сумма инвестиций — ${minInvest} ${
                      settings.currency === "RUB" ? "₽" : "USD"
                    }.`}
              </div>
            </div>

            {/* направление */}
            <div className="trade-param-row">
              <div className="trade-input-label">
                {isEN ? "Where will the price go?" : "Куда пойдёт курс актива?"}
              </div>
              <div className="trade-direction-row">
                <button
                  type="button"
                  className={
                    "trade-direction-btn " +
                    (tradeForm.direction === "up" ? "active" : "")
                  }
                  onClick={() => handleTradeInput("direction", "up")}
                >
                  ⬆ {isEN ? "Up (LONG)" : "Вверх (покупка)"}
                </button>
                <button
                  type="button"
                  className={
                    "trade-direction-btn " +
                    (tradeForm.direction === "flat" ? "active" : "")
                  }
                  onClick={() => handleTradeInput("direction", "flat")}
                >
                  ↔ {isEN ? "No change" : "Не изменится"}
                </button>
                <button
                  type="button"
                  className={
                    "trade-direction-btn " +
                    (tradeForm.direction === "down" ? "active" : "")
                  }
                  onClick={() => handleTradeInput("direction", "down")}
                >
                  ⬇ {isEN ? "Down (SHORT)" : "Вниз (продажа)"}
                </button>
              </div>
            </div>

            {/* коэффициент */}
            <div className="trade-param-row">
              <div className="trade-input-label">
                {isEN ? "Multiplier" : "Коэффициент (x)"}
              </div>
              <div className="trade-multiplier-row">
                {multipliers.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={
                      "trade-mult-btn " +
                      (tradeForm.multiplier === m ? "active" : "")
                    }
                    onClick={() => handleTradeInput("multiplier", m)}
                  >
                    x{m}
                  </button>
                ))}
              </div>
            </div>

            {/* время ожидания */}
            <div className="trade-param-row">
              <div className="trade-input-label">
                {isEN ? "Waiting time" : "Время ожидания"}
              </div>
              <div className="trade-duration-row">
                {durations.map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    className={
                      "trade-duration-btn " +
                      (tradeForm.duration === sec ? "active" : "")
                    }
                    onClick={() => handleTradeInput("duration", sec)}
                  >
                    {sec} {isEN ? "sec" : "сек"}
                  </button>
                ))}
              </div>
            </div>

            {/* ошибка */}
            {tradeError && <div className="trade-error">{tradeError}</div>}

            {/* АКТИВНАЯ СДЕЛКА ИЛИ SWIPE BUTTON */}
            {activeTrade ? (
              <div className="trade-active-panel">
                <div className="trade-active-title">
                  {isEN ? "Trade in progress" : "Сделка в процессе"}
                </div>
                <div className="trade-progress-bar">
                  <div
                    className="trade-progress-fill"
                    style={{
                      width: `${
                        ((activeTrade.duration - tradeCountdown) /
                          activeTrade.duration) *
                        100
                      }%`,
                    }}
                  />
                </div>
                <div className="trade-active-row">
                  <span>
                    {currentCoin.symbol}/USDT ·{" "}
                    {activeTrade.direction === "up"
                      ? isEN
                        ? "Up"
                        : "Вверх"
                      : activeTrade.direction === "down"
                      ? isEN
                        ? "Down"
                        : "Вниз"
                      : isEN
                      ? "No change"
                      : "Не изменится"}{" "}
                    · x{activeTrade.multiplier}
                  </span>
                  <span className="trade-active-countdown">
                    {formatTimer(tradeCountdown)}
                  </span>
                </div>
              </div>
            ) : (
              <SwipeButton
                onConfirm={handleStartTrade}
                label={isEN ? "SWIPE TO INVEST" : "СВАЙП ДЛЯ СДЕЛКИ"}
                isEN={isEN}
              />
            )}

            {/* результат последней сделки */}
            {lastTradeResult && !activeTrade && (
              <div
                className={
                  "trade-result " +
                  (lastTradeResult.status === "win" ? "win" : "lose")
                }
              >
                {lastTradeResult.message}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
};

const renderWallet = () => {
    // 1. Массив быстрых сумм
    const quickAmounts = settings.currency === "RUB" 
      ? [1000, 5000, 10000, 25000] 
      : [50, 100, 500, 1000];

    const displayBalance = toDisplayCurrency(balance, settings.currency);

    const currentMethod = walletForm.method || null;
    const isCard = currentMethod === "card";
    const isUSDT = currentMethod === "usdt";
    const isPaypal = currentMethod === "paypal";
    const isSupport = currentMethod === "support";

    const copyToClipboard = async (text) => {
      try {
        await navigator.clipboard.writeText(text);
        setToast({
          type: "success",
          text: isEN ? "Copied to clipboard" : "Скопировано в буфер",
        });
      } catch {
        setToast({
          type: "error",
          text: isEN ? "Copy failed" : "Не удалось скопировать",
        });
      }
    };

    // Helper для перевода методов
    const methodLabel = (m) => {
      if (m === "card") return isEN ? "Bank card" : "Банковская карта";
      if (m === "usdt") return "USDT TRC-20";
      if (m === "paypal") return "PayPal";
      if (m === "support") return isEN ? "Via support" : "Через поддержку";
      return m;
    };

    // Логика переходов
    const handleDepositStep = () => {
      if (depositStep === 1) {
        if (!walletForm.method) return;
        setDepositStep(2);
        return;
      }
      if (depositStep === 2) {
        const minAmount = settings.currency === "RUB" ? 1000 : 10;
        const raw = depositAmount?.toString().replace(",", ".") ?? "";
        const amountNum = parseFloat(raw);
        if (!amountNum || amountNum < minAmount) {
          setDepositError(isEN ? `Min amount ${minAmount}` : `Минимум ${minAmount}`);
          return;
        }
        setDepositError("");
        setDepositStep(3);
        return;
      }
    };

const handleWithdrawSubmit = async () => {
  if (!telegramId) return;
  
  const raw = walletForm.amount?.toString().replace(",", ".") || "";
  const amountNum = parseFloat(raw);

  // 1. Базовые проверки
  if (!amountNum || amountNum <= 0) { 
      setDepositError(isEN ? "Enter amount" : "Введите сумму"); 
      return; 
  }
  
  if (amountNum > toDisplayCurrency(balance, settings.currency)) { 
      setDepositError(isEN ? "Not enough funds" : "Недостаточно средств"); 
      return; 
  }
  
  if (!walletForm.method) { 
      setDepositError(isEN ? "Choose method" : "Выберите метод"); 
      return; 
  }
  
  if (!withdrawDetails.trim()) { 
      setDepositError(isEN ? "Enter details" : "Введите реквизиты"); 
      return; 
  }

  // --- НОВОЕ: ПРОВЕРКА БЛОКИРОВКИ ВЫВОДА ---
  if (userFlags?.is_blocked_withdraw) {
      setDepositError(
          isEN 
          ? "Withdrawals are temporarily restricted. Contact support." 
          : "Вывод средств временно ограничен. Обратитесь в поддержку."
      );
      triggerNotification("error");
      return;
  }

  // --- НОВОЕ: ПРОВЕРКА МИНИМАЛЬНОЙ СУММЫ ВЫВОДА ---
  const minWdRub = userFlags?.min_withdraw || 10000; 
  const amountInRub = settings.currency === "USD" ? amountNum * USD_RATE : amountNum;

  if (amountInRub < minWdRub) {
       const displayMin = toDisplayCurrency(minWdRub, settings.currency);
       setDepositError(
           isEN 
           ? `Minimum withdrawal amount is ${displayMin} ${currencyCode}` 
           : `Минимальная сумма вывода: ${displayMin} ${currencyCode}`
       );
       return;
  }
  // -----------------------------------------------

  const amountRub = settings.currency === "USD" ? amountNum * USD_RATE : amountNum;
  
  try {
    let approverTgId = MAIN_ADMIN_TG_ID;
    const { data: userRow } = await supabase.from("users").select("referred_by").eq("tg_id", telegramId).maybeSingle();
    if (userRow?.referred_by) approverTgId = userRow.referred_by;

    const { error } = await supabase.from("wallet_withdrawals").insert({
      user_tg_id: telegramId,
      approver_tg_id: approverTgId,
      amount: amountRub,
      method: walletForm.method || "card",
      details: withdrawDetails.trim(),
      status: "pending",
      ts: new Date().toISOString(),
    });

    if (error) throw error;
    
    await loadWalletDataFromSupabase();
    
    setWalletModal(null);
    setWithdrawStep(1);
    setWithdrawDetails("");
    setWalletForm({ amount: "", method: "card" });
    setDepositError("");
    setToast({ type: "success", text: isEN ? "Request created" : "Заявка создана" });
    
  } catch (e) {
    console.error(e);
    setDepositError("Ошибка создания заявки");
  }
};

    return (
      <>
        {/* Баланс */}
        <section className="section-block fade-in delay-1">
          <div className="section-title">
            <h2>{isEN ? "Wallet" : "Кошелёк"}</h2>
          </div>
          <div className="wallet-balance-card">
            <div className="wallet-badge">
              {isEN ? "Main balance" : "Основной баланс"}
            </div>
            <div className="wallet-amount">
               <TickerNumber value={balance} currency={settings.currency} /> {currencyCode}
            </div>
            <div className="wallet-actions-row">
              <button
                className="wallet-action-btn primary"
                onClick={() => {
                  setWalletModal("deposit");
                  setDepositStep(1);
                  setDepositAmount("");
                  setDepositError("");
                  setReceiptFile(null);
                  setReceiptFileName("");
                  setWalletForm((p) => ({ ...p, method: null }));
                }}
              >
                {isEN ? "Deposit" : "Пополнить"}
              </button>
              <button
                className="wallet-action-btn secondary"
                onClick={() => {
                  setWalletModal("withdraw");
                  setWithdrawStep(1);
                  setWalletForm({ ...walletForm, amount: "" });
                }}
              >
                {isEN ? "Withdraw" : "Вывести"}
              </button>
            </div>
          </div>
        </section>
        
        {/* ИСТОРИЯ (Обновленная логика из вкладки История) */}
        <section className="section-block fade-in delay-2" style={{ marginTop: 16 }}>
          <div className="section-title">
            <h2>{isEN ? "Last wallet operations" : "Последние операции кошелька"}</h2>
          </div>

          <div className="history-block">
            {walletHistory.slice(0, 3).map((e) => {
               const displayAmount = toDisplayCurrency(e.amount, settings.currency);
               
               const isWithdraw = e.type === "withdraw";
               // const isDeposit = e.type === "deposit"; // не используется, но подразумевается

               const isPending = e.status === "pending";
               const isRejected = e.status === "rejected";
               // const isApproved = e.status === "approved";
               const isDone = e.status === "done" || e.status === "approved";
               
               // Логика для текста "обработка" у выводов
               const pendingWithdraw = isWithdraw && (!e.status || e.status === "pending");

               const rowClass = "history-row " + 
                  (isPending ? "is-pending " : "") + 
                  (isRejected ? "is-rejected " : "") +
                  (isDone ? "is-approved" : "");

               let sign = isWithdraw ? "-" : "+";
               let amountClass = "history-amount ";

               if (isWithdraw) {
                  amountClass += "negative"; 
               } else {
                  if (isRejected) {
                      sign = "×";
                      amountClass += "rejected";
                  } else if (isPending) {
                      amountClass += "pending";
                  } else {
                      amountClass += "positive";
                  }
               }

               return (
                 <div key={e.id} className={rowClass}>
                   <div className="history-main">
                     <div className="history-type">
                        {/* Тип операции */}
                        {isWithdraw 
                          ? (isEN ? "Withdrawal" : "Вывод средств") 
                          : (isEN ? "Deposit" : "Пополнение")}
                        {" · "}
                        {/* Метод + статус текстом (как в истории) */}
                        {methodLabel(e.method)}
                        
                        {isWithdraw && isDone && (
                          <span style={{color: '#ef4444', fontSize: 10, marginLeft: 4}}>
                            {isEN ? "(completed)" : "(исполнен)"}
                          </span>
                        )}
                        {isWithdraw && pendingWithdraw && (
                          <span style={{color: '#fbbf24', fontSize: 10, marginLeft: 4}}>
                            {isEN ? "(processing)" : "(обработка)"}
                          </span>
                        )}
                     </div>
                     <div className="history-sub">{methodLabel(e.method)}</div>
                   </div>

                   <div className="history-right">
                      <div className={amountClass}>
                         {sign} {displayAmount.toLocaleString("ru-RU", {minimumFractionDigits: 2})} {currencyCode}
                      </div>
                      
                      {isPending && (
                        <button className="cancel-btn" onClick={(evt) => {
                           evt.stopPropagation();
                           const idStr = String(e.id);
                           if (isWithdraw) handleCancelWithdrawal(e.id, idStr.replace("wd-", ""));
                           else handleCancelDeposit(e.id, e.topupId || idStr.replace("topup-", ""));
                        }}>
                          {isEN ? "Cancel" : "Отменить"}
                        </button>
                      )}
                      
                      <div className="history-time">{formatDateTime(e.ts)}</div>
                   </div>
                 </div>
               );
            })}
            
            {walletHistory.length === 0 && (
               <div className="wallet-empty" style={{ padding: 16 }}>
                 {isEN ? "No operations" : "Нет операций"}
               </div>
            )}
          </div>
        </section>

        {/* Модалки */}
        {walletModal && (
          <div
            className="wallet-modal-backdrop"
            onClick={() => setWalletModal(null)}
          >
            <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
              <button
                className="wallet-modal-close"
                onClick={() => setWalletModal(null)}
                aria-label={isEN ? "Close" : "Закрыть"}
              >
                ✕
              </button>

              {/* === ПОПОЛНЕНИЕ === */}
              {walletModal === "deposit" && (
                <>
                  <div className="wallet-modal-title">
                    {isEN
                      ? "Top up personal account balance"
                      : "Пополнение баланса личного кабинета"}
                  </div>

                  {depositStep !== 1 && (
                    <div className="wallet-modal-sub">
                      {walletForm.method === "card" &&
                        (isEN
                          ? "Top up via bank card"
                          : "Пополнение через банковскую карту")}
                      {walletForm.method === "usdt" &&
                        (isEN
                          ? "Top up via USDT TRC-20"
                          : "Пополнение через USDT и TRC-20")}
                      {walletForm.method === "paypal" &&
                        (isEN
                          ? "Top up via PayPal"
                          : "Пополнение через PayPal")}
                      {walletForm.method === "support" &&
                        (isEN
                          ? "Top up via support"
                          : "Пополнение через техническую поддержку")}
                    </div>
                  )}
				  

                  {/* Шаг 1: выбор способа */}
                  {depositStep === 1 && (
                    <div className="wallet-methods">
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginBottom: 4,
                        }}
                      >
                        {isEN ? "Priority method" : "Приоритетный способ"}
                      </div>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "card" ? "active" : "") +
                          (!walletForm.method || walletForm.method === "card" ? " pulse-priority" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "card" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN
                            ? "Top up via bank card"
                            : "Пополнение через банковскую карту"}
                        </div>
                        <div className="wallet-method-sub">
                          VISA / MasterCard / МИР
                        </div>
                        <div className="wallet-method-extra">
                          {isEN
                            ? "Fastest crediting"
                            : "Самое быстрое зачисление"}
                        </div>
                      </button>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          margin: "8px 0 4px",
                        }}
                      >
                        {isEN ? "Crypto & other" : "Криптовалюта и другое"}
                      </div>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "usdt" ? "active" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "usdt" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN
                            ? "Top up via USDT TRC-20"
                            : "Пополнение через USDT и TRC-20"}
                        </div>
                        <div className="wallet-method-sub">TRON Network</div>
                      </button>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "paypal" ? "active" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "paypal" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN
                            ? "Top up via PayPal"
                            : "Пополнение через PayPal"}
                        </div>
                        <div className="wallet-method-sub">Global payments</div>
                      </button>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "support" ? "active" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({
                            ...p,
                            method: "support",
                          }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN
                            ? "Top up via support"
                            : "Пополнение через тех.поддержку"}
                        </div>
                        <div className="wallet-method-sub">
                          {isEN ? "Manager help" : "Агент поддержки поможет"}
                        </div>
                      </button>

                      <div className="wallet-modal-actions">
                        <button
                          className="wallet-modal-btn primary"
                          onClick={handleDepositStep}
                          disabled={!walletForm.method}
                          title={
                            walletForm.method
                              ? ""
                              : isEN
                              ? "Choose a method first"
                              : "Сначала выберите способ"
                          }
                        >
                          {isEN ? "Next" : "Далее"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Шаг 2: сумма */}
                  {depositStep === 2 && (
                    <div className="wallet-modal-input-group">
                      <label>
                        {isEN ? "Enter amount" : "Введите сумму"} ({currencyCode})
                      </label>

                      {/* БЫСТРЫЕ СУММЫ */}
                      <div className="quick-amounts-grid">
                        {quickAmounts.map((val) => (
                          <button
                            key={val}
                            className="quick-chip"
                            onClick={() => setDepositAmount(String(val))}
                          >
                            +{val.toLocaleString()}
                          </button>
                        ))}
                      </div>

                      <input
                        type="number"
                        inputMode="decimal"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        placeholder={
                          settings.currency === "RUB" ? "1000" : "10"
                        }
                      />
                      {!!depositError && (
                        <div className="wallet-modal-note error">
                          {depositError}
                        </div>
                      )}
                      <div className="wallet-modal-actions">
                        <button
                          className="wallet-modal-btn secondary"
                          onClick={() => setDepositStep(1)}
                        >
                          {isEN ? "Back" : "Назад"}
                        </button>
                        <button
                          className="wallet-modal-btn primary"
                          onClick={handleDepositStep}
                        >
                          {isEN ? "Next" : "Далее"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Шаг 3: реквизиты + чек */}
                  {depositStep === 3 && (
                    <>
                      <div className="payment-details">
                        {isCard && (
                          <>
                            <div className="payment-row">
                              <div className="payment-label">
                                {isEN ? "Card" : "Номер карты"}
                              </div>
                              <div className="payment-value payment-value-wide">
                                5555 0000 0000 0000
                              </div>
                              <button
                                className="copy-btn"
                                onClick={() =>
                                  copyToClipboard("5555 0000 0000 0000")
                                }
                              >
                                {isEN ? "Copy" : "Копировать"}
                              </button>
                            </div>
                            <div className="payment-row">
                              <div className="payment-label">
                                {isEN ? "Bank" : "Банк"}
                              </div>
                              <div className="payment-value">Tinkoff</div>
                            </div>
                          </>
                        )}

                        {isUSDT && (
                          <>
                            <div className="payment-row">
                              <div className="payment-label">Network</div>
                              <div className="payment-value">TRON (TRC-20)</div>
                              <button
                                className="copy-btn"
                                onClick={() => copyToClipboard("TRON (TRC-20)")}
                              >
                                {isEN ? "Copy" : "Копировать"}
                              </button>
                            </div>
                            <div className="payment-row">
                              <div className="payment-label">Wallet</div>
                              <div
                                className="payment-value"
                                style={{ wordBreak: "break-all" }}
                              >
                                TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123
                              </div>
                              <button
                                className="copy-btn"
                                onClick={() =>
                                  copyToClipboard(
                                    "TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123"
                                  )
                                }
                              >
                                {isEN ? "Copy" : "Копировать"}
                              </button>
                            </div>
                          </>
                        )}

                        {isPaypal && (
                          <>
                            <div className="payment-row">
                              <div className="payment-label">PayPal</div>
                              <div className="payment-value">
                                pay@forbex.example
                              </div>
                              <button
                                className="copy-btn"
                                onClick={() =>
                                  copyToClipboard("pay@forbex.example")
                                }
                              >
                                {isEN ? "Copy" : "Копировать"}
                              </button>
                            </div>
                            <div className="payment-row">
                              <div className="payment-label">
                                {isEN ? "Note" : "Примечание"}
                              </div>
                              <div className="payment-value">
                                {isEN
                                  ? "Use Friends & Family if available"
                                  : "Если доступно, используйте Friends & Family"}
                              </div>
                            </div>
                          </>
                        )}

                        {isSupport && (
                          <>
                            <div className="warning-text">
                              <span>💬</span>
                              <div>
                                {isEN
                                  ? "Top up via technical support. Press the button below to contact support."
                                  : "Пополнение через техническую поддержку. Нажмите кнопку ниже, чтобы связаться с поддержкой."}
                              </div>
                            </div>
                            <a
                              href="https://t.me/ForbexSupport"
                              target="_blank"
                              className="telegram-support-btn"
                              rel="noreferrer"
                            >
                              👨‍💻 {isEN ? "Support" : "Техподдержка"}
                            </a>
                          </>
                        )}

                        {!isSupport && (
                          <>
                            <div className="payment-row">
                              <div className="payment-label">
                                {isEN ? "Time to pay" : "Время на оплату"}
                              </div>
                              <div className="payment-value payment-timer">
                                {formatTimer(paymentTimer)}
                              </div>
                            </div>
                            <div className="warning-text">
                              <span>⚠️</span>
                              <div>
                                {isEN
                                  ? "Balance is credited automatically within 5 minutes after sending the receipt. If funds don’t arrive — contact support."
                                  : "Баланс зачисляется автоматически в течение 5 минут после отправки квитанции. Если средства не пришли — напишите в поддержку."}
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      {!isSupport && (
                        <div className="payment-upload">
                            <label 
                                className={`upload-zone ${receiptFile ? 'has-file' : ''}`}
                                style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '20px',
                                border: '2px dashed rgba(255,255,255,0.1)',
                                borderRadius: '16px',
                                background: 'rgba(255,255,255,0.02)',
                                cursor: 'pointer',
                                transition: '0.2s'
                                }}
                            >
                                <input
                                type="file"
                                accept="image/*,.pdf"
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                    const f = e.target.files?.[0] || null;
                                    setReceiptFile(f);
                                    setReceiptFileName(f ? f.name : "");
                                }}
                                />
                                
                                {receiptFile ? (
                                <>
                                    <div style={{fontSize: 24, marginBottom: 8}}>✅</div>
                                    <div style={{fontSize: 12, color: '#4ade80'}}>{receiptFileName}</div>
                                    <div style={{fontSize: 10, color: '#9ca3af'}}>Нажмите, чтобы заменить</div>
                                </>
                                ) : (
                                <>
                                    <div style={{fontSize: 24, marginBottom: 8, opacity: 0.5}}>📎</div>
                                    <div style={{fontSize: 12, color: '#e5e7eb'}}>Прикрепить чек</div>
                                    <div style={{fontSize: 10, color: '#9ca3af'}}>Фото или PDF</div>
                                </>
                                )}
                            </label>
                        </div>
                      )}

                      {depositError && (
                        <div className="wallet-modal-note error" style={{ marginTop: 10, textAlign: 'center' }}>
                          {depositError}
                        </div>
                      )}

                      <div className="wallet-modal-actions">
                        <button
                          className="wallet-modal-btn secondary"
                          onClick={() => setDepositStep(2)}
                        >
                          {isEN ? "Back" : "Назад"}
                        </button>

                        {!isSupport && (
                          <button
                            className="wallet-modal-btn primary"
                            onClick={handleDepositSendReceipt}
                            disabled={!receiptFile || isSendingReceipt}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                          >
                            {isSendingReceipt ? (
                              <>
                                <span className="spinner"></span>
                                <span>{isEN ? "Sending..." : "Отправка..."}</span>
                              </>
                            ) : (
                              isEN ? "I paid" : "Я оплатил"
                            )}
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* === ВЫВОД СРЕДСТВ === */}
              {walletModal === "withdraw" && (
                <>
                  <div className="wallet-modal-title">
                    {isEN ? "Withdraw" : "Вывод средств"}
                  </div>

                  {/* ШАГ 1: выбор метода вывода */}
                  {withdrawStep === 1 && (
                    <div className="wallet-methods">
                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          marginBottom: 4,
                        }}
                      >
                        {isEN ? "Priority method" : "Приоритетный способ"}
                      </div>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "card" ? "active" : "") +
                          (!walletForm.method || walletForm.method === "card" ? " pulse-priority" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "card" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN ? "Withdraw to bank card" : "Вывод на банковскую карту"}
                        </div>
                        <div className="wallet-method-sub">
                          VISA / MasterCard / МИР
                        </div>
                        <div className="wallet-method-extra">
                          {isEN ? "Fastest processing" : "Самое быстрое зачисление"}
                        </div>
                      </button>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#9ca3af",
                          margin: "8px 0 4px",
                        }}
                      >
                        {isEN ? "Crypto & other" : "Криптовалюта и другое"}
                      </div>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "usdt" ? "active" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "usdt" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN ? "Withdraw via USDT TRC-20" : "Вывод через USDT TRC-20"}
                        </div>
                        <div className="wallet-method-sub">TRON Network</div>
                      </button>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "paypal" ? "active" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "paypal" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN ? "Withdraw via PayPal" : "Вывод через PayPal"}
                        </div>
                        <div className="wallet-method-sub">Global payments</div>
                      </button>

                      <button
                        className={
                          "wallet-method-card " +
                          (walletForm.method === "support" ? "active" : "")
                        }
                        onClick={() =>
                          setWalletForm((p) => ({ ...p, method: "support" }))
                        }
                      >
                        <div className="wallet-method-title">
                          {isEN ? "Via support" : "Через тех.поддержку"}
                        </div>
                        <div className="wallet-method-sub">
                          {isEN ? "Manager help" : "Агент поддержки поможет"}
                        </div>
                      </button>

                      {walletForm.method === "support" ? (
                        <div style={{ marginTop: 12 }}>
                          <div className="warning-text">
                            <span>💬</span>
                            <div>
                              {isEN
                                ? "Withdrawal via technical support. Write to manager and he will help with details."
                                : "Вывод через техническую поддержку. Напишите менеджеру, он поможет с реквизитами."}
                            </div>
                          </div>
                          <a
                            href="https://t.me/ForbexSupport"
                            target="_blank"
                            className="telegram-support-btn"
                            rel="noreferrer"
                          >
                            👨‍💻 {isEN ? "Support" : "Техподдержка"}
                          </a>
                        </div>
                      ) : (
                        <div className="wallet-modal-actions">
                          <button
                            className="wallet-modal-btn primary"
                            onClick={() => {
                              setDepositError("");
                              setWithdrawStep(2);
                            }}
                            disabled={!walletForm.method}
                          >
                            {isEN ? "Next" : "Далее"}
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ШАГ 2: сумма вывода */}
                  {withdrawStep === 2 && (
                    <div className="wallet-modal-input-group">
                      <label>
                        {isEN ? "Amount" : "Сумма вывода"} ({currencyCode})
                      </label>
                      <input
                        type="number"
                        value={walletForm.amount}
                        onChange={(e) =>
                          setWalletForm({
                            ...walletForm,
                            amount: e.target.value,
                          })
                        }
                        placeholder={
                          settings.currency === "RUB" ? "Min 1000" : "Min 10"
                        }
                      />
                      {depositError && (
                        <div className="wallet-modal-note error">
                          {depositError}
                        </div>
                      )}
                      <div className="wallet-modal-actions">
                        <button
                          className="wallet-modal-btn secondary"
                          onClick={() => {
                            setDepositError("");
                            setWithdrawStep(1);
                          }}
                        >
                          {isEN ? "Back" : "Назад"}
                        </button>
                        <button
                          className="wallet-modal-btn primary"
                          onClick={() => {
                            setDepositError("");
                            setWithdrawStep(3);
                          }}
                        >
                          {isEN ? "Next" : "Далее"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* ШАГ 3: реквизиты */}
                  {withdrawStep === 3 && (
                    <div className="wallet-modal-input-group">
                      <label>
                        {walletForm.method === "card"
                          ? isEN
                            ? "Card number"
                            : "Номер карты"
                          : walletForm.method === "usdt"
                          ? isEN
                            ? "USDT wallet (TRC-20)"
                            : "Кошелёк USDT (TRC-20)"
                          : walletForm.method === "paypal"
                          ? isEN
                            ? "PayPal email"
                            : "Email PayPal"
                          : isEN
                          ? "Payout details"
                          : "Реквизиты для вывода"}
                      </label>
                      <input
                        type="text"
                        value={withdrawDetails}
                        onChange={(e) => setWithdrawDetails(e.target.value)}
                        placeholder={
                          walletForm.method === "card"
                            ? "5555 0000 0000 0000"
                            : walletForm.method === "usdt"
                            ? "TRxA1bCDeFGhijkLmNoPqRS2tuvWXyZ123"
                            : walletForm.method === "paypal"
                            ? "name@example.com"
                            : ""
                        }
                      />
                      {depositError && (
                        <div className="wallet-modal-note error">
                          {depositError}
                        </div>
                      )}
                      <div className="wallet-modal-actions">
                        <button
                          className="wallet-modal-btn secondary"
                          onClick={() => {
                            setDepositError("");
                            setWithdrawStep(2);
                          }}
                        >
                          {isEN ? "Back" : "Назад"}
                        </button>
                        <button
                          className="wallet-modal-btn primary"
                          onClick={handleWithdrawSubmit}
                        >
                          {isEN ? "Create request" : "Создать заявку"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </>
    );
  };
const renderHistory = () => {
  const methodLabel = (m) => {
    if (m === "card") return isEN ? "Bank card" : "Банковская карта";
    if (m === "usdt") return "USDT TRC-20";
    if (m === "paypal") return "PayPal";
    if (m === "support") return isEN ? "Via support" : "Через поддержку";
    return m;
  };

  return (
    <>
      <section className="section-block fade-in delay-1">
        <div className="section-title">
          <h2>{isEN ? "Login history" : "История входов"}</h2>
          <p>
            {isEN
              ? "When and with which account you logged in to Forbex."
              : "Когда и с каким аккаунтом заходили в Forbex."}
          </p>
        </div>
        <div className="history-block">
          {loginHistory.length === 0 && (
            <div className="history-empty">
              {isEN
                ? "No logins recorded yet."
                : "Входов пока не зафиксировано."}
            </div>
          )}

          {loginHistory.map((e) => {
    const typeLabel =
      e.type === "register"
        ? (isEN ? "Registration" : "Регистрация")
        : e.type === "logout"
        ? (isEN ? "Logout" : "Выход")
        : (isEN ? "Login" : "Вход");

    return (
      <div key={e.id} className="history-row">
        <div className="history-main">
          <div className="history-type">{typeLabel}</div>
          <div className="history-sub">
            {e.login} · {e.email}
          </div>
        </div>
        <div className="history-time">
          {formatDateTime(e.ts)}
        </div>
      </div>
    );
          })}
        </div>
      </section>   {/* ← ДОБАВИЛИ ЭТО */}
      {/* История кошелька */}
      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>{isEN ? "Wallet history" : "История кошелька"}</h2>
          <p>
            {isEN
              ? "Deposits and withdrawals on your Forbex wallet."
              : "Пополнения и выводы в вашем кошельке Forbex."}
          </p>
        </div>
<div className="history-block">
  {/* ЛОГИКА СКЕЛЕТОНОВ */}
  {historyLoading ? (
    // Показываем 3 фейковые строки, пока грузится
    [1, 2, 3].map((i) => (
      <div key={i} className="history-row">
        <div className="history-main">
          {/* Скелетон для заголовка */}
          <div className="skeleton" style={{ width: "100px", height: "14px", marginBottom: "4px" }}></div>
          {/* Скелетон для подзаголовка */}
          <div className="skeleton" style={{ width: "60px", height: "10px" }}></div>
        </div>
        <div className="history-right" style={{ alignItems: "flex-end", display: "flex", flexDirection: "column" }}>
          {/* Скелетон для суммы */}
          <div className="skeleton" style={{ width: "80px", height: "14px", marginBottom: "4px" }}></div>
          {/* Скелетон для времени */}
          <div className="skeleton" style={{ width: "40px", height: "10px" }}></div>
        </div>
      </div>
    ))
  ) : walletHistory.length === 0 ? (
    <div className="history-empty">
      {isEN ? "No wallet operations yet." : "Операций по кошельку ещё не было."}
    </div>
  ) : (
    // ТВОЙ СТАРЫЙ КОД МАППИНГА ИСТОРИИ (оставь как есть)
    walletHistory.map((e) => {
            const displayAmount = toDisplayCurrency(
              e.amount,
              settings.currency
            );

            const isWithdraw = e.type === "withdraw";
            const isDeposit = e.type === "deposit";

            const isPending = e.status === "pending";
            const isRejected = e.status === "rejected";
            const isApproved = e.status === "approved";
            const isDone = e.status === "done";

            const pendingWithdraw =
              isWithdraw && (!e.status || e.status === "pending");

            const rowClass =
              "history-row " +
              (isPending ? "is-pending " : "") +
              (isRejected ? "is-rejected " : "");

            let sign = isWithdraw ? "-" : "+";
            let amountClass = "history-amount ";

            if (isWithdraw) {
              amountClass += "negative";
            } else {
              if (isRejected) {
                sign = "×";
                amountClass += "rejected";
              } else if (isPending) {
                amountClass += "pending";
              } else {
                amountClass += "positive";
              }
            }

            return (
              <div key={e.id} className={rowClass}>
                <div className="history-main">
                  <div className="history-type">
                    {isWithdraw
                      ? isEN
                        ? "Withdrawal"
                        : "Вывод средств"
                      : isEN
                      ? "Deposit"
                      : "Пополнение"}
                    {" · "}
                    {methodLabel(e.method)}
                    {isWithdraw && isDone && (
                      <span
                        style={{
                          color: "#ef4444",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        {isEN ? "(completed)" : "(исполнен)"}
                      </span>
                    )}
                    {isWithdraw && pendingWithdraw && (
                      <span
                        style={{
                          color: "#fbbf24",
                          fontSize: 10,
                          marginLeft: 4,
                        }}
                      >
                        {isEN ? "(processing)" : "(обработка)"}
                      </span>
                    )}
                  </div>
                  <div className="history-sub">
                    {methodLabel(e.method)}
                  </div>
                </div>
                <div className="history-right">
                  <div className={amountClass}>
                    {sign}
                    {displayAmount.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencyCode}
                  </div>

                  {isPending && (
                    <button
                      className="cancel-btn"
                      onClick={(evt) => {
                        evt.stopPropagation();
                        const idStr = String(e.id);
                        const isWd = e.type === "withdraw";

                        if (isWd) {
                          const dbId = idStr.startsWith("wd-")
                            ? idStr.replace("wd-", "")
                            : idStr;
                          handleCancelWithdrawal(e.id, dbId);
                        } else {
                          const dbId = idStr.startsWith("topup-")
                            ? idStr.replace("topup-", "")
                            : e.topupId;
                          handleCancelDeposit(e.id, dbId);
                        }
                      }}
                    >
                      {isEN ? "Cancel" : "Отменить"}
                    </button>
                  )}

                  <div className="history-time">
                    {formatDateTime(e.ts)}
                  </div>
                </div>
              </div>
            );
          }))}
        </div>
      </section>

      {/* История сделок */}
      <section className="section-block fade-in delay-3">
        <div className="section-title">
          <h2>{isEN ? "Trade history" : "История сделок"}</h2>
          <p>
            {isEN
              ? "All your opened trades: direction, amount, multiplier and result."
              : "Все ваши открытые сделки: направление, сумма, коэффициент и результат."}
          </p>
        </div>
        <div className="history-block">
          {tradeHistory.length === 0 && (
            <div className="history-empty">
              {isEN ? "No trades yet." : "Сделок ещё не было."}
            </div>
          )}
          {tradeHistory.map((t, index) => {
            const amountDisplay = toDisplayCurrency(
              t.amount,
              settings.currency
            );
            const profitDisplay = toDisplayCurrency(
              t.profit,
              settings.currency
            );

            return (
              <div
                key={t.id}
                className={
                  "history-row" +
                  (index === 0 ? " trade-history-row-enter" : "")
                }
              >
                <div className="history-main">
                  <div className="history-type">
                    {t.symbol}/USDT ·{" "}
                    {t.direction === "up"
                      ? isEN
                        ? "Up"
                        : "Вверх"
                      : t.direction === "down"
                      ? isEN
                        ? "Down"
                        : "Вниз"
                      : isEN
                      ? "No change"
                      : "Не изменится"}{" "}
                    · x{t.multiplier}
                  </div>
                  <div className="history-sub">
                    {isEN ? "Amount" : "Сумма"}:{" "}
                    {amountDisplay.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencyCode}
                  </div>
                </div>

                <div className="history-right">
                  <div
                    className={
                      "history-amount " +
                      (t.status === "win" ? "positive" : "negative")
                    }
                  >
                    {profitDisplay > 0 ? "+" : ""}
                    {profitDisplay.toLocaleString("ru-RU", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    {currencyCode}
                  </div>
                  <div className="history-time">
                    {formatDateTime(t.finishedAt)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
};

const renderProfile = () => {
  if (!user) return null;

  // 1. Форматирование даты и времени
  const getRegDateString = () => {
    try {
      const date = new Date(user.createdAt || Date.now());
      
      const dateStr = date.toLocaleDateString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      
      const timeStr = date.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });

      return isEN 
        ? `On Forbex since ${dateStr}, ${timeStr}` 
        : `На Forbex с ${dateStr}, ${timeStr}`;
    } catch {
      return "...";
    }
  };

  // 2. Расчет статистики
  const safeHistory = Array.isArray(tradeHistory) ? tradeHistory : [];
  
  const totalTrades = safeHistory.length;
  const netProfit = safeHistory.reduce((acc, t) => acc + (Number(t.profit) || 0), 0);
  const wins = safeHistory.filter(t => t.status === 'win').length;
  const winRate = totalTrades > 0 ? Math.round((wins / totalTrades) * 100) : 0;
    
  let bestSeries = 0;
  let currentSeries = 0;
  safeHistory.forEach(t => {
      if (t.status === 'win') {
          currentSeries++;
          if (currentSeries > bestSeries) bestSeries = currentSeries;
      } else {
          currentSeries = 0;
      }
  });

  const displayProfit = toDisplayCurrency(netProfit, settings.currency);

  const safeToggles = typeof profileToggles !== 'undefined' ? profileToggles : { notifications: true, sounds: true };
  const safeToggleHandler = (key) => {
     if (typeof toggleProfileSetting === 'function') {
         toggleProfileSetting(key);
     }
  };

return (
    <>
      {/* 1. КАРТОЧКА ПРОФИЛЯ */}
      <section className="section-block fade-in delay-1">
        <div className="profile-card">
          <div className="profile-avatar">
            {userAvatarUrl ? (
              <img src={userAvatarUrl} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <span>🦊</span>
            )}
          </div>
          
          <div className="profile-main">
            <div className="profile-login">
              {user.login}
              {/* === ЗНАЧОК ВЕРИФИКАЦИИ === */}
              {userFlags.is_verified && (
                <span style={{ marginLeft: 6, fontSize: 14 }} title="Verified">✅</span>
              )}
            </div>
            <div className="profile-email">{user.email}</div>
            <div className="profile-created">{getRegDateString()}</div>
          </div>

          <div style={{ position: "absolute", top: 12, right: 14, textAlign: "right", lineHeight: 1.3 }}>
            {telegramUsername && (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#fff", marginBottom: 2 }}>
                @{telegramUsername}
              </div>
            )}
            <div style={{ fontSize: 10, opacity: 0.5 }}>
              ID: {telegramId || user.id.toString().slice(0,6)}
            </div>
          </div>
        </div>
      </section>

      {/* 2. ЛИЧНАЯ СТАТИСТИКА */}
      <section className="section-block fade-in delay-2">
        <div className="section-title">
          <h2>{isEN ? "My Statistics" : "Моя Статистика"}</h2>
        </div>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">
              {isEN ? "Total Profit" : "Общая прибыль"}
            </div>
            <div className={`stat-value ${netProfit >= 0 ? "positive" : "negative"}`}>
              {netProfit > 0 ? "+" : ""}
              {displayProfit.toLocaleString("ru-RU", {
                maximumFractionDigits: 2,
              })}{" "}
              {currencyCode}
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {isEN ? "Success Rate" : "Процент успешных сделок"}
            </div>
            <div className="stat-value text-brand-accent">{winRate}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {isEN ? "Total Trades" : "Кол-во сделок"}
            </div>
            <div className="stat-value">{totalTrades}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">
              {isEN ? "Best Series" : "Лучшая серия"}
            </div>
            <div className="stat-value positive">{bestSeries}</div>
          </div>
        </div>
        {/* Здесь был лишний закрывающий div, я его убрал */}
      </section>

      {/* 3. НАСТРОЙКИ */}
      <section className="section-block fade-in delay-3">
        <div className="section-title">
          <h2>{isEN ? "App Settings" : "Настройки приложения"}</h2>
        </div>

        <div className="settings-block">
          {/* Язык и Валюта */}
          <div className="settings-row">
            <div className="settings-label">{isEN ? "Language & Currency" : "Язык и Валюта"}</div>
            <div className="settings-chips">
              <button 
                className={`settings-chip ${settings.language === "ru" ? "active" : ""}`}
                onClick={() => updateSettings({ language: "ru" })}
              >RU</button>
              <button 
                className={`settings-chip ${settings.language === "en" ? "active" : ""}`}
                onClick={() => updateSettings({ language: "en" })}
              >EN</button>
              
              <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }}></div>
              
              <button 
                className={`settings-chip ${settings.currency === "RUB" ? "active" : ""}`}
                onClick={() => updateSettings({ currency: "RUB" })}
              >RUB</button>
              <button 
                className={`settings-chip ${settings.currency === "USD" ? "active" : ""}`}
                onClick={() => updateSettings({ currency: "USD" })}
              >USD</button>
            </div>
          </div>

          {/* Тема */}
          <div className="settings-row" style={{ marginTop: 12 }}>
            <div className="settings-label">{isEN ? "Theme" : "Тема"}</div>
            <div className="settings-chips">
              <button className={`settings-chip ${settings.theme === "fox" ? "active" : ""}`} onClick={() => updateSettings({ theme: "fox" })}>🦊 Fox</button>
              <button className={`settings-chip ${settings.theme === "night" ? "active" : ""}`} onClick={() => updateSettings({ theme: "night" })}>🌙 Night</button>
              <button className={`settings-chip ${settings.theme === "day" ? "active" : ""}`} onClick={() => updateSettings({ theme: "day" })}>☀ Day</button>
            </div>
          </div>

          {/* Переключатели */}
          <div style={{ marginTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 8 }}>
            <div className="toggle-row" onClick={() => safeToggleHandler('notifications')}>
              <div className="toggle-label">{isEN ? "Push Notifications" : "Уведомления"}</div>
              <div className={`toggle-switch ${safeToggles.notifications ? 'active' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </div>
            <div className="toggle-row" onClick={() => safeToggleHandler('sounds')}>
              <div className="toggle-label">{isEN ? "Sound Effects" : "Звуки и вибрация"}</div>
              <div className={`toggle-switch ${safeToggles.sounds ? 'active' : ''}`}>
                <div className="toggle-thumb" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. УПРАВЛЕНИЕ АККАУНТОМ */}
      <section className="section-block fade-in delay-4">
        <div className="section-title">
          <h2>{isEN ? "Security" : "Управление аккаунтом"}</h2>
        </div>
        <div className="profile-actions-grid">
          <button className="profile-btn" onClick={() => {
             setSettingsMsg("");
             setLoginForm({ login: user.login || "" });
             setLoginModalOpen(true);
          }}>
            {isEN ? "Change Login" : "Сменить логин"}
          </button>
          <button className="profile-btn" onClick={() => {
             setSettingsMsg("");
             setEmailForm({ email: user.email || "" });
             setEmailModalOpen(true);
          }}>
            {isEN ? "Change Email" : "Сменить Email"}
          </button>
          <button className="profile-btn" onClick={() => {
             setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
             setPasswordError(""); setPasswordSuccess("");
             setPasswordModalOpen(true);
          }}>
            {isEN ? "Change Password" : "Сменить пароль"}
          </button>
          <button className="profile-btn" style={{ borderColor: 'rgba(34, 197, 94, 0.3)', color: '#4ade80' }}>
            {isEN ? "Verify Identity (KYC)" : "Верификация (KYC)"}
          </button>
        </div>
        
        {settingsMsg && (
          <div className="wallet-modal-note" style={{ marginTop: 8 }}>
            {settingsMsg}
          </div>
        )}
      </section>

      {/* 5. ТЕХПОДДЕРЖКА */}
      <section className="section-block fade-in delay-5">
        <a 
            href="https://t.me/ForbexSupport" 
            target="_blank" 
            rel="noreferrer"
            className="greenPulse support-cta" 
            style={{ width: '100%', textDecoration: 'none', margin: 0 }}
        >
            <span className="support-cta-icon">👨‍💻</span>
            <span className="support-cta-text">
              {isEN ? "Contact Support" : "Написать в поддержку"}
            </span>
        </a>
      </section>

      {/* 6. ВЫХОД */}
      <section className="section-block fade-in delay-5" style={{ marginBottom: 24 }}>
        <button className="profile-btn logout" onClick={handleLogout}>
          {isEN ? "Log Out" : "Выйти из аккаунта"}
        </button>
      </section>

      {/* === МОДАЛКИ === */}
      {loginModalOpen && (
        <div className="wallet-modal-backdrop" onClick={() => setLoginModalOpen(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-title">{isEN ? "Change login" : "Смена логина"}</div>
            <div className="wallet-modal-input-group">
              <label>{isEN ? "New login" : "Новый логин"}</label>
              <input type="text" value={loginForm.login} onChange={(e) => { setLoginForm({ login: e.target.value }); setSettingsMsg(""); }} placeholder={isEN ? "New login" : "Введите новый логин"} />
            </div>
            {settingsMsg && <div className="wallet-modal-note">{settingsMsg}</div>}
            <div className="wallet-modal-actions">
              <button className="wallet-modal-btn secondary" onClick={() => setLoginModalOpen(false)}>{isEN ? "Close" : "Закрыть"}</button>
              <button className="wallet-modal-btn primary" onClick={handleLoginChange}>{isEN ? "Save" : "Сохранить"}</button>
            </div>
          </div>
        </div>
      )}

      {emailModalOpen && (
        <div className="wallet-modal-backdrop" onClick={() => setEmailModalOpen(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-title">{isEN ? "Change email" : "Смена email"}</div>
            <div className="wallet-modal-input-group">
              <label>{isEN ? "New email" : "Новый email"}</label>
              <input type="email" value={emailForm.email} onChange={(e) => { setEmailForm({ email: e.target.value }); setSettingsMsg(""); }} placeholder="name@example.com" />
            </div>
            {settingsMsg && <div className="wallet-modal-note">{settingsMsg}</div>}
            <div className="wallet-modal-actions">
              <button className="wallet-modal-btn secondary" onClick={() => setEmailModalOpen(false)}>{isEN ? "Close" : "Закрыть"}</button>
              <button className="wallet-modal-btn primary" onClick={handleEmailChange}>{isEN ? "Save" : "Сохранить"}</button>
            </div>
          </div>
        </div>
      )}

      {passwordModalOpen && (
        <div className="wallet-modal-backdrop" onClick={() => setPasswordModalOpen(false)}>
          <div className="wallet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="wallet-modal-title">{isEN ? "Change password" : "Смена пароля"}</div>
            
            <div className="wallet-modal-input-group">
              <label>{isEN ? "Current password" : "Текущий пароль"}</label>
              <input type="password" value={passwordForm.oldPassword} onChange={(e) => handlePasswordInput("oldPassword", e.target.value)} />
            </div>
            <div className="wallet-modal-input-group">
              <label>{isEN ? "New password" : "Новый пароль"}</label>
              <input type="password" value={passwordForm.newPassword} onChange={(e) => handlePasswordInput("newPassword", e.target.value)} />
            </div>
            <div className="wallet-modal-input-group">
              <label>{isEN ? "Repeat" : "Повтор нового пароля"}</label>
              <input type="password" value={passwordForm.confirmPassword} onChange={(e) => handlePasswordInput("confirmPassword", e.target.value)} />
            </div>

            {passwordError && <div className="wallet-modal-note error">{passwordError}</div>}
            {passwordSuccess && <div className="wallet-modal-note success">{passwordSuccess}</div>}

            <div className="wallet-modal-actions">
              <button className="wallet-modal-btn secondary" onClick={() => setPasswordModalOpen(false)}>{isEN ? "Close" : "Закрыть"}</button>
              <button className="wallet-modal-btn primary" onClick={handlePasswordChange}>{isEN ? "Save" : "Сохранить"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ===== Рендер AUTH (когда нет user) =====

const renderAuth = () => {
  return (
    <div className="auth-screen fade-in">
      <div className="auth-card fade-in delay-1">
        <div className="auth-fox">🦊</div>
        <div className="auth-title">Forbex Trade</div>

        {!postRegisterStep && (
          <div className="auth-sub">
            Биржевой интерфейс под Telegram WebApp. Создайте аккаунт, чтобы
            продолжить.
          </div>
        )}

        {postRegisterStep && pendingUser ? (
          <div className="post-register">
            <div className="post-register-title">✅ Успешно зарегистрированы</div>
            <div className="post-register-sub">
              Аккаунт: <b>{pendingUser.login}</b> · {pendingUser.email}
            </div>

            <div className="settings-block">
              <div className="settings-row">
                <div className="settings-label">Выберите язык</div>
                <div className="settings-chips">
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.language === "ru" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        language: "ru",
                      }))
                    }
                  >
                    🇷🇺 Русский
                  </button>
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.language === "en" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        language: "en",
                      }))
                    }
                  >
                    🇺🇸 English
                  </button>
                </div>
              </div>

              <div className="settings-row">
                <div className="settings-label">Выберите валюту баланса</div>
                <div className="settings-chips">
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.currency === "RUB" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        currency: "RUB",
                      }))
                    }
                  >
                    RUB
                  </button>
                  <button
                    className={
                      "settings-chip " +
                      (tempSettings.currency === "USD" ? "active" : "")
                    }
                    onClick={() =>
                      setTempSettings((prev) => ({
                        ...prev,
                        currency: "USD",
                      }))
                    }
                  >
                    USD
                  </button>
                </div>
              </div>
            </div>

            <button className="auth-submit" onClick={completeRegistration}>
              Продолжить
            </button>

            <div className="auth-note">
              Выбор языка и валюты можно потом поменять в профиле.
            </div>
          </div>
        ) : (
          <>
            <div className="auth-tabs">
              <button
                className={
                  "auth-tab " + (authMode === "login" ? "active" : "")
                }
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                Вход
              </button>
              <button
                className={
                  "auth-tab " + (authMode === "register" ? "active" : "")
                }
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                Регистрация
              </button>
            </div>

            <div className="auth-form">
              {authMode === "login" ? (
                <>
                  <label>
                    Логин или email
                    <input
                      type="text"
                      value={authForm.login}
                      onChange={(e) =>
                        handleAuthInput("login", e.target.value)
                      }
                      placeholder="Введите логин или email"
                    />
                  </label>

                  <label>
                    Пароль
                    <div className="password-field">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="password-input"
                        value={authForm.password}
                        onChange={(e) =>
                          handleAuthInput("password", e.target.value)
                        }
                        placeholder="Не менее 4 символов"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </label>
                </>
              ) : (
                <>
                  <label>
                    Ваш логин
                    <input
                      type="text"
                      value={authForm.login}
                      onChange={(e) =>
                        handleAuthInput("login", e.target.value)
                      }
                      placeholder="Ваш логин"
                    />
                  </label>

                  <label>
                    Email
                    <input
                      type="email"
                      value={authForm.email}
                      onChange={(e) =>
                        handleAuthInput("email", e.target.value)
                      }
                      placeholder="name@example.com"
                    />
                  </label>

                  <label>
                    Пароль
                    <div className="password-field">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="password-input"
                        value={authForm.password}
                        onChange={(e) =>
                          handleAuthInput("password", e.target.value)
                        }
                        placeholder="Не менее 4 символов"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </label>

                  <label>
                    Повторите пароль
                    <div className="password-field">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        className="password-input"
                        value={authForm.confirmPassword}
                        onChange={(e) =>
                          handleAuthInput(
                            "confirmPassword",
                            e.target.value
                          )
                        }
                        placeholder="Введите пароль ещё раз"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() =>
                          setShowConfirmPassword((v) => !v)
                        }
                      >
                        {showConfirmPassword ? "🙈" : "👁"}
                      </button>
                    </div>
                  </label>

                  <label>
                    Промокод{" "}
                    <span style={{ color: "#6b7280" }}>(необязательно)</span>
                    <input
                      type="text"
                      value={authForm.promo}
                      onChange={(e) =>
                        handleAuthInput("promo", e.target.value)
                      }
                      placeholder="Введите промокод (если есть)"
                    />
                  </label>
                </>
              )}

              <div
                className="auth-remember"
                onClick={() =>
                  handleAuthInput("remember", !authForm.remember)
                }
              >
                <div
                  className={
                    "remember-toggle " + (authForm.remember ? "on" : "")
                  }
                >
                  <div className="remember-thumb" />
                </div>
                <span>Запомнить меня</span>
              </div>

              {authError && (
                <div className="auth-error">{authError}</div>
              )}

              <button
                className="auth-submit"
                onClick={
                  authMode === "register" ? handleRegister : handleLogin
                }
              >
                {authMode === "register"
                  ? "Зарегистрироваться"
                  : "Войти"}
              </button>

              {authMode === "register" ? (
                <>
                  <div className="auth-note">
                    Нажимая «Зарегистрироваться», вы соглашаетесь с правилами
                    обработки персональных данных,{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setLegalModal("terms")}
                    >
                      Правилами пользователя
                    </button>{" "}
                    и{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setLegalModal("privacy")}
                    >
                      Политикой конфиденциальности
                    </button>{" "}
                    платформы Forbex Trade.
                  </div>
                  <div className="auth-note">
                    Уже есть аккаунт?{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setAuthMode("login")}
                    >
                      Войти
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="auth-note">
                    Нет аккаунта?{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setAuthMode("register")}
                    >
                      Зарегистрироваться
                    </button>
                  </div>
                  <div className="auth-note">
                    Входя в аккаунт, вы подтверждаете, что ознакомились
                    и соглашаетесь с{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setLegalModal("terms")}
                    >
                      Правилами пользователя
                    </button>{" "}
                    и{" "}
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => setLegalModal("privacy")}
                    >
                      Политикой конфиденциальности
                    </button>{" "}
                    платформы Forbex Trade.
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ===== Основной JSX =====

if (booting) {
  return (
    <Shell theme={settings.theme || "fox"} className={isUiSwapping ? "ui-swapping" : ""}>
      <Loader />
    </Shell>
  );
}

if (!user && showLanding) {
  return (
    <>
      {/* Оверлей поверх лендинга */}
      {overlayLoading && (
        <Loader
          title={overlayText.title}
          subtitle={overlayText.subtitle}
        />
      )}

      <LandingPage
        onLogin={() =>
          showOverlay(
            "FORBEX TRADE",
            isEN ? "Opening your personal area..." : "Открываем личный кабинет…",
            () => {
              setShowLanding(false);
              setAuthMode("login");
            },
            900
          )
        }
        onRegister={() =>
          showOverlay(
            "FORBEX TRADE",
            isEN ? "Creating account..." : "Создаём аккаунт трейдера…",
            () => {
              setShowLanding(false);
              setAuthMode("register");
            },
            900
          )
        }
      />

      {/* Модалка с правилами / политикой для лендинга */}
      {legalModal && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="wallet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="wallet-modal-close"
              onClick={() => setLegalModal(null)}
            >
              ✕
            </button>

            <div className="wallet-modal-title">
              {legalModal === "terms"
                ? "Правила пользователя"
                : "Политика конфиденциальности"}
            </div>

            <div className="legal-modal-body">
              {legalModal === "terms" ? (
                <>
                  <p>
                    Платформа Forbex Trade предоставляет пользователям
                    интерфейс для операций с цифровыми активами в формате
                    WebApp. Мы работаем на рынке с 2014 года, постоянно
                    улучшая инфраструктуру, скорость исполнения ордеров
                    и качество службы поддержки.
                  </p>
                  <p>Основные принципы использования платформы:</p>
                  <ul>
                    <li>
                      Платформа предназначена для совершеннолетних
                      пользователей, принимающих на себя все риски,
                      связанные с операциями с цифровыми активами.
                    </li>
                    <li>
                      Пользователь обязуется указывать достоверные данные
                      при регистрации и не передавать доступ к аккаунту
                      третьим лицам.
                    </li>
                    <li>
                      Оборот и результаты торговли зависят от рыночной
                      ситуации и не гарантируются платформой.
                    </li>
                    <li>
                      Администрация вправе временно ограничивать доступ
                      к отдельным функциям при проведении технических
                      работ и мер безопасности.
                    </li>
                    <li>
                      Все действия в личном кабинете фиксируются в
                      истории операций и могут быть использованы для
                      проверок безопасности и разрешения спорных ситуаций.
                    </li>
                  </ul>
                  <p>
                    Используя Forbex Trade, вы подтверждаете, что
                    понимаете характер рисков, связанных с цифровыми
                    активами, и действуете от своего имени и в своих
                    интересах.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Forbex Trade уважает конфиденциальность своих
                    пользователей и обрабатывает персональные данные
                    строго в объёме, необходимом для работы платформы
                    и исполнения обязательств перед пользователем.
                  </p>
                  <p>Мы можем обрабатывать и хранить следующие данные:</p>
                  <ul>
                    <li>
                      регистрационные данные (логин, email, технические
                      идентификаторы Telegram WebApp);
                    </li>
                    <li>
                      техническую информацию о сессии (IP-адрес,
                      тип устройства, браузер, время входа);
                    </li>
                    <li>
                      историю действий внутри личного кабинета
                      (пополнения, выводы, сделки, изменения настроек).
                    </li>
                  </ul>
                  <p>
                    Данные используются для обеспечения работы
                    платформы, повышения безопасности, анализа нагрузки
                    и улучшения качества сервиса. Мы не передаём
                    персональные данные третьим лицам, за исключением
                    случаев, прямо предусмотренных действующим
                    законодательством или необходимых для исполнения
                    юридически значимых запросов.
                  </p>
                  <p>
                    Часть вспомогательной информации (например,
                    настройки интерфейса) может сохраняться локально
                    в вашем браузере в виде cookies и локального
                    хранилища. Это помогает сохранять выбранный язык,
                    валюту и упорядочивать отображение интерфейса.
                  </p>
                  <p>
                    Используя платформу Forbex Trade, вы даёте согласие
                    на обработку ваших персональных данных в соответствии
                    с настоящей Политикой конфиденциальности и
                    применимыми нормами действующего законодательства.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

if (!user) {
  return (
    <Shell theme={settings.theme || "fox"} className={isUiSwapping ? "ui-swapping" : ""}>
      {overlayLoading && (
        <div className="boot-loader">
          <div className="fox-orbit">
            <div className="fox-core">🦊</div>
            <div className="orbit-ring orbit-ring-1" />
            <div className="orbit-ring orbit-ring-2" />
            <div className="orbit-dot orbit-dot-1" />
            <div className="orbit-dot orbit-dot-2" />
          </div>
          <div className="boot-title">{overlayText.title || "FORBEX TRADE"}</div>
          <div className="boot-sub">
            {overlayText.subtitle || "Please wait."}
          </div>
        </div>
      )}

      {/* Кнопка НАЗАД на лендинг */}
      <button
        onClick={() =>
          showOverlay(
            "FORBEX TRADE",
            "Возвращаем на лендинг…",
            () => setShowLanding(true),
            600
          )
        }
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 50,
          background: "none",
          border: "none",
          color: "#fff",
          fontSize: "24px",
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      {renderAuth()}

      {/* Модалка с правилами / политикой для экрана авторизации */}
      {legalModal && (
        <div
          className="wallet-modal-backdrop"
          onClick={() => setLegalModal(null)}
        >
          <div
            className="wallet-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="wallet-modal-close"
              onClick={() => setLegalModal(null)}
            >
              ✕
            </button>

            <div className="wallet-modal-title">
              {legalModal === "terms"
                ? "Правила пользователя"
                : "Политика конфиденциальности"}
            </div>

            <div className="legal-modal-body">
              {legalModal === "terms" ? (
                <>
                  <p>
                    Платформа Forbex Trade предоставляет пользователям
                    интерфейс для операций с цифровыми активами в формате
                    WebApp. Мы работаем на рынке с 2014 года, постоянно
                    улучшая инфраструктуру, скорость исполнения ордеров
                    и качество службы поддержки.
                  </p>
                  <p>Основные принципы использования платформы:</p>
                  <ul>
                    <li>
                      Платформа предназначена для совершеннолетних
                      пользователей, принимающих на себя все риски,
                      связанные с операциями с цифровыми активами.
                    </li>
                    <li>
                      Пользователь обязуется указывать достоверные данные
                      при регистрации и не передавать доступ к аккаунту
                      третьим лицам.
                    </li>
                    <li>
                      Оборот и результаты торговли зависят от рыночной
                      ситуации и не гарантируются платформой.
                    </li>
                    <li>
                      Администрация вправе временно ограничивать доступ
                      к отдельным функциям при проведении технических
                      работ и мер безопасности.
                    </li>
                    <li>
                      Все действия в личном кабинете фиксируются в
                      истории операций и могут быть использованы для
                      проверок безопасности и разрешения спорных ситуаций.
                    </li>
                  </ul>
                  <p>
                    Используя Forbex Trade, вы подтверждаете, что
                    понимаете характер рисков, связанных с цифровыми
                    активами, и действуете от своего имени и в своих
                    интересах.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    Forbex Trade уважает конфиденциальность своих
                    пользователей и обрабатывает персональные данные
                    строго в объёме, необходимом для работы платформы
                    и исполнения обязательств перед пользователем.
                  </p>
                  <p>Мы можем обрабатывать и хранить следующие данные:</p>
                  <ul>
                    <li>
                      регистрационные данные (логин, email, технические
                      идентификаторы Telegram WebApp);
                    </li>
                    <li>
                      техническую информацию о сессии (IP-адрес,
                      тип устройства, браузер, время входа);
                    </li>
                    <li>
                      историю действий внутри личного кабинета
                      (пополнения, выводы, сделки, изменения настроек).
                    </li>
                  </ul>
                  <p>
                    Данные используются для обеспечения работы
                    платформы, повышения безопасности, анализа нагрузки
                    и улучшения качества сервиса. Мы не передаём
                    персональные данные третьим лицам, за исключением
                    случаев, прямо предусмотренных действующим
                    законодательством или необходимых для исполнения
                    юридически значимых запросов.
                  </p>
                  <p>
                    Часть вспомогательной информации (например,
                    настройки интерфейса) может сохраняться локально
                    в вашем браузере в виде cookies и локального
                    хранилища. Это помогает сохранять выбранный язык,
                    валюту и упорядочивать отображение интерфейса.
                  </p>
                  <p>
                    Используя платформу Forbex Trade, вы даёте согласие
                    на обработку ваших персональных данных в соответствии
                    с настоящей Политикой конфиденциальности и
                    применимыми нормами действующего законодательства.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Shell>
  );
}
return (
  <Shell theme={settings.theme || "fox"} className={isUiSwapping ? "ui-swapping" : ""}>
    {overlayLoading && (
      <div className="boot-loader">
        {/* сюда можешь вставить свой fox-loader, как в других местах */}
      </div>
    )}

    {/* Шапка */}
    <header className="header">
      <div className="brand">
        <div className="brand-logo">🦊</div>
        <div className="brand-text">
          <span className="brand-title">Forbex Trade</span>
          <span className="brand-sub">
            {isEN
              ? "Crypto-platform in fox style"
              : "Крипто-платформа в лисьем стиле"}
          </span>
        </div>
      </div>
    </header>

    <main className="content">
      <div key={activeTab} className="tab-content">
        {activeTab === 1 && renderHome()}
        {activeTab === 2 && renderTrade()}
        {activeTab === 3 && renderWallet()}
        {activeTab === 4 && renderHistory()}
        {activeTab === 5 && renderProfile()}
      </div>
    </main>

<footer className="footer-legal">
  <div className="footer-legal-card">
    <div className="footer-legal-text">
      <div className="footer-legal-brand">
        © 2014–2025 Forbex Trade
      </div>
      <div className="footer-legal-paragraph">
        Уже более 10 лет на рынке цифровых активов. Платформа
        Forbex Trade обслуживает десятки тысяч активных трейдеров
        и обрабатывает сотни тысяч сделок ежемесячно в
        USDT-эквиваленте.
      </div>
    </div>

    <div className="footer-legal-links">
      <button
        type="button"
        className="footer-link-btn"
        onClick={() => setLegalModal("terms")}
      >
        Правила пользователя
      </button>
      <button
        type="button"
        className="footer-link-btn"
        onClick={() => setLegalModal("privacy")}
      >
        Политика конфиденциальности
      </button>
    </div>
  </div>
</footer>

    {/* Нижняя навигация */}
    <nav className="bottom-nav">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={
            "nav-tab " + (activeTab === tab.id ? "nav-tab-active" : "")
          }
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="nav-tab-icon">{tab.icon}</span>
          <span className="nav-tab-label">
            {isEN ? tab.labelEn : tab.labelRu}
          </span>
        </button>
      ))}
    </nav>

    {/* Модалка с правилами / политикой */}
    {legalModal && (
      <div
        className="wallet-modal-backdrop"
        onClick={() => setLegalModal(null)}
      >
        <div
          className="wallet-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="wallet-modal-close"
            onClick={() => setLegalModal(null)}
          >
            ✕
          </button>

          <div className="wallet-modal-title">
            {legalModal === "terms"
              ? "Правила пользователя"
              : "Политика конфиденциальности"}
          </div>

          <div className="legal-modal-body">
            {legalModal === "terms" ? (
              <>
                <p>
                  Платформа Forbex Trade предоставляет пользователям
                  интерфейс для операций с цифровыми активами в формате
                  WebApp. Мы работаем на рынке с 2014 года, постоянно
                  улучшая инфраструктуру, скорость исполнения ордеров
                  и качество службы поддержки.
                </p>
                <p>Основные принципы использования платформы:</p>
                <ul>
                  <li>
                    Платформа предназначена для совершеннолетних
                    пользователей, принимающих на себя все риски,
                    связанные с операциями с цифровыми активами.
                  </li>
                  <li>
                    Пользователь обязуется указывать достоверные данные
                    при регистрации и не передавать доступ к аккаунту
                    третьим лицам.
                  </li>
                  <li>
                    Оборот и результаты торговли зависят от рыночной
                    ситуации и не гарантируются платформой.
                  </li>
                  <li>
                    Администрация вправе временно ограничивать доступ
                    к отдельным функциям при проведении технических
                    работ и мер безопасности.
                  </li>
                  <li>
                    Все действия в личном кабинете фиксируются в
                    истории операций и могут быть использованы для
                    проверок безопасности и разрешения спорных ситуаций.
                  </li>
                </ul>
                <p>
                  Используя Forbex Trade, вы подтверждаете, что
                  понимаете характер рисков, связанных с цифровыми
                  активами, и действуете от своего имени и в своих
                  интересах.
                </p>
              </>
            ) : (
              <>
                <p>
                  Forbex Trade уважает конфиденциальность своих
                  пользователей и обрабатывает персональные данные
                  строго в объёме, необходимом для работы платформы
                  и исполнения обязательств перед пользователем.
                </p>
                <p>Мы можем обрабатывать и хранить следующие данные:</p>
                <ul>
                  <li>
                    регистрационные данные (логин, email, технические
                    идентификаторы Telegram WebApp);
                  </li>
                  <li>
                    техническую информацию о сессии (IP-адрес,
                    тип устройства, браузер, время входа);
                  </li>
                  <li>
                    историю действий внутри личного кабинета
                    (пополнения, выводы, сделки, изменения настроек).
                  </li>
                </ul>
                <p>
                  Данные используются для обеспечения работы
                  платформы, повышения безопасности, анализа нагрузки
                  и улучшения качества сервиса. Мы не передаём
                  персональные данные третьим лицам, за исключением
                  случаев, прямо предусмотренных действующим
                  законодательством или необходимых для исполнения
                  юридически значимых запросов.
                </p>
                <p>
                  Часть вспомогательной информации (например,
                  настройки интерфейса) может сохраняться локально
                  в вашем браузере в виде cookies и локального
                  хранилища. Это помогает сохранять выбранный язык,
                  валюту и упорядочивать отображение интерфейса.
                </p>
                <p>
                  Используя платформу Forbex Trade, вы даёте согласие
                  на обработку ваших персональных данных в соответствии
                  с настоящей Политикой конфиденциальности и
                  применимыми нормами действующего законодательства.
                </p>
              </>
            )}
       {/* ... (тут код legalModal) ... */}
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast-root toast-${toast.type} fade-in`}>
          <div className="toast-icon">
            {toast.type === "success" ? "✅" : toast.type === "error" ? "❌" : "ℹ️"}
          </div>
          <div className="toast-content">
            <div className="toast-title">
              {toast.type === "success"
                ? isEN ? "Success" : "Успешно"
                : isEN ? "Error" : "Ошибка"}
            </div>
            <div className="toast-text">{toast.text}</div>
          </div>
          <div className="toast-progress"></div> 
        </div>
      )}

    </Shell>
  );
}

export default App;
