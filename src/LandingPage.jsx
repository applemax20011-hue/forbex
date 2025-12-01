import React, { useEffect, useRef, useState } from "react"; 

// Данные для тикера (бегущая строка)
const COINS = [
  { name: "BTC", price: "97,320.50", change: "+3.2%", up: true },
  { name: "ETH", price: "3,270.12", change: "+1.8%", up: true },
  { name: "SOL", price: "192.30", change: "-0.7%", up: false },
  { name: "USDT", price: "100.50 ₽", change: "+0.1%", up: true },
  { name: "TON", price: "6.25", change: "+4.5%", up: true },
  { name: "EUR/RUB", price: "105.20", change: "+0.4%", up: true },
];

// Уведомления
const LIVE_ACTIONS = [
  "Александр К. (Москва) вывел 50,000 ₽",
  "Елена В. (СПб) купила 0.5 BTC",
  "Дмитрий (Казань) открыл сделку",
  "User7723 получил бонус",
  "Иван М. пополнил счет через СБП",
];

// --- КОМПОНЕНТЫ ЛЕНДИНГА ---

const Ticker = () => (
  <div className="w-full bg-black/60 border-b border-orange-500/20 overflow-hidden py-2 backdrop-blur-md relative z-40">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...COINS, ...COINS, ...COINS].map((coin, i) => (
        <div
          key={i}
          className="flex items-center mx-4 sm:mx-6 text-xs sm:text-sm font-mono"
        >
          <span className="font-bold text-white mr-2">{coin.name}</span>
          <span className="text-orange-100/80 mr-2">${coin.price}</span>
          <span className={coin.up ? "text-orange-500" : "text-red-500"}>
            {coin.change}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const LiveNotification = () => {
  const [notification, setNotification] = useState(LIVE_ACTIONS[0]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setNotification(
          LIVE_ACTIONS[Math.floor(Math.random() * LIVE_ACTIONS.length)]
        );
        setVisible(true);
      }, 500);
    }, 6000);

    setTimeout(() => setVisible(true), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`hidden md:block fixed bottom-8 left-8 z-50 transition-all duration-500 transform ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="bg-black/80 backdrop-blur-xl px-4 py-3 rounded-lg flex items-center gap-3 border-l-4 border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
        <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
        <span className="text-xs font-mono text-gray-200">{notification}</span>
      </div>
    </div>
  );
};

const LiveChart = () => (
  <div className="w-full h-40 sm:h-48 relative overflow-hidden rounded-xl bg-black/50 border border-orange-500/20 p-3 sm:p-4">
    <div className="absolute top-2 left-3 sm:left-4 text-xs text-gray-500 font-mono">
      BTC/USD LIVE
    </div>
    <svg viewBox="0 0 400 100" className="w-full h-full">
      <defs>
        <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,80 Q20,70 40,85 T80,50 T120,60 T160,30 T200,55 T240,40 T280,20 T320,40 T360,10 T400,30 V100 H0 Z"
        fill="url(#gradient)"
      />
      <path
        d="M0,80 Q20,70 40,85 T80,50 T120,60 T160,30 T200,55 T240,40 T280,20 T320,40 T360,10 T400,30"
        fill="none"
        stroke="#f97316"
        strokeWidth="2"
        className="drop-shadow-[0_0_6px_rgba(249,115,22,0.5)]"
      />
    </svg>
  </div>
);

const ThreeBackground = () => {
  const mountRef = useRef(null);

  useEffect(() => {
    if (!window.THREE) return;
    const THREE = window.THREE;

    const scene = new THREE.Scene();
    // Легкий оранжевый туман
    scene.fog = new THREE.FogExp2(0x050200, 0.02);

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (mountRef.current) {
      mountRef.current.innerHTML = "";
      mountRef.current.appendChild(renderer.domElement);
    }

    const particlesGeometry = new THREE.BufferGeometry();
    const count = window.innerWidth < 768 ? 150 : 300;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 40;
    }
    particlesGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );

    const material = new THREE.PointsMaterial({
      size: 0.06,
      color: 0xff8800, // Яркий оранжевый
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);
    camera.position.z = 10;

    let mouseX = 0,
      mouseY = 0;

    const animate = () => {
      requestAnimationFrame(animate);
      particlesMesh.rotation.y += 0.0008;
      particlesMesh.rotation.x += 0.0004;
      camera.position.x += (mouseX * 1.5 - camera.position.x) * 0.05;
      camera.position.y += (-mouseY * 1.5 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      renderer.render(scene, camera);
    };
    animate();

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = (e.clientY / window.innerHeight) * 2 - 1;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      if (mountRef.current) mountRef.current.innerHTML = "";
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      id="canvas-container"
      style={{ position: "fixed", inset: 0, zIndex: -2 }}
    />
  );
};

const Modal = ({ open, onClose, title, children }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0b0b0b] border border-white/10 rounded-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="text-sm font-bold text-white">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/5 transition-colors"
          >
            <i data-lucide="x" className="w-4 h-4 text-gray-400" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto text-xs text-gray-300 space-y-3">
          {children}
        </div>
        <div className="px-5 py-3 border-t border-white/10 text-right">
          <button
            onClick={onClose}
            className="text-xs text-orange-500 hover:text-orange-400 font-bold transition-colors"
          >
            ЗАКРЫТЬ
          </button>
        </div>
      </div>
    </div>
  );
};

// === COSMIC ORANGE BACKGROUND (ОРАНЖЕВЫЙ КОСМОС) ===
const BackgroundEffects = () => (
  <>
    {/* 1. Глубокая черная база */}
    <div className="fixed inset-0 bg-[#050201] -z-50" />
    
    {/* 2. Текстура шума (зернистость) */}
    <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.06] pointer-events-none -z-40 mix-blend-overlay" />
    
    {/* 3. Оранжевое свечение сверху (Основной Cosmic Orange) */}
    <div 
      className="fixed top-[-20%] left-[-10%] w-[80%] h-[80%] bg-orange-600/20 rounded-full blur-[140px] -z-30 animate-pulse" 
      style={{ animationDuration: '8s' }} 
    />
    
    {/* 4. Вторичное свечение снизу (Глубокий красный/оранжевый) */}
    <div className="fixed bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/15 rounded-full blur-[120px] -z-30" />

    {/* 5. Кибер-сетка оранжевого цвета */}
    <div className="fixed inset-0 bg-[linear-gradient(rgba(249,115,22,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(249,115,22,0.07)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_50%,#000_70%,transparent_100%)] -z-20 pointer-events-none" />
  </>
);

const PaymentPartners = () => (
  <div className="py-8 border-t border-white/5 bg-black/30 backdrop-blur-sm text-center relative z-20 mt-auto">
    <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-[0.2em] font-mono">Trusted Payment Systems</p>
    <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-12 opacity-70 hover:opacity-100 transition-all duration-500">
       <div className="flex items-center gap-1 font-bold text-2xl italic text-white group">
          <span className="text-blue-500 group-hover:drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all">Visa</span>
       </div>
       <div className="flex items-center gap-1 font-bold text-2xl text-white group">
          <span className="text-red-500 group-hover:drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">Master</span>
          <span className="text-yellow-500 group-hover:drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]">Card</span>
       </div>
       <div className="flex items-center gap-2 font-bold text-xl text-green-500 group hover:text-green-400 transition-colors">
          USDT 
          <span className="text-[10px] border border-green-500 px-1.5 py-0.5 rounded text-white group-hover:bg-green-500/20 transition-all">TRC20</span>
       </div>
       <div className="font-bold text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 hover:brightness-125 transition-all">
          СБП
       </div>
       <div className="font-bold text-2xl text-white hover:text-green-400 transition-colors">
          MIR
       </div>
    </div>
  </div>
);

// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ---

export default function LandingPage({ onLogin, onRegister }) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Пересоздаём иконки lucide, когда открываются модалки/меню
  useEffect(() => {
    if (window.lucide) window.lucide.createIcons();
  }, [showPrivacy, showTerms, mobileMenuOpen]);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative min-h-screen text-white font-sans selection:bg-orange-500 selection:text-black pb-0 flex flex-col">
      
      {/* 1. ФОН: Cyber/Cosmic Orange Effects */}
      <BackgroundEffects />
      <ThreeBackground />
      
      {/* Тикер */}
      <Ticker />

      {/* Навигация */}
      <nav className="w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/5 py-4 sticky top-0">
        <div className="container mx-auto px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 group cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-700 rounded-xl flex items-center justify-center border border-orange-400/50 shadow-[0_0_15px_rgba(249,115,22,0.3)] group-hover:scale-105 transition-transform">
              <span className="text-xl">🦊</span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold tracking-wider">FORBEX</span>
              <span className="text-[9px] text-orange-500 tracking-[0.25em] font-bold">TRADE</span>
            </div>
          </div>

          {/* Линки по секциям (десктоп) */}
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-gray-400">
            <button onClick={() => scrollToSection("how-it-works")} className="hover:text-orange-400 hover:drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] transition-all">
              Start
            </button>
            <button onClick={() => scrollToSection("features")} className="hover:text-orange-400 hover:drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] transition-all">
              Features
            </button>
            <button onClick={() => scrollToSection("faq")} className="hover:text-orange-400 hover:drop-shadow-[0_0_5px_rgba(249,115,22,0.8)] transition-all">
              FAQ
            </button>
          </div>

          {/* Правый блок: кнопки + бургер */}
          <div className="flex items-center gap-4">
            <button
              onClick={onLogin}
              className="hidden sm:inline-block text-sm font-bold hover:text-orange-400 transition-colors"
            >
              Вход
            </button>
            <button
              onClick={onRegister}
              className="hidden sm:inline-block bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-sm hover:bg-orange-500 hover:shadow-[0_0_20px_rgba(249,115,22,0.4)] transition-all transform hover:-translate-y-0.5"
            >
              Регистрация
            </button>

            {/* Бургер (мобилка) */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
            >
              <i data-lucide={mobileMenuOpen ? "x" : "menu"} className="w-5 h-5 text-orange-400" />
            </button>
          </div>
        </div>

        {/* Мобильное меню */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-3 border-t border-white/10 pt-3 bg-black/95 backdrop-blur-xl absolute w-full left-0 shadow-2xl">
            <div className="container mx-auto px-6 flex flex-col gap-4 py-4 text-sm text-gray-200 font-medium">
              <button onClick={() => scrollToSection("how-it-works")} className="flex justify-between items-center py-2 border-b border-white/5">
                <span>Как начать</span> <i data-lucide="chevron-right" className="w-4 h-4 text-orange-500" />
              </button>
              <button onClick={() => scrollToSection("features")} className="flex justify-between items-center py-2 border-b border-white/5">
                <span>Возможности</span> <i data-lucide="chevron-right" className="w-4 h-4 text-orange-500" />
              </button>
              <button onClick={() => scrollToSection("faq")} className="flex justify-between items-center py-2 border-b border-white/5">
                <span>FAQ</span> <i data-lucide="chevron-right" className="w-4 h-4 text-orange-500" />
              </button>

              <div className="grid grid-cols-2 gap-4 mt-2">
                <button onClick={() => { setMobileMenuOpen(false); onLogin && onLogin(); }} className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 text-center">
                  Вход
                </button>
                <button onClick={() => { setMobileMenuOpen(false); onRegister && onRegister(); }} className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-center">
                  Регистрация
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* HERO Секция */}
      <section className="pt-16 pb-20 relative overflow-visible">
        <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="space-y-8 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 mx-auto md:mx-0 backdrop-blur-md">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_10px_#4ade80]" />
              <span className="text-[10px] font-mono text-orange-300 uppercase tracking-widest">
                Работает в РФ 24/7
              </span>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-black leading-[0.9]">
              Торгуй <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-red-500 drop-shadow-[0_0_25px_rgba(249,115,22,0.4)]">
                БЕЗ ГРАНИЦ.
              </span>
            </h1>
            
            <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto md:mx-0 leading-relaxed">
              Единая экосистема для акций, крипты и форекса. Пополнение через
              СБП, P2P и криптовалюты. Никаких блокировок.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <button
                onClick={onRegister}
                className="px-10 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-xl hover:scale-105 transition-all duration-300 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 group"
              >
                Открыть счет
                <i data-lucide="arrow-right" className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={onLogin}
                className="px-10 py-4 bg-white/5 backdrop-blur border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <i data-lucide="log-in" className="w-5 h-5" />
                Войти
              </button>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-xs text-gray-500 font-mono pt-2 opacity-80">
              <div className="flex items-center gap-2">
                <i data-lucide="shield-check" className="text-green-400 w-4 h-4" />
                <span>No KYC до $15k</span>
              </div>
              <div className="flex items-center gap-2">
                <i data-lucide="zap" className="text-yellow-400 w-4 h-4" />
                <span>Моментальный вывод</span>
              </div>
            </div>
          </div>

          {/* Интерактивная карточка */}
          <div className="relative mt-8 md:mt-0 mx-auto max-w-sm w-full perspective-1000">
            <div className="bg-[#0a0a0a]/80 backdrop-blur-xl p-6 rounded-3xl border border-white/10 md:transform md:rotate-2 md:hover:rotate-0 transition-all duration-500 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative group">
              {/* Блик на карточке */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent rounded-3xl pointer-events-none" />
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-500 text-[10px] font-mono mb-1 tracking-widest">TOTAL BALANCE</p>
                  <h3 className="text-3xl font-bold font-mono text-white tracking-tight">$124,592.40</h3>
                </div>
                <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full text-xs font-bold shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                  +12.5%
                </div>
              </div>
              
              <LiveChart />
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button onClick={onRegister} className="bg-green-500/10 text-green-400 py-3 rounded-xl font-bold hover:bg-green-500 hover:text-black transition-all text-sm border border-green-500/20">
                  Купить
                </button>
                <button onClick={onRegister} className="bg-red-500/10 text-red-400 py-3 rounded-xl font-bold hover:bg-red-500 hover:text-black transition-all text-sm border border-red-500/20">
                  Продать
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Как начать */}
      <section id="how-it-works" className="py-20 relative z-10">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold mb-10 text-center md:text-left">
            Как начать за 10 минут
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: "user-plus",
                title: "1. Регистрация",
                desc: "Создай аккаунт по номеру телефона или email. Без сложных анкет.",
                color: "text-orange-400",
                bg: "bg-orange-500/10"
              },
              {
                icon: "wallet-cards",
                title: "2. Пополнение",
                desc: "Пополняй баланс через СБП, карту РФ или криптовалюту.",
                color: "text-blue-400",
                 bg: "bg-blue-500/10"
              },
              {
                icon: "activity",
                title: "3. Торговля",
                desc: "Открывай сделки на акциях, крипте и форексе в один клик.",
                color: "text-green-400",
                 bg: "bg-green-500/10"
              },
            ].map((step, idx) => (
              <div key={idx} className="bg-[#0c0c0c] hover:bg-[#151515] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${step.bg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <i data-lucide={step.icon} className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <h3 className="text-lg font-bold">{step.title}</h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Карточки преимуществ */}
      <section id="features" className="py-10 relative z-10 container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: "globe-2", title: "Все рынки", desc: "NASDAQ, MOEX, Crypto.", color: "text-blue-400" },
            { icon: "credit-card", title: "Рубли", desc: "Ввод/вывод на карты РФ.", color: "text-orange-400" },
            { icon: "lock", title: "Безопасность", desc: "Холодное хранение.", color: "text-purple-400" },
            { icon: "smartphone", title: "WebApp", desc: "Торгуй прямо в Telegram.", color: "text-yellow-400" },
          ].map((card, idx) => (
            <div key={idx} className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-2xl hover:-translate-y-1 hover:border-orange-500/30 transition-all group">
              <div className="mb-4">
                <i data-lucide={card.icon} className={`w-8 h-8 ${card.color} group-hover:animate-pulse`} />
              </div>
              <h3 className="font-bold text-lg mb-2">{card.title}</h3>
              <p className="text-sm text-gray-400">{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 relative z-10 container mx-auto px-6">
        <h2 className="text-3xl font-bold mb-8 text-center md:text-left">
          Частые вопросы
        </h2>
        <div className="space-y-4 max-w-3xl">
          {[
            {
              q: "Нужен ли KYC для торговли?",
              a: "Для объёма до $15,000 в месяц доступна торговля без полной верификации. Для больших лимитов потребуется KYC.",
            },
            {
              q: "Как быстро зачисляются рубли?",
              a: "Пополнение через СБП обычно зачисляется в течение 1–3 минут. В редких случаях возможно увеличение времени из-за банка-отправителя.",
            },
            {
              q: "Какой минимальный депозит?",
              a: "Минимум зависит от метода пополнения, но стартовать можно с небольшой суммы — от нескольких сотен рублей.",
            },
            {
              q: "Есть ли комиссия за вывод?",
              a: "Комиссия зависит от способа вывода и указывается в интерфейсе перед подтверждением операции.",
            },
          ].map((item, idx) => (
            <details key={idx} className="group bg-[#0a0a0a] border border-white/5 rounded-xl px-6 py-4 open:border-orange-500/30 transition-all">
              <summary className="flex items-center justify-between cursor-pointer list-none">
                <span className="text-base font-semibold text-white group-hover:text-orange-400 transition-colors">{item.q}</span>
                <span className="ml-4 text-gray-500 group-open:rotate-180 transition-transform">
                  <i data-lucide="chevron-down" className="w-5 h-5" />
                </span>
              </summary>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed pl-2 border-l-2 border-orange-500/50">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* 2. ПАРТНЕРЫ: Вставлены перед футером */}
      <PaymentPartners />

      {/* Футер */}
      <footer className="bg-black py-8 border-t border-white/10 text-sm text-gray-600 text-center relative z-20">
        <p className="mb-4">© 2025 Forbex Trade. Smart Trading Platform.</p>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-medium">
          <button onClick={() => setShowTerms(true)} className="hover:text-orange-500 transition-colors">
            Правила пользователя
          </button>
          <button onClick={() => setShowPrivacy(true)} className="hover:text-orange-500 transition-colors">
            Политика конфиденциальности
          </button>
          <span className="text-gray-700">
            Торговля связана с риском потери капитала
          </span>
        </div>
      </footer>

      <LiveNotification />

      {/* Модалка "Правила пользователя" */}
      <Modal
        open={showTerms}
        onClose={() => setShowTerms(false)}
        title="Правила пользователя"
      >
        <p>
          Платформа Forbex Trade предоставляет пользователям интерфейс для
          операций с цифровыми активами в формате WebApp. Мы работаем на рынке
          с 2014 года, постоянно улучшая инфраструктуру, скорость исполнения
          ордеров и качество службы поддержки.
        </p>
        <p>Основные принципы использования платформы:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            Платформа предназначена для совершеннолетних пользователей,
            принимающих на себя все риски, связанные с операциями с цифровыми
            активами.
          </li>
          <li>
            Пользователь обязуется указывать достоверные данные при регистрации
            и не передавать доступ к аккаунту третьим лицам.
          </li>
          <li>
            Оборот и результаты торговли зависят от рыночной ситуации и не
            гарантируются платформой.
          </li>
          <li>
            Администрация вправе временно ограничивать доступ к отдельным
            функциям при проведении технических работ и мер безопасности.
          </li>
          <li>
            Все действия в личном кабинете фиксируются в истории операций и
            могут быть использованы для проверок безопасности и разрешения
            спорных ситуаций.
          </li>
        </ul>
        <p>
          Используя Forbex Trade, вы подтверждаете, что понимаете характер
          рисков, связанных с цифровыми активами, и действуете от своего имени и
          в своих интересах.
        </p>
      </Modal>

      {/* Модалка "Политика конфиденциальности" */}
      <Modal
        open={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        title="Политика конфиденциальности"
      >
        <p>
          Forbex Trade уважает конфиденциальность своих пользователей и
          обрабатывает персональные данные строго в объёме, необходимом для
          работы платформы и исполнения обязательств перед пользователем.
        </p>
        <p>Мы можем обрабатывать и хранить следующие данные:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            регистрационные данные (логин, email, технические идентификаторы
            Telegram WebApp);
          </li>
          <li>
            техническую информацию о сессии (IP-адрес, тип устройства, браузер,
            время входа);
          </li>
          <li>
            историю действий внутри личного кабинета (пополнения, выводы,
            сделки, изменения настроек).
          </li>
        </ul>
        <p>
          Данные используются для обеспечения работы платформы, повышения
          безопасности, анализа нагрузки и улучшения качества сервиса. Мы не
          передаём персональные данные третьим лицам, за исключением случаев,
          прямо предусмотренных действующим законодательством или необходимых
          для исполнения юридически значимых запросов.
        </p>
        <p>
          Часть вспомогательной информации (например, настройки интерфейса)
          может сохраняться локально в вашем браузере в виде cookies и
          локального хранилища. Это помогает сохранять выбранный язык, валюту и
          упорядочивать отображение интерфейса.
        </p>
        <p>
          Используя платформу Forbex Trade, вы даёте согласие на обработку
          ваших персональных данных в соответствии с настоящей Политикой
          конфиденциальности и применимыми нормами действующего
          законодательства.
        </p>
      </Modal>
    </div>
  );
}