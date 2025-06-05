"use client";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  Edit,
  Plus,
  Loader2,
  Building,
  MapPin,
  Check,
  X,
  MoreHorizontal,
} from "lucide-react";

import ModalStockLocation from "@/components/modals/modal-stock-location";
import { StockLocation } from "@/hooks/useStockLocations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading";

export const dynamic = "force-dynamic";

const PageContent = () => {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");

  const [data, setData] = useState<StockLocation[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockLocation>({
    id: "",
    name: "",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const handleOpen = (data?: StockLocation) => {
    if (data) {
      setSelectedItem({
        id: data.id,
        name: data.name,
        isActive: data.isActive,
        createdAt: data.createdAt || new Date(),
        updatedAt: data.updatedAt || new Date(),
      });
    } else {
      setSelectedItem({
        id: "",
        name: "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    setShowModal(true);
  };

  const handleClose = () => setShowModal(false);

  const handleSubmit = async (formData: {
    name: string;
    isActive: boolean;
  }) => {
    try {
      const url = selectedItem.id
        ? `/api/stockLocation/${selectedItem.id}`
        : "/api/stockLocation";
      const method = selectedItem.id ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Error al guardar el local");
      }

      toast.success(
        selectedItem.id
          ? "Local actualizado correctamente"
          : "Local creado correctamente"
      );

      setShowModal(false);
      fetchData(); // Refrescar datos
    } catch (error) {
      toast.error("Error al guardar el local");
      console.error(error);
    }
  };

  const toggleActiveStatus = async (location: StockLocation) => {
    setIsUpdating(location.id);
    try {
      const response = await fetch(`/api/stockLocation/${location.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({
          name: location.name,
          isActive: !location.isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al actualizar el estado");
      }

      // Actualizar estado local
      setData((prev) =>
        prev.map((item) =>
          item.id === location.id ? { ...item, isActive: !item.isActive } : item
        )
      );

      toast.success(
        `Local ${!location.isActive ? "activado" : "desactivado"} correctamente`
      );
    } catch (error) {
      toast.error("Error al actualizar el estado del local");
      console.error(error);
    } finally {
      setIsUpdating(null);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/stockLocation?page=${page}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!res.ok) throw new Error("Failed to fetch stock locations");
      const result = await res.json();
      setData(result.stockLocations);
      setTotalPages(result.totalPages);
    } catch (error) {
      toast.error("Error al cargar los locales");
      console.error("Error fetching stock locations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [page]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header mejorado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Locales</h1>
          <p className="text-muted-foreground">
            Administra las ubicaciones de stock de tu empresa
          </p>
        </div>
        <Button onClick={() => handleOpen()} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Local
        </Button>
      </div>

      {/* Card principal */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Locales Registrados</CardTitle>
            <p className="text-sm text-muted-foreground">
              {data.length} local{data.length !== 1 ? "es" : ""} encontrado
              {data.length !== 1 ? "s" : ""}
            </p>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                <span className="text-muted-foreground">
                  Cargando locales...
                </span>
              </div>
            </div>
          ) : data.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Building className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No hay locales</h3>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Comienza creando tu primer local de stock
              </p>
              <Button onClick={() => handleOpen()}>
                <Plus className="mr-2 h-4 w-4" />
                Crear Local
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Local
                      </div>
                    </TableHead>
                    <TableHead className="w-[150px] text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Check className="h-4 w-4" />
                        Estado
                      </div>
                    </TableHead>
                    <TableHead className="w-[100px] text-center">
                      Acciones
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="rounded-full bg-blue-100 p-2">
                            <Building className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium">{item.name}</span>
                            <p className="text-sm text-muted-foreground">
                              ID: {item.id.slice(0, 8)}...
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center">
                          {item.isActive ? (
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                              <Badge
                                variant="secondary"
                                className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              >
                                Activo
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 bg-red-500 rounded-full" />
                              <Badge
                                variant="secondary"
                                className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                              >
                                Inactivo
                              </Badge>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              disabled={isUpdating === item.id}
                            >
                              {isUpdating === item.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <MoreHorizontal className="h-4 w-4" />
                              )}
                              <span className="sr-only">Abrir menú</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-[160px]"
                          >
                            <DropdownMenuItem onClick={() => handleOpen(item)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar local
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => toggleActiveStatus(item)}
                              className={
                                item.isActive
                                  ? "text-red-600 focus:text-red-600"
                                  : "text-green-600 focus:text-green-600"
                              }
                            >
                              {item.isActive ? (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Desactivar
                                </>
                              ) : (
                                <>
                                  <Check className="mr-2 h-4 w-4" />
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal */}
      {showModal && (
        <ModalStockLocation
          initialData={selectedItem}
          onClose={handleClose}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
};

export default function WarehousePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex items-center gap-3">
            <LoadingSpinner />
            <p className="text-xl text-muted-foreground">Cargando almacenes...</p>
          </div>
        </div>
      }
    >
      <PageContent />
    </Suspense>
  );
}
