import React, { useState } from "react";
import { ShopGSTRule, ProductPriceConditionType } from "../../../types/shopGST";
import { deleteShopGSTRule } from "../../../services/superadmin/shopGSTService";
import { useToast } from "../../../hooks/useToast";
import { ToastContainer } from "../../ui/ToastContainer";
interface ShopGSTRuleTableProps {
  rules: ShopGSTRule[];
  loading?: boolean;
  onEdit: (rule: ShopGSTRule) => void;
  onRefresh: () => void;
}

const ShopGSTRuleTable: React.FC<ShopGSTRuleTableProps> = ({
  rules,
  loading = false,
  onEdit,
  onRefresh,
}) => {
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set());
  const { toasts, error: showError } = useToast();
  const handleDelete = async (rule: ShopGSTRule) => {
    if (
      !confirm(`Are you sure you want to delete the GST rule "${rule.name}"?`)
    ) {
      return;
    }

    try {
      setDeletingIds((prev) => new Set(prev).add(rule.id));
      await deleteShopGSTRule(rule.id);
      onRefresh();
    } catch (error) {
      console.error("Error deleting GST rule:", error);
      showError(
        error instanceof Error ? error.message : "Failed to delete GST rule",
      );
    } finally {
      setDeletingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(rule.id);
        return newSet;
      });
    }
  };

  const formatPriceCondition = (rule: ShopGSTRule) => {
    if (rule.price_condition_type === ProductPriceConditionType.ANY) {
      return "Any Price";
    }

    const value = rule.price_condition_value
      ? `₹${parseFloat(String(rule.price_condition_value)).toFixed(2)}`
      : "N/A";

    switch (rule.price_condition_type) {
      case ProductPriceConditionType.LESS_THAN:
        return `< ${value}`;
      case ProductPriceConditionType.LESS_THAN_OR_EQUAL_TO:
        return `<= ${value}`;
      case ProductPriceConditionType.GREATER_THAN:
        return `> ${value}`;
      case ProductPriceConditionType.GREATER_THAN_OR_EQUAL_TO:
        return `>= ${value}`;
      case ProductPriceConditionType.EQUAL_TO:
        return `= ${value}`;
      default:
        return value;
    }
  };

  const formatDateRange = (rule: ShopGSTRule) => {
    const hasStart = rule.start_date;
    const hasEnd = rule.end_date;

    if (!hasStart && !hasEnd) {
      return "No date restrictions";
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    if (hasStart && hasEnd) {
      return `${formatDate(rule.start_date!)} - ${formatDate(rule.end_date!)}`;
    } else if (hasStart) {
      return `From ${formatDate(rule.start_date!)}`;
    } else {
      return `Until ${formatDate(rule.end_date!)}`;
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600 dark:text-gray-400">
              Loading GST rules...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No GST Rules Found
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            No GST rules have been created yet. Create your first rule to get
            started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Rule Details
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Shop & Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                GST Rate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Price Condition
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status & Dates
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {rules.map((rule) => (
              <tr
                key={rule.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
              >
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {rule.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      ID: {rule.id}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    <div className="font-medium">
                      {rule.shop_name || `Shop ID: ${rule.shop_id}`}
                    </div>
                    <div className="text-gray-600 dark:text-gray-400">
                      {rule.category_name || `Category ID: ${rule.category_id}`}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {parseFloat(String(rule.gst_rate_percentage)).toFixed(2)}%
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {formatPriceCondition(rule)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="space-y-1">
                    <div>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          rule.is_active
                            ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                            : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                        }`}
                      >
                        {rule.is_active ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {formatDateRange(rule)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(rule)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(rule)}
                      disabled={deletingIds.has(rule.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      {deletingIds.has(rule.id) ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden divide-y divide-gray-200 dark:divide-gray-700">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {rule.name}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ID: {rule.id}
                </p>
              </div>
              <span
                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  rule.is_active
                    ? "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400"
                    : "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400"
                }`}
              >
                {rule.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 gap-y-2 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400">Shop: </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {rule.shop_name || `Shop ID: ${rule.shop_id}`}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Category:{" "}
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {rule.category_name || `Category ID: ${rule.category_id}`}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  GST Rate:{" "}
                </span>
                <span className="text-gray-900 dark:text-gray-100 font-medium">
                  {parseFloat(String(rule.gst_rate_percentage)).toFixed(2)}%
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Price Condition:{" "}
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatPriceCondition(rule)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400">
                  Date Range:{" "}
                </span>
                <span className="text-gray-900 dark:text-gray-100">
                  {formatDateRange(rule)}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => onEdit(rule)}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 text-sm font-medium transition-colors duration-200"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(rule)}
                disabled={deletingIds.has(rule.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors duration-200"
              >
                {deletingIds.has(rule.id) ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default ShopGSTRuleTable;
