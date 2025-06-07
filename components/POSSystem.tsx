"use client";

import { CreditCard, Minus, Plus, Search, ShoppingCart, X } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { ProductCard } from "@/components/productCard";
import { useAllStockLocations } from "@/hooks/useStockLocations";
import { Product } from "@/lib/models/products";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { getSalePrice } from "@/lib/utils";

interface ItemCarrito extends Product {
  cantidad: number;
}

export default function POSSystem() {
  const { stockLocations, error } = useAllStockLocations();
  const { data: session } = useSession();

  const username = session?.user?.name || "Invitado";
  const userId = session?.user?.id || "";
  const role = session?.user?.role || "";
  // Estados
  const [productos, setProductos] = useState<Product[]>([]); //! PLP
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]); //! PLP
  const [busqueda, setBusqueda] = useState(""); //! PLP
  const [cantidadPagada, setCantidadPagada] = useState<string>(""); //! PLP
  const [vuelto, setVuelto] = useState<number>(0); //! PLP
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invalidQuantity, setInvalidQuantity] = useState<boolean>(false);
  const [inputQuantities, setInputQuantities] = useState<
    Record<number, string>
  >({});
  const [sendSale, setSendSale] = useState<boolean>(false);
  const [saleError, setSaleError] = useState<string | null>(null); // Nuevo estado para errores

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<string>("");
  const [transferCode, setTransferCode] = useState<string>("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products?page=1&limit=5000", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!res.ok) throw new Error("Error al obtener productos");
      const data = await res.json();
      setProductos(data.products);
    } catch (error) {
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar productos según la búsqueda
  const productosFiltrados = productos.filter((producto) =>
    producto.name.toLowerCase().includes(busqueda.toLowerCase())
  );

  // Calcular total
  const total = carrito.reduce(
    // (sum, item) => sum + item.salePrice * item.cantidad,
    (sum, item) => sum + getSalePrice(item) * item.cantidad,
    0
  );

  // Función para validar el carrito
  const validateCarrito = () => {
    // Verifica si algún producto tiene una cantidad menor o igual a 0
    const hasInvalidQuantity = carrito.some(
      (item) => item.warehouseStocks[0].quantity < item.cantidad
    );
    console.log("tieneCantidadInvalida", hasInvalidQuantity);

    setInvalidQuantity(hasInvalidQuantity);
  };

  // Llamada a la validación cada vez que cambia el carrito
  useEffect(() => {
    validateCarrito();
  }, [total]);

  // Calcular vuelto cuando cambia la cantidad pagada o el total
  useEffect(() => {
    const pagado = Number.parseFloat(cantidadPagada) || 0;
    setVuelto(pagado !== 0 ? pagado - total : 0);
  }, [cantidadPagada, total]);

  useEffect(() => {
    if (selectedPaymentMethod === "transferencia") {
      setCantidadPagada(total.toFixed(2));
    } else {
      setCantidadPagada("");
    }
  }, [selectedPaymentMethod, total]);

  // Agregar producto al carrito
  const agregarAlCarrito = (producto: Product) => {
    if (role != "dependiente") {
      if (role == "admin") {
        toast.error(
          "Los administradores no pueden realizar ventas, por favor, inicie sesión con un usuario dependiente"
        );
        return;
      }
      toast.error("No tienes permiso para agregar productos al carrito");
      return;
    }
    setCarrito((prevCarrito) => {
      const itemExistente = prevCarrito.find((item) => {
        if (
          item.id === producto.id &&
          item.warehouseStocks[0].quantity >= item.cantidad
        ) {
          return true;
        }
      });

      if (itemExistente) {
        if (
          itemExistente.warehouseStocks[0].quantity > itemExistente.cantidad
        ) {
          // Se incrementa la cantidad
          return prevCarrito.map((item) =>
            item.id === producto.id
              ? { ...item, cantidad: item.cantidad + 1 }
              : item
          );
        } else {
          // No hay suficiente stock para incrementar, mostramos error y retornamos el carrito sin cambios
          toast.error(`No hay suficiente stock para ${producto.name}`);
          return prevCarrito;
        }
      } else {
        // Verificar si hay stock disponible
        if (
          producto.warehouseStocks.length < 1 ||
          producto.warehouseStocks[0].quantity <= 0
        ) {
          toast.error(`No hay stock disponible para ${producto.name}`);
          return prevCarrito;
        }
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

  const finalizeSale = async () => {
    console.log("Finalizando venta...");
    setSendSale(true);
    setSaleError(null); // Limpiar errores previos

    if (
      carrito.length > 0 &&
      Number.parseFloat(cantidadPagada) >= total &&
      userId
    ) {
      const items = carrito.map((item) => ({
        productId: item.id,
        quantity: item.cantidad,
        // unitPrice: item.salePrice,
        unitPrice: getSalePrice(item),
      }));

      const saleData = {
        userId,
        items,
        total,
        paymentMethodName: selectedPaymentMethod,
        ...(selectedPaymentMethod === "transferencia" && {
          transferCode: transferCode.trim(),
        }),
      };
      console.log("enviando datos de la venta:", saleData);

      try {
        const response = await fetch("/api/sales", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-access":
              process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
          },
          body: JSON.stringify(saleData),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          // Manejar errores de la API
          const errorMessage =
            data.error || `Error ${response.status}: ${response.statusText}`;
          setSaleError(errorMessage);
          toast.error("Error al registrar la venta: " + errorMessage);
          console.log("Error al crear la venta:", errorMessage);
        } else {
          // Venta exitosa
          console.log("Venta creada exitosamente:", data);
          toast.success("Venta registrada exitosamente");
          limpiarCarrito();
          setSheetOpen(false);
          fetchProducts();
          setSelectedPaymentMethod(""); // Reset payment method
          setTransferCode(""); // Reset transfer code
        }
      } catch (error) {
        // Manejar errores de red o parsing
        const errorMessage =
          error instanceof Error ? error.message : "Error de conexión";
        setSaleError(errorMessage);
        toast.error("Error al procesar la venta: " + errorMessage);
        console.log("Error al procesar la venta:", error);
      }
    } else {
      // Validaciones fallidas
      setSaleError("Debe completar todos los campos para finalizar la venta.");
      toast.error("Debe completar todos los campos para finalizar la venta.");
      console.log(
        "No se puede finalizar la venta: carrito vacío o monto insuficiente o usuario no logueado."
      );
    }

    setSendSale(false);
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
            <div className="relative max-w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-8 pr-8"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
              {busqueda && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-gray-100"
                  onClick={() => setBusqueda("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="relative group">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute bottom-full left-1/2 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white group-hover:block">
                    Registrar Venta
                  </span>
                  {carrito.length > 0 && (
                    <Badge className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                      {carrito.reduce((sum, item) => sum + item.cantidad, 0)}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Carrito de Venta</SheetTitle>
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
                          <div key={item.id} className="flex flex-col">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.imageName || "/placeholder.svg"}
                                  alt={item.name}
                                  className="h-12 w-12 rounded-md object-cover"
                                />
                                <div>
                                  <p className="font-medium">{item.name}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {/* ${item.salePrice.toFixed(2)} x{" "} */}
                                    ${getSalePrice(item).toFixed(2)} x{" "}
                                    {item.cantidad}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    actualizarCantidad(
                                      item.id,
                                      item.cantidad - 1
                                    )
                                  }
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  pattern="[0-9]*"
                                  value={
                                    inputQuantities[item.id] !== undefined
                                      ? inputQuantities[item.id]
                                      : item.cantidad.toString()
                                  }
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    // Permite que el usuario borre completamente el input para escribir
                                    setInputQuantities((prev) => ({
                                      ...prev,
                                      [item.id]: value,
                                    }));
                                  }}
                                  onBlur={(e) => {
                                    const value = e.target.value;
                                    if (value === "" || Number(value) < 1) {
                                      // Si se borra el valor o es menor que 1, se elimina el producto del carrito
                                      actualizarCantidad(item.id, 0);
                                      setInputQuantities((prev) => {
                                        const newState = { ...prev };
                                        delete newState[item.id];
                                        return newState;
                                      });
                                    } else {
                                      // Sino, se actualiza la cantidad
                                      const newQuantity = Number(value);
                                      actualizarCantidad(item.id, newQuantity);
                                      setInputQuantities((prev) => ({
                                        ...prev,
                                        [item.id]: newQuantity.toString(),
                                      }));
                                    }
                                  }}
                                  className="w-14 text-center border rounded px-1 py-0.5"
                                />
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    actualizarCantidad(
                                      item.id,
                                      item.cantidad + 1
                                    )
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
                            {item.cantidad >
                              item.warehouseStocks[0].quantity && (
                              <span className="mt-1 text-xs text-red-500">
                                Se ha excedido la cantidad disponible
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>

                  <div className="mt-2 space-y-4">
                    <Separator />
                    <div className="flex justify-between text-lg font-medium">
                      <span>Total a pagar:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>

                    {/* Método de pago */}
                    <div className="space-y-2">
                      <label
                        htmlFor="metodo-pago"
                        className="text-sm font-medium"
                      >
                        Método de pago:
                      </label>
                      <Select
                        value={selectedPaymentMethod}
                        onValueChange={setSelectedPaymentMethod}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione método de pago" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="efectivo">Efectivo</SelectItem>
                          <SelectItem value="transferencia">
                            Transferencia
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {selectedPaymentMethod === "transferencia" && (
                      <div className="space-y-2">
                        <label
                          htmlFor="codigo-transferencia"
                          className="text-sm font-medium"
                        >
                          Código de transferencia:
                        </label>
                        <Input
                          id="codigo-transferencia"
                          type="text"
                          value={transferCode}
                          onChange={(e) =>
                            setTransferCode(e.target.value.toUpperCase())
                          }
                          placeholder="Ej: MM502J9UIP987"
                          className="uppercase"
                          maxLength={15}
                        />
                        <p className="text-xs text-gray-500">
                          Formato: MM502J9UIP987
                        </p>
                      </div>
                    )}

                    {selectedPaymentMethod !== "transferencia" && (
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
                    )}

                    {Number.parseFloat(cantidadPagada) > 0 &&
                      selectedPaymentMethod !== "transferencia" && (
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
                            <span className={vuelto < 0 ? "text-red-500" : ""}>
                              ${vuelto.toFixed(2)}
                            </span>
                          </div>
                          {username === "Invitado" && (
                            <span className="text-red-500 text-xs">
                              Inicie sesión para registrar la venta
                            </span>
                          )}
                        </div>
                      )}

                    <div className="mt-2 space-y-4">
                      {saleError && (
                        <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-destructive flex items-center justify-center">
                              <X className="w-3 h-3 text-white" />
                            </div>
                            <p className="text-sm text-destructive font-medium">
                              Error al procesar venta
                            </p>
                          </div>
                          <p className="text-xs text-destructive/80 mt-1 ml-6">
                            {saleError}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSaleError(null)}
                            className="mt-2 h-6 px-2 text-xs text-destructive hover:text-destructive"
                          >
                            Cerrar
                          </Button>
                        </div>
                      )}

                      <div className="flex gap-2 mb-6">
                        <Button
                          className="flex-1"
                          onClick={finalizeSale}
                          disabled={
                            carrito.length === 0 ||
                            Number.parseFloat(cantidadPagada) < total ||
                            Number.parseFloat(cantidadPagada) <= 0 ||
                            cantidadPagada === "" ||
                            username === "Invitado" ||
                            selectedPaymentMethod === "" ||
                            (selectedPaymentMethod === "transferencia" &&
                              transferCode === "") ||
                            sendSale ||
                            invalidQuantity ||
                            role == "admin"
                          }
                        >
                          {sendSale ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <CreditCard className="mr-2 h-4 w-4" />
                              Finalizar Venta
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            limpiarCarrito();
                            setSaleError(null); // Limpiar error al cancelar
                            setSelectedPaymentMethod(""); // Reset payment method
                            setTransferCode(""); // Reset transfer code
                          }}
                          disabled={carrito.length === 0 || sendSale}
                        >
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1 p-4">
        <h2 className="mb-4 text-xl font-semibold">Productos</h2>
        {loading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="ml-3 text-gray-600">Cargando productos...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {productosFiltrados.map((product) => {
              const enCarrito = carrito.find((item) => item.id === product.id);
              return (
                <div key={product.id} className="relative">
                  {enCarrito && enCarrito.cantidad > 0 && (
                    <span className="absolute -top-2 -right-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-white text-sm font-bold shadow">
                      {enCarrito.cantidad}
                    </span>
                  )}
                  <ProductCard
                    product={product}
                    onSelect={agregarAlCarrito}
                    stockLocations={stockLocations || []}
                    session={session}
                    refresh={fetchProducts} // Callback para refrescar datos
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
