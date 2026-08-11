import React from "react";
import { GSTRule } from "../../../types/gst";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

interface GSTRuleTableProps {
  rules: GSTRule[];
  onEdit: (rule: GSTRule) => void;
  onDelete: (ruleId: number) => void;
}

const GSTRuleTable: React.FC<GSTRuleTableProps> = ({
  rules,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="overflow-x-auto bg-white shadow-lg rounded-lg">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-100">
          <tr>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name / ID
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Category
            </th>
            {/* Hide Price Condition on smaller screens, show on md and up */}
            <th
              scope="col"
              className="hidden md:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Price Condition
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              GST Rate
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            {/* Hide Effective Dates on smaller screens, show on lg and up */}
            <th
              scope="col"
              className="hidden lg:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Effective Dates
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {rules.map((rule) => (
            <tr key={rule.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-semibold text-gray-900 truncate max-w-xs">
                  {rule.name}
                </div>
                <div className="text-xs text-gray-500">ID: {rule.id}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700 truncate max-w-xs">
                {rule.category_name || `ID: ${rule.category_id}`}
              </td>

              <td className="hidden md:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {rule.price_condition_type !== "any"
                  ? `${rule.price_condition_type.replace(/_/g, " ")} ${
                      rule.price_condition_value || ""
                    }`
                  : "Any Price"}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {Number(rule.gst_rate_percentage).toFixed(2)}%
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    rule.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {rule.is_active ? "Active" : "Inactive"}
                </span>
              </td>

              <td className="hidden lg:table-cell px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                {rule.start_date
                  ? new Date(rule.start_date).toLocaleDateString()
                  : "N/A"}{" "}
                -{" "}
                {rule.end_date
                  ? new Date(rule.end_date).toLocaleDateString()
                  : "N/A"}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onEdit(rule)}
                    className="text-primary-600 hover:text-primary-800 transition-colors p-1"
                    title="Edit Rule"
                  >
                    <PencilSquareIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => onDelete(rule.id)}
                    className="text-red-600 hover:text-red-800 transition-colors p-1"
                    title="Delete Rule"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GSTRuleTable;
