"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  Settings,
  Package,
  ShoppingCart,
  Users,
  Building,
  FileText,
  BarChart3,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

interface HeaderNavMenuProps {
  role?: string;
}

export default function HeaderNavMenu({ role = "" }: HeaderNavMenuProps) {
  // Definir las opciones según el role con iconos
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

  const userOptions = [
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

  const menuOptions = role === "admin" ? adminOptions : userOptions;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2 px-4 py-2">
          <Settings className="h-4 w-4" />
          Panel de administración
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-64" align="start" side="bottom">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          {role === "admin" ? "Administración" : "Panel de Usuario"}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
