# Developer Notes - BrookShow Event Planner

## Architecture Overview

This is a **frontend-only PWA** with a pluggable backend adapter pattern. All backend calls are mocked by default and stored in IndexedDB.

### Key Design Decisions

1. **No Backend Dependency**: App works fully without a backend server
2. **Offline-First**: IndexedDB + Service Worker for offline support
3. **Sync Queue**: Queues all write operations for later server sync
4. **Mock Adapter**: `apiClient.ts` can be easily swapped with real API calls

## Integration Steps

### Quick Start (Mock Mode)
```bash
npm install
npm run dev
```

The app will work immediately with mock data stored in IndexedDB.

### Backend Integration

#### Step 1: Configure API Endpoint
```typescript
// src/config.ts
export const config = {
  API_BASE_URL: 'https://your-api.com',  // ← Change this
  SIMULATE_OFFLINE: false,
  // ...
};
```

#### Step 2: Replace Mock Functions in apiClient.ts

**Pattern for ALL endpoints:**

```typescript
// BEFORE (mock):
async createEvent(payload): Promise<Event> {
  const event = { ...payload, id: generateId() };
  await storage.set(db.events, event.id, event);
  await addToSyncQueue('createEvent', event);
  return event;
}

// AFTER (real API):
async createEvent(payload): Promise<Event> {
  const response = await fetch(`${config.API_BASE_URL}/events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
    body: JSON.stringify(payload),
  });
  
  if (!response.ok) {
    throw new Error(`Failed to create event: ${response.statusText}`);
  }
  
  const event = await response.json();
  
  // Still save locally for offline access
  await storage.set(db.events, event.id, event);
  
  return event;
}
```

**Apply this pattern to all methods in apiClient.ts:**
- `listEvents`, `getEvent`, `createEvent`, `updateEvent`, `deleteEvent`, `publishEvent`
- `listTicketTypes`, `createTicketType`, `updateTicketType`
- `purchaseTicket`
- `scanTicket` ← Most critical for security
- `searchArtists`
- `createBooking`, `listBookings`

#### Step 3: Implement QR Signature Validation

**Current (Insecure):**
```typescript
signature: 'mock-signature-' + ticketId
```

**Production (Secure):**

**Backend (Node.js example):**
```javascript
const crypto = require('crypto');

const QR_SECRET = process.env.QR_SECRET_KEY; // Store securely!

function generateSignature(ticketId, eventId, issuedAt) {
  const data = `${ticketId}:${eventId}:${issuedAt}`;
  return crypto
    .createHmac('sha256', QR_SECRET)
    .update(data)
    .digest('hex');
}

function validateTicketQR(qrPayload) {
  const { ticketId, eventId, issuedAt, signature } = JSON.parse(qrPayload);
  
  const expectedSig = generateSignature(ticketId, eventId, issuedAt);
  
  if (signature !== expectedSig) {
    return {
      valid: false,
      error: 'Invalid signature - potential counterfeit',
    };
  }
  
  // Check database for ticket existence and status
  const ticket = await db.tickets.findOne({ id: ticketId });
  
  if (!ticket) {
    return { valid: false, error: 'Ticket not found' };
  }
  
  if (ticket.scanned) {
    return {
      valid: false,
      error: `Already scanned at ${ticket.scannedAt}`,
      scannedBy: ticket.scannerId,
    };
  }
  
  return { valid: true, ticket };
}
```

**Frontend (update purchaseTicket in apiClient.ts):**
```typescript
// Call backend to generate signature
const signatureResponse = await fetch(`${config.API_BASE_URL}/tickets/sign`, {
  method: 'POST',
  body: JSON.stringify({ ticketId, eventId, issuedAt }),
});
const { signature } = await signatureResponse.json();

const qrPayload: QRPayload = {
  eventId,
  ticketId,
  buyerName: buyer.name,
  issuedAt,
  signature, // Use server-generated signature
};
```

#### Step 4: Implement Auth

```typescript
// src/services/auth.ts
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export function getAuthToken(): string | null {
  return localStorage.getItem('access_token');
}

export function setAuthTokens(tokens: AuthTokens): void {
  localStorage.setItem('access_token', tokens.accessToken);
  localStorage.setItem('refresh_token', tokens.refreshToken);
}

export function clearAuthTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

// Add to all apiClient requests:
headers: {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
}
```

#### Step 5: Update Sync Queue

```typescript
// src/services/syncQueue.ts - flushQueue function

async function flushQueue(): Promise<void> {
  if (config.SIMULATE_OFFLINE || !navigator.onLine) return;

  const queue = await getSyncQueue();
  const pending = queue.filter(item => item.status === 'pending');

  for (const item of pending) {
    try {
      let endpoint = '';
      let method = 'POST';

      switch (item.action) {
        case 'createEvent':
          endpoint = '/events';
          break;
        case 'updateEvent':
          endpoint = `/events/${item.payload.id}`;
          method = 'PUT';
          break;
        case 'purchaseTicket':
          endpoint = '/tickets/purchase';
          break;
        case 'scanTicket':
          endpoint = '/tickets/scan';
          break;
        // ... handle all actions
      }

      const response = await fetch(`${config.API_BASE_URL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAuthToken()}`,
        },
        body: JSON.stringify(item.payload),
      });

      if (!response.ok) throw new Error(`Sync failed: ${response.statusText}`);

      // Mark as synced
      await updateSyncItem(item.id, { status: 'synced' });

      // Update scan logs
      if (item.action === 'scanTicket') {
        await storage.set(db.scanLogs, item.payload.id, {
          ...item.payload,
          synced: true,
        });
      }

    } catch (error: any) {
      // Handle retry logic (already implemented)
    }
  }
}
```

## Camera Scanner Notes

### Browser Compatibility
- **Chrome/Edge**: Full support ✓
- **Safari iOS**: Requires HTTPS, may need user interaction
- **Firefox**: Full support ✓
- **Safari Desktop**: Limited support (use manual input fallback)

### Testing Camera on Desktop
1. Connect physical device OR
2. Use browser's device emulation + allow camera access

### Troubleshooting
- **Permission denied**: Browser blocks camera in some contexts (HTTP, iframes)
- **Camera not found**: Check if camera is being used by another app
- **Black screen**: May need page reload to reinitialize

### Manual Input Fallback
Always available for situations where camera:
- Not available (desktop without webcam)
- Permission denied
- Not working properly

## Offline Mode Testing

### Method 1: Settings Toggle
1. Navigate to Settings
2. Enable "Simulate Offline Mode"
3. All API calls will fail immediately
4. Data stored in sync queue
5. Disable to sync

### Method 2: Browser DevTools
1. Open DevTools (F12)
2. Network tab → Throttling → Offline
3. Test app behavior
4. Go back online to sync

### Expected Behavior
- ✓ View cached events, tickets, artists
- ✓ Scan tickets (queued for validation)
- ✓ View reports with local data
- ✗ Create events (queued)
- ✗ Purchase tickets (queued)
- ✗ Search new artists

## Data Flow

### Write Operations
```
User Action
  ↓
1. Save to IndexedDB (immediate)
  ↓
2. Add to Sync Queue
  ↓
3. Return success to UI
  ↓
4. When online: Flush queue to API
  ↓
5. Mark as synced
```

### Read Operations
```
User Request
  ↓
1. Check IndexedDB first (fast)
  ↓
2. If online & stale: Fetch from API
  ↓
3. Update IndexedDB cache
  ↓
4. Return to UI
```

## Security Checklist

### QR Codes
- [ ] Replace placeholder signatures with HMAC-SHA256
- [ ] Use strong, random secret key
- [ ] Validate signature server-side BEFORE marking scanned
- [ ] Rotate secret keys periodically
- [ ] Log all validation attempts

### API Security
- [ ] All endpoints behind authentication
- [ ] HTTPS only (no HTTP)
- [ ] Rate limiting on all endpoints
- [ ] Input validation and sanitization
- [ ] SQL injection prevention (parameterized queries)
- [ ] CORS configured properly

### Frontend Security
- [ ] No sensitive data in localStorage (only tokens)
- [ ] XSS prevention (React handles this mostly)
- [ ] CSP headers configured
- [ ] Secure cookie settings (HttpOnly, Secure, SameSite)

### Camera Privacy
- [ ] Clear explanation before requesting permission
- [ ] Camera access only when needed
- [ ] No recording or storing of video
- [ ] Immediate release of camera when done

## Performance Optimization

### Current Optimizations
- ✓ IndexedDB for fast local storage
- ✓ Service Worker caching
- ✓ Lazy loading (React.lazy for routes if needed)
- ✓ Efficient re-renders (React Query for caching)

### Future Optimizations
- [ ] Virtual scrolling for large lists
- [ ] Image compression before upload
- [ ] Pagination for event lists
- [ ] Debounced search inputs
- [ ] Web Workers for heavy operations

## Testing Checklist

### Functional Tests
- [ ] Create event with all fields
- [ ] Upload event images
- [ ] Create ticket types
- [ ] Purchase tickets
- [ ] Generate QR codes
- [ ] Scan valid tickets
- [ ] Reject invalid/duplicate tickets
- [ ] Search artists
- [ ] Create bookings
- [ ] Export CSV reports

### Offline Tests
- [ ] View events offline
- [ ] Scan tickets offline
- [ ] Queue syncs when offline
- [ ] Automatic sync when back online
- [ ] Manual retry for failed syncs

### PWA Tests
- [ ] Install on mobile device
- [ ] Add to home screen
- [ ] Launch in standalone mode
- [ ] Service worker caching works
- [ ] Offline fallback page

### Camera Tests
- [ ] Request permission flow
- [ ] Grant permission → scanner works
- [ ] Deny permission → fallback works
- [ ] Manual input alternative
- [ ] QR decode accuracy

## Deployment

### Build for Production
```bash
npm run build
```

Output in `dist/` folder.

### Deploy To:
- **Vercel**: `vercel --prod`
- **Netlify**: Drag `dist/` folder
- **GitHub Pages**: `npm run build && gh-pages -d dist`
- **Custom server**: Serve `dist/` folder

### Post-Deployment Checklist
- [ ] HTTPS enabled
- [ ] Service worker registered
- [ ] Manifest.json accessible
- [ ] Camera permissions work
- [ ] API_BASE_URL updated
- [ ] Environment variables set
- [ ] Analytics/monitoring enabled

## Troubleshooting

### Service Worker Not Updating
```bash
# Clear cache
Application → Clear Storage → Clear site data

# Hard reload
Ctrl+Shift+R (or Cmd+Shift+R on Mac)

# Unregister SW
Application → Service Workers → Unregister
```

### IndexedDB Issues
```bash
# Clear IndexedDB
Application → Storage → IndexedDB → Delete

# Or programmatically:
const dbs = await indexedDB.databases();
dbs.forEach(db => indexedDB.deleteDatabase(db.name));
```

### Sync Queue Stuck
1. Go to Settings
2. Click "Clear Synced Items"
3. Check network in DevTools
4. Verify API_BASE_URL is correct
5. Check authentication tokens

## File Structure Reference

```
src/
├── components/
│   ├── Layout.tsx              # App shell with sidebar
│   ├── QRScanner.tsx           # Camera scanner component
│   └── ui/                     # shadcn components
├── pages/
│   ├── Dashboard.tsx           # Metrics & overview
│   ├── EventsList.tsx          # Event management
│   ├── TicketSales.tsx         # Purchase flow + QR generation
│   ├── ScannerPage.tsx         # Scanner page
│   ├── Artists.tsx             # Artist search & booking
│   ├── Reports.tsx             # Analytics & CSV export
│   └── Settings.tsx            # Configuration
├── services/
│   ├── apiClient.ts            # 🔥 Replace mocks here
│   ├── syncQueue.ts            # Offline sync logic
│   └── storage.ts              # IndexedDB helpers
├── hooks/
│   └── useSyncStatus.ts        # Sync state hook
├── types/
│   └── index.ts                # TypeScript definitions
├── config.ts                   # 🔥 Update API_BASE_URL here
└── App.tsx                     # Root component with routing

public/
├── manifest.json               # PWA manifest
└── sw.js                       # Service worker
```

## Environment Variables

If using `.env` file:

```env
VITE_API_BASE_URL=https://api.your-domain.com
VITE_QR_SECRET_KEY=your-secret-key-here
VITE_ENVIRONMENT=production
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Support & Maintenance

### Monitoring
- Track sync queue length
- Monitor scan success rate
- Log failed syncs
- Alert on high error rates

### Logs to Keep
- Scan logs (for auditing)
- Sync failures
- Authentication errors
- QR validation failures

### Regular Maintenance
- Clear old synced items from queue
- Archive old events
- Backup IndexedDB data
- Update dependencies
- Rotate secret keys

## Contact

For technical questions or issues, refer to:
- Main README.md for user-facing docs
- This file for developer integration
- Code comments for implementation details
