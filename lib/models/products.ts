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
  prices?: ProductPriceByLocation[];
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

export interface UpdateProductPriceInput {
  productId: number
  locationId: string
  newPrice: number
}

export interface ProductPriceByLocation {
  id: number;
  productId: number;
  locationId: string;
  salePrice: number;
  location: Location;
}