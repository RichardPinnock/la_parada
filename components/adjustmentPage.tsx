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
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { useDebounce } from "@/hooks/debounce";

// --- Interfaces ---
export interface Adjustment {
  id: string;
  productId: number;
  quantity: number;
  reason: string;
  userId: string;
  locationId: string;
  createdAt: string;
  user: User;
  location: Location;
  product: Product;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "dependiente" | string;
  isActive: boolean;
}

export interface Location {
  id: string;
  name: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  purchasePrice: number;
  salePrice: number;
  imageName: string;
  stock: number;
  isActive: boolean;
  notes: string;
}

export default function AdjustmentsPage() {
  // Estados para ajustes, busqueda, paginación, etc.
  const [adjustments, setAdjustments] = useState<Adjustment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const debouncedSearch = useDebounce(search, 500);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Estados para la modal de detalle
  const [selectedAdjustment, setSelectedAdjustment] =
    useState<Adjustment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Función para traer ajustes desde /api/adjustment
  const fetchAdjustments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/adjustment?page=${page}&limit=5&search=${encodeURIComponent(
          search
        )}`
      );
      if (!response.ok) {
        setAdjustments([]);
        console.log('response ==>>', response);
        if (response.status === 404) {
            toast.error("No se encontraron ajustes");
            return;
        }
        throw new Error("Error al obtener los ajustes");
      }

      const res = await response.json();
      const newAdjustments: Adjustment[] = Array.isArray(res)
        ? res
        : res.data || [];

      if (page === 1) {
        setAdjustments(newAdjustments);
      } else {
        setAdjustments((prev) => [...prev, ...newAdjustments]);
      }

      setHasMore(newAdjustments.length >= 5);
    } catch (error) {
      setAdjustments([]);
      toast.error("Error al cargar los ajustes");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // Llamar a fetchAdjustments siempre que cambie la página o el debounced search
  useEffect(() => {
    fetchAdjustments();
  }, [page, debouncedSearch]);

  // useEffect para paginado infinito usando IntersectionObserver
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Historial de Ajustes</h1>

      {/* Buscador */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar ajustes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reinicia la página al cambiar la busqueda
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabla de Ajustes */}
      <Card>
        <CardHeader>
          <CardTitle>Ajustes Registrados ({adjustments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && page === 1 ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : adjustments.length === 0 ? (
            <p className="text-gray-600">No se encontraron ajustes.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Local</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>
                      {new Date(adj.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{adj.user?.name}</TableCell>
                    <TableCell>{adj.product?.name}</TableCell>
                    <TableCell>{adj.location?.name}</TableCell>
                    <TableCell>{adj.quantity}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedAdjustment(adj);
                          setShowDetailModal(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Ref para paginado infinito */}
      <div ref={loadMoreRef} className="h-4" />
      {loading && page > 1 && (
        <div className="flex justify-center py-4">
          <p>Cargando más...</p>
        </div>
      )}

      {/* Modal para ver detalle del ajuste */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle del Ajuste</DialogTitle>
            <DialogDescription>
              Información completa del ajuste registrado.
            </DialogDescription>
          </DialogHeader>
          {selectedAdjustment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Fecha</Label>
                  <p className="font-medium">
                    {new Date(selectedAdjustment.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label>Usuario</Label>
                  <p className="font-medium">{selectedAdjustment.user?.name}</p>
                </div>
                <div>
                  <Label>Producto</Label>
                  <p className="font-medium">
                    {selectedAdjustment.product?.name}
                  </p>
                </div>
                <div>
                  <Label>Local</Label>
                  <p className="font-medium">
                    {selectedAdjustment.location?.name}
                  </p>
                </div>
                <div>
                  <Label>Cantidad</Label>
                  <p className="font-medium">{selectedAdjustment.quantity}</p>
                </div>
              </div>
              <div>
                <Label>Razón</Label>
                <p className="text-gray-700">{selectedAdjustment.reason}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
