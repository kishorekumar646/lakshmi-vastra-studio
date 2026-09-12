# Lakshmi Vastra Studio

Business website for **Lakshmi Vastra Studio** — a saree and ethnic wear store.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + Python |
| Database | SQLite (local) / Supabase PostgreSQL (production) |
| Images | Cloudinary |
| Frontend Hosting | Cloudflare Pages |
| Backend Hosting | Render |

## Features

- Product catalog with category filter and search
- Product detail page with WhatsApp enquiry button
- Contact / inquiry form
- Floating WhatsApp button on all pages
- Admin panel — manage products, categories, and inquiries
- Image upload via Cloudinary

## Project Structure

```
Lakshmi-Vastra-Studio/
├── frontend/        # React + Vite
├── backend/         # FastAPI + Python
├── start.sh         # Run both servers locally
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
- API Docs → http://localhost:8000/docs

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite:///./lakshmi_vastra.db
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

## Deployment

### Backend → Render
1. Connect GitHub repo to Render
2. Root directory: `backend`
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables in Render dashboard (use Supabase PostgreSQL URL for `DATABASE_URL`)

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

Adds 5 categories and 10 sample products.
