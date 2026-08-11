import React, { useState, useEffect } from "react";
import { ShopGSTRule, BasicShop } from "../../../types/shopGST";
import { fetchShopGSTRules } from "../../../services/superadmin/shopGSTService";
import ShopGSTRuleForm from "./ShopGSTRuleForm";
import ShopGSTRuleTable from "./ShopGSTRuleTable";
import ShopSelector from "./ShopSelector";

const ShopGSTManagement: React.FC = () => {
  const [rules, setRules] = useState<ShopGSTRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<ShopGSTRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ShopGSTRule | null>(null);
  
  // Filters
  const [filterShop, setFilterShop] = useState<BasicShop | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadRules();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [rules, filterShop, searchTerm]);

  const loadRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedRules = await fetchShopGSTRules();
      setRules(fetchedRules);
    } catch (err) {
      console.error("Error loading GST rules:", err);
      setError(err instanceof Error ? err.message : "Failed to load GST rules");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...rules];

    // Filter by shop
    if (filterShop) {
      filtered = filtered.filter(rule => rule.shop_id === filterShop.shop_id);
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(term) ||
        rule.shop_name?.toLowerCase().includes(term) ||
        rule.category_name?.toLowerCase().includes(term)
      );
    }

    setFilteredRules(filtered);
  };

  const handleCreateNew = () => {
    setEditingRule(null);
    setShowForm(true);
  };

  const handleEdit = (rule: ShopGSTRule) => {
    setEditingRule(rule);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingRule(null);
    loadRules(); // Refresh the list
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingRule(null);
  };

  const clearFilters = () => {
    setFilterShop(null);
    setSearchTerm("");
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <ShopGSTRuleForm
          rule={editingRule}
          onSuccess={handleFormSuccess}
          onCancel={handleFormCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Shop GST Management
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage GST rules for shop products and orders
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={handleCreateNew}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 dark:bg-primary-500 hover:bg-primary-700 dark:hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create GST Rule
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end sm:space-x-4 space-y-4 sm:space-y-0">
            {/* Search */}
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Rules
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by rule name, shop, or category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:border-transparent transition-colors duration-200"
              />
            </div>

            {/* Shop Filter */}
            <div className="w-full sm:w-64">
              <ShopSelector
                selectedShopId={filterShop?.shop_id || null}
                onShopChange={setFilterShop}
                disabled={loading}
              />
            </div>

            {/* Clear Filters */}
            {(filterShop || searchTerm) && (
              <div>
                <button
                  onClick={clearFilters}
                  className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>

          {/* Filter Summary */}
          {(filterShop || searchTerm) && (
            <div className="mt-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-md">
              <div className="flex flex-wrap items-center gap-2 text-sm text-primary-800 dark:text-primary-200">
                <span>Filters active:</span>
                {filterShop && (
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-800 rounded-md">
                    Shop: {filterShop.name}
                  </span>
                )}
                {searchTerm && (
                  <span className="px-2 py-1 bg-primary-100 dark:bg-primary-800 rounded-md">
                    Search: "{searchTerm}"
                  </span>
                )}
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  ({filteredRules.length} of {rules.length} rules shown)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Error loading GST rules
              </h3>
              <div className="mt-2">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {error}
                </p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadRules}
                  className="bg-red-100 dark:bg-red-800 px-3 py-2 rounded-md text-sm font-medium text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-700 transition-colors duration-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      {!error && !loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/20 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Rules</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{rules.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Rules</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {rules.filter(r => r.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/20 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Inactive Rules</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {rules.filter(r => !r.is_active).length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-md flex items-center justify-center">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unique Shops</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                  {new Set(rules.map(r => r.shop_id)).size}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rules Table */}
      <ShopGSTRuleTable
        rules={filteredRules}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={loadRules}
      />
    </div>
  );
};

export default ShopGSTManagement;
