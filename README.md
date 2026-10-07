# Lakshmi Vastra Studio

Premium saree & ethnic wear e-commerce platform with a luxury editorial aesthetic.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite 8 |
| Backend | FastAPI + Python |
| Database | Supabase (PostgreSQL) |
| Images | Cloudinary |
| Frontend Hosting | Cloudflare Pages |
| Backend Hosting | Render |

## Features

### Customer-facing
- Luxury editorial home page with scroll-driven animations (DressShowcase, Lookbook)
- Shop By Occasion tiles with real category data
- Product catalog with category filter, search, and wishlist
- Product detail page with size guide and WhatsApp enquiry
- Guest cart (localStorage) + authenticated cart (API) with merge on login
- Toast notifications (react-hot-toast) for cart and wishlist actions
- Scroll-triggered navbar — hidden on load, slides in after 80 px scroll

### Admin Portal (`/admin`)
- Luxury dark split-screen login
- Full dashboard: Products, Categories, Orders, Delivery Persons, Shop Owners, Customers, Payments, Pincodes, Reviews, Inquiries
- Image upload via Cloudinary (multi-image per product)
- Real-time order tracking and delivery assignment
- PWA install support

### Shop Owner Portal (`/shop`)
- Luxury dark amber-themed login with Sign In / Register tabs
- Dashboard: Products (assigned by admin), Orders (QR scan confirmation), Account settings
- Notifications for incoming orders

### Delivery Portal (`/delivery`)
- Luxury dark navy-themed login
- Dashboard: Available deliveries, Active deliveries (OTP/QR confirm), Completed history
- Real-time order assignment notifications

## Project Structure

```
Lakshmi-Vastra-Studio/
├── frontend/                  # React + Vite
│   └── src/
│       ├── components/
│       │   └── luxury/        # DressShowcase, ShopByOccasion, Lookbook, HeroSection, NewArrivals
│       ├── context/           # CartContext, WishlistContext, AuthContext
│       ├── pages/             # AdminDashboard, ShopDashboard, DeliveryDashboard, login pages, customer pages
│       ├── hooks/             # usePushNotifications, usePwaInstall, useSilkReveal
│       └── api.js             # All API calls (axios)
├── backend/                   # FastAPI + Python
├── start.sh                   # Run both servers locally
└── .gitignore
```

## Local Development

### 1. Backend setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # fill in your values
```

### 2. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env   # fill in your values
```

### 3. Run both servers
```bash
./start.sh
```

- Website → http://localhost:5173
- Admin → http://localhost:5173/admin/login
- Shop → http://localhost:5173/shop/login
- Delivery → http://localhost:5173/delivery/login
- API Docs → http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=postgresql://...   # Supabase connection string
SECRET_KEY=your-secret-key
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-password
WHATSAPP_NUMBER=919876543210
```

### Frontend (`frontend/.env`)
```
VITE_API_URL=http://localhost:8000
VITE_WHATSAPP_NUMBER=919876543210
VITE_PHONE_NUMBER=+91 98765 43210
```

### Portal builds (optional)
```
VITE_PORTAL=admin   # build standalone admin app
VITE_PORTAL=shop    # build standalone shop app
VITE_PORTAL=delivery  # build standalone delivery app
```

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard

### Frontend → Cloudflare Pages
1. Connect GitHub repo to Cloudflare Pages
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Set `VITE_API_URL` to your Render backend URL

## Seed Test Data

```bash
cd backend
source venv/bin/activate
python seed_data.py
```

Adds sample categories and products.

## Design System

| Token | Value | Usage |
|---|---|---|
| Gold | `#B8892A` | Primary accent, CTA borders, nav active state |
| Gold Light | `#D4A94A` | Price text, revenue highlights |
| Background | `#08040C` | Admin page/main dark background |
| Portal Dark | `#070509` | Shop/Delivery main content area |
| Card | `rgba(255,255,255,0.04)` | All dashboard cards, panels, modals |
| Card Border | `rgba(184,137,42,0.12)` | Gold-tinted card borders |
| Text Primary | `rgba(255,255,255,0.85)` | Main body text |
| Text Muted | `rgba(255,255,255,0.45)` | Labels, secondary text |
| Blue Accent | `#93C5FD` | Info badges, delivery person |
| Green Accent | `#86EFAC` | Success, approved, active |
| Red Accent | `#FCA5A5` | Error, delete, deactivate |
| Amber Accent | `#FCD34D` | Warnings, pending states |
| Font Heading | Playfair Display | Section titles, product names |
| Font Subtitle | Cormorant Garamond italic | Taglines, categories |
| Font Body | Inter | UI text, labels |

### Portal Color Identity
- **Admin**: Dark maroon/purple (`#08040C` + gold accents) — shield motif
- **Shop**: Amber/gold (`#0D0A00` + `#B8892A` accents) — store motif
- **Delivery**: Deep navy (`#030812` + `#4A90D9` accents) — truck motif

### Mobile Lookbook
- Horizontal scroll on mobile uses `overflowX: "scroll"` + `touchAction: "pan-x"`
- Desktop uses scroll-driven `translateX` animation (sticky section with 400vh height)
- Images: `60vmin` height with `minWidth: 180px` for consistent layout

## Components

### Luxury (`frontend/src/components/luxury/`)
| Component | Description |
|---|---|
| `DressShowcase` | Full-screen horizontal scroll showcase with real product data |
| `ShopByOccasion` | Category tiles grid from API |
| `Lookbook` | Editorial image gallery (scroll-driven desktop, swipeable mobile) |
| `HeroSection` | Video/image hero with animated headline |
| `NewArrivals` | Latest products horizontal strip |

### Shared
| Component | Description |
|---|---|
| `CartDrawer` | Slide-in cart panel with guest/auth cart merge |
| `SizeGuideModal` | Size guide overlay for product pages |
| `InstallGuideSheet` | PWA install guide for all portals |
| `QrScanner` | Camera QR code scanner (shop & delivery portals) |
