import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Search, 
  Tag, 
  AlertCircle,
  CheckCircle,
  X,
  ArrowLeft,
  Store,
  FolderOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { shopManagementService, Shop, ShopCategory, ShopAttribute, ShopAttributeValue } from '../../../services/shopManagementService';

const ShopAttributes: React.FC = () => {
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [categories, setCategories] = useState<ShopCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<ShopCategory | null>(null);
  const [attributes, setAttributes] = useState<ShopAttribute[]>([]);
  const [attributeValues, setAttributeValues] = useState<Record<number, ShopAttributeValue[]>>({});
  const [expandedAttributes, setExpandedAttributes] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showValueModal, setShowValueModal] = useState(false);
  const [editingAttribute, setEditingAttribute] = useState<ShopAttribute | null>(null);
  const [editingValue, setEditingValue] = useState<ShopAttributeValue | null>(null);
  const [selectedAttributeForValue, setSelectedAttributeForValue] = useState<ShopAttribute | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    type: 'text' as 'text' | 'number' | 'boolean' | 'select' | 'multiselect' | 'color' | 'date',
    attribute_type: 'text' as 'text' | 'number' | 'select' | 'multiselect' | 'boolean',
    description: '',
    is_required: false,
    is_filterable: false,
    sort_order: 0,
    is_active: true
  });
  const [valueFormData, setValueFormData] = useState({
    value: '',
    sort_order: 0,
    is_active: true
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchShops();
  }, []);

  useEffect(() => {
    if (selectedShop) {
      fetchCategories();
    }
  }, [selectedShop]);

  useEffect(() => {
    if (selectedShop && selectedCategory) {
      fetchAttributes();
    }
  }, [selectedShop, selectedCategory]);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const data = await shopManagementService.getShops();
      setShops(data);
    } catch (error) {
      setError('Failed to fetch shops');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    if (!selectedShop) return;
    try {
      const data = await shopManagementService.getCategoriesByShop(selectedShop.shop_id);
      setCategories(data);
    } catch (error) {
      setError('Failed to fetch categories');
    }
  };

  const fetchAttributes = async () => {
    if (!selectedShop || !selectedCategory) return;
    try {
      setLoading(true);
      const data = await shopManagementService.getAttributesByShopCategory(selectedShop.shop_id, selectedCategory.category_id);
      setAttributes(data);
      // Clear any success/error messages when fetching new data
      setSuccess('');
      setError('');
    } catch (error) {
      setError('Failed to fetch attributes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttributeValues = async (attributeId: number) => {
    try {
      const data = await shopManagementService.getAttributeValues(attributeId);
      setAttributeValues(prev => ({ ...prev, [attributeId]: data }));
    } catch (error) {
      console.error('Failed to fetch attribute values:', error);
    }
  };

  const toggleAttributeExpansion = async (attribute: ShopAttribute) => {
    const isExpanded = expandedAttributes.has(attribute.attribute_id);
    
    if (isExpanded) {
      setExpandedAttributes(prev => {
        const newSet = new Set(prev);
        newSet.delete(attribute.attribute_id);
        return newSet;
      });
    } else {
      setExpandedAttributes(prev => new Set(prev).add(attribute.attribute_id));
      if (!attributeValues[attribute.attribute_id]) {
        await fetchAttributeValues(attribute.attribute_id);
      }
    }
  };

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').trim();
  };

  const handleNameChange = (name: string) => {
    setFormData({ 
      ...formData, 
      name,
      slug: editingAttribute ? formData.slug : generateSlug(name)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShop || !selectedCategory) return;

    try {
      setError('');
      
      // Map frontend type to backend attribute_type
      const typeMapping = {
        'text': 'text',
        'number': 'number',
        'boolean': 'boolean',
        'select': 'select',
        'multiselect': 'multiselect',
        'color': 'text',
        'date': 'text'
      } as const;

      // Ensure the type is valid before mapping
      const frontendType = formData.type;
      if (!typeMapping[frontendType]) {
        setError('Invalid attribute type selected');
        return;
      }

      const attributeData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        type: frontendType,
        attribute_type: typeMapping[frontendType],
        is_required: formData.is_required,
        is_filterable: formData.is_filterable,
        sort_order: formData.sort_order,
        is_active: formData.is_active,
        shop_id: selectedShop.shop_id,
        category_id: selectedCategory.category_id
      };

      console.log('Sending attribute data:', attributeData); // Debug log
      console.log('Frontend type:', frontendType, '-> Backend type:', typeMapping[frontendType]); // Debug log

      if (editingAttribute) {
        await shopManagementService.updateAttribute(editingAttribute.attribute_id, attributeData);
        setSuccess('Attribute updated successfully');
      } else {
        await shopManagementService.createAttribute(attributeData);
        setSuccess('Attribute created successfully');
      }

      setShowModal(false);
      setEditingAttribute(null);
      resetForm();
      fetchAttributes();
    } catch (error: any) {
      setError(error.message || 'Operation failed');
    }
  };

  const handleValueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttributeForValue) return;

    try {
      setError('');
      const valueData = {
        ...valueFormData,
        attribute_id: selectedAttributeForValue.attribute_id
      };

      if (editingValue) {
        await shopManagementService.updateAttributeValue(editingValue.value_id, valueData);
        setSuccess('Attribute value updated successfully');
      } else {
        await shopManagementService.createAttributeValue(valueData);
        setSuccess('Attribute value created successfully');
      }

      setShowValueModal(false);
      setEditingValue(null);
      setSelectedAttributeForValue(null);
      resetValueForm();
      fetchAttributeValues(selectedAttributeForValue.attribute_id);
    } catch (error: any) {
      setError(error.message || 'Operation failed');
    }
  };

  const handleEdit = (attribute: ShopAttribute) => {
    setEditingAttribute(attribute);
    setFormData({
      name: attribute.name,
      slug: attribute.slug,
      type: attribute.type,
      attribute_type: attribute.attribute_type,
      description: attribute.description || '',
      is_required: attribute.is_required,
      is_filterable: attribute.is_filterable,
      sort_order: attribute.sort_order,
      is_active: attribute.is_active
    });
    setShowModal(true);
  };

  const handleEditValue = (value: ShopAttributeValue, attribute: ShopAttribute) => {
    setEditingValue(value);
    setSelectedAttributeForValue(attribute);
    setValueFormData({
      value: value.value,
      sort_order: value.sort_order,
      is_active: value.is_active
    });
    setShowValueModal(true);
  };

  const handleAddValue = (attribute: ShopAttribute) => {
    setSelectedAttributeForValue(attribute);
    setShowValueModal(true);
  };

  const handleDelete = async (attributeId: number) => {
    if (!confirm('Are you sure you want to delete this attribute?')) return;
    try {
      await shopManagementService.deleteAttribute(attributeId);
      setSuccess('Attribute deleted successfully');
      fetchAttributes();
    } catch (error: any) {
      setError(error.message || 'Failed to delete attribute');
    }
  };

  const handleDeleteValue = async (valueId: number, attributeId: number) => {
    if (!confirm('Are you sure you want to delete this attribute value?')) return;
    try {
      await shopManagementService.deleteAttributeValue(valueId);
      setSuccess('Attribute value deleted successfully');
      fetchAttributeValues(attributeId);
    } catch (error: any) {
      setError(error.message || 'Failed to delete attribute value');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      type: 'text',
      attribute_type: 'text',
      description: '',
      is_required: false,
      is_filterable: false,
      sort_order: 0,
      is_active: true
    });
  };

  const resetValueForm = () => {
    setValueFormData({
      value: '',
      sort_order: 0,
      is_active: true
    });
  };

  const filteredAttributes = attributes.filter(attribute =>
    attribute.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Shop Selection View
  if (!selectedShop) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Shop Attributes</h1>
          <p className="text-gray-600">Select a shop to manage its attributes</p>
        </div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <button
              key={shop.shop_id}
              onClick={() => setSelectedShop(shop)}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Store className="text-primary-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{shop.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    shop.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {shop.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Category Selection View
  if (!selectedCategory) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedShop(null)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>Back to Shops</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedShop.name} - Categories</h1>
              <p className="text-gray-600">Select a category to manage its attributes</p>
            </div>
          </div>
        </div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => (
            <button
              key={category.category_id}
              onClick={() => setSelectedCategory(category)}
              className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow text-left"
            >
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FolderOpen className="text-blue-500" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    category.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {category.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Attributes Management View
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 self-start"
          >
            <ArrowLeft size={20} />
            <span>Back to Categories</span>
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
              {selectedShop.name} {'>'} {selectedCategory.name} - Attributes
            </h1>
            <p className="text-gray-600 text-sm sm:text-base">Manage attributes for this category</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <Plus size={20} />
          <span>Add Attribute</span>
        </button>
      </div>

      {/* Messages */}
      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search attributes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Attributes List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAttributes.map((attribute) => (
            <div key={attribute.attribute_id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-start sm:items-center space-x-4">
                    <button
                      onClick={() => toggleAttributeExpansion(attribute)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mt-1 sm:mt-0"
                    >
                      {expandedAttributes.has(attribute.attribute_id) ? (
                        <ChevronDown size={20} />
                      ) : (
                        <ChevronRight size={20} />
                      )}
                    </button>
                    <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                      <Tag className="text-indigo-500" size={24} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 break-words">{attribute.name}</h3>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-sm text-gray-500">Type: {attribute.type}</span>
                        {attribute.is_required && (
                          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Required</span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          attribute.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {attribute.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button
                      onClick={() => handleAddValue(attribute)}
                      className="px-3 py-1.5 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center space-x-1"
                    >
                      <Plus size={16} />
                      <span className="hidden sm:inline">Add Value</span>
                      <span className="sm:hidden">Value</span>
                    </button>
                    <button
                      onClick={() => handleEdit(attribute)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center justify-center"
                    >
                      <Edit2 size={16} />
                      <span className="sm:hidden ml-1">Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(attribute.attribute_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                      <span className="sm:hidden ml-1">Delete</span>
                    </button>
                  </div>
                </div>
                
                {attribute.description && (
                  <p className="mt-2 ml-0 sm:ml-10 text-gray-600 text-sm break-words">{attribute.description}</p>
                )}

                {/* Attribute Values */}
                {expandedAttributes.has(attribute.attribute_id) && (
                  <div className="mt-4 ml-0 sm:ml-10">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Attribute Values</h4>
                    {attributeValues[attribute.attribute_id]?.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {attributeValues[attribute.attribute_id].map((value) => (
                          <div key={value.value_id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-gray-50 p-3 rounded-lg space-y-2 sm:space-y-0">
                            <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                              <span className="text-sm font-medium break-words">{value.value}</span>
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full self-start ${
                                value.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                                {value.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="flex space-x-1 self-start sm:self-auto">
                              <button
                                onClick={() => handleEditValue(value, attribute)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded flex items-center justify-center"
                              >
                                <Edit2 size={14} />
                                <span className="sm:hidden ml-1 text-xs">Edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteValue(value.value_id, attribute.attribute_id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded flex items-center justify-center"
                              >
                                <Trash2 size={14} />
                                <span className="sm:hidden ml-1 text-xs">Delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No values added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredAttributes.length === 0 && !loading && (
        <div className="text-center py-12 px-4">
          <Tag className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No attributes found</h3>
          <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
            {searchTerm ? 'Try adjusting your search criteria' : 'Get started by creating a new attribute'}
          </p>
        </div>
      )}

      {/* Attribute Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg md:max-w-xl lg:max-w-2xl xl:max-w-3xl max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold">
                {editingAttribute ? 'Edit Attribute' : 'Add New Attribute'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Attribute Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter attribute name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Slug *</label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter attribute slug"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type *</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="select">Select</option>
                    <option value="multiselect">Multi-select</option>
                    <option value="color">Color</option>
                    <option value="date">Date</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Enter attribute description"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                    <input
                      type="number"
                      value={formData.sort_order}
                      onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  <div className="flex flex-col justify-center">
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_required"
                          checked={formData.is_required}
                          onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_required" className="ml-2 block text-sm text-gray-900">Required</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_filterable"
                          checked={formData.is_filterable}
                          onChange={(e) => setFormData({ ...formData, is_filterable: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_filterable" className="ml-2 block text-sm text-gray-900">Filterable</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="is_active"
                          checked={formData.is_active}
                          onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">Active</label>
                      </div>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
                </div>

                {/* Fixed Footer */}
                <div className="border-t p-4 sm:p-6 bg-gray-50 shrink-0">
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                    >
                      {editingAttribute ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Attribute Value Modal */}
      {showValueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] flex flex-col">
            {/* Fixed Header */}
            <div className="flex justify-between items-center p-4 sm:p-6 border-b shrink-0">
              <h2 className="text-lg sm:text-xl font-semibold">
                {editingValue ? 'Edit Attribute Value' : 'Add Attribute Value'}
              </h2>
              <button 
                onClick={() => {
                  setShowValueModal(false);
                  setEditingValue(null);
                  setSelectedAttributeForValue(null);
                  resetValueForm();
                }} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleValueSubmit} className="p-4 sm:p-6">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Value *</label>
                    <input
                      type="text"
                      required
                      value={valueFormData.value}
                      onChange={(e) => setValueFormData({ ...valueFormData, value: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Enter attribute value"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
                      <input
                        type="number"
                        value={valueFormData.sort_order}
                        onChange={(e) => setValueFormData({ ...valueFormData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="flex items-center justify-center">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="value_is_active"
                          checked={valueFormData.is_active}
                          onChange={(e) => setValueFormData({ ...valueFormData, is_active: e.target.checked })}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                        <label htmlFor="value_is_active" className="ml-2 block text-sm text-gray-900">Active</label>
                      </div>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                      {error}
                    </div>
                  )}
                </div>

                {/* Fixed Footer */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowValueModal(false);
                        setEditingValue(null);
                        setSelectedAttributeForValue(null);
                        resetValueForm();
                      }}
                      className="w-full sm:w-auto px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="w-full sm:w-auto px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg"
                    >
                      {editingValue ? 'Update' : 'Create'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopAttributes;
