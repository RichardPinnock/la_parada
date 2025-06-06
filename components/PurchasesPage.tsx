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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Search,
  Eye,
  Trash2,
  ShoppingCart,
  Package,
  ChevronsUpDown,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useAllStockLocations } from "@/hooks/useStockLocations";
import { useDebounce } from "@/hooks/debounce";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Purchase {
  id: string;
  userId: string;
  total: number;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
  };
  items?: PurchaseItem[];
}

interface PurchaseItem {
  id: string;
  productId: number;
  quantity: number;
  unitCost: number;
  totalCost: number;
  locationId: string;
  product?: {
    id: number;
    name: string;
  };
  location?: {
    id: string;
    name: string;
  };
}

interface Product {
  id: number;
  name: string;
  purchasePrice?: number;
}

interface StockLocation {
  id: string;
  name: string;
}

interface NewPurchaseItem {
  productId: number;
  quantity: number;
  unitPrice: number;
  productName: string;
}

export default function PurchasesPage() {
  const { data: session } = useSession();
  const { stockLocations, loading: locationsLoading } = useAllStockLocations();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [productComboOpen, setProductComboOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 500);

  // Modal states
  const [showNewPurchaseModal, setShowNewPurchaseModal] = useState(false);
  const [showPurchaseDetailModal, setShowPurchaseDetailModal] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(
    null
  );

  // New purchase form states
  const [newPurchaseItems, setNewPurchaseItems] = useState<NewPurchaseItem[]>(
    []
  );
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Ref para detectar el scroll en el fondo para paginado infinito
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Fetch purchases con paginación
  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        "/api/purchase?page=" +
          page +
          "&limit=5&search=" +
          encodeURIComponent(search),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-internal-access":
              process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
          },
        }
      );
      if (!response.ok) throw new Error("Error al obtener compras");

      const data = await response.json();
      const newPurchases: Purchase[] = Array.isArray(data)
        ? data
        : data.purchases || [];

      if (page === 1) {
        setPurchases(newPurchases);
      } else {
        setPurchases((prev) => [...prev, ...newPurchases]);
      }
      if (newPurchases.length < 5) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }
    } catch (error) {
      toast.error("Error al cargar las compras");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch products
  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/products?page=1&limit=100", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });
      if (!response.ok) throw new Error("Error al obtener productos");

      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      toast.error("Error al cargar productos");
      console.error(error);
    }
  };

  useEffect(() => {
    // Cuando cambia el page o el debouncedSearch se traen las compras
    fetchPurchases();
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, []);

  // useEffect para manejar paginado infinito usando IntersectionObserver
  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setPage((prevPage) => prevPage + 1);
        }
      },
      { root: null, threshold: 1.0 }
    );
    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [loading, hasMore]);

  // Add item to new purchase
  const addItemToPurchase = () => {
    if (!selectedProductId || quantity <= 0 || unitPrice <= 0) {
      toast.error("Completa todos los campos correctamente");
      return;
    }

    const product = products.find((p) => p.id.toString() === selectedProductId);
    if (!product) return;

    const existingItemIndex = newPurchaseItems.findIndex(
      (item) => item.productId === product.id
    );

    if (existingItemIndex >= 0) {
      const updatedItems = [...newPurchaseItems];
      updatedItems[existingItemIndex].quantity += quantity;
      setNewPurchaseItems(updatedItems);
    } else {
      setNewPurchaseItems([
        ...newPurchaseItems,
        {
          productId: product.id,
          quantity,
          unitPrice,
          productName: product.name,
        },
      ]);
    }
    setSelectedProductId("");
    setQuantity(1);
    setUnitPrice(0);
  };

  // Remove item from new purchase
  const removeItemFromPurchase = (productId: number) => {
    setNewPurchaseItems(
      newPurchaseItems.filter((item) => item.productId !== productId)
    );
  };

  // Update item quantity
  const updateItemQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItemFromPurchase(productId);
      return;
    }
    setNewPurchaseItems(
      newPurchaseItems.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  // Update item price
  const updateItemPrice = (productId: number, newPrice: number) => {
    if (newPrice < 0) return;
    setNewPurchaseItems(
      newPurchaseItems.map((item) =>
        item.productId === productId ? { ...item, unitPrice: newPrice } : item
      )
    );
  };

  // Calculate total of new purchase
  const calculateTotal = () => {
    return newPurchaseItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
  };

  // Submit new purchase
  const submitPurchase = async () => {
    if (!session?.user?.id) {
      toast.error("Debes iniciar sesión");
      return;
    }
    if (newPurchaseItems.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    if (!selectedLocationId) {
      toast.error("Selecciona una ubicación de stock");
      return;
    }
    setSubmitting(true);
    try {
      const purchaseData = {
        userId: session.user.id,
        total: calculateTotal(),
        locationId: selectedLocationId,
        items: newPurchaseItems.map((item) => ({
          productId: Number(item.productId),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la compra");
      }
      toast.success("Compra registrada exitosamente");
      setShowNewPurchaseModal(false);
      resetNewPurchaseForm();
      fetchPurchases();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Error al registrar la compra"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Reset new purchase form
  const resetNewPurchaseForm = () => {
    setNewPurchaseItems([]);
    setSelectedProductId("");
    setSelectedLocationId("");
    setQuantity(1);
    setUnitPrice(0);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Modal para nueva compra */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestión de Compras</h1>
        <Dialog
          open={showNewPurchaseModal}
          onOpenChange={(open) => {
            setShowNewPurchaseModal(open);
            if (!open) resetNewPurchaseForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Compra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Nueva Compra</DialogTitle>
              <DialogDescription>
                Agrega productos y completa la información de la compra
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Location selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ubicación de Stock</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label>Seleccionar ubicación</Label>
                    <Select
                      value={selectedLocationId}
                      onValueChange={setSelectedLocationId}
                      disabled={locationsLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ubicación de stock" />
                      </SelectTrigger>
                      <SelectContent>
                        {stockLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Add product section */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Agregar Producto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Producto</Label>
                      <Popover
                        open={productComboOpen}
                        onOpenChange={setProductComboOpen}
                      >
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={productComboOpen}
                            className="w-full justify-between"
                          >
                            {selectedProductId
                              ? products.find(
                                  (product) =>
                                    product.id.toString() === selectedProductId
                                )?.name
                              : "Seleccionar prod..."}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput
                              placeholder="Buscar prod..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>
                                No se encontró ningún producto.
                              </CommandEmpty>
                              <CommandGroup>
                                {products.map((product) => (
                                  <CommandItem
                                    key={product.id}
                                    value={product.name}
                                    onSelect={(currentValue) => {
                                      const foundProduct = products.find(
                                        (p) => p.name === currentValue
                                      );
                                      setSelectedProductId(
                                        foundProduct?.id.toString() ===
                                          selectedProductId
                                          ? ""
                                          : foundProduct?.id.toString() || ""
                                      );
                                      setProductComboOpen(false);
                                    }}
                                  >
                                    {product.name}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        selectedProductId ===
                                          product.id.toString()
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        onFocus={(e) => {
                          if (e.target.value === "1") {
                            e.target.select();
                            e.target.focus();
                          }
                        }}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Precio Unitario</Label>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={unitPrice}
                        onChange={(e) => {
                          const value = e.target.value;
                          setUnitPrice(value === "" ? 0 : Number(value));
                        }}
                        onFocus={(e) => {
                          if (e.target.value === "0") {
                            e.target.select();
                          }
                        }}
                        placeholder="100"
                      />
                    </div>

                    <div className="flex items-end">
                      <Button onClick={addItemToPurchase} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Items list */}
              {newPurchaseItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Package className="w-5 h-5 mr-2" />
                      Productos ({newPurchaseItems.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {newPurchaseItems.map((item) => (
                        <div
                          key={item.productId}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <p className="font-medium">{item.productName}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Cantidad:</Label>
                                <Input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) =>
                                    updateItemQuantity(
                                      item.productId,
                                      Number(e.target.value)
                                    )
                                  }
                                  onFocus={(e) => {
                                    if (e.target.value === "1") {
                                      e.target.select();
                                      e.target.focus();
                                    }
                                  }}
                                  className="w-20 h-8"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs">Precio:</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) =>
                                    updateItemPrice(
                                      item.productId,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-24 h-8"
                                />
                              </div>
                              <div className="text-sm font-medium">
                                Total: $
                                {(item.quantity * item.unitPrice).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              removeItemFromPurchase(item.productId)
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-4" />

                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total de Compra:</span>
                      <span>${calculateTotal().toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Submit button */}
              <div className="flex gap-2">
                <Button
                  onClick={submitPurchase}
                  disabled={
                    submitting ||
                    newPurchaseItems.length === 0 ||
                    !selectedLocationId
                  }
                  className="flex-1"
                >
                  {submitting ? "Registrando..." : "Registrar Compra"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowNewPurchaseModal(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Buscador */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar compras..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              // Al cambiar la búsqueda, reiniciamos la paginación:
              setPage(1);
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla de Compras */}
      <Card>
        <CardHeader>
          <CardTitle>Compras Registradas ({purchases.length})</CardTitle>
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
                    <TableHead>ID</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="font-mono text-sm">
                        {purchase.id}
                      </TableCell>
                      <TableCell>
                        {new Date(purchase.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {purchase.user?.name || "Usuario no disponible"}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${purchase.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {purchase.items?.length || 0} productos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setShowPurchaseDetailModal(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {purchases.length === 0 && !loading && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No se encontraron compras</p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Ref para detectar el scroll y cargar más */}
      <div ref={loadMoreRef} className="h-4"></div>
      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <p>Cargando más...</p>
        </div>
      )}

      {/* Modal de detalle de compra */}
      <Dialog
        open={showPurchaseDetailModal}
        onOpenChange={setShowPurchaseDetailModal}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalle de Compra</DialogTitle>
            <DialogDescription>
              Información completa de la compra
            </DialogDescription>
          </DialogHeader>
          {selectedPurchase && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>ID de Compra</Label>
                  <p className="font-mono text-sm bg-gray-100 p-2 rounded">
                    {selectedPurchase.id}
                  </p>
                </div>
                <div>
                  <Label>Fecha</Label>
                  <p className="font-medium">
                    {new Date(selectedPurchase.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Usuario</Label>
                  <p className="font-medium">
                    {selectedPurchase.user?.name || "Usuario no disponible"}
                  </p>
                </div>
                <div>
                  <Label>Total</Label>
                  <p className="font-medium text-lg">
                    ${selectedPurchase.total.toFixed(2)}
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <Label>Productos</Label>
                {selectedPurchase.items && selectedPurchase.items.length > 0 ? (
                  <div className="mt-2 space-y-2">
                    {selectedPurchase.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {item.product?.name ||
                              `Producto ID: ${item.productId}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {item.location?.name ||
                              `Ubicación: ${item.locationId}`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {item.quantity} x ${item.unitCost.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-500">
                            = ${item.totalCost.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">
                    No hay detalles de productos disponibles
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
