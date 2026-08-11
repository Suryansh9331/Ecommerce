import React, { useState, useEffect, useCallback } from "react";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import GSTRuleTable from "../../components/superadmin/gst/GSTRuleTable";
import GSTRuleForm from "../../components/superadmin/gst/GSTRuleForm";
import { GSTRule, BasicCategory } from "../../types/gst";
import {
  fetchGSTRules,
  createGSTRule,
  updateGSTRule,
  deleteGSTRule,
  fetchAllCategoriesForGST,
} from "../../services/superadmin/gstService";
import ConfirmationModal from "../../components/common/ConfirmationModal";

const GSTRuleManagement: React.FC = () => {
  const [rules, setRules] = useState<GSTRule[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<GSTRule | null>(null);
  const [categories, setCategories] = useState<BasicCategory[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<number | null>(null);

  const loadRules = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedRules = await fetchGSTRules();
      setRules(fetchedRules);
    } catch (err) {
      setError((err as Error).message || "Failed to load GST rules.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const fetchedCategories = await fetchAllCategoriesForGST();
      setCategories(fetchedCategories);
    } catch (err) {
      console.error("Failed to load categories:", err);
      setError(
        (err as Error).message || "Failed to load categories for the form."
      );
    }
  }, []);

  useEffect(() => {
    loadRules();
    loadCategories();
  }, [loadRules, loadCategories]);

  const handleOpenForm = (rule?: GSTRule) => {
    setEditingRule(rule || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingRule(null);
    setIsFormOpen(false);
  };

  const handleSubmitForm = async (data: Partial<GSTRule>) => {
    setIsLoading(true);
    setError(null);
    try {
      if (editingRule && editingRule.id) {
        await updateGSTRule(editingRule.id, data);
      } else {
        await createGSTRule(data);
      }
      await loadRules(); // Refresh list
      handleCloseForm();
    } catch (err) {
      setError((err as Error).message || "Failed to save GST rule.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (ruleId: number) => {
    setRuleToDelete(ruleId);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteRule = async () => {
    if (ruleToDelete === null) return;
    setIsLoading(true);
    setError(null);
    try {
      await deleteGSTRule(ruleToDelete);
      await loadRules();
    } catch (err) {
      setError((err as Error).message || "Failed to delete GST rule.");
      console.error(err);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setRuleToDelete(null);
    }
  };

  return (
    // Responsive padding: p-4 for small screens, p-6 for medium and up
    <div className="p-4 md:p-4 bg-gray-50 min-h-screen">
      <header className="mb-6">
        {/* Responsive text size for the header */}
        <h1 className="text-2xl sm:text-3xl font-bold text-primary-600">
          GST Rule Management
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          Manage Goods and Services Tax applicability rules.
        </p>
      </header>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded text-sm">
          Error: {error}
        </div>
      )}

      {/* Button alignment: right on larger screens, potentially full-width or centered on smaller */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => handleOpenForm()}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold py-2 px-3 sm:px-4 rounded-lg shadow-md transition duration-150 ease-in-out flex items-center text-sm sm:text-base"
        >
          <PlusCircleIcon className="h-5 w-5 mr-1 sm:mr-2" />
          Add New Rule
        </button>
      </div>

      {isLoading && (
        <p className="text-center text-gray-500 py-8">Loading rules...</p>
      )}

      {!isLoading && !error && rules.length === 0 && (
        <p className="text-center text-gray-500 py-8">
          No GST rules found. Add one to get started.
        </p>
      )}

      {/* The GSTRuleTable component itself will handle internal responsiveness */}
      {!isLoading && rules.length > 0 && (
        <GSTRuleTable
          rules={rules}
          onEdit={handleOpenForm}
          onDelete={handleDeleteClick}
        />
      )}

      {/* The GSTRuleForm (modal) will handle its own responsiveness */}
      {isFormOpen && (
        <GSTRuleForm
          initialData={editingRule || undefined}
          onSubmit={handleSubmitForm}
          onCancel={handleCloseForm}
          categories={categories}
          isLoading={isLoading}
        />
      )}
      {showDeleteConfirm && ruleToDelete !== null && (
        <ConfirmationModal
          isOpen={showDeleteConfirm}
          title="Confirm Deletion"
          message="Are you sure you want to delete this GST rule? This action cannot be undone."
          onConfirm={confirmDeleteRule}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setRuleToDelete(null);
          }}
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive={true}
        />
      )}
    </div>
  );
};

export default GSTRuleManagement;
