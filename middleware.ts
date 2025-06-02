// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { frontendAccess } from './lib/route-access';
import { Role } from './lib/models/role';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const pathname = req.nextUrl.pathname;

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
