export interface Product {
  id: number;
  name: string;
  salePrice: number;
  imageName: string;
  stock?: number;
  isActive?: boolean;
  notes?: string;
  purchasePrice: number;
  warehouseStocks: WarehouseStocks[];
}
interface WarehouseStocks {
  id:         string;
  productId:  number;
  locationId: string;
  quantity:   number;
  location:   Location;
}

interface Location {
  id:   string;
  name: string;
}