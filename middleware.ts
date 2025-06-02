// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt'; // asegúrate de tener next-auth instalado

const ROLE_ACCESS: Record<string, string[]> = {
  '/admin': ['admin'],
  '/ventas': ['admin', 'vendedor'],
  '/compras': ['admin', 'comprador'],
};

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = await getToken({ req: request });

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Detectar si la ruta coincide con alguna protegida
  const protectedRoute = Object.keys(ROLE_ACCESS).find((route) =>
    pathname.startsWith(route)
  );

  if (protectedRoute) {
    const allowedRoles = ROLE_ACCESS[protectedRoute];
    const userRole = (token.role) as string;

    if (!allowedRoles.includes(userRole)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/ventas/:path*', '/compras/:path*'], // ajusta según tus rutas
};
// Rutas del Frontend
const front = [
  "/",                      // Página principal (app/page.tsx)
  "/admin/user",            // Gestión de usuarios (app/admin/user/page.tsx)
  "/admin/warehouse",       // Gestión de locales/almacenes (app/admin/warehouse/page.tsx)
  "/ipv",                   // Página de IPV (app/ipv/page.tsx)
  "/login",                 // Página de login (app/login/page.tsx)
  "/products",              // Listado de productos (app/products/page.tsx)
  "/products/[id]",         // Detalle de producto (app/products/[id]/page.tsx)
  "/products/new",          // Creación de productos (app/products/new/page.tsx)
  "/purchase",              // Página de compras (app/purchase/page.tsx)
  "/register",              // Página de registro (app/register/page.tsx)
  "/setup",                 // Setup principal (app/setup/page.tsx)
  "/users/new",             // Página para crear usuarios (app/users/new/page.tsx)
];


// Rutas del Backend (APIs)
const back = [
  "/api/adjustment",        // Ajustes de inventario (app/api/adjustment/route.ts)
  "/api/auth",              // Autenticación (app/api/auth/[...nextauth]/...)
  "/api/ipv",               // APIs para IPV (app/api/ipv/route.ts)
  "/api/paymentMethod",     // Métodos de pago (app/api/paymentMethod/route.ts)
  "/api/products",          // Gestión de productos (app/api/products/route.ts)
  "/api/purchase",          // Gestión de compras (app/api/purchase/route.ts)
  "/api/sales",             // Gestión de ventas (app/api/sales/route.ts)
  "/api/shift",             // Turnos (app/api/shift/route.ts, app/api/shift/close/route.ts)
  "/api/stockLocation",     // Ubicaciones de stock (app/api/stockLocation/route.ts)
  "/api/transfer-location", // Transferencias de ubicación (app/api/transfer-location/route.ts)
  "/api/user",              // Usuarios (app/api/user/route.ts y /api/user/[id]/route.ts)
  "/api/warehouse-stock",   // Movimientos y stocks en almacén (app/api/warehouse-stock/route.ts)
];