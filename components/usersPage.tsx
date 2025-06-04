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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  Check,
  X,
  Users,
  UserCheck,
  UserX,
  Edit,
  MoreHorizontal,
  User,
  Building,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/debounce";

import ReactSelect from "react-select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "./ui/dropdown-menu";

import { Avatar, AvatarFallback } from "./ui/avatar";

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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

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

  // Función para cerrar modal
  const closeModal = () => {
    setShowUserModal(false);
    setOpenDropdownId(null);
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
      toast.error("Error al cargar las ubicaciones");
      console.error(error);
    }
  };

  // Función para toggle estado del usuario
  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado del usuario");
      }

      toast.success(
        `Usuario ${!currentStatus ? "activado" : "desactivado"} correctamente`
      );

      // Actualizar el estado local
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: !currentStatus } : user
        )
      );

      setOpenDropdownId(null);
    } catch (error) {
      toast.error("Error al actualizar el estado del usuario");
      console.error(error);
    }
  };

  // Traer usuarios al cambiar el search o page
  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchLocations();
  }, []);

  // Efecto para resetear paginación cuando cambia la búsqueda
  useEffect(() => {
    setPage(1);
    setHasMore(true);
  }, [debouncedSearch]);

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
      closeModal();
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
    setOpenDropdownId(null);
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
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">
            Administra usuarios y sus permisos en el sistema
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedUser(null);
            resetUserForm();
            setShowUserModal(true);
          }}
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Buscador mejorado */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar usuarios por nombre o email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Usuarios mejorada */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Usuarios Registrados</CardTitle>
            <p className="text-sm text-muted-foreground">
              {users.length} usuario{users.length !== 1 ? "s" : ""} encontrado
              {users.length !== 1 ? "s" : ""}
            </p>
          </div>
          {loading && page === 1 && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </CardHeader>
        <CardContent>
          {loading && page === 1 ? (
            <div className="flex justify-center py-12">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-muted-foreground">
                  Cargando usuarios...
                </span>
              </div>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Usuario
                        </div>
                      </TableHead>
                      <TableHead className="w-[150px]">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="h-4 w-4 p-0">
                            R
                          </Badge>
                          Rol
                        </div>
                      </TableHead>
                      <TableHead className="w-[200px]">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4" />
                          Ubicaciones
                        </div>
                      </TableHead>
                      <TableHead className="w-[100px] text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="h-4 w-4" />
                          Estado
                        </div>
                      </TableHead>
                      <TableHead className="w-[80px] text-center">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                              <span className="font-medium">{user.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {user.email}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "admin"
                                ? "destructive"
                                : "secondary"
                            }
                            className="capitalize"
                          >
                            {user.role === "admin"
                              ? "Administrador"
                              : "Dependiente"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.stockLocations.length > 0 ? (
                              user.stockLocations
                                .slice(0, 2)
                                .map((location, index) => (
                                  <Badge
                                    key={location.stockLocation.id}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {location.stockLocation.name}
                                  </Badge>
                                ))
                            ) : (
                              <span className="text-sm text-muted-foreground">
                                Sin ubicaciones
                              </span>
                            )}
                            {user.stockLocations.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{user.stockLocations.length - 2} más
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            {user.isActive ? (
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                >
                                  Activo
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="h-2 w-2 bg-red-500 rounded-full" />
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                >
                                  Inactivo
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <DropdownMenu
                            open={openDropdownId === user.id}
                            onOpenChange={(open) => {
                              setOpenDropdownId(open ? user.id : null);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Abrir menú</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="w-[160px]"
                            >
                              <DropdownMenuItem
                                onClick={() => openEditModal(user)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openEditModal(user)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleUserStatus(user.id, user.isActive)
                                }
                                className={
                                  user.isActive
                                    ? "text-red-600 focus:text-red-600"
                                    : "text-green-600 focus:text-green-600"
                                }
                              >
                                {user.isActive ? (
                                  <>
                                    <UserX className="mr-2 h-4 w-4" />
                                    Desactivar
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="mr-2 h-4 w-4" />
                                    Activar
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Estado vacío mejorado */}
                {users.length === 0 && !loading && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No hay usuarios
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4 text-center">
                      {search
                        ? "No se encontraron usuarios con ese criterio de búsqueda"
                        : "Comienza creando tu primer usuario"}
                    </p>
                    {!search && (
                      <Button
                        onClick={() => {
                          setSelectedUser(null);
                          resetUserForm();
                          setShowUserModal(true);
                        }}
                        size="sm"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Crear usuario
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Paginación infinita */}
      <div ref={loadMoreRef} className="h-4" />
      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm text-muted-foreground">
              Cargando más usuarios...
            </span>
          </div>
        </div>
      )}

      {/* Modal mejorado para crear/editar usuario */}
      <Dialog open={showUserModal} onOpenChange={closeModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedUser ? (
                <>
                  <Edit className="h-5 w-5" />
                  Editar Usuario
                </>
              ) : (
                <>
                  <Plus className="h-5 w-5" />
                  Crear Usuario
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <Separator />

          <div className="space-y-6 mt-4">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nombre <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre completo del usuario"
                    autoComplete="off"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="correo@ejemplo.com"
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña{" "}
                  {!selectedUser && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={
                    selectedUser
                      ? "Deja vacío para mantener la contraseña actual"
                      : "Contraseña del usuario"
                  }
                  autoComplete="new-password"
                />
                {selectedUser && (
                  <p className="text-xs text-muted-foreground">
                    Solo completa este campo si deseas cambiar la contraseña
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Configuración de Acceso */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Configuración de Acceso</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="role">
                    Rol <span className="text-red-500">*</span>
                  </Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {roleOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="active">Estado del Usuario</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="active"
                      checked={isActive}
                      onCheckedChange={setIsActive}
                    />
                    <Label htmlFor="active" className="cursor-pointer">
                      {isActive ? "Activo" : "Inactivo"}
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Ubicaciones <span className="text-red-500">*</span>
                </Label>
                <ReactSelect
                  isMulti
                  options={stockOptions}
                  value={selectedStockOptions}
                  onChange={(selected) =>
                    setSelectedStockLocationIds(
                      selected ? selected.map((opt) => opt.value) : []
                    )
                  }
                  placeholder="Seleccionar ubicaciones..."
                  className="react-select-container"
                  classNamePrefix="react-select"
                  styles={{
                    control: (base) => ({
                      ...base,
                      borderColor: "#e2e8f0",
                      minHeight: "42px",
                      "&:hover": {
                        borderColor: "#cbd5e1",
                      },
                    }),
                    menu: (base) => ({
                      ...base,
                      zIndex: 9999,
                    }),
                  }}
                  noOptionsMessage={() => "No hay ubicaciones disponibles"}
                />
                {role === "dependiente" &&
                  selectedStockLocationIds.length > 1 && (
                    <p className="text-xs text-red-500">
                      Un dependiente solo puede tener una ubicación asignada
                    </p>
                  )}
              </div>
            </div>

            <Separator />

            {/* Botones de acción */}
            <div className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                variant="outline"
                onClick={closeModal}
                className="order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button
                onClick={submitUser}
                disabled={sendDataUser}
                className="order-1 sm:order-2"
              >
                {sendDataUser && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {selectedUser ? "Actualizar Usuario" : "Crear Usuario"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
