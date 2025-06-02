"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, Plus, FileText } from "lucide-react";
import HeaderNavMenu from "@/components/headerSelectList";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className="w-full bg-white shadow-md py-4 px-8">
      <nav className="flex justify-between items-center">
        <Link
          href="/"
          className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors"
        >
          La Parada
        </Link>
        <div className="flex items-center space-x-4">
          {session?.user?.role === "admin" && (
            <>
              {/* <Link href="/products">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Productos
                </Button>
              </Link>
              <Link href="/products/new">
                <Button variant="default" className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Crear Productos
                </Button>
              </Link> */}
            </>
          )}
          <HeaderNavMenu role={session?.user?.role || ""}/>

          {session ? (
            <>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500 text-right">
                  {session.user?.name && <div>{session.user.name}</div>}
                  <div>{session.user?.email}</div>
                </div>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  onClick={() => signOut()}
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </Button>
              </div>
            </>
          ) : (
            <Link href="/login">
              <Button variant="default" className="flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Sign In
              </Button>
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
