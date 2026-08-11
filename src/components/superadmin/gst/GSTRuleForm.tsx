import React, { useState, useEffect, FormEvent } from "react";
import {
  GSTRule,
  ProductPriceConditionType,
  BasicCategory,
} from "../../../types/gst";
import Modal from "../../common/Modal"; 

interface GSTRuleFormProps {
  initialData?: GSTRule;
  onSubmit: (data: Partial<GSTRule>) => Promise<void>;
  onCancel: () => void;
  categories: BasicCategory[];
  isLoading?: boolean;
}

const GSTRuleForm: React.FC<GSTRuleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  categories,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<Partial<GSTRule>>({
    name: "",

    category_id: categories.length > 0 ? categories[0].category_id : undefined,
    price_condition_type: ProductPriceConditionType.ANY,
    price_condition_value: "",
    gst_rate_percentage: "",
    is_active: true,
    start_date: null,
    end_date: null,
  });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        price_condition_value:
          initialData.price_condition_value !== null &&
          initialData.price_condition_value !== undefined
            ? String(initialData.price_condition_value)
            : "",
        gst_rate_percentage:
          initialData.gst_rate_percentage !== null &&
          initialData.gst_rate_percentage !== undefined
            ? String(initialData.gst_rate_percentage)
            : "",
        start_date: initialData.start_date
          ? initialData.start_date.split("T")[0]
          : null,
        end_date: initialData.end_date
          ? initialData.end_date.split("T")[0]
          : null,
      });
    } else {
      setFormData({
        name: "",
        // description: '',
        category_id:
          categories.length > 0 ? categories[0].category_id : undefined,
        price_condition_type: ProductPriceConditionType.ANY,
        price_condition_value: "",
        gst_rate_percentage: "",
        is_active: true,
        start_date: null,
        end_date: null,
      });
    }
  }, [initialData, categories]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name?.trim()) {
      setFormError("Rule name is required.");
      return;
    }
    if (!formData.category_id) {
      setFormError("Category is required.");
      return;
    }
    if (
      !formData.gst_rate_percentage ||
      isNaN(Number(formData.gst_rate_percentage)) ||
      Number(formData.gst_rate_percentage) < 0
    ) {
      setFormError("Valid, non-negative GST Rate Percentage is required.");
      return;
    }
    if (
      formData.price_condition_type !== ProductPriceConditionType.ANY &&
      (!formData.price_condition_value ||
        isNaN(Number(formData.price_condition_value)) ||
        Number(formData.price_condition_value) < 0)
    ) {
      setFormError(
        "Price Condition Value is required, must be a non-negative number if condition type is not 'ANY'."
      );
      return;
    }
    if (
      formData.start_date &&
      formData.end_date &&
      new Date(formData.start_date) > new Date(formData.end_date)
    ) {
      setFormError("End date cannot be before start date.");
      return;
    }

    const submissionData: Partial<GSTRule> = {
      ...formData,
      category_id: Number(formData.category_id),
      gst_rate_percentage: Number(formData.gst_rate_percentage),
      price_condition_value:
        formData.price_condition_type !== ProductPriceConditionType.ANY &&
        formData.price_condition_value
          ? Number(formData.price_condition_value)
          : null,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
    };

    try {
      await onSubmit(submissionData);
    } catch (error) {
      setFormError((error as Error).message || "An unexpected error occurred.");
    }
  };

  const isPriceValueDisabled =
    formData.price_condition_type === ProductPriceConditionType.ANY;

  return (
    <Modal
      isOpen={true}
      onClose={onCancel}
      title={initialData ? "Edit GST Rule" : "Add New GST Rule"}
      size="lg"
    >
      {" "}
     
      <form
        onSubmit={handleSubmit}
        className="space-y-4 p-1 max-h-[70vh] sm:max-h-[80vh] overflow-y-auto"
      >
        {formError && (
          <div className="text-red-600 bg-red-100 p-3 rounded-md text-sm">
            {formError}
          </div>
        )}

        <div>
          <label
            htmlFor="name"
            className="block text-sm font-medium text-gray-700"
          >
            Rule Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            value={formData.name || ""}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        {/* <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea name="description" id="description" value={formData.description || ''} onChange={handleChange} rows={2} // Reduced rows for smaller modals
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm" />
        </div> */}

        <div>
          <label
            htmlFor="category_id"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            name="category_id"
            id="category_id"
            value={formData.category_id || ""}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          >
            <option value="" disabled>
              Select a category
            </option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.name} (ID: {cat.category_id})
              </option>
            ))}
          </select>
        </div>

        {/* Use grid for layout, stacking on small screens */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="price_condition_type"
              className="block text-sm font-medium text-gray-700"
            >
              Price Condition Type
            </label>
            <select
              name="price_condition_type"
              id="price_condition_type"
              value={formData.price_condition_type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            >
              {Object.values(ProductPriceConditionType).map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="price_condition_value"
              className="block text-sm font-medium text-gray-700"
            >
              Price Condition Value
            </label>
            <input
              type="number"
              name="price_condition_value"
              id="price_condition_value"
              step="0.01"
              value={formData.price_condition_value || ""}
              onChange={handleChange}
              disabled={isPriceValueDisabled}
              className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${
                isPriceValueDisabled ? "bg-gray-100 cursor-not-allowed" : ""
              }`}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="gst_rate_percentage"
            className="block text-sm font-medium text-gray-700"
          >
            GST Rate (%)
          </label>
          <input
            type="number"
            name="gst_rate_percentage"
            id="gst_rate_percentage"
            step="0.01"
            min="0"
            max="100"
            value={formData.gst_rate_percentage || ""}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="start_date"
              className="block text-sm font-medium text-gray-700"
            >
              Start Date (Optional)
            </label>
            <input
              type="date"
              name="start_date"
              id="start_date"
              value={formData.start_date || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="end_date"
              className="block text-sm font-medium text-gray-700"
            >
              End Date (Optional)
            </label>
            <input
              type="date"
              name="end_date"
              id="end_date"
              value={formData.end_date || ""}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex items-center pt-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={!!formData.is_active}
            onChange={handleChange} // Ensure checked is boolean
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label
            htmlFor="is_active"
            className="ml-2 block text-sm text-gray-900"
          >
            Is Active
          </label>
        </div>

        {/* Buttons might stack on very small screens if the modal itself is constrained */}
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading
              ? initialData
                ? "Saving..."
                : "Creating..."
              : initialData
              ? "Save Changes"
              : "Create Rule"}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default GSTRuleForm;
