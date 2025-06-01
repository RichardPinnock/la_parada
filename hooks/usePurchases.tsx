import { useState, useEffect } from "react";

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

interface Purchase {
  id: string;
  userId: string;
  total: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
  };
  items?: PurchaseItem[];
}

interface UsePurchasesOptions {
  search?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
  includeItems?: boolean;
  includeUser?: boolean;
}

interface UsePurchasesReturn {
  purchases: Purchase[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null;
  refetch: () => Promise<void>;
}

export function usePurchases(
  options: UsePurchasesOptions = {}
): UsePurchasesReturn {
  const {
    search = "",
    page = 1,
    limit = 10,
    autoFetch = true,
    includeItems = false,
    includeUser = false,
  } = options;

  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const fetchPurchases = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(includeItems && { includeItems: "true" }),
        ...(includeUser && { includeUser: "true" }),
      });

      const response = await fetch(`/api/purchase?${params}`);

      if (!response.ok) {
        throw new Error("Error al obtener las compras");
      }

      const data = await response.json();

      // Si la API actual no devuelve paginación, adaptamos la respuesta
      if (Array.isArray(data)) {
        setPurchases(data);
        setPagination({
          total: data.length,
          page: 1,
          limit: data.length,
          totalPages: 1,
        });
      } else {
        setPurchases(data.purchases || []);
        setPagination(data.pagination || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPurchases([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPurchases();
    }
  }, [search, page, limit, autoFetch, includeItems, includeUser]);

  return {
    purchases,
    loading,
    error,
    pagination,
    refetch: fetchPurchases,
  };
}

// Hook simplificado para obtener todas las compras
export function useAllPurchases() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPurchases = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/purchase");

      if (!response.ok) {
        throw new Error("Error al obtener las compras");
      }

      const data = await response.json();
      setPurchases(Array.isArray(data) ? data : data.purchases || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setPurchases([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllPurchases();
  }, []);

  return {
    purchases,
    loading,
    error,
    refetch: fetchAllPurchases,
  };
}

// Hook para crear una nueva compra
export function useCreatePurchase() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPurchase = async (purchaseData: {
    userId: string;
    total: number;
    locationId: string;
    items: { productId: string; quantity: number; unitPrice: number }[];
  }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la compra");
      }

      const newPurchase = await response.json();
      return newPurchase;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Error desconocido";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createPurchase,
    loading,
    error,
  };
}
