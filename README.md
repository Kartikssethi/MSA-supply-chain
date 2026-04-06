# Fleet Management Frontend

A modern, full-featured fleet management dashboard built with React, TypeScript, Vite, and Tailwind CSS. Manage vehicles, drivers, trips, maintenance schedules, and real-time tracking all from one unified interface.

## Features

- 🚗 **Vehicle Management** - Track and manage fleet vehicles
- 👥 **Driver Management** - Manage driver information and assignments
- 📍 **Real-time Tracking** - Monitor vehicle locations and status
- 🗺️ **Trip Planning** - Create and manage delivery routes
- 🔧 **Maintenance Scheduling** - Track vehicle maintenance and service records
- 📊 **Dashboard** - Comprehensive analytics and overview
- 🎨 **Modern UI** - Built with shadcn/ui components and Tailwind CSS

## Tech Stack

- **React 18.3.1** - UI framework
- **TypeScript** - Type-safe development
- **Vite 6.3.5** - Lightning-fast build tool
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **shadcn/ui** - High-quality UI components
- **React Router 7.13** - Client-side routing
- **Recharts 2.15** - Data visualization
- **React Hook Form 7.55** - Form management

## Prerequisites

- Node.js 16+ (v18+ recommended)
- pnpm 10+ (or npm/yarn)

## Installation

### 1. Clone the repository

```bash
git clone <repository-url>
cd MSA
```

### 2. Install dependencies

Using pnpm (recommended):
```bash
pnpm install
```

Or using npm:
```bash
npm install
```

Or using yarn:
```bash
yarn install
```

## Development

### Start the development server

```bash
pnpm dev
```

The application will be available at `http://localhost:5173/`

### Build for production

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

## Project Structure

```
src/
├── app/
│   ├── App.tsx                 # Main app component
│   ├── routes.ts              # Route definitions
│   ├── api/                   # API and mock data
│   ├── components/
│   │   ├── layout/            # Layout components (Header, Sidebar)
│   │   ├── ui/                # shadcn/ui components
│   │   └── figma/             # Custom components
│   ├── pages/                 # Page components
│   │   ├── Dashboard.tsx
│   │   ├── Drivers.tsx
│   │   ├── Vehicles.tsx
│   │   ├── Trips.tsx
│   │   ├── Tracking.tsx
│   │   └── Maintenance.tsx
│   └── utils/                 # Utility functions
├── styles/                    # Global styles
├── imports/                   # Documentation
└── main.tsx                   # React entry point
```

## Configuration Files

- `vite.config.ts` - Vite configuration with React and Tailwind plugins
- `tsconfig.json` - TypeScript compiler options
- `tailwind.config.js` - Tailwind CSS theme configuration
- `postcss.config.mjs` - PostCSS configuration
- `.gitignore` - Git ignore rules

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm preview` | Preview production build |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

Please follow the guidelines in [Guidelines.md](Guidelines.md) for contributing to this project.

## License

See [ATTRIBUTIONS.md](ATTRIBUTIONS.md) for license information.

## Support

For issues or questions, please open an issue in the repository.
