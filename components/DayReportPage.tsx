"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Building2,
  Calendar,
  Download,
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Users,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";

interface ProductIPV {
  nombre: string;
  PC: number; // Precio Compra
  PV: number; // Precio Venta
  I: number; // Inventario inicial
  E: number; // Entradas
  M: number; // Movimientos/Ajustes
  R: number; // Restante
  V: number; // Vendido
  T: number; // Total vendido (ingresos)
  G: number; // Ganancia
}

interface StockLocation {
  id: string;
  name: string;
  isActive: boolean;
}

interface IPVReport {
  date: string;
  shiftAuthors: string[];
  shiftManagers: string[];
  products: ProductIPV[];
  total: {
    totalCashAmount: number;
    totalTransferAmount: number;
  };
  stockLocation: StockLocation;
}

export default function DayReportPage() {
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [reports, setReports] = useState<Record<string, IPVReport>>({});
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);
  const [loadingLocations, setLoadingLocations] = useState(true);

  // Estados para el resumen consolidado
  const [consolidatedData, setConsolidatedData] = useState<{
    totalRevenue: number;
    totalProfit: number;
    totalCash: number;
    totalTransfer: number;
    totalProductsSold: number;
    allProducts: Map<string, ProductIPV>;
  }>({
    totalRevenue: 0,
    totalProfit: 0,
    totalCash: 0,
    totalTransfer: 0,
    totalProductsSold: 0,
    allProducts: new Map(),
  });

  // Cargar ubicaciones de stock al montar el componente
  useEffect(() => {
    fetchStockLocations();
  }, []);

  // Generar reporte cuando cambia la fecha
  useEffect(() => {
    if (stockLocations.length > 0) {
      generateAllReports();
    }
  }, [selectedDate, stockLocations]);

  const fetchStockLocations = async () => {
    try {
      const response = await fetch("/api/stockLocation", {
        headers: {
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });

      if (!response.ok) throw new Error("Error al cargar ubicaciones");

      const data = await response.json();
      setStockLocations(
        data.stockLocations.filter((loc: StockLocation) => loc.isActive)
      );
    } catch (error) {
      console.error("Error fetching stock locations:", error);
      toast.error("Error al cargar las ubicaciones de stock");
    } finally {
      setLoadingLocations(false);
    }
  };

  const generateAllReports = async () => {
    if (stockLocations.length === 0) return;

    setLoading(true);
    const newReports: Record<string, IPVReport> = {};

    try {
      // Ejecutar todas las consultas en paralelo
      const reportPromises = stockLocations.map(async (location) => {
        try {
          const response = await fetch(
            `/api/ipv?locationId=${location.id}&date=${selectedDate}`,
            {
              headers: {
                "x-internal-access":
                  process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
              },
            }
          );

          if (!response.ok) {
            throw new Error(
              `Error en ${location.name}: ${response.statusText}`
            );
          }

          const data = await response.json();
          return { locationId: location.id, data };
        } catch (error) {
          console.error(`Error fetching report for ${location.name}:`, error);
          toast.error(`Error al cargar reporte de ${location.name}`);
          return { locationId: location.id, data: null };
        }
      });

      const results = await Promise.all(reportPromises);

      // Procesar resultados
      results.forEach(({ locationId, data }) => {
        if (data) {
          newReports[locationId] = data;
        }
      });

      setReports(newReports);
      consolidateData(newReports);
      toast.success(
        `Reportes generados para ${Object.keys(newReports).length} ubicaciones`
      );
    } catch (error) {
      console.error("Error generating reports:", error);
      toast.error("Error al generar los reportes");
    } finally {
      setLoading(false);
    }
  };

  const consolidateData = (allReports: Record<string, IPVReport>) => {
    let totalRevenue = 0;
    let totalProfit = 0;
    let totalCash = 0;
    let totalTransfer = 0;
    let totalProductsSold = 0;
    const allProducts = new Map<string, ProductIPV>();

    Object.values(allReports).forEach((report) => {
      // Sumar totales
      totalCash += report.total.totalCashAmount;
      totalTransfer += report.total.totalTransferAmount;

      // Consolidar productos
      report.products.forEach((product) => {
        const key = product.nombre;

        if (allProducts.has(key)) {
          const existing = allProducts.get(key)!;
          allProducts.set(key, {
            nombre: product.nombre,
            PC: (existing.PC + product.PC) / 2, // Promedio de precios de compra
            PV: (existing.PV + product.PV) / 2, // Promedio de precios de venta
            I: existing.I + product.I, // Sumar inventario inicial
            E: existing.E + product.E, // Sumar entradas
            M: existing.M + product.M, // Sumar movimientos
            R: existing.R + product.R, // Sumar restante
            V: existing.V + product.V, // Sumar vendido
            T: existing.T + product.T, // Sumar total vendido
            G: existing.G + product.G, // Sumar ganancia
          });
        } else {
          allProducts.set(key, { ...product });
        }

        totalRevenue += product.T;
        totalProfit += product.G;
        totalProductsSold += product.V;
      });
    });

    setConsolidatedData({
      totalRevenue,
      totalProfit,
      totalCash,
      totalTransfer,
      totalProductsSold,
      allProducts,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-DO", {
      style: "currency",
      currency: "DOP",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const exportToCSV = () => {
    const consolidatedProducts = Array.from(
      consolidatedData.allProducts.values()
    );

    const headers = [
      "Producto",
      "Precio Compra",
      "Precio Venta",
      "Inventario Inicial",
      "Entradas",
      "Movimientos",
      "Restante",
      "Vendido",
      "Total Vendido",
      "Ganancia",
    ];

    const csvContent = [
      headers.join(","),
      ...consolidatedProducts.map((product) =>
        [
          `"${product.nombre}"`,
          product.PC,
          product.PV,
          product.I,
          product.E,
          product.M,
          product.R,
          product.V,
          product.T,
          product.G,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-consolidado-${selectedDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loadingLocations) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-lg">Cargando ubicaciones...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reporte Consolidado del Día</h1>
          <p className="text-muted-foreground">
            IPV de todos los almacenes -{" "}
            {new Date(selectedDate).toLocaleDateString("es-DO")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto"
            />
          </div>
          <Button
            onClick={generateAllReports}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Actualizar
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs Consolidados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ingresos Totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(consolidatedData.totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Efectivo: {formatCurrency(consolidatedData.totalCash)} |
              Transferencia: {formatCurrency(consolidatedData.totalTransfer)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ganancia Total
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(consolidatedData.totalProfit)}
            </div>
            <p className="text-xs text-muted-foreground">
              Margen:{" "}
              {consolidatedData.totalRevenue > 0
                ? (
                    (consolidatedData.totalProfit /
                      consolidatedData.totalRevenue) *
                    100
                  ).toFixed(1)
                : 0}
              %
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Productos Vendidos
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {consolidatedData.totalProductsSold}
            </div>
            <p className="text-xs text-muted-foreground">
              {consolidatedData.allProducts.size} productos únicos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Almacenes Activos
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(reports).length}
            </div>
            <p className="text-xs text-muted-foreground">
              de {stockLocations.length} disponibles
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para ver datos */}
      <Tabs defaultValue="consolidated" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="consolidated">Vista Consolidada</TabsTrigger>
          <TabsTrigger value="by-location">Por Almacén</TabsTrigger>
          <TabsTrigger value="summary">Resumen Ejecutivo</TabsTrigger>
        </TabsList>

        {/* Vista Consolidada */}
        <TabsContent value="consolidated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Productos Consolidados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">P. Compra</TableHead>
                      <TableHead className="text-right">P. Venta</TableHead>
                      <TableHead className="text-right">Inicial</TableHead>
                      <TableHead className="text-right">Entradas</TableHead>
                      <TableHead className="text-right">Vendido</TableHead>
                      <TableHead className="text-right">Restante</TableHead>
                      <TableHead className="text-right">Ingresos</TableHead>
                      <TableHead className="text-right">Ganancia</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.from(consolidatedData.allProducts.values())
                      .sort((a, b) => b.T - a.T) // Ordenar por ingresos
                      .map((product) => (
                        <TableRow key={product.nombre}>
                          <TableCell className="font-medium">
                            {product.nombre}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.PC)}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(product.PV)}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.I}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.E}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.V}
                          </TableCell>
                          <TableCell className="text-right">
                            {product.R}
                          </TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            {formatCurrency(product.T)}
                          </TableCell>
                          <TableCell className="text-right text-blue-600 font-medium">
                            {formatCurrency(product.G)}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vista por Almacén */}
        <TabsContent value="by-location" className="space-y-4">
          {stockLocations.map((location) => {
            const report = reports[location.id];
            if (!report) {
              return (
                <Card key={location.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {location.name}
                      <Badge variant="secondary">Sin datos</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      No se pudieron cargar los datos para este almacén.
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Card key={location.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      {location.name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {formatCurrency(
                          report.total.totalCashAmount +
                            report.total.totalTransferAmount
                        )}
                      </Badge>
                      <Badge variant="secondary">
                        {report.products.reduce((acc, p) => acc + p.V, 0)}{" "}
                        vendidos
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Efectivo</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatCurrency(report.total.totalCashAmount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Transferencia
                      </p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatCurrency(report.total.totalTransferAmount)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Personal</p>
                      <p className="text-sm">
                        {[...report.shiftAuthors, ...report.shiftManagers].join(
                          ", "
                        ) || "N/A"}
                      </p>
                    </div>
                  </div>

                  {/* Top 5 productos por ingresos */}
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Top Productos</TableHead>
                          <TableHead className="text-right">Vendido</TableHead>
                          <TableHead className="text-right">Ingresos</TableHead>
                          <TableHead className="text-right">Ganancia</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.products
                          .sort((a, b) => b.T - a.T)
                          .slice(0, 5)
                          .map((product, index) => (
                            <TableRow key={`${location.id}-${product.nombre}`}>
                              <TableCell className="font-medium">
                                #{index + 1} {product.nombre}
                              </TableCell>
                              <TableCell className="text-right">
                                {product.V}
                              </TableCell>
                              <TableCell className="text-right text-green-600">
                                {formatCurrency(product.T)}
                              </TableCell>
                              <TableCell className="text-right text-blue-600">
                                {formatCurrency(product.G)}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        {/* Resumen Ejecutivo */}
        <TabsContent value="summary" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Rendimiento por Almacén</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stockLocations.map((location) => {
                    const report = reports[location.id];
                    if (!report) return null;

                    const totalRevenue =
                      report.total.totalCashAmount +
                      report.total.totalTransferAmount;
                    const totalProfit = report.products.reduce(
                      (acc, p) => acc + p.G,
                      0
                    );

                    return (
                      <div
                        key={location.id}
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{location.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {report.products.reduce((acc, p) => acc + p.V, 0)}{" "}
                            productos vendidos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(totalRevenue)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Ganancia: {formatCurrency(totalProfit)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top 10 Productos Globales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Array.from(consolidatedData.allProducts.values())
                    .sort((a, b) => b.T - a.T)
                    .slice(0, 10)
                    .map((product, index) => (
                      <div
                        key={product.nombre}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="w-8 h-8 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium text-sm">
                              {product.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {product.V} vendidos
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-sm">
                            {formatCurrency(product.T)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrency(product.G)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
