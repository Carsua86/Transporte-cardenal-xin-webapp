const wingPath = "M0,0 Q-45,-15 -78,14 Q-56,36 -22,26 Q-8,18 0,0 Z";

function Wing({ mirror }: { mirror: boolean }) {
  return (
    <g transform={mirror ? "translate(22,-2) scale(-1,1)" : "translate(-22,-2)"}>
      <g className="animate-wing-flap [transform-box:view-box]" style={{ transformOrigin: "0px 0px" }}>
        <path d={wingPath} fill="url(#wingGrad)" stroke="var(--brand-900)" strokeWidth="1" strokeOpacity="0.4" />
        <path d="M-14,4 Q-38,4 -62,18" fill="none" stroke="var(--brand-900)" strokeOpacity="0.3" strokeWidth="1.5" />
        <path d="M-10,12 Q-30,16 -48,26" fill="none" stroke="var(--brand-900)" strokeOpacity="0.25" strokeWidth="1.5" />
      </g>
    </g>
  );
}

function CardinalBird() {
  return (
    <g transform="translate(115,20)">
      {/* sombra */}
      <ellipse cx="0" cy="62" rx="46" ry="9" fill="var(--navy-900)" opacity="0.35" filter="url(#softBlur)" />
      {/* cola */}
      <polygon points="-14,44 -2,30 6,48" fill="url(#tailGrad)" />
      <polygon points="0,48 10,30 16,50" fill="url(#tailGrad)" />
      {/* alas */}
      <Wing mirror={false} />
      <Wing mirror />
      {/* cuerpo */}
      <ellipse cx="0" cy="10" rx="38" ry="50" fill="url(#birdBodyGrad)" />
      <ellipse cx="-12" cy="-10" rx="10" ry="16" fill="#ffffff" opacity="0.18" />
      {/* cabeza */}
      <circle cx="0" cy="-48" r="24" fill="url(#birdHeadGrad)" />
      <ellipse cx="-8" cy="-56" rx="6" ry="8" fill="#ffffff" opacity="0.22" />
      {/* mascarilla facial */}
      <path d="M-10,-42 Q0,-34 12,-40 Q6,-30 -2,-32 Q-8,-34 -10,-42 Z" fill="var(--navy-900)" opacity="0.55" />
      {/* cresta */}
      <polygon points="-9,-68 -13,-92 -2,-70" fill="url(#tailGrad)" />
      <polygon points="-1,-70 1,-96 8,-70" fill="url(#tailGrad)" />
      <polygon points="8,-70 14,-90 16,-66" fill="url(#tailGrad)" />
      {/* pico */}
      <polygon points="0,-40 11,-33 0,-27" fill="url(#beakGrad)" />
      {/* ojo */}
      <circle cx="9" cy="-50" r="3.6" fill="#ffffff" />
      <circle cx="10" cy="-50" r="1.7" fill="var(--navy-900)" />
      <circle cx="9.3" cy="-51" r="0.6" fill="#ffffff" />
    </g>
  );
}

function KenworthTruck() {
  return (
    <g className="animate-truck-bounce">
      {/* sombra */}
      <ellipse cx="110" cy="66" rx="130" ry="10" fill="var(--navy-900)" opacity="0.35" filter="url(#softBlur)" />
      {/* tolva/remolque */}
      <rect x="0" y="-6" width="150" height="52" rx="6" fill="url(#truckBodyGrad)" />
      <rect x="0" y="-6" width="150" height="52" rx="6" fill="none" stroke="var(--brand-900)" strokeOpacity="0.3" strokeWidth="1" />
      <rect x="0" y="-6" width="150" height="8" rx="4" fill="url(#goldStripeGrad)" />
      <rect x="6" y="2" width="138" height="6" rx="3" fill="#ffffff" opacity="0.12" />
      {/* tubos de escape cromados */}
      <rect x="139" y="-30" width="5" height="38" fill="url(#chromeGrad)" />
      <rect x="137" y="-34" width="9" height="6" rx="2" fill="url(#chromeGrad)" />
      <rect x="151" y="-30" width="5" height="38" fill="url(#chromeGrad)" />
      <rect x="149" y="-34" width="9" height="6" rx="2" fill="url(#chromeGrad)" />
      {/* cabina */}
      <rect x="150" y="8" width="46" height="38" rx="6" fill="url(#cabGrad)" />
      <rect x="162" y="14" width="20" height="16" rx="2" fill="url(#glassGrad)" />
      <rect x="163" y="15" width="8" height="5" rx="1" fill="#ffffff" opacity="0.5" />
      {/* capó largo (estilo Kenworth) */}
      <rect x="196" y="18" width="32" height="28" rx="5" fill="url(#cabGrad)" />
      <rect x="196" y="20" width="32" height="5" fill="#ffffff" opacity="0.15" />
      <rect x="224" y="22" width="5" height="20" rx="1" fill="url(#chromeGrad)" />
      <circle cx="230" cy="30" r="3.2" fill="var(--gold-200)" />
      <circle cx="229" cy="29" r="1.1" fill="#ffffff" opacity="0.8" />
      {/* ruedas */}
      <g className="[transform-box:fill-box] origin-center animate-wheel-spin">
        <circle cx="30" cy="52" r="15" fill="var(--navy-900)" />
        <circle cx="30" cy="52" r="6" fill="url(#chromeGrad)" />
      </g>
      <g className="[transform-box:fill-box] origin-center animate-wheel-spin">
        <circle cx="120" cy="52" r="15" fill="var(--navy-900)" />
        <circle cx="120" cy="52" r="6" fill="url(#chromeGrad)" />
      </g>
      <g className="[transform-box:fill-box] origin-center animate-wheel-spin">
        <circle cx="210" cy="52" r="15" fill="var(--navy-900)" />
        <circle cx="210" cy="52" r="6" fill="url(#chromeGrad)" />
      </g>
    </g>
  );
}

export function HighwayScene({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMax slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="birdBodyGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--brand-400)" />
          <stop offset="55%" stopColor="var(--brand-600)" />
          <stop offset="100%" stopColor="var(--brand-800)" />
        </radialGradient>
        <radialGradient id="birdHeadGrad" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stopColor="var(--brand-400)" />
          <stop offset="60%" stopColor="var(--brand-600)" />
          <stop offset="100%" stopColor="var(--brand-800)" />
        </radialGradient>
        <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-500)" />
          <stop offset="100%" stopColor="var(--brand-900)" />
        </linearGradient>
        <linearGradient id="tailGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-600)" />
          <stop offset="100%" stopColor="var(--brand-900)" />
        </linearGradient>
        <linearGradient id="beakGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--gold-200)" />
          <stop offset="100%" stopColor="var(--gold-600)" />
        </linearGradient>
        <linearGradient id="truckBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-400)" />
          <stop offset="45%" stopColor="var(--brand-600)" />
          <stop offset="100%" stopColor="var(--brand-900)" />
        </linearGradient>
        <linearGradient id="cabGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--brand-500)" />
          <stop offset="100%" stopColor="var(--brand-900)" />
        </linearGradient>
        <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--gold-100)" />
          <stop offset="100%" stopColor="var(--navy-400)" />
        </linearGradient>
        <linearGradient id="goldStripeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--gold-200)" />
          <stop offset="100%" stopColor="var(--gold-600)" />
        </linearGradient>
        <linearGradient id="chromeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--navy-100)" />
          <stop offset="45%" stopColor="#ffffff" />
          <stop offset="60%" stopColor="var(--navy-300)" />
          <stop offset="100%" stopColor="var(--navy-500)" />
        </linearGradient>
        <filter id="softBlur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" />
        </filter>
      </defs>

      {/* sol/resplandor dorado */}
      <circle cx="660" cy="90" r="90" fill="var(--gold-400)" opacity="0.18" />
      <circle cx="660" cy="90" r="46" fill="var(--gold-400)" opacity="0.35" />

      {/* nubes */}
      <g fill="#ffffff" opacity="0.08" className="animate-cloud-drift">
        <ellipse cx="130" cy="80" rx="46" ry="20" />
        <ellipse cx="165" cy="70" rx="34" ry="16" />
        <ellipse cx="480" cy="55" rx="38" ry="16" />
        <ellipse cx="510" cy="65" rx="26" ry="12" />
      </g>

      {/* lomas */}
      <path d="M0,300 Q200,225 400,270 T800,245 V400 H0 Z" fill="var(--navy-700)" opacity="0.6" />
      <path d="M0,345 Q250,285 500,325 T800,305 V400 H0 Z" fill="var(--navy-600)" opacity="0.5" />

      {/* carretera */}
      <polygon points="315,400 485,400 452,248 348,248" fill="var(--navy-900)" />
      <polygon points="348,248 452,248 447,236 353,236" fill="var(--gold-400)" opacity="0.4" />
      <g fill="var(--gold-400)" opacity="0.85" className="animate-road-dash">
        <rect x="392" y="252" width="6" height="14" />
        <rect x="388" y="278" width="8" height="18" />
        <rect x="384" y="308" width="10" height="22" />
        <rect x="379" y="344" width="13" height="26" />
      </g>

      {/* cardenal transformándose en camión Kenworth */}
      <g transform="translate(120,300)">
        <g className="animate-truck-cycle [transform-box:view-box]" style={{ transformOrigin: "115px 20px" }}>
          <KenworthTruck />
        </g>
        <g className="animate-bird-cycle [transform-box:view-box]" style={{ transformOrigin: "115px 20px" }}>
          <CardinalBird />
        </g>
        <circle cx="115" cy="20" r="140" fill="var(--gold-400)" opacity="0" className="animate-morph-flash" />
      </g>
    </svg>
  );
}
