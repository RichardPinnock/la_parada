"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  LogIn,
  LogOut,
  Menu,
  User,
  Settings,
  ChevronDown,
  Store,
  Package,
  ShoppingCart,
  Users,
  Building,
  FileText,
  BarChart3,
} from "lucide-react";

export default function Header() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const getUserInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeVariant = (role?: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "dependiente":
        return "secondary";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role?: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "dependiente":
        return "Dependiente";
      default:
        return "Usuario";
    }
  };

  // Opciones del menú según el rol
  const getMenuOptions = (role?: string) => {
    const adminOptions = [
      {
        label: "Ver Productos",
        href: "/products",
        icon: Package,
        description: "Explorar catálogo de productos",
      },
      {
        label: "Crear Productos",
        href: "/products/new",
        icon: Package,
        description: "Agregar nuevos productos",
      },
      {
        label: "Realizar Compras",
        href: "/purchase",
        icon: ShoppingCart,
        description: "Gestionar compras de inventario",
      },
      {
        label: "Gestión de Usuarios",
        href: "/admin/user",
        icon: Users,
        description: "Administrar usuarios del sistema",
      },
      {
        label: "Gestión de Locales",
        href: "/admin/warehouse",
        icon: Building,
        description: "Configurar ubicaciones de stock",
      },
      {
        label: "Gestión de Ajustes",
        href: "/admin/adjustment",
        icon: FileText,
        description: "Ajustes de inventario",
      },
      {
        label: "IPV",
        href: "/ipv",
        icon: BarChart3,
        description: "Inventario, Productos y Ventas",
      },
    ];

    const dependienteOptions = [
      {
        label: "Ver Productos",
        href: "/products",
        icon: Package,
        description: "Explorar catálogo de productos",
      },
      {
        label: "IPV",
        href: "/ipv",
        icon: BarChart3,
        description: "Inventario, Productos y Ventas",
      },
      {
        label: "Ver Ajustes",
        href: "/admin/adjustment",
        icon: FileText,
        description: "Consultar ajustes de inventario",
      },
    ];

    return role === "admin" ? adminOptions : dependienteOptions;
  };

  const menuOptions = getMenuOptions(session?.user?.role);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-xl font-bold text-foreground hover:text-primary transition-colors"
          >
            <Store className="w-6 h-6" />
            <span className="hidden sm:inline">La Parada</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-auto px-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={session.user?.image || ""}
                          alt={session.user?.name || "User"}
                        />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(session.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="text-sm font-medium">
                          {session.user?.name || "Usuario"}
                        </span>
                        <Badge
                          variant={getRoleBadgeVariant(session.user?.role)}
                          className="text-xs h-4 px-1"
                        >
                          {getRoleLabel(session.user?.role)}
                        </Badge>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />

                  {/* Opciones del panel según rol */}
                  <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
                    {session.user?.role === "admin"
                      ? "Panel de Administración"
                      : "Panel de Usuario"}
                  </DropdownMenuLabel>

                  {menuOptions.map((option) => {
                    const Icon = option.icon;
                    return (
                      <DropdownMenuItem key={option.href} asChild>
                        <Link
                          href={option.href}
                          className="flex items-center gap-3 w-full cursor-pointer"
                        >
                          <Icon className="h-4 w-4" />
                          <div className="flex flex-col">
                            <span className="font-medium">{option.label}</span>
                            <span className="text-xs text-muted-foreground">
                              {option.description}
                            </span>
                          </div>
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}

                  <DropdownMenuSeparator />

                  {/* Opciones de usuario */}
                  <DropdownMenuItem asChild>
                    <Link
                      href="/profile"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link
                      href="/settings"
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Settings className="w-4 h-4" />
                      Configuración
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => signOut()}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Cerrar Sesión
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="default" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  Iniciar Sesión
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            {session ? (
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <SheetHeader className="text-left">
                    <SheetTitle className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={session.user?.image || ""}
                          alt={session.user?.name || "User"}
                        />
                        <AvatarFallback>
                          {getUserInitials(session.user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">
                          {session.user?.name || "Usuario"}
                        </span>
                        <Badge
                          variant={getRoleBadgeVariant(session.user?.role)}
                          className="text-xs"
                        >
                          {getRoleLabel(session.user?.role)}
                        </Badge>
                      </div>
                    </SheetTitle>
                    <SheetDescription>{session.user?.email}</SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-4">
                    {/* Panel de administración/usuario para móvil */}
                    <div className="space-y-2">
                      <div className="px-3 py-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {session.user?.role === "admin"
                            ? "Panel de Administración"
                            : "Panel de Usuario"}
                        </h3>
                      </div>

                      {menuOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <Link
                            key={option.href}
                            href={option.href}
                            onClick={() => setIsOpen(false)}
                            className="block"
                          >
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-3 h-auto py-3 px-3"
                            >
                              <Icon className="h-4 w-4 shrink-0" />
                              <div className="flex flex-col items-start text-left">
                                <span className="font-medium">
                                  {option.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {option.description}
                                </span>
                              </div>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>

                    {/* Separador y opciones de usuario */}
                    {/*   <div className="border-t pt-4 space-y-2">
                      <div className="px-3 py-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          Cuenta
                        </h3>
                      </div>

                      <Link href="/profile" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                        >
                          <User className="w-4 h-4" />
                          Perfil
                        </Button>
                      </Link>

                      <Link href="/settings" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-2"
                        >
                          <Settings className="w-4 h-4" />
                          Configuración
                        </Button>
                      </Link>

                      <Button
                        variant="destructive"
                        className="w-full justify-start gap-2 mt-4"
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar Sesión
                      </Button>
                    </div> */}
                  </div>
                </SheetContent>
              </Sheet>
            ) : (
              <Link href="/login">
                <Button size="sm" className="flex items-center gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="hidden sm:inline">Iniciar Sesión</span>
                </Button>
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
