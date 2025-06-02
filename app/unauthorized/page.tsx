'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button'; // O usa un <button> nativo
import { AlertTriangle } from 'lucide-react';

export default function UnauthorizedPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const redirect = setTimeout(() => {
      router.push('/');
    }, countdown * 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(redirect);
    };
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-600 px-4">
      <div className="max-w-md w-full bg-gray-200 shadow-xl rounded-2xl p-8 text-center space-y-6">
        <div className="flex justify-center">
          <AlertTriangle className="h-12 w-12 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-800">
          Acceso no autorizado
        </h1>
        <p className="text-gray-600">
          No tienes permisos para acceder a esta página.
        </p>
        <p className="text-sm text-red-500">
          Serás redirigido en <span className="font-medium">{countdown}</span> segundos.
        </p>
        <Button onClick={() => router.back()} className="w-full">
          Volver atrás
        </Button>
      </div>
    </div>
  );
}
