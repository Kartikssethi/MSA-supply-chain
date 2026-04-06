# Fleet Management System

A modern monorepo containing both frontend (React) and backend (FastAPI) for a comprehensive fleet management platform.

## Project Structure

```
.
├── frontend/          # React + TypeScript + Vite frontend application
├── backend/           # Python FastAPI backend server
├── pnpm-workspace.yaml # Monorepo configuration
└── README.md          # This file
```

## Getting Started

### Prerequisites

- Node.js 16+ (v18+ recommended)
- Python 3.8+
- pnpm 10+ (or npm/yarn)

### Frontend Setup

Navigate to the frontend folder and follow the instructions in [frontend/README.md](frontend/README.md)

```bash
cd frontend
pnpm install
pnpm dev
```

Frontend runs on `http://localhost:5173`

### Backend Setup

Navigate to the backend folder:

```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

Backend runs on `http://localhost:8000` with API docs at `/docs`

## Development

- **Frontend**: Hot reload development server with React Fast Refresh
- **Backend**: Auto-reload FastAPI server with uvicorn

## Production Builds

### Frontend

```bash
cd frontend
pnpm build
pnpm preview
```

### Backend

```bash
cd backend
# Configure your production ASGI server (Gunicorn, etc.)
```

## Project Documentation

- [Frontend Documentation](frontend/README.md)
- [Guidelines](Guidelines.md)
- [Attributions](ATTRIBUTIONS.md)

## Architecture

- **Frontend**: React 18 + TypeScript + Tailwind CSS + shadcn/ui components
- **Backend**: FastAPI + Uvicorn
- **Database**: (To be configured)
- **API**: RESTful API with JSON

## Contributing

Please refer to [Guidelines.md](Guidelines.md) for contribution guidelines.

## License

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for license information.
