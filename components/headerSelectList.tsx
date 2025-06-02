"use client";

import Link from "next/link";

interface HeaderNavMenuProps {
  role?: string;
}

export default function HeaderNavMenu({ role = "" }: HeaderNavMenuProps) {
  // Definir las opciones según el role
  const menuOptions =
  role === "admin"
    ? [
        { label: "Ver Productos", href: "/products" },
        { label: "Crear Productos", href: "/products/new" },
        { label: "Realizar Compras", href: "/purchase" },
        { label: "Gestión de Usuarios", href: "/admin/user" },
        { label: "Gestión de Locales", href: "/admin/warehouse" },
        { label: "IPV", href: "/ipv" },
      ]
    : [{ label: "IPV", href: "/ipv" }];

  return (
    <div className="relative group">
      {/* Botón principal que muestra el título del menú */}
      <button
        type="button"
        className="px-4 py-2 bg-gray-50 text-black font-medium rounded hover:bg-gray-200 transition-colors focus:outline-none"
      >
        Panel de administración
      </button>
      {/* Dropdown visible al hacer hover en el contenedor */}
      <div className="absolute left-0 mt-2 w-56 rounded shadow-lg bg-white border border-gray-200 opacity-0 invisible group-hover:visible group-hover:opacity-100 transition-all duration-200 z-10">
        <ul className="py-1">
          {menuOptions.map((option) => (
            <li key={option.href}>
              <Link
                href={option.href}
                className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
              >
                {option.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}