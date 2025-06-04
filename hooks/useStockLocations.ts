import { useState, useEffect } from "react";

export interface StockLocation {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UseStockLocationsOptions {
  search?: string;
  page?: number;
  limit?: number;
  autoFetch?: boolean;
}

interface UseStockLocationsReturn {
  stockLocations: StockLocation[];
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

export function useStockLocations(
  options: UseStockLocationsOptions = {}
): UseStockLocationsReturn {
  const { search = "", page = 1, limit = 10, autoFetch = true } = options;

  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  } | null>(null);

  const fetchStockLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
      });

      const response = await fetch(`/api/stockLocation?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener las ubicaciones de stock");
      }

      const data = await response.json();

      setStockLocations(data.stockLocations || []);
      setPagination(data.pagination || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStockLocations([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchStockLocations();
    }
  }, [search, page, limit, autoFetch]);

  return {
    stockLocations,
    loading,
    error,
    pagination,
    refetch: fetchStockLocations,
  };
}

// Hook simplificado para obtener solo las localizaciones sin paginación
export function useAllStockLocations() {
  const [stockLocations, setStockLocations] = useState<StockLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllStockLocations = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stockLocation?limit=1000", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-internal-access":
            process.env.NEXT_PUBLIC_INTERNAL_API_SECRET ?? "",
        },
      });

      if (!response.ok) {
        throw new Error("Error al obtener las ubicaciones de stock");
      }

      const data = await response.json();
      setStockLocations(data.stockLocations || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setStockLocations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllStockLocations();
  }, []);

  return {
    stockLocations,
    loading,
    error,
    refetch: fetchAllStockLocations,
  };
}
