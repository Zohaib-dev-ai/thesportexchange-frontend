# The Sport Exchange - Full Stack Setup Guide

## Architecture Overview

The project is now separated into Frontend (Next.js) and Backend (Express.js):

```
thesportexchange/
├── frontend/ (Next.js app - current directory)
├── backend/ (Express API - new)
└── database/ (MySQL schema)
```

## Quick Start

### 1. Start Backend Server
```bash
cd backend
npm install  # Already done
npm run dev  # Running on http://localhost:5000
```

### 2. Start Frontend Server
```bash
npm run dev  # Running on http://localhost:3000
```

### 3. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/health

## Environment Variables

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=thesportexchange
```

### Backend (backend/.env)
```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=thesportexchange
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=development
```

## Updating Frontend API Calls

All frontend files that make API calls need to use the new backend URL. I've created a helper function:

### Import the Helper
```typescript
import { getApiUrl } from '../lib/api';
```

### Update Fetch Calls
**Before:**
```typescript
const response = await fetch('/api/investors');
```

**After:**
```typescript
const response = await fetch(getApiUrl('/api/investors'));
```

### Files to Update
You need to update these files (search for `fetch('/api/` and replace with `fetch(getApiUrl('/api/`):

1. ✅ `app/dashboard/page.tsx` - DONE
2. ✅ `app/components/DashboardCharts.tsx` - DONE
3. ✅ `app/lib/auth.ts` - DONE
4. ⏳ `app/dashboard/add-investor/page.tsx`
5. ⏳ `app/dashboard/investor/[id]/page.tsx`
6. ⏳ `app/investor-portal/page.tsx`

### Quick Find & Replace
In each file:
1. Add import: `import { getApiUrl } from '../lib/api';` (adjust path as needed)
2. Replace: `fetch('/api/` → `fetch(getApiUrl('/api/`
3. Replace: `fetch(\`/api/` → `fetch(getApiUrl(\`/api/`

## API Endpoints Available

All routes are now served from Express backend:

- `POST /api/auth/login` - Admin login
- `POST /api/auth/investor-login` - Investor login  
- `GET /api/investors` - Get all investors
- `GET /api/investors/:id` - Get single investor
- `POST /api/investors` - Create investor
- `PUT /api/investors/:id` - Update investor
- `DELETE /api/investors/:id` - Delete investor
- `PUT /api/investors/:id/change-password` - Change password
- `GET /api/investors/:id/documents` - Get documents
- `POST /api/investors/:id/documents` - Add document
- `DELETE /api/investors/:id/documents` - Delete document
- `POST /api/upload` - Upload file
- `POST /api/newsletter/send` - Send newsletter
- `GET /api/newsletter/history` - Get newsletters
- `GET /api/newsletter/:id` - Get single newsletter

## Testing

1. **Test Backend**:
   ```bash
   curl http://localhost:5000/health
   # Should return: {"status":"ok","message":"Backend is running"}
   ```

2. **Test Database Connection**:
   - Backend terminal should show: "✅ Database connected successfully"

3. **Test Login**:
   - Frontend: http://localhost:3000/login
   - Use your admin credentials
   - Should redirect to dashboard

## Deployment

### Backend Deployment (Railway/Render)
1. Push backend folder to Git
2. Connect to Railway or Render
3. Set environment variables
4. Update CORS origin to your frontend URL

### Frontend Deployment (Vercel)
1. Deploy as usual to Vercel
2. Add environment variable:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
   ```

## Benefits of This Setup

✅ **Independent Scaling**: Scale backend and frontend separately
✅ **Better Performance**: Backend optimized for API calls
✅ **Mobile Ready**: Backend API can be used for mobile apps
✅ **Cleaner Code**: Separation of concerns
✅ **Easier Testing**: Test backend APIs independently

## Troubleshooting

### CORS Errors
If you get CORS errors, check `backend/src/server.ts` and add your frontend URL to the allowed origins.

### Connection Refused
Make sure both servers are running:
- Backend on port 5000
- Frontend on port 3000

### Database Connection Failed
Check:
1. MySQL is running
2. Database "thesportexchange" exists
3. Credentials in backend/.env are correct

## Next Steps

1. Update remaining frontend files to use `getApiUrl()` helper
2. Test all functionality (login, CRUD operations, file upload)
3. Deploy both backend and frontend
4. Update production environment variables

## Support

For issues or questions, check:
- Backend logs in terminal running `npm run dev`
- Frontend logs in browser console
- Network tab in browser DevTools

---

**Status**: Backend is running successfully ✅
**Next**: Update remaining frontend API calls to use the new backend URL
