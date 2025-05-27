"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Edit } from "lucide-react";

import ModalStockLocation from "@/components/modals/modal-stock-location";

interface StockLocation {
  id: string;
  name: string;
  isActive: boolean;
}

export const dynamic = "force-dynamic";

const Page = () => {
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get("page") || "1");

  const [data, setData] = useState<StockLocation[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockLocation>({
    id: "",
    name: "",
    isActive: true,
  });

  const handleOpen = (data?: any) => {

    if (data) {
      setSelectedItem({ id: data.id, name: data.name, isActive: data.isActive });
    } else {
      setSelectedItem({ id: "", name: "", isActive: true });
    }
    setShowModal(true);
  };
  const handleClose = () => setShowModal(false);

  const handleSubmit = (data: { name: string; isActive: boolean }) => {
    // Aquí puedes hacer lo que quieras con los datos (ej: enviar a la API)
    console.log("Datos enviados:", data);
    setShowModal(false);
  };

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/stockLocation?page=${page}`);
        if (!res.ok) throw new Error("Failed to fetch stock locations");
        const result = await res.json();
        setData(result.stockLocations);
        setTotalPages(result.totalPages);
      } catch (error) {
        console.log("Error fetching stock locations:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [page]);

  const handleCheck =
    (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const newItems = [...data];
      newItems[index].isActive = event.target.checked;
      setData(newItems);
      console.log(newItems[index].name, newItems[index].isActive);
    };

  return (
    <>
      {isLoading ? (
        <div className="flex items-center justify-center space-x-2 min-h-[200px]">
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center p-8">
            <h1 className="text-2xl font-bold mb-4">Locales</h1>
            <button
              onClick={handleOpen}
              className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors font-semibold"
            >
              Registrar local
            </button>
          </div>
          {showModal && (
            <ModalStockLocation initialData={selectedItem} onClose={handleClose} onSubmit={handleSubmit} />
          )}

          {data.length === 0 ? (
            <div className="min-h-screen flex items-center justify-center">
              <p className="text-gray-600 text-center font-bold text-3xl">
                No hay locales de stock disponibles.
              </p>
            </div>
          ) : (
            <div className="p-8">
              <div className="mb-2 p-2 bg-gray-50 rounded-md">
                <div className="max-h-46 overflow-x-auto">
                  <table className="min-w-full divide-y-2 divide-gray-200">
                    <thead className="sticky top-0 bg-white ltr:text-left rtl:text-right">
                      <tr className="*:font-medium *:text-gray-900">
                        <th className="px-3 py-2 whitespace-nowrap">Nombre</th>
                        <th className="px-3 py-2 whitespace-nowrap">Estado</th>
                        <th className="px-3 py-2 whitespace-nowrap">Editar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {data.map((item, idx) => (
                        <tr
                          key={item.name}
                          className="*:text-gray-900 *:first:font-medium"
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            {item.name}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <input
                              type="checkbox"
                              checked={item.isActive}
                              onChange={handleCheck(idx)}
                            />
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-center">
                            <button
                              onClick={() => handleOpen(item)}
                              className="px-2 py-1 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Page;
