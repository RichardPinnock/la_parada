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
import { Calendar, Users, TrendingUp, Download } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import DescargarPdfButton from "./genaratePdfIPV";

interface IPVProduct {
  nombre: string;
  PC: number; // Precio de compra
  PV: number; // Precio de venta
  I: number; // Inventario inicial
  E: number; // Entradas
  M: number; // Mermas/Ajustes
  R: number; // Restante
  V: number; // Vendidos
  T: number; // Total vendido
  G: number; // Ganancia
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
  // console.log("🚀 ~ IPVPage ~ data:", session);
  const userId = session?.user?.id ?? "1";
  const [data, setData] = useState<IPVData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [user, setUser] = useState<any | null>(null);
  const [userLocation, setUserLocation] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);

  const fetchIPVData = async (date: string = "", locationId: string = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (date) {
        const formattedDate = date.split("T")[0];
        params.append("date", formattedDate);
      }
      if (locationId) {
        params.append("locationId", locationId);
      }
      const url = `/api/ipv?${params.toString()}`;
      const response = await fetch(url);

      if (!response.ok) {
        toast.error("Error al obtener los datos del IPV");
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
    if (!userId) {
      toast.error("Usuario no autenticado");
      console.log("Usuario no autenticado");
      return;
    }

    try {
      const response = await fetch(`/api/user/${userId}`);
      if (!response.ok) {
        throw new Error("Error al obtener los datos del usuario");
      }
      const userData = await response.json();
      // console.log("userData", userData);

      setUser(userData);
      setUserLocation(userData.stockLocations);
      console.log("userLocation", userData.stockLocations);

      // if(userData.stockLocations.length > 0) {
      //   setSelectedLocation(userData.stockLocations[0]);
      // }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Error al cargar los datos del usuario");
    }
  };

  useEffect(() => {
    fetchIPVData();
    fetchUserLocation();
  }, []);

  const handleDateChange = () => {
    fetchIPVData(selectedDate, selectedLocation?.id || "");
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

  // if (!data || data.products.length === 0 || data.shiftAuthors.length === 0) {
  //   return (
  //     <div className="container mx-auto p-6">
  //       <Card>
  //         <CardContent className="flex items-center justify-center h-40">
  //           <p className="text-gray-600">
  //             No se encontraron datos del IPV para la fecha seleccionada.
  //           </p>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }

  const totalVentas =
    data?.products.reduce((sum, product) => sum + product.T, 0) || 0;
  const totalGanancias =
    data?.products.reduce((sum, product) => sum + (product.G ?? 0), 0) || 0;
  const totalProductosVendidos =
    data?.products.reduce((sum, product) => sum + product.V, 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Informe de Punto de Venta (IPV)</h1>
        <DescargarPdfButton data={data || undefined} />
      </div>

      {/* Selector de fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Seleccionar Fecha
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4 items-end">
          <div>
            <Label htmlFor="date">Fecha</Label>
            <Input
              id="date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>
          {userLocation.length > 1 ? (
            <div className="flex flex-col">
              <Label htmlFor="location">Local</Label>
              <select
                id="location"
                value={selectedLocation?.id || ""}
                onChange={(e) => {
                  const newLocation = userLocation.find(
                    (loc) => loc.stockLocation.id === e.target.value
                  );
                  if (newLocation) {
                    setSelectedLocation(newLocation.stockLocation);
                    fetchIPVData(selectedDate, newLocation.stockLocation.id);
                  }
                }}
                className="border rounded h-9 px-2 py-0 text-base leading-9 focus:outline-none"
              >
                {userLocation.map((loc) => (
                  <option
                    key={loc.stockLocation.id}
                    value={loc.stockLocation.id}
                  >
                    {loc.stockLocation.name || loc.stockLocation.id}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex flex-col">
              {/* {data?.stockLocation.name} */}
              <Label htmlFor="location">Local</Label>
              {selectedLocation.name}
            </div>
          )}
          <Button onClick={handleDateChange}>Consultar</Button>
        </CardContent>
      </Card>

      {!data || data.products.length === 0 ? (
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="flex items-center justify-center h-40">
              <p className="text-gray-600">
                No se encontraron datos del IPV para la fecha seleccionada.
              </p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          {/* Información general */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Fecha del Reporte
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Date(data.date).toLocaleDateString("es-ES")}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Ventas
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${totalVentas?.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Ganancias
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${totalGanancias?.toFixed(2)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Productos Vendidos
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalProductosVendidos}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total en Efectivo
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ${data.total.totalCashAmount?.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total en Transferencia
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ${data.total.totalTransferAmount?.toFixed(2) || "0.00"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Autores de turnos */}
          {data.shiftAuthors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Personal de Turno
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.shiftAuthors.map((author, index) => (
                    <Badge key={index} variant="secondary">
                      {author}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabla de productos */}
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
                      <TableHead className="text-right">P.C.</TableHead>
                      <TableHead className="text-right">P.V.</TableHead>
                      <TableHead className="text-right">Inicial</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Salida</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                      <TableHead className="text-right">Vendidos</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Ganancia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {product.nombre}
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.PC?.toFixed(2)}
                        </TableCell>
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
                        <TableCell className="text-right text-blue-600 font-semibold">
                          ${product.G != null ? product.G.toFixed(2) : "0.00"}
                        </TableCell>
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
                    ${totalVentas?.toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Total Ganancias
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    ${totalGanancias?.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
