import { Role } from "./models/role";

export const frontendAccess: Record<string, Role[]> = {
  "/admin/user": ["admin"],
  "/admin/warehouse": ["admin"],
  "/ipv": ["admin", "dependiente"],
  "/products": ["admin", "dependiente",],
  "/products/[id]": ["admin", "dependiente", ],
  "/products/new": ["admin", "dependiente"],
  "/purchase": ["admin", ],
//   "/register": ["admin"],
  "/setup": ["admin"],
  "/users/new": ["admin"],
  
  // * No protegidas ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  "/": [],
  "/login": [],
};

export const backendAccess: Record<string, Role[]> = {
  "/api/adjustment": ["admin", "dependiente"],
  "/api/ipv": ["admin", "dependiente"],
  "/api/paymentMethod": ["admin"],
  "/api/purchase": ["admin", ],
  "/api/sales": ["admin", "dependiente"],
  "/api/shift": ["admin", "dependiente"],
  "/api/stockLocation": ["admin"],
  "/api/transfer-location": ["admin"],
  "/api/user": ["admin"],
  "/api/warehouse-stock": ["admin"],
  
  // * No protegidas ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  "/api/products": [], //! no se protege porque se debe poder listar los productos pero debería protegerse
  "/api/auth": [],
};
