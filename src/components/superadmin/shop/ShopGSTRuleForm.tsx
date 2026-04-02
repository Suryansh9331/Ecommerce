import React, { useState, useEffect } from "react";
import { 
  ShopGSTRule, 
  ShopGSTRuleFormData, 
  BasicShop, 
  BasicShopCategory, 
  ProductPriceConditionType 
} from "../../../types/shopGST";
import { 
  createShopGSTRule, 
  updateShopGSTRule, 
  validateShopGSTRuleData,
  PRICE_CONDITION_OPTIONS 
} from "../../../services/superadmin/shopGSTService";
import ShopSelector from "./ShopSelector";
import ShopCategorySelector from "./ShopCategorySelector";
import { useToast } from '../../../hooks/useToast';
import { ToastContainer } from '../../ui/ToastContainer';

interface ShopGSTRuleFormProps {
  rule?: ShopGSTRule | null;
  onSuccess: (rule: ShopGSTRule) => void;
  onCancel: () => void;
}

const ShopGSTRuleForm: React.FC<ShopGSTRuleFormProps> = ({
  rule,
  onSuccess,
  onCancel,
}) => {
  const isEditMode = !!rule;
  
  // Form state
  const [formData, setFormData] = useState<ShopGSTRuleFormData>({
    name: rule?.name || "",
    shop_id: rule?.shop_id || "",
    category_id: rule?.category_id || "",
    price_condition_type: rule?.price_condition_type || ProductPriceConditionType.ANY,
    price_condition_value: rule?.price_condition_value || null,
    gst_rate_percentage: rule?.gst_rate_percentage || "",
    is_active: rule?.is_active ?? true,
    start_date: rule?.start_date || null,
    end_date: rule?.end_date || null,
  });
  
  // Component state
  const [selectedShop, setSelectedShop] = useState<BasicShop | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<BasicShopCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toasts, error: showError } = useToast();



  // Initialize selected values for edit mode
  useEffect(() => {
    if (rule) {
      setSelectedShop({
        shop_id: rule.shop_id,
        name: rule.shop_name || "Unknown Shop"
      });
      setSelectedCategory({
        category_id: rule.category_id,
        name: rule.category_name || "Unknown Category"
      });
    }
  }, [rule]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === "checkbox") {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === "price_condition_value" && value) {
      processedValue = parseFloat(value) || null;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
    
    // Clear validation errors when user starts typing
    if (validationErrors.length > 0) {
      setValidationErrors([]);
    }
  };

  const handleShopChange = (shop: BasicShop | null) => {
    setSelectedShop(shop);
    setFormData(prev => ({
      ...prev,
      shop_id: shop?.shop_id || "",
      category_id: "", // Reset category when shop changes
    }));
    setSelectedCategory(null);
  };

  const handleCategoryChange = (category: BasicShopCategory | null) => {
    setSelectedCategory(category);
    setFormData(prev => ({
      ...prev,
      category_id: category?.category_id || ""
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    const errors = validateShopGSTRuleData(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    try {
      setIsSubmitting(true);
      setValidationErrors([]);
      
      let savedRule: ShopGSTRule;
      
      if (isEditMode && rule) {
        savedRule = await updateShopGSTRule(rule.id, formData);
      } else {
        savedRule = await createShopGSTRule(formData);
      }
      
      // Call success callback
      onSuccess(savedRule);
      
    } catch (error) {
      console.error("Error saving GST rule:", error);
      // You can add error handling UI here or use the parent component's error handling
     showError(error instanceof Error ? error.message : 'Failed to save GST rule');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPriceConditionRequired = formData.price_condition_type !== ProductPriceConditionType.ANY;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2 sm:mb-0">
            {isEditMode ? 'Edit GST Rule' : 'Create New GST Rule'}
          </h3>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Please fix the following errors:
                </h3>
                <div className="mt-2">
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rule Name */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Rule Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              disabled={isSubmitting}
              placeholder="Enter a descriptive name for this GST rule"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              required
            />
          </div>

          {/* Shop Selection */}
          <div>
            <ShopSelector
              selectedShopId={selectedShop?.shop_id || null}
              onShopChange={handleShopChange}
              disabled={isSubmitting}
            />
          </div>

          {/* Category Selection */}
          <div>
            <ShopCategorySelector
              shopId={selectedShop?.shop_id || null}
              selectedCategoryId={selectedCategory?.category_id || null}
              onCategoryChange={handleCategoryChange}
              disabled={isSubmitting}
            />
          </div>

          {/* GST Rate */}
          <div>
            <label htmlFor="gst_rate_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              GST Rate Percentage *
            </label>
            <div className="relative">
              <input
                type="number"
                id="gst_rate_percentage"
                name="gst_rate_percentage"
                value={formData.gst_rate_percentage}
                onChange={handleInputChange}
                disabled={isSubmitting}
                min="0"
                max="100"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 pr-8 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                required
              />
              <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 dark:text-gray-400 text-sm">
                %
              </span>
            </div>
          </div>

          {/* Price Condition Type */}
          <div>
            <label htmlFor="price_condition_type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Price Condition *
            </label>
            <select
              id="price_condition_type"
              name="price_condition_type"
              value={formData.price_condition_type}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              required
            >
              {PRICE_CONDITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price Condition Value */}
          {isPriceConditionRequired && (
            <div>
              <label htmlFor="price_condition_value" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Price Condition Value *
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 dark:text-gray-400 text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  id="price_condition_value"
                  name="price_condition_value"
                  value={formData.price_condition_value || ""}
                  onChange={handleInputChange}
                  disabled={isSubmitting}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  required
                />
              </div>
            </div>
          )}

          {/* Date Range */}
          <div>
            <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Start Date (Optional)
            </label>
            <input
              type="date"
              id="start_date"
              name="start_date"
              value={formData.start_date ? new Date(formData.start_date).toISOString().slice(0, 10) : ""}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If not specified, rule will be effective immediately
            </p>
          </div>

          <div>
            <label htmlFor="end_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              id="end_date"
              name="end_date"
              value={formData.end_date ? new Date(formData.end_date).toISOString().slice(0, 10) : ""}
              onChange={handleInputChange}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:focus:ring-orange-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              If not specified, rule will continue until edited or deleted
            </p>
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            disabled={isSubmitting}
            className="h-4 w-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500 dark:focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
            Active (rule will be applied to orders)
          </label>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-orange-600 dark:bg-orange-500 text-white text-sm font-medium rounded-md hover:bg-orange-700 dark:hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 dark:focus:ring-orange-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
          >
            {isSubmitting && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            )}
            <span>
              {isSubmitting 
                ? (isEditMode ? 'Updating...' : 'Creating...') 
                : (isEditMode ? 'Update GST Rule' : 'Create GST Rule')
              }
            </span>
          </button>
        </div>
      </form>
      <ToastContainer toasts={toasts} />
    </div>
  );
};

export default ShopGSTRuleForm;
