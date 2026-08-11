import React, { useState, useEffect } from "react";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../../components/ui/ToastContainer";
// Types
type Shop = {
  shop_id: number;
  name: string;
  description?: string;
};

type InventoryItem = {
  id: number;
  name: string;
  sku: string;
  shop_id: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  brand: {
    id: number;
    name: string;
    slug: string;
  };
  stock_qty: number;
  low_stock_threshold: number;
  available: number;
  is_published: boolean;
  active_flag: boolean;
};

type InventoryStats = {
  total_products: number;
  total_stock: number;
  low_stock_count: number;
  out_of_stock_count: number;
};

type Pagination = {
  total: number;
  current_page: number;
  per_page: number;
  pages: number;
};

type InventoryResponse = {
  products: InventoryItem[];
  pagination: Pagination;
};

// Removed unused StockSummary type

// Service layer for shop inventory management
class ShopInventoryService {
  private getApiBaseUrl(): string {
    const baseUrl =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:5110";
    return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  }

  private getAuthHeaders() {
    const token = localStorage.getItem("access_token");
    return {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    };
  }

  async getShops(): Promise<Shop[]> {
    const response = await fetch(`${this.getApiBaseUrl()}/api/shop/shops`, {
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error("Failed to fetch shops");
    }

    const data = await response.json();
    return data.shops || data.data || [];
  }

  async getInventoryStats(shopId: number): Promise<InventoryStats> {
    const response = await fetch(
      `${this.getApiBaseUrl()}/api/shop/${shopId}/inventory/stats`,
      {
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to fetch inventory stats");
    }

    return await response.json();
  }

  async getInventoryProducts(
    shopId: number,
    filters: {
      page?: number;
      per_page?: number;
      search?: string;
      category?: string;
      brand?: string;
      stock_status?: string;
    },
  ): Promise<InventoryResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(
      `${this.getApiBaseUrl()}/api/shop/${shopId}/inventory/products?${params}`,
      {
        headers: this.getAuthHeaders(),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          `Failed to fetch inventory data: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }

  async updateProductStock(
    productId: number,
    stockData: { stock_qty: number; low_stock_threshold: number },
  ): Promise<any> {
    const response = await fetch(
      `${this.getApiBaseUrl()}/api/shop/products/${productId}/stock`,
      {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: JSON.stringify(stockData),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.message ||
          `Failed to update stock: ${response.status} ${response.statusText}`,
      );
    }

    return await response.json();
  }
}

const shopInventoryService = new ShopInventoryService();

const ShopInventoryManagement: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<number | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [category, setCategory] = useState<string>("All Categories");
  const [brand, setBrand] = useState<string>("All Brands");
  const [stockStatus, setStockStatus] = useState<string>("All Stock Status");
  const [page, setPage] = useState(1);
  const [perPage] = useState(10); // setter unused

  // Edit modal
  const [editModal, setEditModal] = useState<{
    open: boolean;
    product: InventoryItem;
  } | null>(null);
  const [updating, setUpdating] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const { toasts, error: showError, warning } = useToast();
  // Fetch shops
  useEffect(() => {
    const fetchShops = async () => {
      try {
        const data = await shopInventoryService.getShops();
        setShops(data);
      } catch (error) {
        console.error("Error fetching shops:", error);
        setError("Failed to load shops");
      }
    };
    fetchShops();
  }, []);

  // Fetch inventory data when shop is selected
  useEffect(() => {
    if (selectedShopId) {
      fetchInventoryData();
      fetchInventoryStats();
    }
  }, [selectedShopId, page, perPage, search, category, brand, stockStatus]);

  const fetchInventoryData = async () => {
    if (!selectedShopId) return;

    setLoading(true);
    setError(null);

    try {
      const data = await shopInventoryService.getInventoryProducts(
        selectedShopId,
        {
          page,
          per_page: perPage,
          ...(search && { search }),
          ...(category !== "All Categories" && { category }),
          ...(brand !== "All Brands" && { brand }),
          ...(stockStatus !== "All Stock Status" && {
            stock_status: stockStatus.toLowerCase().replace(" ", "_"),
          }),
        },
      );

      setInventory(data.products || []);
    } catch (error: any) {
      console.error("Error fetching inventory:", error);
      setError(error.message || "Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStats = async () => {
    if (!selectedShopId) return;

    try {
      const data = await shopInventoryService.getInventoryStats(selectedShopId);
      setStats(data);
    } catch (error: any) {
      console.error("Error fetching inventory stats:", error);
    }
  };

  const updateProductStock = async (
    productId: number,
    stockData: { stock_qty: number; low_stock_threshold: number },
  ) => {
    setUpdating(true);
    try {
      const updatedProduct = await shopInventoryService.updateProductStock(
        productId,
        stockData,
      );

      // Update the local state
      setInventory((prev) =>
        prev.map((item) =>
          item.id === productId
            ? {
                ...item,
                stock_qty: stockData.stock_qty,
                low_stock_threshold: stockData.low_stock_threshold,
                available: stockData.stock_qty,
              }
            : item,
        ),
      );

      // Refresh stats
      fetchInventoryStats();

      return updatedProduct;
    } catch (error: any) {
      console.error("Error updating stock:", error);
      throw new Error(error.message || "Failed to update stock");
    } finally {
      setUpdating(false);
    }
  };

  // Filter categories and brands from inventory data
  const categories = [
    "All Categories",
    ...Array.from(new Set(inventory.map((item) => item.category.name))),
  ];
  const brands = [
    "All Brands",
    ...Array.from(new Set(inventory.map((item) => item.brand.name))),
  ];

  // Edit modal handlers
  const openEditModal = (product: InventoryItem) =>
    setEditModal({ open: true, product });
  const closeEditModal = () => setEditModal(null);

  const handleEditSave = async () => {
    if (!editModal) return;

    try {
      await updateProductStock(editModal.product.id, {
        stock_qty: editModal.product.stock_qty,
        low_stock_threshold: editModal.product.low_stock_threshold,
      });
      closeEditModal();
    } catch (error: any) {
      showError(error.message);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock_qty === 0) return "out of stock";
    if (item.stock_qty <= item.low_stock_threshold) return "low stock";
    return "in stock";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "out of stock":
        return "bg-red-100 text-red-700";
      case "low stock":
        return "bg-yellow-100 text-yellow-700";
      case "in stock":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // --- Export helpers ---
  const buildFilename = (ext: string) => {
    const shop = shops.find((s) => s.shop_id === selectedShopId);
    const name = shop?.name
      ? shop.name.replace(/[^a-z0-9_-]+/gi, "_")
      : `shop_${selectedShopId ?? ""}`;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    return `${name}_inventory_${ts}.${ext}`;
  };

  const exportCSV = () => {
    if (!inventory || inventory.length === 0) {
      warning("No data to export");
      return;
    }
    const headers = [
      "PRODUCT NAME",
      "SKU",
      "CATEGORY",
      "BRAND",
      "STOCK QTY",
      "AVAILABLE",
      "STATUS",
    ];
    const rows = inventory.map((item) => [
      item.name,
      item.sku,
      item.category?.name ?? "",
      item.brand?.name ?? "",
      String(item.stock_qty ?? ""),
      String(item.available ?? ""),
      getStockStatus(item),
    ]);

    // Escape CSV values
    const escapeCSV = (val: string) => {
      const needsQuotes = /[",\n]/.test(val);
      const v = val.replace(/"/g, '""');
      return needsQuotes ? `"${v}"` : v;
    };

    const lines = [headers, ...rows].map((r) =>
      r.map((c) => escapeCSV(String(c ?? ""))).join(","),
    );
    const csvContent = "\uFEFF" + lines.join("\n"); // add BOM for UTF-8
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename("csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const exportExcel = () => {
    if (!inventory || inventory.length === 0) {
      warning("No data to export");
      return;
    }
    // Build simple HTML table compatible with Excel (.xls)
    const headers = [
      "PRODUCT NAME",
      "SKU",
      "CATEGORY",
      "BRAND",
      "STOCK QTY",
      "AVAILABLE",
      "STATUS",
    ];
    const th = headers
      .map(
        (h) =>
          `<th style="text-align:left;border:1px solid #ccc;padding:4px;">${h}</th>`,
      )
      .join("");
    const trs = inventory
      .map((item) => {
        const tds = [
          item.name,
          item.sku,
          item.category?.name ?? "",
          item.brand?.name ?? "",
          String(item.stock_qty ?? ""),
          String(item.available ?? ""),
          getStockStatus(item),
        ]
          .map(
            (v) =>
              `<td style="border:1px solid #ccc;padding:4px;">${String(v ?? "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")}</td>`,
          )
          .join("");
        return `<tr>${tds}</tr>`;
      })
      .join("");

    const html = `\n      <html xmlns:x=\"urn:schemas-microsoft-com:office:excel\">\n      <head>\n        <meta charset=\"utf-8\" />\n      </head>\n      <body>\n        <table border=\"1\" style=\"border-collapse:collapse;\">\n          <thead><tr>${th}</tr></thead>\n          <tbody>${trs}</tbody>\n        </table>\n      </body>\n      </html>`;

    const blob = new Blob([html], { type: "application/vnd.ms-excel" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildFilename("xls");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Inventory Management
      </h1>

      {/* Shop selector */}
      <div className="mb-4 sm:mb-6">
        <label className="font-semibold mr-2 text-sm sm:text-base">
          Select Shop:
        </label>
        <select
          className="border rounded px-2 py-1 text-sm sm:text-base w-full sm:w-auto"
          value={selectedShopId ?? ""}
          onChange={(e) => {
            const value = e.target.value;
            if (value && value !== "") {
              const shopId = Number(value);
              if (!isNaN(shopId)) {
                setSelectedShopId(shopId);
              }
            } else {
              setSelectedShopId(null);
            }
          }}
        >
          <option value="" disabled>
            Choose a shop
          </option>
          {shops.map((shop) => (
            <option key={shop.shop_id} value={shop.shop_id}>
              {shop.name}
            </option>
          ))}
        </select>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 rounded text-sm sm:text-base">
          {error}
        </div>
      )}

      {/* Show UI only if shop is selected */}
      {selectedShopId && (
        <>
          {/* Summary cards */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-primary-50 rounded-lg p-3 sm:p-4 flex flex-col items-start">
                <span className="text-primary-500 text-lg sm:text-2xl font-bold">
                  {stats.total_products}
                </span>
                <span className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
                  Total Products
                </span>
              </div>
              <div className="bg-primary-50 rounded-lg p-3 sm:p-4 flex flex-col items-start">
                <span className="text-primary-500 text-lg sm:text-2xl font-bold">
                  {stats.low_stock_count}
                </span>
                <span className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
                  Low Stock Alerts
                </span>
              </div>
              <div className="bg-primary-50 rounded-lg p-3 sm:p-4 flex flex-col items-start">
                <span className="text-primary-500 text-lg sm:text-2xl font-bold">
                  {stats.out_of_stock_count}
                </span>
                <span className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
                  Out of Stock Items
                </span>
              </div>
              <div className="bg-primary-50 rounded-lg p-3 sm:p-4 flex flex-col items-start">
                <span className="text-primary-500 text-lg sm:text-2xl font-bold">
                  {stats.total_stock}
                </span>
                <span className="text-gray-600 mt-1 sm:mt-2 text-xs sm:text-sm">
                  Total Stock
                </span>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 items-start sm:items-center">
            <input
              type="text"
              placeholder="Search by product name or SKU..."
              className="border rounded px-3 py-2 w-full sm:w-64 text-sm sm:text-base"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="border rounded px-2 py-2 text-sm sm:text-base w-full sm:w-auto"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-2 py-2 text-sm sm:text-base w-full sm:w-auto"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
            <select
              className="border rounded px-2 py-2 text-sm sm:text-base w-full sm:w-auto"
              value={stockStatus}
              onChange={(e) => setStockStatus(e.target.value)}
            >
              {[
                "All Stock Status",
                "in stock",
                "low stock",
                "out of stock",
              ].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <div className="relative w-full sm:w-auto sm:ml-auto">
              <button
                type="button"
                className="border px-4 py-2 rounded bg-white hover:bg-gray-100 text-sm sm:text-base w-full sm:w-auto"
                onClick={() => setExportOpen((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
              >
                Export
              </button>
              {exportOpen && (
                <div
                  className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-10"
                  role="menu"
                >
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    onClick={exportCSV}
                    role="menuitem"
                  >
                    Export CSV
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm"
                    onClick={exportExcel}
                    role="menuitem"
                  >
                    Export Excel (.xls)
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Inventory table */}
          <div className="overflow-x-auto bg-white rounded-lg shadow">
            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
                <p className="mt-2 text-gray-600 text-sm sm:text-base">
                  Loading inventory...
                </p>
              </div>
            ) : (
              <div className="min-w-full">
                {/* Desktop table */}
                <table className="min-w-full hidden lg:table">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-2 text-left text-sm">
                        PRODUCT NAME
                      </th>
                      <th className="px-4 py-2 text-left text-sm">SKU</th>
                      <th className="px-4 py-2 text-left text-sm">CATEGORY</th>
                      <th className="px-4 py-2 text-left text-sm">BRAND</th>
                      <th className="px-4 py-2 text-left text-sm">STOCK QTY</th>
                      <th className="px-4 py-2 text-left text-sm">AVAILABLE</th>
                      <th className="px-4 py-2 text-left text-sm">STATUS</th>
                      <th className="px-4 py-2 text-left text-sm">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => {
                      const status = getStockStatus(item);
                      return (
                        <tr key={item.id} className="border-b">
                          <td className="px-4 py-2 text-sm">{item.name}</td>
                          <td className="px-4 py-2 text-sm">{item.sku}</td>
                          <td className="px-4 py-2 text-sm">
                            {item.category.name}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.brand.name}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.stock_qty}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {item.available}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <span
                              className={`px-2 py-1 rounded text-xs ${getStatusColor(status)}`}
                            >
                              {status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-sm">
                            <button
                              onClick={() => openEditModal(item)}
                              className="text-primary-500 hover:text-primary-700"
                              disabled={updating}
                            >
                              <svg
                                width="18"
                                height="18"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                              </svg>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {inventory.length === 0 && !loading && (
                      <tr>
                        <td
                          colSpan={8}
                          className="text-center py-8 text-gray-400 text-sm"
                        >
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="lg:hidden">
                  {inventory.map((item) => {
                    const status = getStockStatus(item);
                    return (
                      <div key={item.id} className="border-b p-4">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-sm">{item.name}</h3>
                          <button
                            onClick={() => openEditModal(item)}
                            className="text-primary-500 hover:text-primary-700"
                            disabled={updating}
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path d="M12 20h9" />
                              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19.5 3 21l1.5-4L16.5 3.5z" />
                            </svg>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                          <div>
                            <span className="font-medium">SKU:</span> {item.sku}
                          </div>
                          <div>
                            <span className="font-medium">Category:</span>{" "}
                            {item.category.name}
                          </div>
                          <div>
                            <span className="font-medium">Brand:</span>{" "}
                            {item.brand.name}
                          </div>
                          <div>
                            <span className="font-medium">Stock:</span>{" "}
                            {item.stock_qty}
                          </div>
                          <div>
                            <span className="font-medium">Available:</span>{" "}
                            {item.available}
                          </div>
                          <div>
                            <span className="font-medium">Status:</span>
                            <span
                              className={`ml-1 px-2 py-1 rounded text-xs ${getStatusColor(status)}`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {inventory.length === 0 && !loading && (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No products found.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Pagination */}
          {inventory.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
                Showing {(page - 1) * perPage + 1} to{" "}
                {Math.min(page * perPage, inventory.length)} of{" "}
                {inventory.length} results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                >
                  Previous
                </button>
                <span className="px-3 py-1 border rounded bg-primary-500 text-white text-sm">
                  {page}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={inventory.length < perPage}
                  className="px-3 py-1 border rounded disabled:opacity-50 text-sm"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Edit Stock Modal */}
          {editModal?.open && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4">
              <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm sm:max-w-md shadow-lg">
                <h2 className="text-lg font-semibold mb-4">Update Stock</h2>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-sm">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-sm"
                    value={editModal.product.stock_qty}
                    onChange={(e) =>
                      setEditModal(
                        (prev) =>
                          prev && {
                            ...prev,
                            product: {
                              ...prev.product,
                              stock_qty: Number(e.target.value),
                            },
                          },
                      )
                    }
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1 font-medium text-sm">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-full text-sm"
                    value={editModal.product.low_stock_threshold}
                    onChange={(e) =>
                      setEditModal(
                        (prev) =>
                          prev && {
                            ...prev,
                            product: {
                              ...prev.product,
                              low_stock_threshold: Number(e.target.value),
                            },
                          },
                      )
                    }
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    className="px-4 py-2 rounded bg-gray-100 text-sm"
                    onClick={closeEditModal}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded bg-primary-500 text-white font-semibold disabled:opacity-50 text-sm"
                    onClick={handleEditSave}
                    disabled={updating}
                  >
                    {updating ? "Updating..." : "Update"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default ShopInventoryManagement;
