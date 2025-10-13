# BrookShow Event Planner Dashboard

A React-based event planning and ticket management dashboard with offline-first capabilities.

## Tech Stack

- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **React Router** for navigation
- **React Hook Form** with Zod validation
- **TanStack Query** for data fetching
- **IndexedDB** (via localForage) for local storage
- **html5-qrcode** for camera scanning
- **qrcode** for QR code generation
- **Recharts** for data visualization
- **Lucide React** for icons

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at [http://localhost:5173](http://localhost:5173)

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Linting

```bash
npm run lint
```

## Features

- **Event Management**: Create, edit, and manage events
- **Ticket Sales**: Sell tickets with QR code generation
- **QR Scanning**: Camera-based ticket validation
- **Artist Booking**: Search and book artists for events
- **Offline Support**: Works offline with local data storage
- **Reports & Analytics**: View sales data and scan logs

## Project Structure

```
src/
├── components/          # React components
│   ├── Layout.tsx       # Main app layout
│   ├── QRScanner.tsx    # Camera scanner
│   └── ui/              # shadcn/ui components
├── pages/               # Page components
│   ├── Dashboard.tsx    # Main dashboard
│   ├── EventsList.tsx   # Events listing
│   ├── TicketSales.tsx  # Ticket purchase
│   ├── ScannerPage.tsx  # Scanner page
│   └── Settings.tsx     # App settings
├── services/            # API and storage services
├── hooks/               # Custom React hooks
├── types/               # TypeScript type definitions
└── App.tsx              # Root component
```

## License

MIT
