// lib/withRole.ts
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { backendAccess } from './route-access';
import { Role } from './models/role';

export function withRole(handler: (req: NextRequest, token: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const pathname = req.nextUrl.pathname;
    const matchedRoute =
      Object.keys(backendAccess).find((route) =>
        pathname.startsWith(route)
      ) || '';

    const allowedRoles = backendAccess[matchedRoute] ?? [];

    if (allowedRoles.length === 0) {
      return handler(req, null); // pública
    }

    const token = await getToken({ req });

    if (!token) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const userRole = (token.role) as Role;
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    return handler(req, token);
  };
}
