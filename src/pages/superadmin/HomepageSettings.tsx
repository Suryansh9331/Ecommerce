import React, { useState, useEffect } from 'react';
import { PlusCircle, X, ChevronDown, ChevronUp, Save, Upload, Link as LinkIcon, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const FRONTEND_BASE_URL = import.meta.env.VITE_FRONTEND_BASE_URL ;

interface ICategory {
    category_id: number;
    name: string;
    slug: string;
    description?: string;
    parent_id?: number;
    icon_url?: string;
    created_at: string;
    updated_at: string;
    subcategories?: ICategory[];
}

interface IHomepageCategory {
    id: number;
    category_id: number;
    display_order: number;
    is_active: boolean;
    category: ICategory;
    created_at: string;
    updated_at: string;
}

interface IBrand {
    brand_id: number;
    name: string;
    slug: string;
    icon_url?: string;
    created_at: string;
    updated_at: string;
}

interface IProduct {
    product_id: number;
    name: string;
    slug: string;
    image_url?: string;
    price: number;
    brand_id: number;
    category_id: number;
    created_at: string;
    updated_at: string;
    product_name: string;
}

type SlotType = 'sidebar_right' | 'bottom_left' | 'bottom_right';

interface ICarouselItem {
    id: number;
    type: 'brand' | 'product' | 'promo' | 'new' | 'featured' | SlotType;
    image_url: string;
    target_id: number;
    display_order: number;
    is_active: boolean;
    shareable_link?: string;
    orientation?: 'horizontal' | 'vertical';
}

const SLOT_CONFIG: Record<SlotType, { label: string; orientation: 'horizontal' | 'vertical'; size: string; area: string }> = {
    sidebar_right: { label: 'Right Sidebar', orientation: 'vertical', size: '368 × 564 px (tall / portrait)', area: 'Right column of the hero' },
    bottom_left: { label: 'Bottom Left', orientation: 'horizontal', size: '~800 × 172 px (wide)', area: 'Bottom-left of the hero' },
    bottom_right: { label: 'Bottom Right', orientation: 'horizontal', size: '~800 × 172 px (wide)', area: 'Bottom-right of the hero' },
};

const SLOT_KEYS: SlotType[] = ['sidebar_right', 'bottom_left', 'bottom_right'];

const HomepageSettings: React.FC = () => {
    const [categories, setCategories] = useState<ICategory[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
    const [brands, setBrands] = useState<IBrand[]>([]);
    const [products, setProducts] = useState<IProduct[]>([]);
    const [brandCarousel, setBrandCarousel] = useState<ICarouselItem[]>([]);
    const [productCarousel, setProductCarousel] = useState<ICarouselItem[]>([]);
    const [verticalCarousel, setVerticalCarousel] = useState<ICarouselItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [selectedType, setSelectedType] = useState<'brand' | 'product'>('brand');
    const [selectedTarget, setSelectedTarget] = useState<number | null>(null);
    const [shareableLink, setShareableLink] = useState<string>('');
    const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
    const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
    const [shareableBrandLink, setShareableBrandLink] = useState<string>('');
    const [shareableProductLink, setShareableProductLink] = useState<string>('');
    const [carouselItems, setCarouselItems] = useState<ICarouselItem[]>([]);
    const [selectedProductGroup, setSelectedProductGroup] = useState<'promo' | 'new' | 'featured'>('promo');
    const [editingCarousel, setEditingCarousel] = useState<ICarouselItem | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    // Side & bottom positional banners
    const [slotBanners, setSlotBanners] = useState<ICarouselItem[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<SlotType>('sidebar_right');
    const [slotImage, setSlotImage] = useState<File | null>(null);
    const [slotLink, setSlotLink] = useState<string>('');
    const [previewMain, setPreviewMain] = useState(0); // live-rotating index for the preview main carousel

    useEffect(() => {
        fetchCategories();
        fetchFeaturedCategories();
        fetchBrands();
        fetchProducts();
        fetchCarousels();
        fetchCarouselItems();
    }, []);

    // Auto-rotate the preview's main carousel, mirroring the real hero (3s)
    useEffect(() => {
        if (brandCarousel.length < 2) return;
        const id = setInterval(() => {
            setPreviewMain((p) => (p + 1) % brandCarousel.length);
        }, 3000);
        return () => clearInterval(id);
    }, [brandCarousel.length]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/categories/main`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.status === 401) {
                toast.error('Session expired. Please login again.');
                return;
            }

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Failed to fetch categories');
        } finally {
            setLoading(false);
        }
    };

    const fetchFeaturedCategories = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/homepage/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch featured categories');
            }

            const data: IHomepageCategory[] = await response.json();
            setSelectedCategories(data.map(cat => cat.category_id));
        } catch (error) {
            console.error('Error fetching featured categories:', error);
            toast.error('Failed to fetch featured categories');
        }
    };

    const fetchBrands = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/brands`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch brands');
            }

            const data = await response.json();
            setBrands(data);
        } catch (error) {
            console.error('Error fetching brands:', error);
            toast.error('Failed to fetch brands');
        }
    };

    const fetchProducts = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/products`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            // console.log('API /products response:', data);
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to fetch products');
        }
    };

    const fetchCarousels = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch carousels');
            }

            const data = await response.json();
            // Filter by type AND orientation
            setBrandCarousel(data.filter((item: ICarouselItem) => 
                item.type === 'brand' && (!item.orientation || item.orientation === 'horizontal')
            ));
            setProductCarousel(data.filter((item: ICarouselItem) => 
                (item.type === 'promo' || item.type === 'new' || item.type === 'featured') && 
                (!item.orientation || item.orientation === 'horizontal')
            ));
            setVerticalCarousel(data.filter((item: ICarouselItem) =>
                item.orientation === 'vertical'
            ));
            setSlotBanners(data.filter((item: ICarouselItem) =>
                SLOT_KEYS.includes(item.type as SlotType)
            ));
        } catch (error) {
            console.error('Error fetching carousels:', error);
            toast.error('Failed to fetch carousels');
        }
    };

    const fetchCarouselItems = async () => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) return;
            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (!response.ok) throw new Error('Failed to fetch carousel items');
            const data = await response.json();
            setCarouselItems(data);
        } catch (error) {
            console.error('Error fetching carousel items:', error);
        }
    };

    const toggleCategoryExpand = (categoryId: number) => {
        setExpandedCategories(prev => ({
            ...prev,
            [categoryId]: !prev[categoryId]
        }));
    };

    const handleCategorySelect = (categoryId: number) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };

    const handleSaveSettings = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/homepage/categories`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category_ids: selectedCategories
                })
            });

            if (!response.ok) {
                throw new Error('Failed to save homepage settings');
            }

            toast.success('Homepage settings saved successfully');
        } catch (error) {
            console.error('Error saving homepage settings:', error);
            toast.error('Failed to save homepage settings');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedImage(file);
        }
    };

    const generateShareableLink = (type: 'brand' | 'product' | 'promo' | 'new' | 'featured', targetId: number) => {
        if (type === 'brand') {
            const brand = brands.find(b => b.brand_id === targetId);
            return brand ? `${FRONTEND_BASE_URL}/all-products?brand=${brand.slug}` : '';
        } else if (type === 'product') {
            const product = products.find(p => p.product_id === targetId);
            return product ? `${FRONTEND_BASE_URL}/product/${product.product_id}` : '';
        } else {
            // Handle product groups
            switch (type) {
                case 'promo':
                    return `${FRONTEND_BASE_URL}/promo-products`;
                case 'new':
                    return `${FRONTEND_BASE_URL}/new-product`;
                case 'featured':
                    return `${FRONTEND_BASE_URL}/featured-products`;
                default:
                    return '';
            }
        }
    };

    const handleCarouselUpload = async (
        carouselType: 'brand' | 'product' | 'promo' | 'new' | 'featured',
        orientation: 'horizontal' | 'vertical' = 'horizontal'
    ) => {
        const selectedId = carouselType === 'brand' ? selectedBrand : 1;
        if (!selectedId && carouselType === 'brand') {
            toast.error('Please select a brand');
            return;
        }
        const link = carouselType === 'brand' ? shareableBrandLink : generateShareableLink(carouselType, 1);
        if (!selectedImage || !link) {
            toast.error('Please select an image and ensure a shareable link is generated.');
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }
            const formData = new FormData();
            formData.append('type', carouselType);
            formData.append('target_id', selectedId.toString());
            formData.append('shareable_link', link);
            formData.append('image', selectedImage);
            formData.append('orientation', orientation); // Pass orientation parameter
            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                throw new Error('Failed to upload carousel item');
            }
            toast.success('Carousel item uploaded successfully');
            setSelectedImage(null);
            if (carouselType === 'brand') {
                setSelectedBrand(null);
                setShareableBrandLink('');
            } else {
                setSelectedProductGroup('promo');
            }
        } catch (error) {
            console.error('Error uploading carousel item:', error);
            toast.error('Failed to upload carousel item');
        } finally {
            setLoading(false);
        }
    };

    const handleSlotImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSlotImage(file);
        }
    };

    const handleSlotBannerUpload = async () => {
        if (!slotImage) {
            toast.error('Please select an image');
            return;
        }
        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }
            const formData = new FormData();
            formData.append('type', selectedSlot);
            formData.append('orientation', SLOT_CONFIG[selectedSlot].orientation);
            formData.append('target_id', '0');
            if (slotLink.trim()) {
                formData.append('shareable_link', slotLink.trim());
            }
            formData.append('image', slotImage);

            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            if (!response.ok) {
                throw new Error('Failed to upload banner');
            }
            toast.success(`${SLOT_CONFIG[selectedSlot].label} banner added successfully`);
            setSlotImage(null);
            setSlotLink('');
            fetchCarousels();
            fetchCarouselItems();
        } catch (error) {
            console.error('Error uploading slot banner:', error);
            toast.error('Failed to upload banner');
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveFromCarousel = async (itemId: number) => {
        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to remove item from carousel');
            }

            toast.success('Item removed from carousel successfully');
            fetchCarousels();
        } catch (error) {
            console.error('Error removing item from carousel:', error);
            toast.error('Failed to remove item from carousel');
        }
    };

    const renderCategoryItem = (category: ICategory, level: number = 0) => {
        const isExpanded = expandedCategories[category.category_id] || false;
        const hasSubcategories = category.subcategories && category.subcategories.length > 0;
        const isSelected = selectedCategories.includes(category.category_id);

        return (
            <div key={category.category_id} className="mb-2">
                <div
                    className={`flex items-center p-3 rounded-lg ${isSelected ? 'bg-primary-600 bg-opacity-10' : 'hover:bg-gray-50'
                        }`}
                    style={{ paddingLeft: `${level * 2 + 1}rem` }}
                >
                    {hasSubcategories && (
                        <button
                            onClick={() => toggleCategoryExpand(category.category_id)}
                            className="p-1 rounded-full hover:bg-gray-200 mr-2"
                        >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                    )}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center sm:justify-between gap-4 flex-1">
                        <div className='flex flex-row gap-2'>
                            {category.icon_url && (
                                <img
                                    src={category.icon_url}
                                    alt={category.name}
                                    className="w-8 h-8 mr-3 rounded-full"
                                />
                            )}
                            <div className="flex-1">
                                <h3 className="font-medium">{category.name}</h3>
                                <p className="text-sm text-gray-500">{category.slug}</p>
                            </div>
                        </div>
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleCategorySelect(category.category_id)}
                                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-600"
                            />
                            <span className="text-sm text-gray-600">Show on homepage</span>
                        </label>
                    </div>
                </div>

                {isExpanded && hasSubcategories && (
                    <div className="mt-2">
                        {category.subcategories?.map(subcategory =>
                            renderCategoryItem(subcategory, level + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Reorder banners within a single slot/group via the /carousels/order endpoint.
    // Order is only meaningful within a group, so we reindex just that group 0..n.
    const reorderWithinGroup = async (group: ICarouselItem[], index: number, direction: -1 | 1) => {
        const target = index + direction;
        if (target < 0 || target >= group.length) return;
        const reordered = [...group];
        [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
        const order = reordered.map((item, idx) => ({ id: item.id, display_order: idx }));
        const orderMap = new Map(order.map((o) => [o.id, o.display_order]));

        // Optimistic update — reindex the affected items in place so the list
        // reorders instantly without triggering the full-page loading spinner.
        const applyOrder = (arr: ICarouselItem[]) =>
            arr.map((it) => (orderMap.has(it.id) ? { ...it, display_order: orderMap.get(it.id)! } : it));
        setBrandCarousel((prev) => applyOrder(prev));
        setProductCarousel((prev) => applyOrder(prev));
        setSlotBanners((prev) => applyOrder(prev));

        try {
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }
            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels/order`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ order }),
            });
            if (!response.ok) throw new Error('Failed to update order');
        } catch (error) {
            console.error('Error reordering banners:', error);
            toast.error('Failed to update order');
            fetchCarousels(); // revert to server state on failure
        }
    };

    // Small up/down reorder control shown inside each slot's banner list
    const orderButtons = (group: ICarouselItem[], index: number) => (
        <div className="flex flex-col">
            <button
                type="button"
                disabled={index === 0}
                onClick={() => reorderWithinGroup(group, index, -1)}
                className="p-0.5 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move up"
            >
                <ChevronUp size={16} />
            </button>
            <button
                type="button"
                disabled={index === group.length - 1}
                onClick={() => reorderWithinGroup(group, index, 1)}
                className="p-0.5 text-gray-500 hover:text-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Move down"
            >
                <ChevronDown size={16} />
            </button>
        </div>
    );

    const handleEditCarousel = (item: ICarouselItem) => {
        setEditingCarousel(item);
        setSelectedImage(null);
        if (item.type === 'brand') {
            setSelectedBrand(item.target_id);
            setShareableBrandLink(item.shareable_link || '');
        } else if (['promo', 'new', 'featured'].includes(item.type)) {
            setSelectedProductGroup(item.type as 'promo' | 'new' | 'featured');
            setShareableProductLink(generateShareableLink(item.type as 'promo' | 'new' | 'featured', 1));
        }
        setIsEditing(true);
    };

    const handleUpdateCarousel = async () => {
        if (!editingCarousel) return;

        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const formData = new FormData();
            const type = editingCarousel.type === 'brand' ? 'brand' : selectedProductGroup;
            formData.append('type', type);
            formData.append('target_id', editingCarousel.type === 'brand' ? selectedBrand?.toString() || '1' : '1');
            formData.append('shareable_link', generateShareableLink(type, editingCarousel.type === 'brand' ? selectedBrand || 1 : 1));

            if (selectedImage) {
                formData.append('image', selectedImage);
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels/${editingCarousel.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update carousel item');
            }

            toast.success('Carousel item updated successfully');
            setEditingCarousel(null);
            setIsEditing(false);
            setSelectedImage(null);
            setSelectedBrand(null);
            setSelectedProductGroup('promo');
            setShareableBrandLink('');
            fetchCarousels();
            fetchCarouselItems();
        } catch (error) {
            console.error('Error updating carousel item:', error);
            toast.error('Failed to update carousel item');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteCarousel = async (itemId: number) => {
        if (!window.confirm('Are you sure you want to delete this carousel item?')) {
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem('access_token');
            if (!token) {
                toast.error('Authentication token not found. Please login again.');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/api/superadmin/carousels/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to delete carousel item');
            }

            toast.success('Carousel item deleted successfully');
            fetchCarousels();
            fetchCarouselItems();
        } catch (error) {
            console.error('Error deleting carousel item:', error);
            toast.error('Failed to delete carousel item');
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setEditingCarousel(null);
        setIsEditing(false);
        setSelectedImage(null);
        setSelectedBrand(null);
        setSelectedProductGroup('promo');
        setShareableBrandLink('');
    };

    // Jump to a banner uploader section (and select the slot for side/bottom banners)
    const scrollToBanner = (targetId: string, slot?: SlotType) => {
        if (slot) setSelectedSlot(slot);
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const sortByOrder = (arr: ICarouselItem[]) => [...arr].sort((a, b) => a.display_order - b.display_order);
    const rightBanners = sortByOrder(slotBanners.filter((b) => b.type === 'sidebar_right'));
    const bottomLeftBanners = sortByOrder(slotBanners.filter((b) => b.type === 'bottom_left'));
    const bottomRightBanners = sortByOrder(slotBanners.filter((b) => b.type === 'bottom_right'));

    // Slots for the live hero-grid preview (mirrors the homepage Hero layout)
    type PreviewCfg = { label: string; img?: string; count: number; target: string; slot?: SlotType; cta?: string; activeDot?: number };
    const brandSorted = sortByOrder(brandCarousel);
    const pv: Record<'left' | 'main' | 'right' | 'bottom1' | 'bottom2', PreviewCfg> = {
        left: { label: 'Left Panel', img: sortByOrder(productCarousel)[0]?.image_url, count: productCarousel.length, target: 'banner-left' },
        main: {
            label: 'Main',
            img: brandSorted[previewMain % Math.max(1, brandSorted.length)]?.image_url,
            count: brandCarousel.length,
            target: 'banner-main',
            cta: 'Explore',
            activeDot: brandCarousel.length ? previewMain % brandCarousel.length : 0,
        },
        right: { label: 'Right', img: rightBanners[0]?.image_url, count: rightBanners.length, target: 'banner-slots', slot: 'sidebar_right' },
        bottom1: { label: 'Bottom L', img: bottomLeftBanners[0]?.image_url, count: bottomLeftBanners.length, target: 'banner-slots', slot: 'bottom_left' },
        bottom2: { label: 'Bottom R', img: bottomRightBanners[0]?.image_url, count: bottomRightBanners.length, target: 'banner-slots', slot: 'bottom_right' },
    };

    const renderPreviewSlot = (cfg: PreviewCfg, area?: string) => {
        const isSelected = cfg.slot && cfg.slot === selectedSlot;
        return (
            <button
                type="button"
                onClick={() => scrollToBanner(cfg.target, cfg.slot)}
                style={area ? { gridArea: area } : undefined}
                title={`${cfg.label}${cfg.count ? ` — ${cfg.count} banner(s)` : ' — empty'} (click to manage)`}
                className={`group relative rounded-lg overflow-hidden border transition-all hover:ring-2 hover:ring-primary-600 w-full h-full ${
                    cfg.img ? 'border-gray-200' : 'border-dashed border-gray-300 bg-white'
                } ${isSelected ? 'ring-2 ring-primary-600' : ''}`}
            >
                {cfg.img ? (
                    <img src={cfg.img} alt={cfg.label} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <PlusCircle className="w-6 h-6 mb-1" />
                        <span className="text-xs">Empty — click to add</span>
                    </div>
                )}

                {/* Non-navigating CTA button, mirroring the real hero */}
                {cfg.cta && cfg.img && (
                    <span className="pointer-events-none absolute bottom-7 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1.5 rounded-md text-sm font-medium shadow-md">
                        {cfg.cta}
                    </span>
                )}

                {/* Pagination dots for the rotating main */}
                {cfg.img && typeof cfg.activeDot === 'number' && cfg.count > 1 && (
                    <span className="pointer-events-none absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1">
                        {Array.from({ length: cfg.count }).map((_, i) => (
                            <span
                                key={i}
                                className={`h-1.5 w-2.5 rounded-full ${i === cfg.activeDot ? 'bg-primary-600' : 'bg-primary-600/50'}`}
                            />
                        ))}
                    </span>
                )}

                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/60 text-white text-[10px] font-medium leading-none">
                    {cfg.label}{cfg.count > 1 ? ` ·${cfg.count}` : ''}
                </span>
            </button>
        );
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-4 sm:px-6 py-6">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center mb-6">
                <h1 className="text-2xl font-bold">Homepage Settings</h1>
                <button
                    onClick={handleSaveSettings}
                    disabled={loading}
                    className="bg-primary-600 text-white px-4 py-2 rounded flex items-center hover:bg-primary-700 transition-colors disabled:opacity-50"
                >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                </button>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Featured Categories</h2>
                    <p className="text-sm text-gray-500">
                        Select the categories you want to display on the homepage. Selected categories and their subcategories will be visible to users.
                    </p>
                </div>

                <div className="border rounded-lg p-4">
                    {categories.length > 0 ? (
                        <div className="space-y-2">
                            {categories.map(category => renderCategoryItem(category))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded">
                            <p className="text-gray-500">No categories found</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium mb-2">Selected Categories</h3>
                    {selectedCategories.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {selectedCategories.map(categoryId => {
                                const category = categories.find(c => c.category_id === categoryId);
                                return category ? (
                                    <div
                                        key={categoryId}
                                        className="bg-white px-3 py-1 rounded-full text-sm flex items-center"
                                    >
                                        {category.name}
                                        <button
                                            onClick={() => handleCategorySelect(categoryId)}
                                            className="ml-2 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ) : null;
                            })}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No categories selected</p>
                    )}
                </div>
            </div>

            {/* Live Hero Preview - mirrors the homepage hero grid */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                    <h2 className="text-xl font-bold text-gray-800">Live Hero Preview</h2>
                    <span className="text-xs text-gray-500">Click any slot to jump to its uploader</span>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                    A live mirror of how banners appear on the homepage hero (desktop layout). Empty slots are shown as dashed placeholders.
                </p>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 sm:p-4 overflow-x-auto">
                    {/*
                      Ratio-based layout: fr columns/rows preserve the real hero proportions
                      (270 : 1fr(994) : 368 columns, 367 : 172 rows), and aspect-ratio makes
                      the whole preview scale to the available dashboard width.
                    */}
                    <div
                        className="grid w-full mx-auto"
                        style={{
                            minWidth: 600,
                            maxWidth: 1280,
                            aspectRatio: '1680 / 563',
                            gap: '1.2%',
                            gridTemplateAreas: `'left main right' 'left bottoms right'`,
                            gridTemplateColumns: '270fr 994fr 368fr',
                            gridTemplateRows: '367fr 172fr',
                        }}
                    >
                        {renderPreviewSlot(pv.left, 'left')}
                        {renderPreviewSlot(pv.main, 'main')}
                        {renderPreviewSlot(pv.right, 'right')}
                        <div style={{ gridArea: 'bottoms' }} className="grid grid-cols-2 gap-[1.2%]">
                            {renderPreviewSlot(pv.bottom1)}
                            {renderPreviewSlot(pv.bottom2)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Carousel Section - Brand Banners */}
            <div id="banner-main" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Main Carousel</h2>
                        <p className="text-sm text-gray-600">Brand banners displayed in the center/main carousel section</p>
                    </div>
                    <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                        Center Area
                    </div>
                </div>
                
                <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-blue-900 mb-1">Recommended Image Size</p>
                            <p className="text-sm text-blue-800">
                                <strong>1920 x 450 px</strong> or larger with wide aspect ratio (16:9, 21:9, or wider)
                            </p>
                            <p className="text-xs text-blue-700 mt-1">This banner appears in the main horizontal carousel at the center of the homepage</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Image size suggestion for Brand Carousel */}
                    <div className="mb-2 p-2 bg-blue-50 border-l-4 border-blue-400 rounded text-sm text-blue-800">
                        <strong>📐 Horizontal Banner:</strong> Use images that are at least <b>1920 x 450 px</b> or larger, with a wide aspect ratio (16:9, 21:9, or wider). This banner appears in the main horizontal carousel section.
                    </div>
                    <div className="flex items-center space-x-4">
                            <label className="flex-1">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Upload Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full"
                                />
                            </label>
                            <label className="flex-1">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Select Brand</span>
                                <select
                                    value={selectedBrand || ''}
                                    onChange={(e) => {
                                        const value = Number(e.target.value);
                                        setSelectedBrand(value);
                                        if (value) {
                                            const link = generateShareableLink('brand', value);
                                            setShareableBrandLink(link);
                                        } else {
                                            setShareableBrandLink('');
                                        }
                                    }}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="">Select a brand</option>
                                    {brands.map((brand) => (
                                        <option key={brand.brand_id} value={brand.brand_id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                    </div>
                    {selectedBrand && shareableBrandLink && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Shareable Link</span>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={shareableBrandLink}
                                        readOnly
                                        className="flex-1 p-2 border rounded text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareableBrandLink);
                                            toast.success('Link copied to clipboard');
                                        }}
                                        className="bg-gray-200 p-2 rounded hover:bg-gray-300"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    <button
                        onClick={() => handleCarouselUpload('brand', 'horizontal')}
                        className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-blue-700 transition-colors shadow-md font-medium"
                        disabled={loading || !selectedBrand || !selectedImage}
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        {loading ? 'Uploading...' : 'Add Brand Banner to Main Carousel'}
                    </button>
                    
                    {/* Uploaded Main Carousel Banners */}
                    {brandCarousel.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                                Current Main Carousel Banners ({brandCarousel.length})
                            </h3>
                            <div className="space-y-2">
                                {sortByOrder(brandCarousel).map((item, index, group) => {
                                    const brand = brands.find(b => b.brand_id === item.target_id);
                                    return (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <img src={item.image_url} alt={brand?.name} className="w-12 h-12 object-cover rounded border border-gray-300" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{brand?.name || 'Unknown Brand'}</p>
                                                    <p className="text-xs text-gray-500">Display Order: {item.display_order}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {orderButtons(group, index)}
                                                <button
                                                    onClick={() => handleEditCarousel(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit banner"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCarousel(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete banner"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Left Panel Carousel Section - Product Group Banners */}
            <div id="banner-left" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Left Panel Carousel</h2>
                        <p className="text-sm text-gray-600">Product group banners displayed in the left side panel (TopSelling section)</p>
                    </div>
                    <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                        Left Side Panel
                    </div>
                </div>
                
                <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 rounded">
                    <div className="flex items-start">
                        <div className="flex-shrink-0 mr-3">
                            <svg className="w-5 h-5 text-green-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-green-900 mb-1">Recommended Image Size</p>
                            <p className="text-sm text-green-800">
                                <strong>270 x 367 px</strong> or maintain vertical/tall aspect ratio
                            </p>
                            <p className="text-xs text-green-700 mt-1">This banner appears in the left side panel carousel (TopSelling section)</p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <label className="flex-1">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Upload Image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full"
                                />
                            </label>
                            <label className="flex-1">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Select Product Group</span>
                                <select
                                    value={selectedProductGroup}
                                    onChange={(e) => {
                                        const value = e.target.value as 'promo' | 'new' | 'featured';
                                        setSelectedProductGroup(value);
                                        setShareableProductLink(generateShareableLink(value, 1));
                                    }}
                                    className="w-full p-2 border rounded"
                                >
                                    <option value="promo">Promo Products</option>
                                    <option value="new">New Products</option>
                                    <option value="featured">Featured Products</option>
                                </select>
                            </label>
                        </div>
                        {selectedProductGroup && (
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <span className="block text-sm font-medium text-gray-700 mb-1">Shareable Link</span>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={shareableProductLink}
                                        readOnly
                                        className="flex-1 p-2 border rounded text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(shareableProductLink);
                                            toast.success('Link copied to clipboard');
                                        }}
                                        className="bg-gray-200 p-2 rounded hover:bg-gray-300"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        )}
                    <button
                        onClick={() => handleCarouselUpload(selectedProductGroup, 'horizontal')}
                        className="w-full bg-green-600 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-green-700 transition-colors shadow-md font-medium"
                        disabled={loading || !selectedImage}
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        {loading ? 'Uploading...' : `Add ${selectedProductGroup === 'promo' ? 'Promo' : selectedProductGroup === 'new' ? 'New' : 'Featured'} Banner to Left Panel`}
                    </button>
                    
                    {/* Uploaded Left Panel Carousel Banners */}
                    {productCarousel.length > 0 && (
                        <div className="mt-6">
                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                                Current Left Panel Banners ({productCarousel.length})
                            </h3>
                            <div className="space-y-2">
                                {sortByOrder(productCarousel).map((item, index, group) => {
                                    const groupName = item.type === 'promo' ? 'Promo Products' :
                                        item.type === 'new' ? 'New Products' :
                                            item.type === 'featured' ? 'Featured Products' : '';
                                    return (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <img src={item.image_url} alt={groupName} className="w-12 h-12 object-cover rounded border border-gray-300" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{groupName}</p>
                                                    <p className="text-xs text-gray-500">Display Order: {item.display_order}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {orderButtons(group, index)}
                                                {item.shareable_link && (
                                                    <a
                                                        href={item.shareable_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="View link"
                                                    >
                                                        <LinkIcon size={18} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleEditCarousel(item)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Edit banner"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteCarousel(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete banner"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* Side & Bottom Banners Section - Positional slots */}
            <div id="banner-slots" className="bg-white rounded-lg shadow-md p-6 mb-6 scroll-mt-6">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 mb-1">Side &amp; Bottom Banners</h2>
                        <p className="text-sm text-gray-600">Right sidebar and the two bottom banners of the hero section</p>
                    </div>
                    <div className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold">
                        Side / Bottom
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        <label className="flex-1 w-full">
                            <span className="block text-sm font-medium text-gray-700 mb-1">Banner Slot</span>
                            <select
                                value={selectedSlot}
                                onChange={(e) => setSelectedSlot(e.target.value as SlotType)}
                                className="w-full p-2 border rounded"
                            >
                                {SLOT_KEYS.map((slot) => (
                                    <option key={slot} value={slot}>
                                        {SLOT_CONFIG[slot].label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex-1 w-full">
                            <span className="block text-sm font-medium text-gray-700 mb-1">Upload Image</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleSlotImageUpload}
                                className="w-full"
                            />
                        </label>
                    </div>

                    <div className="p-2 bg-purple-50 border-l-4 border-purple-400 rounded text-sm text-purple-800">
                        <strong>📐 {SLOT_CONFIG[selectedSlot].label}:</strong> Recommended size <b>{SLOT_CONFIG[selectedSlot].size}</b>. Appears in the {SLOT_CONFIG[selectedSlot].area}.
                    </div>

                    <label className="block">
                        <span className="block text-sm font-medium text-gray-700 mb-1">Link URL <span className="text-gray-400 font-normal">(optional)</span></span>
                        <input
                            type="text"
                            value={slotLink}
                            onChange={(e) => setSlotLink(e.target.value)}
                            placeholder="https://... (leave blank for a non-clickable banner)"
                            className="w-full p-2 border rounded text-sm"
                        />
                    </label>

                    <button
                        onClick={handleSlotBannerUpload}
                        className="w-full bg-purple-600 text-white px-4 py-3 rounded-lg flex items-center justify-center hover:bg-purple-700 transition-colors shadow-md font-medium disabled:opacity-50"
                        disabled={loading || !slotImage}
                    >
                        <PlusCircle className="w-5 h-5 mr-2" />
                        {loading ? 'Uploading...' : `Add Banner to ${SLOT_CONFIG[selectedSlot].label}`}
                    </button>

                    {/* Existing banners grouped by slot */}
                    {SLOT_KEYS.map((slot) => {
                        const banners = sortByOrder(slotBanners.filter((item) => item.type === slot));
                        if (banners.length === 0) return null;
                        return (
                            <div key={slot} className="mt-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                                    {SLOT_CONFIG[slot].label} ({banners.length})
                                </h3>
                                <div className="space-y-2">
                                    {banners.map((item, index, group) => (
                                        <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                                            <div className="flex items-center space-x-3">
                                                <img src={item.image_url} alt={SLOT_CONFIG[slot].label} className="w-12 h-12 object-cover rounded border border-gray-300" />
                                                <div>
                                                    <p className="font-medium text-gray-800">{SLOT_CONFIG[slot].label}</p>
                                                    <p className="text-xs text-gray-500">Display Order: {item.display_order}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {orderButtons(group, index)}
                                                {item.shareable_link && (
                                                    <a
                                                        href={item.shareable_link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="View link"
                                                    >
                                                        <LinkIcon size={18} />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={() => handleDeleteCarousel(item.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Delete banner"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Edit Modal */}
            {isEditing && editingCarousel && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Edit Carousel Item</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Upload New Image (Optional)</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="w-full"
                                />
                            </div>
                            {editingCarousel.type === 'brand' ? (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Brand</label>
                                    <select
                                        value={selectedBrand || ''}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            setSelectedBrand(value);
                                            if (value) {
                                                const link = generateShareableLink('brand', value);
                                                setShareableBrandLink(link);
                                            }
                                        }}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="">Select a brand</option>
                                        {brands.map((brand) => (
                                            <option key={brand.brand_id} value={brand.brand_id}>
                                                {brand.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Product Group</label>
                                    <select
                                        value={selectedProductGroup}
                                        onChange={(e) => {
                                            const value = e.target.value as 'promo' | 'new' | 'featured';
                                            setSelectedProductGroup(value);
                                            setShareableProductLink(generateShareableLink(value, 1));
                                        }}
                                        className="w-full p-2 border rounded"
                                    >
                                        <option value="promo">Promo Products</option>
                                        <option value="new">New Products</option>
                                        <option value="featured">Featured Products</option>
                                    </select>
                                </div>
                            )}
                            <div className="flex justify-end space-x-2 mt-4">
                                <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpdateCarousel}
                                    disabled={loading}
                                    className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                                >
                                    {loading ? 'Updating...' : 'Update'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomepageSettings; 