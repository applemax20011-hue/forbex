import React, { useEffect, useRef, useState } from "react";

// Данные для тикера
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
  "Иван М. пополнил счет через СБП"
];

// --- КОМПОНЕНТЫ ЛЕНДИНГА ---

const Ticker = () => (
  <div className="w-full bg-brand-card/80 border-b border-white/5 overflow-hidden py-2 backdrop-blur-sm relative z-40">
    <div className="flex animate-marquee whitespace-nowrap">
      {[...COINS, ...COINS, ...COINS].map((coin, i) => (
        <div key={i} className="flex items-center mx-4 sm:mx-6 text-xs sm:text-sm font-mono">
          <span className="font-bold text-white mr-2">{coin.name}</span>
          <span className="text-gray-400 mr-2">${coin.price}</span>
          <span className={coin.up ? "text-brand-accent" : "text-red-500"}>
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
        setNotification(LIVE_ACTIONS[Math.floor(Math.random() * LIVE_ACTIONS.length)]);
        setVisible(true);
      }, 500);
    }, 6000);
    
    setTimeout(() => setVisible(true), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`hidden md:block fixed bottom-8 left-8 z-50 transition-all duration-500 transform ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      <div className="bg-white/5 backdrop-blur-xl px-4 py-3 rounded-lg flex items-center gap-3 border-l-4 border-brand-accent">
        <div className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></div>
        <span className="text-xs font-mono text-gray-200">{notification}</span>
      </div>
    </div>
  );
};

const LiveChart = () => (
    <div className="w-full h-40 sm:h-48 relative overflow-hidden rounded-xl bg-brand-card/50 border border-white/5 p-3 sm:p-4">
        <div className="absolute top-2 left-3 sm:left-4 text-xs text-gray-500 font-mono">BTC/USD LIVE</div>
        <svg viewBox="0 0 400 100" className="w-full h-full">
            <defs>
                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity="0.2"/>
                    <stop offset="100%" stopColor="#f97316" stopOpacity="0"/>
                </linearGradient>
            </defs>
            <path d="M0,80 Q20,70 40,85 T80,50 T120,60 T160,30 T200,55 T240,40 T280,20 T320,40 T360,10 T400,30 V100 H0 Z" fill="url(#gradient)"/>
            <path d="M0,80 Q20,70 40,85 T80,50 T120,60 T160,30 T200,55 T240,40 T280,20 T320,40 T360,10 T400,30" fill="none" stroke="#f97316" strokeWidth="2"/>
        </svg>
    </div>
);

const ThreeBackground = () => {
  const mountRef = useRef(null);
  
  useEffect(() => {
    if (!window.THREE) return;
    const THREE = window.THREE;

    const scene = new THREE.Scene();
    // Немного тумана для глубины
    scene.fog = new THREE.FogExp2(0x030304, 0.02);
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    if (mountRef.current) {
        mountRef.current.innerHTML = ''; // очистка при ререндере
        mountRef.current.appendChild(renderer.domElement);
    }

    // Частицы
    const particlesGeometry = new THREE.BufferGeometry();
    const count = window.innerWidth < 768 ? 150 : 300;
    const posArray = new Float32Array(count * 3);
    for(let i = 0; i < count * 3; i++) {
        posArray[i] = (Math.random() - 0.5) * 40;
    }
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    
    // Оранжевый цвет частиц
    const material = new THREE.PointsMaterial({
        size: 0.05,
        color: 0xf97316, 
        transparent: true,
        opacity: 0.8,
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, material);
    scene.add(particlesMesh);
    camera.position.z = 10;
    
    let mouseX = 0, mouseY = 0;
    
    const animate = () => {
        requestAnimationFrame(animate);
        particlesMesh.rotation.y += 0.0005;
        particlesMesh.rotation.x += 0.0002;
        // Легкое движение за мышкой
        camera.position.x += (mouseX * 2 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 2 - camera.position.y) * 0.05;
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
    
    document.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);
    
    return () => {
        if (mountRef.current) mountRef.current.innerHTML = '';
        document.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <div ref={mountRef} id="canvas-container" style={{position: 'fixed', inset: 0, zIndex: -2}} />;
};

// --- ОСНОВНОЙ КОМПОНЕНТ СТРАНИЦЫ ---
export default function LandingPage({ onLogin, onRegister }) {
    // Инициализация иконок Lucide
    useEffect(() => {
        if (window.lucide) window.lucide.createIcons();
    });

    return (
        <div className="relative min-h-screen text-white font-sans selection:bg-brand-accent selection:text-black pb-20">
            {/* Шум на фоне */}
            <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5 pointer-events-none -z-10"></div>
            
            <ThreeBackground />
            <Ticker />

            {/* Навигация */}
            <nav className="w-full z-50 bg-brand-bg/80 backdrop-blur border-b border-white/5 py-4 sticky top-0">
                <div className="container mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-accent to-brand-blue rounded-lg flex items-center justify-center border border-brand-accent">
                            {/* Иконка молнии заменена на эмодзи лисы или иконку */}
                            <span className="text-xl">🦊</span>
                        </div>
                        <span className="text-xl font-bold tracking-wider">FORBEX <span className="text-brand-accent">TRADE</span></span>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button 
                            onClick={onLogin}
                            className="text-sm font-medium hover:text-brand-accent transition-colors"
                        >
                            Вход
                        </button>
                        <button 
                            onClick={onRegister}
                            className="bg-white text-black px-5 py-2 rounded-full font-bold text-sm hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all"
                        >
                            Регистрация
                        </button>
                    </div>
                </div>
            </nav>

            {/* HERO Секция */}
            <section className="pt-12 pb-16 md:pt-20 md:pb-0 relative overflow-hidden">
                <div className="absolute top-1/4 right-0 w-64 h-64 md:w-96 md:h-96 bg-brand-blue/20 rounded-full blur-[120px] animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 md:w-96 md:h-96 bg-brand-accent/10 rounded-full blur-[120px] animate-pulse"></div>

                <div className="container mx-auto px-4 sm:px-6 grid md:grid-cols-2 gap-8 items-center relative z-10">
                    <div className="space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-brand-accent/30 bg-brand-accent/5 mx-auto md:mx-0">
                            <span className="w-2 h-2 bg-brand-accent rounded-full animate-pulse"></span>
                            <span className="text-xs font-mono text-brand-accent uppercase tracking-widest">Работает в РФ 24/7</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight">
                            Торгуй без <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-blue">Границ.</span>
                        </h1>
                        
                        <p className="text-gray-400 text-base sm:text-lg max-w-lg mx-auto md:mx-0 leading-relaxed">
                            Единая экосистема для акций, крипты и форекса. Пополнение через СБП, P2P и криптовалюты. Никаких блокировок.
                        </p>
                        
                        <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                            <button 
                                onClick={onRegister}
                                className="px-8 py-4 bg-brand-accent text-black font-bold rounded-lg hover:bg-white hover:scale-105 transition-all duration-300 shadow-[0_0_20px_rgba(249,115,22,0.4)] flex items-center justify-center gap-2 group"
                            >
                                Открыть счет
                                <i data-lucide="arrow-right" className="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
                            </button>
                            <button 
                                onClick={onLogin}
                                className="px-8 py-4 bg-white/5 backdrop-blur rounded-lg font-medium hover:bg-white/10 transition-all border border-white/10 flex items-center justify-center gap-2"
                            >
                                <i data-lucide="log-in" className="w-4 h-4"></i>
                                Войти
                            </button>
                        </div>

                        <div className="flex justify-center md:justify-start gap-6 text-xs sm:text-sm text-gray-500 font-mono pt-4">
                            <div className="flex items-center gap-2">
                                <i data-lucide="shield-check" className="text-brand-accent w-4 h-4"></i>
                                <span>No KYC до $15k</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <i data-lucide="zap" className="text-brand-blue w-4 h-4"></i>
                                <span>Моментальный вывод</span>
                            </div>
                        </div>
                    </div>

                    {/* Интерактивная карточка */}
                    <div className="relative mt-8 md:mt-0 mx-auto max-w-sm w-full">
                        <div className="bg-brand-card/60 backdrop-blur-md p-6 rounded-2xl border border-white/10 md:transform md:rotate-2 md:hover:rotate-0 transition-all duration-500 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <p className="text-gray-400 text-xs font-mono mb-1">TOTAL BALANCE</p>
                                    <h3 className="text-3xl font-bold font-mono text-white">$124,592.40</h3>
                                </div>
                                <div className="px-3 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">+12.5%</div>
                            </div>
                            <LiveChart />
                            <div className="grid grid-cols-2 gap-4 mt-6">
                                <button className="bg-green-500/10 text-green-400 py-3 rounded-lg font-bold hover:bg-green-500 hover:text-black transition-colors text-sm">
                                    Купить
                                </button>
                                <button className="bg-red-500/10 text-red-400 py-3 rounded-lg font-bold hover:bg-red-500 hover:text-black transition-colors text-sm">
                                    Продать
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Преимущества */}
            <section className="py-16 relative z-10 container mx-auto px-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: "globe-2", title: "Все рынки", desc: "NASDAQ, MOEX, Crypto.", color: "text-brand-blue" },
                        { icon: "credit-card", title: "Рубли", desc: "Ввод/вывод на карты РФ.", color: "text-brand-accent" },
                        { icon: "lock", title: "Безопасность", desc: "Холодное хранение.", color: "text-purple-400" },
                        { icon: "smartphone", title: "WebApp", desc: "Торгуй прямо в Telegram.", color: "text-yellow-400" },
                    ].map((card, idx) => (
                        <div key={idx} className="bg-white/5 backdrop-blur border border-white/10 p-6 rounded-xl hover:-translate-y-2 transition-transform">
                            <div className="mb-4"><i data-lucide={card.icon} className={`w-6 h-6 ${card.color}`}></i></div>
                            <h3 className="font-bold mb-2">{card.title}</h3>
                            <p className="text-xs text-gray-400">{card.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-brand-accent/10 via-transparent to-transparent pointer-events-none"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2 className="text-3xl md:text-5xl font-bold mb-6">
                        Начни зарабатывать <br/>
                        <span className="text-brand-accent">ПРЯМО СЕЙЧАС</span>
                    </h2>
                    <p className="text-gray-400 mb-8">Бонус 5000 RUB за регистрацию до конца дня.</p>
                    <button 
                        onClick={onRegister}
                        className="bg-brand-accent text-black font-bold px-12 py-4 rounded-full hover:scale-105 transition-transform shadow-[0_0_30px_rgba(249,115,22,0.4)] text-lg"
                    >
                        Зарегистрироваться
                    </button>
                    <p className="mt-5 text-xs text-gray-600">Нажимая кнопку, вы соглашаетесь с условиями оферты.</p>
                </div>
            </section>

            <footer className="bg-black/80 backdrop-blur py-8 border-t border-white/10 text-sm text-gray-500 text-center">
                <p>© 2025 Forbex Trade. All rights reserved.</p>
            </footer>
            
            <LiveNotification />
        </div>
    );
}