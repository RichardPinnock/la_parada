"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Search, Eye, Check, X } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/debounce";

import Select from "react-select";

// Interface de Usuario
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: string;
  isActive: boolean;
  stockLocations: {
    stockLocation: {
      id: string;
      name: string;
      isActive: boolean;
    };
  }[];
}

// Mock data para roles y stock locations
const roleOptions = [
  { value: "dependiente", label: "Dependiente" },
  { value: "admin", label: "Admin" },
];

export default function UsersPage() {
  // Estados para listado, búsqueda y paginación infinita
  const [users, setUsers] = useState<User[]>([]);
  const [stockLocationOptions, setStockLocationOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [sendDataUser, setSendDataUser] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // Ref para paginación infinita (scroll)
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Modal y usuario seleccionado
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Estados para formulario de usuario (modal)
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(roleOptions[0].value);
  const [isActive, setIsActive] = useState(true);
  const [selectedStockLocationIds, setSelectedStockLocationIds] = useState<
    string[]
  >([]);
  // Estado para filtro interno del select múltiple de ubicaciones
  const [stockSearch, setStockSearch] = useState("");

  // Función para reiniciar el formulario modal (sin afectar el buscador global)
  const resetUserForm = () => {
    setName("");
    setEmail("");
    setPassword("");
    setRole(roleOptions[0].value);
    setIsActive(true);
    setSelectedStockLocationIds([]);
    setStockSearch("");
  };

  // Función para traer usuarios (API paginada)
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/user?page=${page}&limit=5&search=${encodeURIComponent(search)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-internal-access":
              process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
          },
        }
      );
      if (!response.ok) throw new Error("Error al obtener los usuarios");
      const res = await response.json();
      const newUsers: User[] = Array.isArray(res) ? res : res.data || [];
      if (page === 1) {
        setUsers(newUsers);
      } else {
        setUsers((prev) => [...prev, ...newUsers]);
      }
      if (newUsers.length < 5) setHasMore(false);
      else setHasMore(true);
    } catch (error) {
      toast.error("Error al cargar los usuarios");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  //Funcion para traer los location
  const fetchLocations = async () => {
    try {
      const response = await fetch(`/api/stockLocation?page=1&limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!response.ok) throw new Error("Error al obtener los locales");
      const res = await response.json();
      const newStockLocation: any[] = Array.isArray(res)
        ? res
        : res.stockLocations || [];
      setStockLocationOptions(newStockLocation);
    } catch (error) {
      toast.error("Error al cargar los usuarios");
      console.error(error);
    }
  };

  // Traer usuarios al cambiar el search o page
  useEffect(() => {
    fetchUsers();
    fetchLocations();
  }, [debouncedSearch, page]);

  // Efecto para paginación infinita
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prev) => prev + 1);
        }
      },
      { root: null, threshold: 1.0 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [loading, hasMore]);

  // Función para enviar el formulario (crear o actualizar)
  const submitUser = async () => {
    // Para crear es obligatorio la contraseña; en edición se ignora si está vacía
    if (!selectedUser && !password) {
      toast.error("La contraseña es obligatoria para crear el usuario");
      return;
    }
    if (!name || !email) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    if (!selectedStockLocationIds.length) {
      toast.error("Selecciona al menos una ubicación");
      return;
    }
    if (!role) {
      toast.error("Selecciona un rol");
      return;
    }
    if (role == "dependiente") {
      if (selectedStockLocationIds.length > 1) {
        toast.error("Un dependiente solo puede tener una ubicación asignada");
        return;
      }
    }
    const userData = {
      name,
      email,
      ...(password ? { password } : {}),
      role,
      isActive,
      stockLocationIds: selectedStockLocationIds,
    };
    try {
      setSendDataUser(true);
      const url = selectedUser ? `/api/user/${selectedUser.id}` : "/api/user";
      const method = selectedUser ? "PUT" : "POST";
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        setSendDataUser(false);
        throw new Error(errorData.error || "Error al guardar el usuario");
      }
      toast.success(
        selectedUser
          ? "Usuario actualizado correctamente"
          : "Usuario creado correctamente"
      );
      setSendDataUser(false);
      setShowUserModal(false);
      resetUserForm();
      // Reiniciamos el listado y la paginación
      setPage(1);
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al guardar el usuario"
      );
      setSendDataUser(false);
    }
  };

  // Función para abrir modal en modo edición
  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setName(user.name);
    setEmail(user.email);
    setPassword("");
    setRole(user.role);
    setIsActive(user.isActive);
    setSelectedStockLocationIds(
      user.stockLocations.map((u) => u.stockLocation.id)
    );
    setShowUserModal(true);
  };

  // Mapea las opciones como requiere react-select
  const stockOptions = stockLocationOptions.map((loc) => ({
    value: loc.id,
    label: loc.name,
  }));

  // Controla las selecciones
  const selectedStockOptions = stockOptions.filter((option) =>
    selectedStockLocationIds.includes(option.value)
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Título y botón para crear usuario */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
        <Button
          onClick={() => {
            setSelectedUser(null);
            resetUserForm();
            setShowUserModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscador Global */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar usuarios..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla de Usuarios: Columnas: Nombre, Email, Rol, Activo y Acciones */}
      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && page === 1 ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Nombre</TableHead>
                    <TableHead className="w-1/3">Email</TableHead>
                    <TableHead className="w-1/6">Rol</TableHead>
                    <TableHead className="w-1/12 text-center">Activo</TableHead>
                    <TableHead className="w-1/12 text-center">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    // Ejemplo: Forzamos que la fila use disposición horizontal
                    <TableRow className="" key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell className="inline-flex items-center justify-center">
                        {user.isActive ? (
                          <Check className="w-4 h-4 text-green-500" />
                        ) : (
                          <X className="w-4 h-4 text-red-500" />
                        )}
                      </TableCell>
                      <TableCell className="w-1/12 inline-flex items-center justify-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(user)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {users.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron usuarios</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ref para paginación infinita */}
      <div ref={loadMoreRef} className="h-4" />
      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <p>Cargando más...</p>
        </div>
      )}

      {/* Modal para crear/editar usuario */}
      <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Editar Usuario" : "Crear Usuario"}
            </DialogTitle>
          </DialogHeader>
          <Separator />

          <div className="space-y-6 mt-4">
            {/* Nombre y Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nombre del usuario"
                  autoComplete="off"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@dominio.com"
                  autoComplete="off"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <Label>
                Contraseña{" "}
                {!selectedUser && <span className="text-red-500">*</span>}
              </Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={selectedUser ? "Deja vacío para mantenerla" : ""}
                autoComplete="new-password"
              />
            </div>

            {/* Ubicaciones de Stock */}
            <div>
              <Label>Ubicaciones</Label>
              <Select
                isMulti
                options={stockOptions}
                value={selectedStockOptions}
                onChange={(selected) =>
                  setSelectedStockLocationIds(selected.map((opt) => opt.value))
                }
                placeholder="Seleccionar ubicaciones..."
                className="react-select-container"
                classNamePrefix="react-select"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#d1d5db",
                    minHeight: "42px",
                  }),
                  menu: (base) => ({ ...base, zIndex: 9999 }),
                }}
              />
            </div>

            {/* Rol, Activo y Ubicaciones */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                <Label>Rol</Label>
                <select
                  className="w-full p-2 border border-gray-300 rounded-md"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center mt-6 space-x-2">
                <input
                  type="checkbox"
                  id="activo"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5"
                />
                <Label htmlFor="activo" className="cursor-pointer">
                  Activo
                </Label>
              </div>
            </div>
            <Separator />
            {/* Botones */}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={submitUser}
                className="flex-1 md:flex-none"
                disabled={sendDataUser}
              >
                {selectedUser ? "Actualizar Usuario" : "Crear Usuario"}
              </Button>
              <Button variant="outline" onClick={() => setShowUserModal(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
