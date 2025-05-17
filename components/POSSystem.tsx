"use client";

import { useState, useEffect } from "react";
import { Search, ShoppingCart, Plus, Minus, X, CreditCard } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import Image from "next/image";
import { Product, ProductCard } from "@/components/productCard";

interface ItemCarrito extends Product {
  cantidad: number;
}

export default function POSSystem() {
  // Estados
  const [productos, setProductos] = useState<Product[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [cantidadPagada, setCantidadPagada] = useState<string>("");
  const [vuelto, setVuelto] = useState<number>(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Obtener productos desde la API
  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      try {
        const res = await fetch("/api/products?page=1");
        if (!res.ok) throw new Error("Error al obtener productos");
        const data = await res.json();
        setProductos(data.products);
      } catch (error) {
        setProductos([]);
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  // Filtrar productos según la búsqueda
  const productosFiltrados = productos.filter((producto) =>
    producto.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular total
  const total = carrito.reduce(
    (sum, item) => sum + item.salePrice * item.cantidad,
    0
  );

  // Calcular vuelto cuando cambia la cantidad pagada o el total
  useEffect(() => {
    const pagado = Number.parseFloat(cantidadPagada) || 0;
    setVuelto(pagado > total ? pagado - total : 0);
  }, [cantidadPagada, total]);

  // Agregar producto al carrito
  const agregarAlCarrito = (producto: Product) => {
    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find((item) => item.id === producto.id);

      if (itemExistente) {
        return prevCarrito.map((item) =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        );
      } else {
        return [...prevCarrito, { ...producto, cantidad: 1 }];
      }
    });
  };

  // Actualizar cantidad de un producto en el carrito
  const actualizarCantidad = (id: number, cantidad: number) => {
    setCarrito((prevCarrito) => {
      if (cantidad <= 0) {
        return prevCarrito.filter((item) => item.id !== id);
      }

      return prevCarrito.map((item) =>
        item.id === id ? { ...item, cantidad } : item
      );
    });
  };

  // Eliminar producto del carrito
  const eliminarDelCarrito = (id: number) => {
    setCarrito((prevCarrito) => prevCarrito.filter((item) => item.id !== id));
  };

  // Limpiar carrito
  const limpiarCarrito = () => {
    setCarrito([]);
    setCantidadPagada("");
    setVuelto(0);
  };

  return (
    <div className="flex h-screen flex-col px-8 mt-6">
      {/* Barra superior */}
      <header className="border-b bg-background p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
{/*             <Image
              src="/5ta_cosmetics.jpg"
              alt="Logo 5ta Cosmetics"
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
            <h1 className="text-2xl font-bold">Sistema POS</h1> */}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                className="pl-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative">
                  <ShoppingCart className="h-5 w-5" />
                  {carrito.length > 0 && (
                    <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Carrito de Compra</SheetTitle>
                  <SheetDescription>
                    Productos seleccionados para la venta actual
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex h-[calc(100vh-12rem)] flex-col justify-between">
                  <ScrollArea className="flex-1 pr-4">
                    {carrito.length === 0 ? (
                      <div className="flex h-40 items-center justify-center text-muted-foreground">
                        El carrito está vacío
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {carrito.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={item.imageName || "/placeholder.svg"}
                                alt={item.name}
                                className="h-12 w-12 rounded-md object-cover"
                              />
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  ${item.salePrice.toFixed(2)} x {item.cantidad}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  actualizarCantidad(item.id, item.cantidad - 1)
                                }
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="w-8 text-center">
                                {item.cantidad}
                              </span>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  actualizarCantidad(item.id, item.cantidad + 1)
                                }
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => eliminarDelCarrito(item.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="mt-4 space-y-4">
                    <Separator />
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="pago" className="text-sm font-medium">
                        Cantidad pagada:
                      </label>
                      <Input
                        id="pago"
                        type="number"
                        min="0"
                        step="0.01"
                        value={cantidadPagada}
                        onChange={(e) => setCantidadPagada(e.target.value)}
                        placeholder="Ingrese el monto recibido"
                      />
                    </div>

                    {Number.parseFloat(cantidadPagada) > 0 && (
                      <div className="rounded-lg bg-muted p-4">
                        <div className="flex justify-between text-sm">
                          <span>Pagado:</span>
                          <span>
                            $
                            {Number.parseFloat(cantidadPagada).toFixed(2) ||
                              "0.00"}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Total:</span>
                          <span>${total.toFixed(2)}</span>
                        </div>
                        <Separator className="my-2" />
                        <div className="flex justify-between font-bold">
                          <span>Vuelto:</span>
                          <span>${vuelto.toFixed(2)}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => {
                          limpiarCarrito();
                          setSheetOpen(false);
                        }}
                        disabled={
                          carrito.length === 0 ||
                          Number.parseFloat(cantidadPagada) < total
                        }
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Finalizar Venta
                      </Button>
                      <Button
                        variant="outline"
                        onClick={limpiarCarrito}
                        disabled={carrito.length === 0}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Contenido principal - Listado de productos */}
      <main className="flex-1 overflow-auto p-4">
        <h2 className="mb-4 text-xl font-semibold">Productos</h2>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-600">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {productosFiltrados.map((product) => {
              const enCarrito = carrito.find((item) => item.id === product.id);
              return (
                <div key={product.id} className="relative">
                  {enCarrito && enCarrito.cantidad > 0 && (
                    <span className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow">
                      {enCarrito.cantidad}
                    </span>
                  )}
                  <ProductCard product={product} onSelect={agregarAlCarrito} />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
