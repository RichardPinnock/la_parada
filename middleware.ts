// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { frontendAccess } from './lib/route-access';
import { Role } from './lib/models/role';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;
  const isProduction = process.env.NODE_ENV === 'production'
  const isApiRequest = req.nextUrl.pathname.startsWith('/api/')

  if (isProduction && isApiRequest) {
    const secretHeader = req.headers.get('x-internal-access')
    const expectedSecret = process.env.INTERNAL_API_SECRET
    console.log(`Checking secret header: ${secretHeader} against expected: ${expectedSecret}`);
    

    if (secretHeader !== expectedSecret) {
      return new NextResponse('Forbidden', { status: 403 })
    }
  }

  // Ruta exacta o dinámica simplificada (por ejemplo: /products/123 → /products/[id])
  const matchedRoute =
    Object.keys(frontendAccess).find((route) =>
      matchPath(pathname, route)
    ) || '';

  const allowedRoles = frontendAccess[matchedRoute] ?? [];

  if (allowedRoles.length === 0) return NextResponse.next(); // Pública

  if (!token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const userRole = (token.role) as Role;
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url));
  }

  return NextResponse.next();
}

// Utilidad para manejar rutas dinámicas como /products/[id]
function matchPath(pathname: string, route: string): boolean {
  if (route.includes('[')) {
    const base = route.split('/[')[0];
    return pathname.startsWith(base + '/');
  }
  return pathname === route;
}

export const config = {
  matcher: ['/((?!_next|favicon|images|api/auth).*)'], // Protege todo menos estáticos y auth
};
