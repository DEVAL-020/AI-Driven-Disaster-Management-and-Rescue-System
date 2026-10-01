# SentinelAI — Project Folder Structure

```
app/
├── README.md
├── design_guidelines.json              # UI/UX design spec (dark tactical theme)
│
├── backend/                            # FastAPI + MongoDB
│   ├── .env                            # MONGO_URL, DB_NAME, JWT_SECRET, ANTHROPIC_API_KEY, admin seed
│   ├── requirements.txt                # Python dependencies
│   ├── server.py                       # Main app: all /api routes, seeding, RBAC
│   ├── auth.py                         # JWT (httpOnly cookies), bcrypt, get_current_user
│   └── ai_service.py                   # Anthropic Messages API via httpx (analyze + chat, offline fallback)
│
├── frontend/                           # React 19 + Tailwind + shadcn/ui
│   ├── .env                            # REACT_APP_BACKEND_URL
│   ├── package.json                    # Node dependencies (incl. leaflet, react-leaflet)
│   ├── craco.config.js
│   ├── jsconfig.json
│   ├── tailwind.config.js              # Fonts + theme tokens
│   ├── postcss.config.js
│   ├── components.json
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── index.js                    # Entry point
│       ├── index.css                   # Global styles, fonts, leaflet dark theme
│       ├── App.js                      # Router + AuthProvider + routes
│       ├── App.css
│       ├── context/
│       │   └── AuthContext.jsx         # Auth state, login/register/logout
│       ├── lib/
│       │   ├── api.js                  # Axios instance (withCredentials)
│       │   ├── dmUtils.js              # Severity/status color helpers, timeAgo
│       │   └── utils.js                # shadcn cn() helper
│       ├── pages/
│       │   ├── Landing.jsx             # Marketing landing page
│       │   ├── Login.jsx               # Operator sign-in + demo logins
│       │   ├── Register.jsx            # Citizen registration
│       │   └── Dashboard.jsx           # Role-aware command center (tabs + stats)
│       ├── components/
│       │   ├── dm/                     # Disaster-management modules
│       │   │   ├── NetworkBanner.jsx   # CN mesh metrics (ping, packet loss, encryption)
│       │   │   ├── IncidentMap.jsx     # Interactive Leaflet map w/ markers
│       │   │   ├── IoTFeed.jsx         # Live IoT sensor simulation
│       │   │   ├── AIPanel.jsx         # AI prediction & incident management
│       │   │   ├── SOSPortal.jsx       # Citizen SOS intake + management
│       │   │   ├── RescuePanel.jsx     # Team dispatch / allocation
│       │   │   ├── SecurityPanel.jsx   # Cybersecurity event log
│       │   │   └── AIChat.jsx          # RESCUE-AI chat assistant
│       │   └── ui/                     # shadcn/ui component library
│       ├── hooks/
│       │   └── use-toast.js
│       └── constants/testIds/          # Shared test-id constants
│
└── memory/
    ├── PRD.md                          # Product requirements & backlog
    └── test_credentials.md             # Seeded account logins
```

## Tech Stack
- **Frontend:** React 19, TailwindCSS, shadcn/ui, Framer Motion, React-Leaflet, Axios, Sonner
- **Backend:** FastAPI, Motor (MongoDB async), PyJWT, bcrypt
- **AI:** Anthropic Claude (optional ANTHROPIC_API_KEY)
- **Auth:** JWT in httpOnly cookies, role-based (admin / rescue_team / citizen)

## Seeded Logins
| Role        | Email             | Password    |
|-------------|-------------------|-------------|
| Admin       | admin@rescue.io   | admin123    |
| Rescue Team | rescue@rescue.io  | password123 |
| Citizen     | citizen@rescue.io | password123 |
```
```
