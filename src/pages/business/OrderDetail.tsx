import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  PrinterIcon,
  UserIcon,
  ShoppingBagIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useAmazonTranslate } from "../../hooks/useAmazonTranslate";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Define interfaces for type safety
interface Address {
  address_id: number;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
}

interface OrderItem {
  order_item_id: number;
  product_id: number;
  product_name_at_purchase: string;
  sku_at_purchase: string;
  quantity: number;
  unit_price_inclusive_gst: string;
  line_item_total_inclusive_gst: string;
  final_price_for_item: string;
  selected_attributes: { [key: number]: string | string[] };
  item_status: string;
  created_at: string;
  updated_at: string;
}

interface Order {
  order_id: string;
  order_date: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  shipping_address_id: number;
  shipping_address_details: Address;
  billing_address_id: number | null;
  billing_address_details: Address | null;
  items: OrderItem[];
  subtotal_amount: string;
  tax_amount: string;
  shipping_amount: string;
  discount_amount: string;
  total_amount: string;
  currency: string;
  order_status: string;
  payment_status: string;
  payment_method: string | null;
  payment_gateway_transaction_id: string | null;
  shipping_method_name: string;
  customer_notes: string;
  status_history: any[]; // TODO: Replace 'any' with a proper type
}

// Status badge component
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  let bgColor = "";
  let textColor = "";

  switch (status) {
    case "DELIVERED":
      bgColor = "bg-emerald-100";
      textColor = "text-emerald-800";
      break;
    case "SHIPPED":
      bgColor = "bg-sky-100";
      textColor = "text-sky-800";
      break;
    case "PROCESSING":
      bgColor = "bg-primary-600/10"; // Light orange background
      textColor = "text-primary-600";
      break;
    case "PENDING_PAYMENT":
      bgColor = "bg-primary-600/10";
      textColor = "text-primary-600";
      break;
    case "CANCELLED":
      bgColor = "bg-rose-100";
      textColor = "text-rose-800";
      break;
    case "SUCCESSFUL":
      bgColor = "bg-emerald-100";
      textColor = "text-emerald-800";
      break;
    case "FAILED":
      bgColor = "bg-rose-100";
      textColor = "text-rose-800";
      break;
    case "REFUNDED":
      bgColor = "bg-purple-100";
      textColor = "text-purple-800";
      break;
    case "PENDING":
      bgColor = "bg-primary-100";
      textColor = "text-primary-800";
      break;
    default:
      bgColor = "bg-gray-100";
      textColor = "text-gray-800";
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium ${bgColor} ${textColor} whitespace-nowrap`}
    >
      {status
        .split("_")
        .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
        .join(" ")}
    </span>
  );
};

// Helper function to format selected attributes for display
const formatSelectedAttributes = (
  selectedAttributes: { [key: number]: string | string[] } | undefined
) => {
  if (!selectedAttributes || Object.keys(selectedAttributes).length === 0) {
    return null;
  }
  const formattedAttributes: string[] = [];
  Object.entries(selectedAttributes).forEach(([, value]) => {
    if (Array.isArray(value)) {
      if (value.length > 0) formattedAttributes.push(...value);
    } else if (value) {
      formattedAttributes.push(value);
    }
  });
  return formattedAttributes.length > 0 ? formattedAttributes.join(", ") : null;
};

// Helper component to render an address block
const AddressBlock: React.FC<{ address: Address | null }> = ({ address }) => {
  if (!address) return <p className="text-sm text-gray-500">N/A</p>;
  return (
    <div className="space-y-1">
      <p className="text-sm text-gray-900 break-words">{address.address_line1}</p>
      {address.address_line2 && (
        <p className="text-sm text-gray-900 break-words">{address.address_line2}</p>
      )}
      <p className="text-sm text-gray-900">
        {address.city}, {address.state} {address.postal_code}
      </p>
      <p className="text-sm text-gray-900">{address.country}</p>
    </div>
  );
};

const OrderDetail: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [merchantProfile, setMerchantProfile] = useState<{
    business_name: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate();

  // Display-only translations
  const [tItemNames, setTItemNames] = useState<Record<number, string>>({});
  const [tItemOptions, setTItemOptions] = useState<Record<number, string>>({});
  const [tCustomerNotes, setTCustomerNotes] = useState<string | null>(null);
  const [tShipMethod, setTShipMethod] = useState<string | null>(null);
  const [tStatusNotes, setTStatusNotes] = useState<Record<number, string>>({});

  // Generate the complete invoice HTML for printing
  const generateInvoiceHTML = () => {
    // Guard against missing data
    if (!order || !merchantProfile) {
      return '';
    }
  const displayShipMethod = tShipMethod || order.shipping_method_name;
  const displayCustomerNotes = tCustomerNotes || order.customer_notes;
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice ${order.order_id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.4;
      color: black;
      background: white;
      padding: 20px;
    }
    
    @page {
      size: A4;
      margin: 0.5in;
    }
    
    .invoice-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid black;
      padding-bottom: 15px;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: bold;
    }
    
    .invoice-title {
      text-align: right;
    }
    
    .invoice-title h1 {
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 10px;
    }
    
    .addresses {
      display: flex;
      justify-content: space-between;
      margin-bottom: 20px;
      page-break-inside: avoid;
    }
    
    .address-block {
      width: 48%;
    }
    
    .address-block h3 {
      font-weight: bold;
      margin-bottom: 10px;
      border-bottom: 1px solid #ccc;
      padding-bottom: 5px;
    }
    
    .order-meta {
      background: #f5f5f5;
      padding: 12px;
      margin-bottom: 20px;
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 15px;
      page-break-inside: avoid;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    
    th, td {
      border: 1px solid black;
      padding: 8px;
      text-align: left;
    }
    
    th {
      background: #e5e5e5;
      font-weight: bold;
    }
    
    .text-right {
      text-align: right;
    }
    
    .summary-table {
      width: 40%;
      margin-left: auto;
      margin-bottom: 20px;
    }
    
    .summary-table td {
      border: none;
      padding: 5px;
    }
    
    .total-row {
      border-top: 2px solid black;
      font-weight: bold;
      font-size: 14px;
    }
    
    .notes {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      page-break-inside: avoid;
    }
    
    .footer {
      margin-top: 30px;
      padding-top: 15px;
      border-top: 1px solid #ccc;
      text-align: center;
      font-size: 10px;
      color: #666;
      page-break-inside: avoid;
    }
    
    .product-details {
      font-size: 10px;
      color: #666;
      margin-top: 2px;
    }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-name">${
      merchantProfile?.business_name || "Your Business"
    }</div>
    <div class="invoice-title">
      <h1>ORDER INVOICE</h1>
      <p><strong>Order ID:</strong> ${order.order_id}</p>
      <p><strong>Invoice Date:</strong> ${new Date().toLocaleDateString()}</p>
    </div>
  </div>

  <div class="addresses">
    <div class="address-block">
      <h3>Billed To:</h3>
      <div>
        ${
          billingAddress
            ? `
          <p>${billingAddress.address_line1}</p>
          ${
            billingAddress.address_line2
              ? `<p>${billingAddress.address_line2}</p>`
              : ""
          }
          <p>${billingAddress.city}, ${billingAddress.state} ${
                billingAddress.postal_code
              }</p>
          <p>${billingAddress.country}</p>
        `
            : "<p>N/A</p>"
        }
      </div>
    </div>
    <div class="address-block">
      <h3>Shipped To:</h3>
      <div>
        ${
          shippingAddress
            ? `
          <p>${shippingAddress.address_line1}</p>
          ${
            shippingAddress.address_line2
              ? `<p>${shippingAddress.address_line2}</p>`
              : ""
          }
          <p>${shippingAddress.city}, ${shippingAddress.state} ${
                shippingAddress.postal_code
              }</p>
          <p>${shippingAddress.country}</p>
        `
            : "<p>N/A</p>"
        }
      </div>
    </div>
  </div>

  <div class="order-meta">
    <div><strong>Order Date:</strong> ${new Date(
      order.order_date
    ).toLocaleDateString()}</div>
  <div><strong>Payment Method:</strong> ${order.payment_method || "N/A"}</div>
  <div><strong>Shipping Method:</strong> ${displayShipMethod}</div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Item Description</th>
        <th class="text-right">Qty</th>
        <th class="text-right">Unit Price</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${order.items
        .map(
          (item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>
            <div style="font-weight: bold;">${tItemNames[item.order_item_id] || item.product_name_at_purchase}</div>
            <div class="product-details">SKU: ${item.sku_at_purchase}</div>
            ${
              (tItemOptions[item.order_item_id] || formatSelectedAttributes(item.selected_attributes))
                ? `<div class="product-details">Options: ${tItemOptions[item.order_item_id] || formatSelectedAttributes(item.selected_attributes)}</div>`
                : ""
            }
          </td>
          <td class="text-right">${item.quantity}</td>
          <td class="text-right">${order.currency} ${parseFloat(
            item.unit_price_inclusive_gst
          ).toFixed(2)}</td>
          <td class="text-right" style="font-weight: bold;">${
            order.currency
          } ${parseFloat(item.final_price_for_item).toFixed(2)}</td>
        </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <table class="summary-table">
    <tbody>
      <tr>
        <td class="text-right">Subtotal:</td>
        <td class="text-right" style="font-weight: bold;">${
          order.currency
        } ${parseFloat(order.subtotal_amount).toFixed(2)}</td>
      </tr>
      <tr>
        <td class="text-right">Tax (included):</td>
        <td class="text-right" style="font-weight: bold;">${
          order.currency
        } ${parseFloat(order.tax_amount).toFixed(2)}</td>
      </tr>
      <tr>
        <td class="text-right">Shipping:</td>
        <td class="text-right" style="font-weight: bold;">${
          order.currency
        } ${parseFloat(order.shipping_amount).toFixed(2)}</td>
      </tr>
      
      <tr class="total-row">
        <td class="text-right">Grand Total:</td>
        <td class="text-right">${order.currency} ${parseFloat(
      order.total_amount
    ).toFixed(2)}</td>
      </tr>
    </tbody>
  </table>

  ${
    displayCustomerNotes
      ? `
    <div class="notes">
      <h3 style="font-weight: bold; margin-bottom: 8px;">Customer Notes</h3>
      <p>${displayCustomerNotes}</p>
    </div>
  `
      : ""
  }

  <div class="footer">
    <p>Thank you for your business!</p>
    <p>This is a computer-generated invoice and does not require a signature.</p>
  </div>
</body>
</html>
    `;
  };

  // UPDATED: This function now creates an iframe and prints it
  const handlePrint = () => {
    // Ensure we have order data
    if (!order || !merchantProfile) {
      console.warn('Order or merchant profile is missing, cannot print.');
      return;
    }
    const invoiceHTML = generateInvoiceHTML();

    // Create a hidden iframe
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.top = "-10000px";
    printFrame.style.left = "-10000px";
    printFrame.style.width = "0";
    printFrame.style.height = "0";

    document.body.appendChild(printFrame);

    // Write the invoice HTML to the iframe
    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(invoiceHTML);
      frameDoc.close();

      // Wait for the content to load, then print
      setTimeout(() => {
        printFrame.contentWindow?.print();

        // Remove the iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("access_token");
        if (!token) throw new Error("No authentication token found");
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        };

        const orderResponse = await fetch(
          `${API_BASE_URL}/api/merchant-dashboard/orders/${orderId}`,
          { headers }
        );
        if (!orderResponse.ok) {
          const errorData = await orderResponse.json().catch(() => null);
          throw new Error(
            errorData?.error ||
              `Failed to fetch order details: ${orderResponse.status}`
          );
        }
        const orderData = await orderResponse.json();
        setOrder(orderData);

        const profileResponse = await fetch(
          `${API_BASE_URL}/api/merchants/profile`,
          { headers }
        );
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setMerchantProfile(profileData.profile);
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to fetch order details";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchOrderDetails();
  }, [orderId]);

  // Translate dynamic texts for display only (fail-open)
  useEffect(() => {
    const lang = (i18n.language || 'en').split('-')[0];
    if (!order || lang === 'en') {
      setTItemNames({});
      setTItemOptions({});
      setTCustomerNotes(null);
      setTShipMethod(null);
      setTStatusNotes({});
      return;
    }
    const run = async () => {
      try {
        const nameItems = order.items.map(it => ({ id: `n:${it.order_item_id}`, text: it.product_name_at_purchase }));
        const optionItems: { id: string; text: string }[] = [];
        order.items.forEach(it => {
          const opts = formatSelectedAttributes(it.selected_attributes);
          if (opts) optionItems.push({ id: `o:${it.order_item_id}`, text: opts });
        });
        const miscItems: { id: string; text: string }[] = [];
        if (order.customer_notes) miscItems.push({ id: `cn:${order.order_id}`, text: order.customer_notes });
        if (order.shipping_method_name) miscItems.push({ id: `ship:${order.order_id}`, text: order.shipping_method_name });
        const historyNoteItems: { id: string; text: string }[] = [];
        if (Array.isArray(order.status_history)) {
          order.status_history.forEach((h: any, idx: number) => {
            if (h?.notes) historyNoteItems.push({ id: `h:${idx}`, text: h.notes });
          });
        }
        const [namesMap, optsMap, miscMap, histMap] = await Promise.all([
          translateBatch(nameItems, lang, 'text/plain'),
          translateBatch(optionItems, lang, 'text/plain'),
          translateBatch(miscItems, lang, 'text/plain'),
          translateBatch(historyNoteItems, lang, 'text/plain'),
        ]);
        const nOut: Record<number, string> = {};
        Object.keys(namesMap).forEach(k => { if (k.startsWith('n:')) nOut[Number(k.split(':')[1])] = namesMap[k]; });
        const oOut: Record<number, string> = {};
        Object.keys(optsMap).forEach(k => { if (k.startsWith('o:')) oOut[Number(k.split(':')[1])] = optsMap[k]; });
        const hOut: Record<number, string> = {};
        Object.keys(histMap).forEach(k => { if (k.startsWith('h:')) hOut[Number(k.split(':')[1])] = histMap[k]; });
        setTItemNames(nOut);
        setTItemOptions(oOut);
        setTCustomerNotes(miscMap[`cn:${order.order_id}`] || null);
        setTShipMethod(miscMap[`ship:${order.order_id}`] || null);
        setTStatusNotes(hOut);
      } catch {
        // ignore errors - fail open
      }
    };
    run();
  }, [order, i18n.language, translateBatch]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 px-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-red-500 mb-4 break-words">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary-500 text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="text-center py-8 px-4">
        <p className="text-gray-500">Order not found.</p>
      </div>
    );
  }

  const billingAddress =
    order.billing_address_details || order.shipping_address_details;
  const shippingAddress = order.shipping_address_details;

  return (
    <>
      {/* --- PRINT ONLY INVOICE --- */}
      <div className="print-only">
        <div>
          {/* Header */}
          <div
            className="print-no-break"
            style={{
              display: "flex",
              justifyContent: "space-between",
              borderBottom: "2px solid black",
              paddingBottom: "15px",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: "0" }}>
                {merchantProfile?.business_name || "Your Business"}
              </h1>
            </div>
            <div style={{ textAlign: "right" }}>
              <h2
                style={{
                  fontSize: "20px",
                  fontWeight: "bold",
                  margin: "0 0 10px 0",
                }}
              >
                ORDER INVOICE
              </h2>
              <p style={{ margin: "2px 0" }}>
                <strong>Order ID:</strong> {order.order_id}
              </p>
              <p style={{ margin: "2px 0" }}>
                <strong>Invoice Date:</strong> {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Addresses */}
          <div
            className="print-no-break"
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <div style={{ width: "48%" }}>
              <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
                Billed To:
              </h3>
              <div>
                <AddressBlock address={billingAddress} />
              </div>
            </div>
            <div style={{ width: "48%" }}>
              <h3 style={{ fontWeight: "bold", marginBottom: "10px" }}>
                Shipped To:
              </h3>
              <div>
                <AddressBlock address={shippingAddress} />
              </div>
            </div>
          </div>

          {/* Order Meta */}
          <div
            className="print-no-break"
            style={{
              background: "#f5f5f5",
              padding: "12px",
              marginBottom: "20px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "15px",
            }}
          >
            <div>
              <strong>Order Date:</strong>{" "}
              {new Date(order.order_date).toLocaleDateString()}
            </div>
            <div>
              <strong>Payment Method:</strong> {order.payment_method || "N/A"}
            </div>
            <div>
              <strong>Shipping Method:</strong> {order.shipping_method_name}
            </div>
          </div>

          {/* Items Table */}
          <table style={{ width: "100%", marginBottom: "20px" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>#</th>
                <th style={{ textAlign: "left" }}>Item Description</th>
                <th style={{ textAlign: "right" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Unit Price</th>
                <th style={{ textAlign: "right" }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item, index) => (
                <tr key={item.order_item_id}>
                  <td>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: "bold" }}>
                      {item.product_name_at_purchase}
                    </div>
                    <div style={{ fontSize: "10px", color: "#666" }}>
                      SKU: {item.sku_at_purchase}
                    </div>
                    {formatSelectedAttributes(item.selected_attributes) && (
                      <div style={{ fontSize: "10px", color: "#666" }}>
                        Options:{" "}
                        {formatSelectedAttributes(item.selected_attributes)}
                      </div>
                    )}
                  </td>
                  <td style={{ textAlign: "right" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>
                    {order.currency}{" "}
                    {parseFloat(item.unit_price_inclusive_gst).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: "bold" }}>
                    {order.currency}{" "}
                    {parseFloat(item.final_price_for_item).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Summary */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "20px",
            }}
          >
            <table style={{ width: "40%" }}>
              <tbody>
                <tr>
                  <td style={{ textAlign: "right", padding: "5px" }}>
                    Subtotal:
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.currency}{" "}
                    {parseFloat(order.subtotal_amount).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "right", padding: "5px" }}>
                    Tax (included):
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.currency} {parseFloat(order.tax_amount).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td style={{ textAlign: "right", padding: "5px" }}>
                    Shipping:
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "5px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.currency}{" "}
                    {parseFloat(order.shipping_amount).toFixed(2)}
                  </td>
                </tr>
                
                <tr style={{ borderTop: "2px solid black" }}>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "8px 5px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    Grand Total:
                  </td>
                  <td
                    style={{
                      textAlign: "right",
                      padding: "8px 5px",
                      fontSize: "14px",
                      fontWeight: "bold",
                    }}
                  >
                    {order.currency} {parseFloat(order.total_amount).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Customer Notes */}
          {order.customer_notes && (
            <div
              className="print-no-break"
              style={{
                marginTop: "20px",
                paddingTop: "15px",
                borderTop: "1px solid #ccc",
              }}
            >
              <h3 style={{ fontWeight: "bold", marginBottom: "8px" }}>
                Customer Notes
              </h3>
              <p style={{ margin: "0" }}>{order.customer_notes}</p>
            </div>
          )}

          {/* Footer */}
          <div
            className="print-no-break"
            style={{
              marginTop: "30px",
              paddingTop: "15px",
              borderTop: "1px solid #ccc",
              textAlign: "center",
              fontSize: "10px",
              color: "#666",
            }}
          >
            <p style={{ margin: "2px 0" }}>Thank you for your business!</p>
            <p style={{ margin: "2px 0" }}>
              This is a computer-generated invoice and does not require a
              signature.
            </p>
          </div>
        </div>
      </div>

      {/* --- ON-SCREEN DASHBOARD VIEW --- */}
      {/* This whole block will be hidden during printing by the global CSS */}
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section - Made responsive */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-gray-200 mb-4 space-y-4 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link
              to="/business/orders"
              className="inline-flex items-center text-primary-600 hover:text-white hover:bg-primary-600 transition-colors px-3 py-1.5 rounded-md font-medium shadow-sm w-fit"
              style={{ fontWeight: 500 }}
            >
              <ArrowLeftIcon className="h-5 w-5 mr-2" /> Back to Orders
            </Link>
            <h1 className="text-xl sm:text-2xl font-semibold text-gray-900">
              Order #{order.order_id}
            </h1>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-3 sm:px-4 py-2 rounded-md shadow-sm text-sm font-medium bg-primary-600 text-white hover:bg-primary-600 transition-colors border border-primary-600"
              style={{ fontWeight: 500 }}
            >
              <PrinterIcon className="h-4 w-4 mr-2" /> 
              <span className="hidden sm:inline">Print Invoice</span>
              <span className="sm:hidden">Print</span>
            </button>
          </div>
        </div>

        {/* Order Status Section - Made responsive */}
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h2 className="text-base sm:text-lg font-medium text-gray-900">
                Order Status
              </h2>
              <p className="text-sm text-gray-500">
                Placed on {new Date(order.order_date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-center sm:text-left">
                <StatusBadge status={order.order_status} />
                <p className="text-xs text-gray-500 mt-1">Order Status</p>
              </div>
              <div className="text-center sm:text-left">
                <StatusBadge status={order.payment_status} />
                <p className="text-xs text-gray-500 mt-1">Payment Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid - Made responsive */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Order Items and History */}
          <div className="xl:col-span-2 space-y-4 sm:space-y-6">
            {/* Order Items Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  <ShoppingBagIcon className="h-5 w-5 mr-2" />
                  Order Items ({order.items.length})
                </h3>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item) => (
                  <div
                    key={item.order_item_id}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-start space-y-3 sm:space-y-0 sm:space-x-4"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {tItemNames[item.order_item_id] || item.product_name_at_purchase}
                      </h4>
                      <p className="text-sm text-gray-500">
                        SKU: {item.sku_at_purchase}
                      </p>
            {(tItemOptions[item.order_item_id] || formatSelectedAttributes(item.selected_attributes)) && (
                        <p className="text-sm text-gray-600 mt-1">
                          Options:{" "}
              {tItemOptions[item.order_item_id] || formatSelectedAttributes(item.selected_attributes)}
                        </p>
                      )}
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0">
                      <p className="text-sm font-medium text-gray-900">
                        {order.currency}{" "}
                        {parseFloat(item.final_price_for_item).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500">
                        ({item.quantity} × {order.currency}{" "}
                        {parseFloat(item.unit_price_inclusive_gst).toFixed(2)})
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status History Section */}
            {order.status_history && order.status_history.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Status History
                  </h3>
                </div>
                <div className="p-4 sm:p-6 space-y-4">
                  {order.status_history.map((history, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="flex-shrink-0 pt-1.5">
                        <div className="w-2.5 h-2.5 bg-primary-500 rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {history.status
                            .split("_")
                            .map(
                              (word: string) =>
                                word.charAt(0) + word.slice(1).toLowerCase()
                            )
                            .join(" ")}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(history.changed_at).toLocaleString()}
                        </p>
                        {(tStatusNotes[index] || history.notes) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {tStatusNotes[index] || history.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Summary and Customer Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Order Summary Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Order Summary
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="text-sm font-medium">
                    {order.currency}{" "}
                    {parseFloat(order.subtotal_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="text-sm font-medium">
                    {order.currency} {parseFloat(order.tax_amount).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Shipping</span>
                  <span className="text-sm font-medium">
                    {order.currency}{" "}
                    {parseFloat(order.shipping_amount).toFixed(2)}
                  </span>
                </div>
               
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between">
                    <span className="text-base font-medium text-gray-900">
                      Total
                    </span>
                    <span className="text-base font-medium text-gray-900">
                      {order.currency}{" "}
                      {parseFloat(order.total_amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Customer Information
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Shipping Address
                  </p>
                  <div className="text-sm text-gray-900 mt-1">
                    <AddressBlock address={shippingAddress} />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 flex items-center">
                  <CreditCardIcon className="h-5 w-5 mr-2" />
                  Payment Information
                </h3>
              </div>
              <div className="p-4 sm:p-6 space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    Payment Method
                  </p>
                  <p className="text-sm text-gray-900 mt-1">
                    {order.payment_method || "N/A"}
                  </p>
                </div>
                {order.payment_gateway_transaction_id && (
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Transaction ID
                    </p>
                    <p className="text-sm text-gray-900 break-all mt-1">
                      {order.payment_gateway_transaction_id}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrderDetail;
