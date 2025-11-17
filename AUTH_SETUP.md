# Authentication Setup Guide

## Current Structure

The authentication system is now set up with proper separation of concerns:

### Files Created:
1. **`app/api/auth/login/route.ts`** - API endpoint for login
2. **`app/lib/auth.ts`** - Authentication service with helper functions

### How It Works:
- Login page calls `loginUser()` from `auth.ts`
- `loginUser()` makes API call to `/api/auth/login`
- API route validates credentials and returns token
- Token is stored using `setAuthData()`
- All pages use `isAuthenticated()` to check auth status

---

## When You Add Database

### Step 1: Install Dependencies
```bash
npm install bcryptjs jsonwebtoken
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### Step 2: Add Environment Variables
Create `.env.local`:
```
DATABASE_URL="your_database_connection_string"
JWT_SECRET="your_secret_key_here_minimum_32_characters"
```

### Step 3: Update ONLY the API Route
In `app/api/auth/login/route.ts`, replace the TODO comments:

```typescript
// Replace this:
const VALID_EMAIL = "admin@thesportexchange.com";
const VALID_PASSWORD = "admin123";

// With database query:
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma'; // or your DB client

const user = await prisma.user.findUnique({ 
  where: { email } 
});

if (!user) {
  return NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );
}

const isValidPassword = await bcrypt.compare(password, user.hashedPassword);

if (!isValidPassword) {
  return NextResponse.json(
    { error: "Invalid email or password" },
    { status: 401 }
  );
}

// Generate real JWT token
const token = jwt.sign(
  { userId: user.id, email: user.email },
  process.env.JWT_SECRET!,
  { expiresIn: '24h' }
);
```

### Step 4: Optional - Add Token Verification
Create `app/api/auth/verify/route.ts` to verify tokens:
```typescript
import { NextRequest, NextResponse } from "next/server";
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  const token = request.headers.get('authorization')?.split(' ')[1];
  
  if (!token) {
    return NextResponse.json({ valid: false }, { status: 401 });
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return NextResponse.json({ valid: true });
  } catch {
    return NextResponse.json({ valid: false }, { status: 401 });
  }
}
```

---

## Benefits of This Approach

✅ **Minimal changes** - Only update API route when adding database  
✅ **Frontend unchanged** - Login page and auth checks stay the same  
✅ **Centralized auth logic** - All auth functions in one place  
✅ **Easy to test** - Can test API independently  
✅ **Secure** - Credentials never exposed in frontend  
✅ **Scalable** - Easy to add features (password reset, 2FA, etc.)

---

## Current Login Credentials (Temporary)
- Email: `admin@thesportexchange.com`
- Password: `admin123`

**Remember to remove hardcoded credentials after database setup!**
