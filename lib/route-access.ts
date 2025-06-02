import { Role } from "./models/role";

export const frontendAccess: Record<string, Role[]> = {
  "/ipv": ["admin", "dependiente"],
  "/products": ["admin", "dependiente",],
  "/products/[id]": ["admin", "dependiente", ],
  "/products/new": ["admin", "dependiente"],
  "/adjustment": ["admin", "dependiente"],
  
  // * Admin ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  //   "/register": ["admin"],
  "/purchase": ["admin", ],
  "/setup": ["admin"],
  "/users/new": ["admin"],
  "/admin/user": ["admin"],
  "/admin/warehouse": ["admin"],
  
  // * No protegidas ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  "/": [],
  "/login": [],
};

export const backendAccess: Record<string, Role[]> = {
  "/api/adjustment": ["admin", "dependiente"],
  "/api/ipv": ["admin", "dependiente"],
  "/api/sales": ["admin", "dependiente"],
  "/api/shift": ["admin", "dependiente"],
  "/api/stockLocation": ["admin", "dependiente"],
  "/api/paymentMethod": ["admin", "dependiente"],

  // * Admin ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  "/api/purchase": ["admin", ],
  "/api/transfer-location": ["admin"],
  "/api/user": ["admin"],
  "/api/warehouse-stock": ["admin"],
  
  // * No protegidas ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
  "/api/products": [], //! no se protege porque se debe poder listar los productos pero debería protegerse
  "/api/auth": [],
};
