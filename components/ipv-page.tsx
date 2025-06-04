"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import DescargarPdfButton from "./genaratePdfIPV";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface IPVProduct {
  nombre: string;
  PC: number;
  PV: number;
  I: number;
  E: number;
  M: number;
  R: number;
  V: number;
  T: number;
  G: number;
}

interface IPVData {
  date: string;
  shiftAuthors: string[];
  products: IPVProduct[];
  total: {
    totalCashAmount: number;
    totalTransferAmount: number;
  };
  shiftManagers: string[];
  stockLocation: {
    id: string;
    name: string;
    isActive: boolean;
  };
}

export default function IPVPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "1";
  const userRole = session?.user?.role;
  const isDependiente = userRole === "dependiente";

  const [data, setData] = useState<IPVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [userLocation, setUserLocation] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  const fetchIPVData = async (date: string = "", locationId: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) {
        params.append("date", date.split("T")[0]);
      }
      if (locationId) {
        params.append("locationId", locationId);
      }

      const response = await fetch(`/api/ipv?${params.toString()}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!response.ok) {
        throw new Error("Error al obtener los datos del IPV");
      }

      const ipvData = await response.json();
      setData(ipvData);
      setSelectedLocation(ipvData.stockLocation);
      toast.success("Datos del IPV cargados correctamente");
    } catch (error) {
      console.error("Error fetching IPV data:", error);
      toast.error("Error al cargar los datos del IPV");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserLocation = async () => {
    if (!userId || isDependiente) return;

    try {
      const response = await fetch(`/api/user/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!response.ok) {
        // throw new Error("Error al obtener los datos del usuario");
      }
      const userData = await response.json();
      setUserLocation(userData.stockLocations);
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.info("Este usuario no es administrador");
    }
  };

  useEffect(() => {
    fetchIPVData();
    fetchUserLocation();
  }, []);

  const handleDateChange = () => {
    fetchIPVData(selectedDate, selectedLocation?.id || "");
  };
  const handleLocationChange = (value: string) => {
    const newLocation = userLocation.find(
      (loc) => loc.stockLocation.id === value
    );
    if (newLocation) {
      setSelectedLocation(newLocation.stockLocation);
      fetchIPVData(selectedDate, newLocation.stockLocation.id);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-600">Cargando datos del IPV...</p>
        </div>
      </div>
    );
  }

  const totalVentas =
    data?.products.reduce((sum, product) => sum + product.T, 0) || 0;
  const totalGanancias =
    data?.products.reduce((sum, product) => sum + (product.G ?? 0), 0) || 0;
  const totalProductosVendidos =
    data?.products.reduce((sum, product) => sum + product.V, 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Informe de Punto de Venta (IPV)</h1>
        <DescargarPdfButton data={data || undefined} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configuración de Consulta
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Sección de filtros */}
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-end">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-1">
              <div className="space-y-2 min-w-[140px]">
                <Label htmlFor="date" className="text-sm font-medium">
                  Fecha de consulta
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>

              {userLocation.length > 1 ? (
                <div className="space-y-2 min-w-[180px]">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Local de consulta
                  </Label>
                  <Select
                    value={selectedLocation?.id || ""}
                    onValueChange={handleLocationChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar local" />
                    </SelectTrigger>
                    <SelectContent>
                      {userLocation.map((loc) => (
                        <SelectItem
                          key={loc.stockLocation.id}
                          value={loc.stockLocation.id}
                        >
                          {loc.stockLocation.name || loc.stockLocation.id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2 min-w-[180px]">
                  <Label className="text-sm font-medium">Local asignado</Label>
                  <div className="h-9 px-3 py-2 bg-muted rounded-md border border-input text-sm">
                    {selectedLocation?.name || "No asignado"}
                  </div>
                </div>
              )}

              <Button
                onClick={handleDateChange}
                className="min-w-[100px] h-9"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Cargando...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Consultar
                  </>
                )}
              </Button>
            </div>

            {/* Información del reporte - Solo en desktop */}
            <div className="hidden xl:flex gap-4">
              {data && (
                <div className="flex gap-4">
                  <Card className="min-w-[200px] bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                        <Calendar className="h-4 w-4" />
                        Fecha del Reporte
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
                        {new Date(data.date).toLocaleDateString("es-ES", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {data.shiftAuthors.length > 0 && (
                    <Card className="min-w-[200px] bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                          <Users className="h-4 w-4" />
                          Personal de Turno
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex flex-wrap gap-1">
                          {data.shiftAuthors
                            .slice(0, 2)
                            .map((author, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="text-xs bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                              >
                                {author}
                              </Badge>
                            ))}
                          {data.shiftAuthors.length > 2 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                            >
                              +{data.shiftAuthors.length - 2} más
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Información del reporte - Mobile/Tablet */}
          {data && (
            <div className="xl:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <Calendar className="h-4 w-4" />
                      Fecha del Reporte
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {new Date(data.date).toLocaleDateString("es-ES", {
                        weekday: "short",
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                  </CardContent>
                </Card>

                {data.shiftAuthors.length > 0 && (
                  <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                        <Users className="h-4 w-4" />
                        Personal ({data.shiftAuthors.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex flex-wrap gap-1">
                        {data.shiftAuthors.slice(0, 3).map((author, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                          >
                            {author}
                          </Badge>
                        ))}
                        {data.shiftAuthors.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200"
                          >
                            +{data.shiftAuthors.length - 3}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!data || data.products.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p className="text-gray-600">
              No se encontraron datos del IPV para la fecha seleccionada.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            <Card className="bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950 dark:to-green-900 border-emerald-200 dark:border-emerald-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Total Ventas
                </CardTitle>
                <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-full">
                  <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  ${totalVentas.toFixed(2)}
                </div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                  Ventas del día
                </p>
              </CardContent>
            </Card>

            {!isDependiente && (
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Total Ganancias
                  </CardTitle>
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full">
                    <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    ${totalGanancias.toFixed(2)}
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Beneficio bruto
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950 dark:to-violet-900 border-purple-200 dark:border-purple-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Productos Vendidos
                </CardTitle>
                <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full">
                  <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                  {totalProductosVendidos}
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  Unidades vendidas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950 dark:to-emerald-900 border-green-200 dark:border-green-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">
                  Total en Efectivo
                </CardTitle>
                <div className="p-2 bg-green-100 dark:bg-green-800 rounded-full">
                  <svg
                    className="h-4 w-4 text-green-600 dark:text-green-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                  ${data.total.totalCashAmount?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Pagos en efectivo
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-cyan-50 to-blue-100 dark:from-cyan-950 dark:to-blue-900 border-cyan-200 dark:border-cyan-800 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
                  Total en Transferencia
                </CardTitle>
                <div className="p-2 bg-cyan-100 dark:bg-cyan-800 rounded-full">
                  <svg
                    className="h-4 w-4 text-cyan-600 dark:text-cyan-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-cyan-900 dark:text-cyan-100">
                  ${data.total.totalTransferAmount?.toFixed(2) || "0.00"}
                </div>
                <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-1">
                  Pagos electrónicos
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Detalle de Productos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      {!isDependiente && (
                        <TableHead className="text-right">P.C.</TableHead>
                      )}
                      <TableHead className="text-right">P.V.</TableHead>
                      <TableHead className="text-right">Inicial</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Salida</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                      <TableHead className="text-right">Vendidos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      {!isDependiente && (
                        <TableHead className="text-right">Ganancia</TableHead>
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {product.nombre}
                        </TableCell>
                        {!isDependiente && (
                          <TableCell className="text-right">
                            ${product.PC?.toFixed(2)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          ${product.PV?.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.I}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.E}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.M}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.R}
                        </TableCell>
                        <TableCell className="text-right">
                          {product.V}
                        </TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ${product.T?.toFixed(2)}
                        </TableCell>
                        {!isDependiente && (
                          <TableCell className="text-right text-blue-600 font-semibold">
                            ${product.G != null ? product.G.toFixed(2) : "0.00"}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Separator className="my-4" />
              <div className="flex justify-end space-x-8">
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Ventas</p>
                  <p className="text-lg font-bold text-green-600">
                    ${totalVentas.toFixed(2)}
                  </p>
                </div>
                {!isDependiente && (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total Ganancias
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                      ${totalGanancias.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
