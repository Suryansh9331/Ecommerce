// import React, { useState, useEffect, useRef } from "react";
// import { useParams, Link, useNavigate } from "react-router-dom";
// import {
//   Star,
//   Check,
//   Heart,
//   ArrowLeft,
//   ChevronRight,
//   ChevronLeft,
//   Share2,
//   X,
//   Copy,
//   Facebook,
//   Twitter,
//   Mail,
// } from "lucide-react";
// import { useCart } from "../context/CartContext";
// import { useAuth } from "../context/AuthContext";
// import { useWishlist } from "../context/WishlistContext";
// import { toast } from "react-hot-toast";
// import useClickOutside from "../hooks/useClickOutside";
// import { useTranslation } from "react-i18next";
// import { useAmazonTranslate } from "../hooks/useAmazonTranslate";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// // Tab type
// type TabType = "product-details" | "information" | "reviews";

// interface ProductMedia {
//   media_id: number;
//   type: string;
//   url: string;
//   sort_order: number;
// }

// interface ProductMeta {
//   short_desc: string;
//   full_desc: string;
//   meta_title: string;
//   meta_desc: string;
//   meta_keywords: string;
// }

// interface ProductAttribute {
//   attribute_id: number;
//   attribute_name: string;
//   value_code: string;
//   value_text: string;
//   value_label: string | null;
//   is_text_based: boolean;
// }

// interface ProductDetails {
//   stock: number;
//   product_id: number;
//   product_name: string;
//   cost_price: number;
//   selling_price: number;
//   price?: number; // Backend-calculated price (with special price logic)
//   originalPrice?: number; // Backend-calculated original price
//   discount_pct: number;
//   special_price: number | null;
//   is_on_special_offer?: boolean;
//   description: string;
//   media: ProductMedia[];
//   meta: ProductMeta;
//   attributes: ProductAttribute[];
//   category: {
//     category_id: number;
//     name: string;
//   };
//   brand: {
//     brand_id: number;
//     name: string;
//   };
//   parent_product_id: number | null;
//   is_variant: boolean;
//   variants: ProductVariant[];
// }

// // Extend the Product type to match what the cart expects
// interface CartProduct extends Omit<ProductDetails, "category" | "brand"> {
//   id: number;
//   name: string;
//   price: number;
//   original_price: number;
//   special_price: number | null;
//   currency: string;
//   image: string;
//   image_url: string;
//   stock: number;
//   isNew: boolean;
//   isBuiltIn: boolean;
//   rating: number;
//   reviews: number;
//   sku: string;
//   category: {
//     category_id: number;
//     name: string;
//   };
//   brand: {
//     brand_id: number;
//     name: string;
//   };
//   is_deleted: boolean;
// }

// // Add new interface for variants
// interface ProductVariant {
//   id: string;
//   name: string;
//   price: number;
//   originalPrice: number;
//   sku: string;
//   isVariant: boolean;
//   isParent: boolean;
//   parentProductId: string | null;
//   media: ProductMedia[];
// }

// // Add Review interface
// interface Review {
//   review_id: number;
//   product_id: number;
//   user_id: number;
//   order_id: string;
//   rating: number;
//   title: string;
//   body: string;
//   created_at: string;
//   updated_at: string;
//   images: {
//     image_id: number;
//     image_url: string;
//     sort_order: number;
//     type: string;
//     created_at: string;
//     updated_at: string;
//   }[];
//   user: {
//     id: number;
//     first_name: string;
//     last_name: string;
//     email: string;
//   };
// }

// interface ReviewResponse {
//   status: string;
//   data: {
//     reviews: Review[];
//     total: number;
//     pages: number;
//     current_page: number;
//   };
// }

// const ProductDetail: React.FC = () => {
//   const { productId } = useParams<{ productId: string }>();
//   const { addToCart } = useCart();
//   const { isAuthenticated, user } = useAuth();
//   const {
//     addToWishlist,
//     removeFromWishlist,
//     isInWishlist,
//     loading: wishlistLoading,
//     wishlistItems,
//   } = useWishlist();
//   const navigate = useNavigate();
//   const [quantity, setQuantity] = useState(1);
//   const [selectedImage, setSelectedImage] = useState("");
//   const [activeTab, setActiveTab] = useState<TabType>("product-details");
//   const [product, setProduct] = useState<ProductDetails | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [reviews, setReviews] = useState<Review[]>([]);
//   const [reviewPage, setReviewPage] = useState(1);
//   const [totalReviewPages, setTotalReviewPages] = useState(1);
//   const [loadingReviews, setLoadingReviews] = useState(false);
//   const [averageRating, setAverageRating] = useState<number>(0);
//   const [selectedPreviewImage, setSelectedPreviewImage] = useState<
//     string | null
//   >(null);
//   const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
//   const [showShareOptions, setShowShareOptions] = useState(false);
//   const [copiedToClipboard, setCopiedToClipboard] = useState(false);
//   const [selectedAttributes, setSelectedAttributes] = useState<{
//     [key: number]: string | string[];
//   }>({});
//   const { i18n } = useTranslation();
//   const { translateBatch } = useAmazonTranslate(API_BASE_URL);
//   const [translatedText, setTranslatedText] = useState<{
//     name?: string;
//     meta_title?: string;
//     short_desc?: string;
//     full_desc?: string;
//     description?: string;
//   }>({});
//   // Additional display-only translated fields
//   const [translatedCategory, setTranslatedCategory] = useState<string | undefined>(undefined);
//   const [translatedBrand, setTranslatedBrand] = useState<string | undefined>(undefined);
//   const [translatedAttrNames, setTranslatedAttrNames] = useState<Record<number, string>>({});
//   const [translatedAttrValues, setTranslatedAttrValues] = useState<Record<string, string>>({});
//   const [translatedVariantNames, setTranslatedVariantNames] = useState<Record<string, string>>({});
//   // Display-only translations for reviews (title/body)
//   const [translatedReviews, setTranslatedReviews] = useState<Record<number, { title?: string; body?: string }>>({});
//   // Variants fetched via dedicated endpoint
//   const [variants, setVariants] = useState<ProductVariant[]>([]);
//   const [loadingVariants, setLoadingVariants] = useState<boolean>(false);
//   const shareDropdownRef = useRef<HTMLDivElement>(null);
//   useClickOutside(shareDropdownRef, () => {
//     if (showShareOptions) setShowShareOptions(false);
//   });

//   // copy product link to clipboard
//   const copyToClipboard = () => {
//     navigator.clipboard.writeText(window.location.href);
//     setCopiedToClipboard(true);
//     toast.success("Link copied to clipboard!");
//     setTimeout(() => setCopiedToClipboard(false), 2000);
//     setShowShareOptions(false);
//   };

//   // Handle attribute selection for multi-select attributes
//   const handleAttributeSelect = (
//     attributeId: number,
//     value: string,
//     isMultiSelect: boolean
//   ) => {
//     // console.log("Attribute selection:", { attributeId, value, isMultiSelect });
//     setSelectedAttributes((prev) => {
//       // console.log("Previous selected attributes:", prev);
//       if (isMultiSelect) {
//         const currentValues = (prev[attributeId] as string[]) || [];
//         const newValues = currentValues.includes(value)
//           ? currentValues.filter((v) => v !== value)
//           : [...currentValues, value];
//         // console.log("New multi-select values:", newValues);
//         return { ...prev, [attributeId]: newValues };
//       } else {
//         // console.log("New single-select value:", value);
//         return { ...prev, [attributeId]: value };
//       }
//     });
//   };

//   // function to share via social platforms
//   const shareViaPlatform = (platform: string) => {
//     const url = encodeURIComponent(window.location.href);
//     const title = encodeURIComponent(
//       product?.product_name || "Check out this product"
//     );

//     let shareUrl = "";

//     switch (platform) {
//       case "facebook":
//         shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
//         break;
//       case "twitter":
//         shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
//         break;
//       case "email":
//         shareUrl = `mailto:?subject=${title}&body=Check out this product: ${url}`;
//         break;
//       default:
//         return;
//     }

//     window.open(shareUrl, "_blank");
//     setShowShareOptions(false);
//   };

//   // Add function to fetch reviews
//   const fetchProductReviews = async (page: number = 1) => {
//     try {
//       setLoadingReviews(true);
//       // console.log("Fetching reviews for product:", productId, "page:", page);

//       const response = await fetch(
//         `${API_BASE_URL}/api/reviews/product/${productId}?page=${page}&per_page=5`,
//         {
//           headers: {
//             "Content-Type": "application/json",
//             Accept: "application/json",
//           },
//         }
//       );

//       // console.log("Review API Response Status:", response.status);

//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error("Review API Error Response:", errorData);
//         throw new Error(errorData.message || "Failed to fetch reviews");
//       }

//       const data: ReviewResponse = await response.json();
//       // console.log("Review API Success Response:", data);

//       if (data.status === "success" && data.data) {
//         // console.log("Reviews Data:", data.data.reviews);
//         // console.log("Total Reviews:", data.data.total);
//         // console.log("Total Pages:", data.data.pages);

//         setReviews(data.data.reviews);
//         setTotalReviewPages(data.data.pages);
//         setReviewPage(page);

//         // Calculate average rating
//         if (data.data.reviews.length > 0) {
//           const totalRating = data.data.reviews.reduce(
//             (sum, review) => sum + review.rating,
//             0
//           );
//           const avgRating = totalRating / data.data.reviews.length;
//           setAverageRating(Number(avgRating.toFixed(1)));
//         }
//       } else {
//         console.error("Unexpected API Response Format:", data);
//         throw new Error("Invalid response format from review API");
//       }
//     } catch (error) {
//       console.error("Error in fetchProductReviews:", error);
//       console.error("Error details:", {
//         message: error instanceof Error ? error.message : "Unknown error",
//         stack: error instanceof Error ? error.stack : undefined,
//       });
//       toast.error("Failed to load reviews");
//     } finally {
//       setLoadingReviews(false);
//     }
//   };

//   // Function to convert video URLs from non-browser-compatible formats to .mp4 for Cloudinary
//   const convertVideoUrl = (url: string, mediaType: string): string => {
//     if (mediaType?.toLowerCase() === 'video' && url.includes('cloudinary')) {
//       // List of video extensions that are not directly playable in browsers
//       const nonBrowserCompatibleExtensions = [
//         '.ts',     // MPEG Transport Stream
//         '.avi',    // Audio Video Interleave
//         '.wmv',    // Windows Media Video
//         '.flv',    // Flash Video
//         '.mov',    // QuickTime Movie (limited browser support)
//         '.mkv',    // Matroska Video
//         '.m4v',    // iTunes Video
//         '.3gp',    // 3GP multimedia
//         '.asf',    // Advanced Systems Format
//         '.vob',    // DVD Video Object
//         '.mts',    // MPEG Transport Stream
//         '.m2ts',   // Blu-ray MPEG-2 Transport Stream
//         '.f4v',    // Flash MP4 Video
//         '.rm',     // RealMedia
//         '.rmvb',   // RealMedia Variable Bitrate
//         '.divx',   // DivX Video
//         '.xvid'    // Xvid Video
//       ];

//       // Check if URL ends with any of the non-compatible extensions
//       for (const ext of nonBrowserCompatibleExtensions) {
//         if (url.endsWith(ext)) {
//           return url.replace(new RegExp(`\\${ext}$`), '.mp4');
//         }
//       }
//     }
//     return url;
//   };

//   useEffect(() => {
//     const fetchProductDetails = async () => {
//       try {
//         setLoading(true);
//         const response = await fetch(
//           `${API_BASE_URL}/api/products/${productId}/details`,
//           {
//             headers: {
//               "Content-Type": "application/json",
//               Accept: "application/json",
//             },
//           }
//         );

//         if (!response.ok) {
//           throw new Error(
//             `Failed to fetch product details: ${response.status}`
//           );
//         }

//         const data = await response.json();
//         // Debug: Inspect variants payload from API
//         // Using console.debug to keep noise lower than console.log
//         console.debug('[ProductDetail] Fetched product details', {
//           productId,
//           hasVariantsArray: Array.isArray(data?.variants),
//           variantsCount: Array.isArray(data?.variants) ? data.variants.length : 'n/a',
//           isVariant: data?.is_variant,
//           parentProductId: data?.parent_product_id,
//         });

// //         console.log("Product Data:", {
// //           selling_price: data.selling_price,
// //           cost_price: data.cost_price,
// //           discount_pct: data.discount_pct,
// //           attributes: data.attributes,
// //         });

//         // Convert video URLs in media array
//         if (data.media && data.media.length > 0) {
//           data.media = data.media.map((media: ProductMedia) => ({
//             ...media,
//             url: convertVideoUrl(media.url, media.type)
//           }));
//         }

//         // Convert video URLs in variants media array
//         if (data.variants && data.variants.length > 0) {
//           data.variants = data.variants.map((variant: ProductVariant) => ({
//             ...variant,
//             media: variant.media ? variant.media.map((media: ProductMedia) => ({
//               ...media,
//               url: convertVideoUrl(media.url, media.type)
//             })) : []
//           }));
//           console.debug('[ProductDetail] Variants after media normalization', {
//             variantsCount: data.variants.length,
//             sampleVariant: data.variants[0],
//           });
//         }


//         setProduct(data);
//         if (data.media && data.media.length > 0) {
//           setSelectedImage(data.media[0].url);
//         }
//       } catch (err) {
//         setError("Failed to fetch product details");
//         console.error("Error fetching product:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     if (productId) {
//       fetchProductDetails();
//     }
//   }, [productId]);

//   // Fetch variants via dedicated endpoint
//   const fetchProductVariants = async (productId: string) => {
//     try {
//       setLoadingVariants(true);
//       const response = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`, {
//         headers: {
//           'Content-Type': 'application/json',
//           'Accept': 'application/json'
//         }
//       });

//       if (!response.ok) {
//         throw new Error('Failed to fetch product variants');
//       }

//       const data = await response.json();
//       console.debug('[ProductDetail] Fetched variants via endpoint', {
//         count: Array.isArray(data?.variants) ? data.variants.length : 'n/a',
//       });
//       setVariants(data.variants || []);
//     } catch (error) {
//       console.error('Error fetching variants:', error);
//     } finally {
//       setLoadingVariants(false);
//     }
//   };

//   useEffect(() => {
//     if (productId) {
//       fetchProductVariants(productId);
//     }
//   }, [productId]);

//   // Update useEffect to fetch reviews when product changes
//   useEffect(() => {
//     if (productId) {
//       fetchProductReviews();
//     }
//   }, [productId]);

//   // Translate review titles and bodies (display-only)
//   useEffect(() => {
//     const run = async () => {
//       const lang = (i18n.language || 'en').split('-')[0];
//       if (!reviews.length || lang === 'en') {
//         setTranslatedReviews({});
//         return;
//       }
//       try {
//         const items: { id: string; text: string }[] = [];
//         reviews.forEach((r) => {
//           if (r.title) items.push({ id: `t:${r.review_id}`, text: r.title });
//           if (r.body) items.push({ id: `b:${r.review_id}`, text: r.body });
//         });
//         if (!items.length) {
//           setTranslatedReviews({});
//           return;
//         }
//         const map = await translateBatch(items, lang, 'text/plain');
//         const tMap: Record<number, { title?: string; body?: string }> = {};
//         reviews.forEach((r) => {
//           const title = map[`t:${r.review_id}`];
//           const body = map[`b:${r.review_id}`];
//           if (title || body) tMap[r.review_id] = { title, body };
//         });
//         setTranslatedReviews(tMap);
//       } catch (e) {
//         // fail open – keep originals
//         setTranslatedReviews((prev) => prev);
//       }
//     };
//     run();
//   }, [reviews, i18n.language, translateBatch]);

//   // Translate dynamic content when language changes
//   useEffect(() => {
//     const doTranslate = async () => {
//       if (!product) return;
//       const lang = (i18n.language || 'en').split('-')[0];
//       if (lang === 'en') {
//         setTranslatedText({});
//         setTranslatedCategory(undefined);
//         setTranslatedBrand(undefined);
//         setTranslatedAttrNames({});
//         setTranslatedAttrValues({});
//         setTranslatedVariantNames({});
//         return;
//       }
//       try {
//         const plainItems: { id: string; text: string }[] = [];
//         if (product.product_name) plainItems.push({ id: 'name', text: product.product_name });
//         if (product.meta?.meta_title) plainItems.push({ id: 'meta_title', text: product.meta.meta_title });
//         if (product.category?.name) plainItems.push({ id: 'category_name', text: product.category.name });
//         if (product.brand?.name) plainItems.push({ id: 'brand_name', text: product.brand.name });

//         const seenAttrIds = new Set<number>();
//         for (const attr of product.attributes || []) {
//           if (!seenAttrIds.has(attr.attribute_id) && attr.attribute_name) {
//             plainItems.push({ id: `attrName:${attr.attribute_id}`, text: attr.attribute_name });
//             seenAttrIds.add(attr.attribute_id);
//           }
//         }
//         const seenAttrVals = new Set<string>();
//         for (const attr of product.attributes || []) {
//           const displayVal = attr.is_text_based ? attr.value_text : (attr.value_label || attr.value_text);
//           if (displayVal) {
//             const key = `attrVal:${attr.attribute_id}|${attr.value_code || displayVal}`;
//             if (!seenAttrVals.has(key)) {
//               plainItems.push({ id: key, text: displayVal });
//               seenAttrVals.add(key);
//             }
//           }
//         }
//         for (const v of product.variants || []) {
//           if (v?.name) plainItems.push({ id: `variant:${v.id}`, text: v.name });
//         }

//         const htmlItems: { id: string; text: string }[] = [];
//         if (product.meta?.short_desc) htmlItems.push({ id: 'short_desc', text: product.meta.short_desc });
//         if (product.meta?.full_desc) htmlItems.push({ id: 'full_desc', text: product.meta.full_desc });
//         if (!product.meta?.full_desc && product.description) htmlItems.push({ id: 'description', text: product.description });

//         const [plainMap, htmlMap] = await Promise.all([
//           plainItems.length ? translateBatch(plainItems, lang, 'text/plain') : Promise.resolve({} as Record<string, string>),
//           htmlItems.length ? translateBatch(htmlItems, lang, 'text/html') : Promise.resolve({} as Record<string, string>),
//         ]);

//         setTranslatedText({
//           name: plainMap['name'] || undefined,
//           meta_title: plainMap['meta_title'] || undefined,
//           short_desc: htmlMap['short_desc'] || undefined,
//           full_desc: htmlMap['full_desc'] || undefined,
//           description: htmlMap['description'] || undefined,
//         });

//         setTranslatedCategory(plainMap['category_name'] || undefined);
//         setTranslatedBrand(plainMap['brand_name'] || undefined);

//         const newAttrNames: Record<number, string> = {};
//         const newAttrValues: Record<string, string> = {};
//         for (const attr of product.attributes || []) {
//           const nk = `attrName:${attr.attribute_id}`;
//           if (plainMap[nk]) newAttrNames[attr.attribute_id] = plainMap[nk];
//           const displayVal = attr.is_text_based ? attr.value_text : (attr.value_label || attr.value_text);
//           if (displayVal) {
//             const vk = `attrVal:${attr.attribute_id}|${attr.value_code || displayVal}`;
//             if (plainMap[vk]) newAttrValues[vk] = plainMap[vk];
//           }
//         }
//         setTranslatedAttrNames(newAttrNames);
//         setTranslatedAttrValues(newAttrValues);

//         const vMap: Record<string, string> = {};
//         for (const v of product.variants || []) {
//           const key = `variant:${v.id}`;
//           if (plainMap[key]) vMap[v.id] = plainMap[key];
//         }
//         setTranslatedVariantNames(vMap);
//       } catch (e) {
//         // Fail open: keep English
//         setTranslatedText((prev) => prev);
//         // Keep previous maps as-is
//       }
//     };
//     doTranslate();
//   }, [product, i18n.language]);

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
//           <p className="mt-4 text-gray-600">Loading product details...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error || !product) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50">
//         <div className="text-center p-8">
//           <h2 className="text-2xl font-semibold text-gray-800 mb-4">
//             Product Not Found
//           </h2>
//           <p className="text-gray-600 mb-6">
//             {error ||
//               "The product you're looking for does not exist or has been removed."}
//           </p>
//           <Link
//             to="/wholesale"
//             className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
//           >
//             <ArrowLeft size={18} />
//             <span>Back to Products</span>
//           </Link>
//         </div>
//       </div>
//     );
//   }

//   const handleAddToCart = () => {
//     const calculatedPrice = product.price || product.selling_price;
//     const calculatedOriginalPrice = product.originalPrice || product.cost_price;

//     // console.log("Cart Debug:", {
//     //   "product.price": product.price,
//     //   "product.originalPrice": product.originalPrice,
//     //   "product.selling_price": product.selling_price,
//     //   "product.cost_price": product.cost_price,
//     //   calculatedPrice: calculatedPrice,
//     //   calculatedOriginalPrice: calculatedOriginalPrice,
//     // });

//     const cartProduct: CartProduct = {
//       ...product,
//       id: product.product_id,
//       name: product.product_name,
//       price: calculatedPrice, // Use backend-calculated price (with special price logic)
//       original_price: calculatedOriginalPrice, // Use backend-calculated original price
//       special_price: product.special_price,
//       currency: "INR",
//       image: product.media[0]?.url || "",
//       image_url: product.media[0]?.url || "",
//       stock: 100,
//       isNew: true,
//       isBuiltIn: false,
//       rating: 0,
//       reviews: 0,
//       sku: `SKU-${product.product_id}`,
//       category: product.category || { category_id: 0, name: "" },
//       brand: product.brand || { brand_id: 0, name: "" },
//       is_deleted: false,
//     };

//     addToCart(cartProduct, quantity, selectedAttributes);
//   };

//   const handleBuyNow = () => {
//     if (!isAuthenticated) {
//       toast.error("Please sign in to proceed with purchase");
//       const returnUrl = encodeURIComponent(window.location.pathname);
//       navigate(`/sign-in?returnUrl=${returnUrl}`);
//       return;
//     }

//     // Check if user is a merchant or admin
//     if (user?.role === "merchant" || user?.role === "admin") {
//       toast.error("Merchants and admins cannot make purchases");
//       return;
//     }

//     if(product?.stock === 0 || product?.stock < quantity) {
//       toast.error("Insufficient stock");
//       return
//     }

//     const calculatedPrice = product.price || product.selling_price;
//     const calculatedOriginalPrice = product.originalPrice || product.cost_price;

//     const productForPurchase = {
//       id: product.product_id,
//       name: product.product_name,
//       price: calculatedPrice,
//       original_price: calculatedOriginalPrice,
//       special_price: product.special_price,
//       image_url: product.media[0]?.url || "",
//       stock: 100,
//       is_deleted: false,
//       sku: `SKU-${product.product_id}`,
//       category: product.category,
//       brand: product.brand,
//     };

//     const directPurchaseItem = {
//       product: productForPurchase,
//       quantity: quantity,
//       selected_attributes:
//         Object.keys(selectedAttributes).length > 0
//           ? selectedAttributes
//           : undefined,
//     };

//     // Navigate to payment page with direct purchase data
//     navigate("/payment", {
//       state: {
//         directPurchase: directPurchaseItem,
//         discount: 0,
//         appliedPromo: null,
//         itemDiscounts: {},
//       },
//     });
//   };

//   const handleQuantityChange = (value: number) => {
//     const newQuantity = quantity + value;
//     if (newQuantity >= 1) {
//       setQuantity(newQuantity);
//     }
//   };

//   const handleWishlist = async () => {
//     if (!isAuthenticated) {
//       toast.error("Please sign in to add items to wishlist");
//       const returnUrl = encodeURIComponent(window.location.pathname);
//       navigate(`/sign-in?returnUrl=${returnUrl}`);
//       return;
//     }

//     // Check if user is a merchant or admin
//     if (user?.role === "merchant" || user?.role === "admin") {
//       toast.error("Merchants and admins cannot add items to wishlist");
//       return;
//     }

//     try {
//       const productId = Number(product?.product_id);
//       const isInWishlistItem = isInWishlist(productId);

//       if (isInWishlistItem) {
//         // Find the wishlist item ID from the wishlist items
//         const wishlistItem = wishlistItems.find(
//           (item) => item.product_id === productId
//         );
//         if (wishlistItem) {
//           await removeFromWishlist(wishlistItem.wishlist_item_id);
//         }
//       } else {
//         // console.log("Attempting to add to wishlist, product ID:", productId);
//         await addToWishlist(productId);
//       }
//     } catch (error) {
//       console.error("Wishlist error details:", error);
//       toast.error(
//         error instanceof Error ? error.message : "Failed to update wishlist"
//       );
//     }
//   };

//   const renderAttributeOptions = () => {
//     if (!product?.attributes || product.attributes.length === 0) return null;

//     // Group attributes by name to combine similar ones
//     const groupedAttributes = product.attributes.reduce((groups, attr) => {
//       const key = attr.attribute_name.toLowerCase();
//       if (!groups[key]) {
//         groups[key] = [];
//       }
//       groups[key].push(attr);
//       return groups;
//     }, {} as { [key: string]: typeof product.attributes });

//     return (
//       <div className="mb-6 space-y-4">
//         {/* All attributes with interactive selection */}
//         {Object.entries(groupedAttributes).map(([groupKey, attributes]) => {
//           const firstAttr = attributes[0];
//           // Determine if attribute should be multi-select based on common patterns
//           const isMultiSelect =
//             firstAttr.attribute_name.toLowerCase().includes("color") ||
//             firstAttr.attribute_name.toLowerCase().includes("size") ||
//             firstAttr.attribute_name.toLowerCase().includes("style") ||
//             firstAttr.attribute_name.toLowerCase().includes("ram") ||
//             firstAttr.attribute_name.toLowerCase().includes("storage") ||
//             firstAttr.attribute_name.toLowerCase().includes("memory") ||
//             firstAttr.attribute_name.toLowerCase().includes("capacity");

//           if (isMultiSelect) {
//             // For multi-select attributes, show all options in one row
//             const selectedValues =
//               (selectedAttributes[firstAttr.attribute_id] as string[]) || [];

//             return (
//               <div key={groupKey} className="flex flex-wrap items-center gap-4">
//                 <div className="text-sm font-medium text-gray-700 min-w-[100px]">
//                   {translatedAttrNames[firstAttr.attribute_id] || firstAttr.attribute_name}:
//                 </div>
//                 <div className="flex flex-wrap gap-3">
//                   {attributes.map((attr) => {
//                     const currentValue = attr.is_text_based
//                       ? attr.value_text
//                       : attr.value_label || attr.value_text;
//                     const isSelected = selectedValues.includes(currentValue);

//           const valKey = `attrVal:${firstAttr.attribute_id}|${attr.value_code || currentValue}`;
//           const displayValue = translatedAttrValues[valKey] || currentValue;
//           return (
//                       <button
//                         key={attr.attribute_id}
//                         onClick={() =>
//                           handleAttributeSelect(
//                             firstAttr.attribute_id,
//                             currentValue,
//                             true
//                           )
//                         }
//                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
//                             ? "border-2 border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
//                             : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
//                           }`}
//                       >
//             {displayValue}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             );
//           } else {
//             // For single-select attributes, show as interactive buttons
//             const selectedValue = selectedAttributes[
//               firstAttr.attribute_id
//             ] as string;

//             return (
//               <div key={groupKey} className="flex flex-wrap items-center gap-4">
//                 <div className="text-sm font-medium text-gray-700 min-w-[100px]">
//                   {translatedAttrNames[firstAttr.attribute_id] || firstAttr.attribute_name}:
//                 </div>
//                 <div className="flex flex-wrap gap-3">
//                   {attributes.map((attr) => {
//                     const value = attr.is_text_based
//                       ? attr.value_text
//                       : attr.value_label || attr.value_text;
//                     const isSelected = selectedValue === value;

//           const valKey = `attrVal:${firstAttr.attribute_id}|${attr.value_code || value}`;
//           const displayValue = translatedAttrValues[valKey] || value;
//           return (
//                       <button
//                         key={attr.attribute_id}
//                         onClick={() =>
//                           handleAttributeSelect(
//                             firstAttr.attribute_id,
//                             value,
//                             false
//                           )
//                         }
//                         className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
//                             ? "border-2 border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
//                             : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
//                           }`}
//                       >
//             {displayValue}
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>
//             );
//           }
//         })}
//       </div>
//     );
//   };

//   // Add function to render star rating
//   const renderStars = (rating: number) => {
//     return (
//       <div className="flex items-center">
//         {[1, 2, 3, 4, 5].map((star) => (
//           <Star
//             key={star}
//             size={16}
//             className={`${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
//               }`}
//           />
//         ))}
//       </div>
//     );
//   };

//   // Helper: get best variant thumbnail url
//   const getVariantThumbUrl = (variant: ProductVariant): string | null => {
//     if (variant?.media && variant.media.length > 0) {
//       return variant.media[0].url;
//     }
//     const anyVariant = variant as unknown as { primary_image?: string };
//     if (anyVariant && typeof anyVariant.primary_image === 'string') return anyVariant.primary_image;
//     return null;
//   };

//   // Update the reviews tab content
//   const renderTabContent = () => {
//     switch (activeTab) {
//       case "product-details":
//         return (
//           <div className="py-6">
//             <h3 className="text-xl font-medium mb-4 text-gray-900">
//               {translatedText.meta_title || product.meta?.meta_title || translatedText.name || product.product_name}
//             </h3>
//             {/* Short Description */}
//     {(translatedText.short_desc || product.meta?.short_desc) && (
//               <div className="mb-4">
//                 <div
//                   className="prose prose-sm max-w-none text-gray-700"
//       dangerouslySetInnerHTML={{ __html: translatedText.short_desc || product.meta.short_desc }}
//                 />
//               </div>
//             )}
//             {/* Full Description */}
//     {(translatedText.full_desc || product.meta?.full_desc) && (
//               <div className="mt-6">
//                 <h4 className="text-lg font-medium mb-3 text-gray-900">
//                   Full Description
//                 </h4>
//                 <div
//                   className="prose prose-sm max-w-none text-gray-700"
//       dangerouslySetInnerHTML={{ __html: translatedText.full_desc || product.meta.full_desc }}
//                 />
//               </div>
//             )}
//             {/* Fallback to basic description if no meta description */}
//     {!product.meta?.full_desc && (translatedText.description || product.description) && (
//               <div className="mt-6">
//                 <h4 className="text-lg font-medium mb-3 text-gray-900">
//                   Description
//                 </h4>
//                 <div
//                   className="prose prose-sm max-w-none text-gray-700"
//       dangerouslySetInnerHTML={{ __html: translatedText.description || product.description }}
//                 />
//               </div>
//             )}
//           </div>
//         );
//       case "information":
//         return (
//           <div className="py-4 sm:py-6">
//             <h3 className="text-base sm:text-xl font-medium mb-4 sm:mb-6 text-gray-900">
//               Specifications
//             </h3>
//             <div className="border-t border-gray-200 overflow-x-auto">
//               <table className="min-w-[340px] sm:min-w-full">
//                 <tbody>
//                   <tr className="border-b border-gray-200">
//                     <td className="py-3 pr-4 font-medium text-gray-700 w-1/3">
//                       Product
//                     </td>
//                     <td className="py-3 text-gray-800">
//                       {translatedText.name || product.product_name}
//                     </td>
//                   </tr>
//                   <tr className="border-b border-gray-200">
//                     <td className="py-3 pr-4 font-medium text-gray-700">
//                       Category
//                     </td>
//                     <td className="py-3 text-gray-800">
//                       {product.category?.name}
//                     </td>
//                   </tr>
//                   <tr className="border-b border-gray-200">
//                     <td className="py-3 pr-4 font-medium text-gray-700">
//                       Brand
//                     </td>
//                     <td className="py-3 text-gray-800">
//                       {product.brand?.name}
//                     </td>
//                   </tr>
//                   <tr className="border-b border-gray-200">
//                     <td className="py-3 pr-4 font-medium text-gray-700">
//                       Price
//                     </td>
//                     <td className="py-3 text-gray-800">
//                       {formatMoney(product.price || product.selling_price)}
//                     </td>
//                   </tr>
//                   {/* Product Attributes */}
//                   {product.attributes &&
//                     product.attributes.map((attr) => (
//                       <tr
//                         key={`${attr.attribute_id}-${attr.value_code}`}
//                         className="border-b border-gray-200"
//                       >
//                         <td className="py-3 pr-4 font-medium text-gray-700">
//                           {translatedAttrNames[attr.attribute_id] || attr.attribute_name}
//                         </td>
//                         <td className="py-3 text-gray-800">
//                           {(() => {
//                             const displayVal = attr.is_text_based
//                               ? attr.value_text
//                               : attr.value_label || attr.value_text;
//                             const key = `attrVal:${attr.attribute_id}|${attr.value_code || displayVal}`;
//                             return translatedAttrValues[key] || displayVal;
//                           })()}
//                         </td>
//                       </tr>
//                     ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         );
//       case "reviews":
//         return (
//           <div className="py-6">
//             {loadingReviews ? (
//               <div className="flex justify-center items-center h-32">
//                 <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
//               </div>
//             ) : reviews.length > 0 ? (
//               <div className="space-y-6">
//                 {reviews.map((review) => (
//                   <div
//                     key={review.review_id}
//                     className="border-b border-gray-200 pb-6 last:border-b-0"
//                   >
//                     <div className="flex items-start justify-between mb-2">
//                       <div>
//                         <h4 className="font-medium text-gray-900">
//                           {translatedReviews[review.review_id]?.title || review.title}
//                         </h4>
//                         <div className="flex items-center gap-2 mt-1">
//                           {renderStars(review.rating)}
//                           <span className="text-sm text-gray-500">
//                             by {review.user?.first_name || "Anonymous"}{" "}
//                             {review.user?.last_name || ""}
//                           </span>
//                         </div>
//                       </div>
//                       <span className="text-sm text-gray-500">
//                         {new Date(review.created_at).toLocaleDateString()}
//                       </span>
//                     </div>
//                     <p className="text-gray-700 mt-2">{translatedReviews[review.review_id]?.body || review.body}</p>
//                     {renderReviewImages(review.images)}
//                   </div>
//                 ))}

//                 {/* Pagination */}
//                 {totalReviewPages > 1 && (
//                   <div className="flex justify-center gap-2 mt-6">
//                     <button
//                       onClick={() => fetchProductReviews(reviewPage - 1)}
//                       disabled={reviewPage === 1}
//                       className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
//                     >
//                       Previous
//                     </button>
//                     <span className="px-3 py-1 text-sm">
//                       Page {reviewPage} of {totalReviewPages}
//                     </span>
//                     <button
//                       onClick={() => fetchProductReviews(reviewPage + 1)}
//                       disabled={reviewPage === totalReviewPages}
//                       className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
//                     >
//                       Next
//                     </button>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               <div className="text-center text-gray-500">
//                 No reviews available yet.
//               </div>
//             )}

//             {/* Image Preview Modal */}
//             <ImagePreviewModal
//               imageUrl={selectedPreviewImage}
//               onClose={() => setSelectedPreviewImage(null)}
//               images={
//                 reviews[activeTab === "reviews" ? reviewPage - 1 : 0]?.images
//               }
//               currentImageIndex={selectedImageIndex}
//               onImageChange={handleImageChange}
//             />
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   // Replace the dummy variant selector with real variants
//   const renderVariants = () => {
//     // Determine which variants to use: fetched or included in product details
//     const variantSource: ProductVariant[] = (variants && variants.length > 0)
//       ? variants
//       : (product?.variants || []);

//     // Debug: Log at render-time to confirm variants availability
//     console.debug('[ProductDetail] Render variants check', {
//       hasProduct: !!product,
//       hasVariantsArray: Array.isArray(variantSource),
//       variantsCount: Array.isArray(variantSource) ? variantSource.length : 0,
//       isVariantFlag: product?.is_variant,
//       parentProductId: product?.parent_product_id,
//       loadingVariants,
//     });
//     if (loadingVariants) {
//       return (
//         <div className="mt-6 sm:mt-8">
//           <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Loading variants…</h3>
//           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
//             {Array.from({ length: 4 }).map((_, i) => (
//               <div key={i} className="border rounded-lg p-3 sm:p-4 animate-pulse">
//                 <div className="bg-gray-200 rounded-md h-24 sm:h-32 mb-3" />
//                 <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
//                 <div className="h-3 bg-gray-100 rounded w-1/2" />
//               </div>
//             ))}
//           </div>
//         </div>
//       );
//     }
//     if (!variantSource || variantSource.length === 0) return null;

//     // Sort variants to show parent product first, then other variants
//     const sortedVariants = [...variantSource].sort((a, b) => {
//       if (a.isParent) return -1;
//       if (b.isParent) return 1;
//       return 0;
//     });

//     return (
//       <div className="mt-6 sm:mt-8">
//         <div className="flex items-center justify-between mb-3 sm:mb-4">
//           <h3 className="text-base sm:text-lg font-medium text-gray-900">
//             {product.is_variant ? "Related Products" : "Available Variants"}
//           </h3>
//           <span className="text-xs sm:text-sm text-gray-500">{sortedVariants.length} option{sortedVariants.length === 1 ? '' : 's'}</span>
//         </div>
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
//           {sortedVariants.map((variant) => {
//             const thumbUrl = getVariantThumbUrl(variant);
//             return (
//               <div
//                 key={variant.id}
//                 className={`w-full border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${
//                   variant.id === product.product_id.toString()
//                     ? "border-blue-500 bg-blue-50"
//                     : "hover:border-gray-400"
//                 }`}
//                 onClick={() => {
//                   if (variant.id !== product.product_id.toString()) {
//                     navigate(`/product/${variant.id}`);
//                   }
//                 }}
//               >
//                 <div className="aspect-w-1 aspect-h-1 mb-4">
//                   {thumbUrl ? (
//                     <img
//                       src={thumbUrl}
//                       alt={variant.name}
//                       className="object-cover rounded-lg w-full h-full"
//                     />
//                   ) : (
//                     <div className="bg-gray-100 rounded-lg flex items-center justify-center w-full h-full">
//                       <span className="text-gray-400">No image</span>
//                     </div>
//                   )}
//                 </div>
//                 <div className="flex items-start justify-between gap-2">
//                   <div className="min-w-0">
//                     <h4 className="font-medium text-gray-900 mb-0.5 truncate max-w-[150px] sm:max-w-[180px]">
//                       {translatedVariantNames[variant.id] || variant.name}
//                     </h4>
//                     <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[180px]">SKU: {variant.sku}</p>
//                   </div>
//                   {variant.id === product.product_id.toString() && (
//                     <span className="text-[10px] sm:text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full h-fit">Current</span>
//                   )}
//                 </div>
//                 <div className="mt-2">
//                   <span className="text-lg font-medium text-gray-900">
//                     {formatMoney(variant.price)}
//                   </span>
//                   {variant.originalPrice > variant.price && (
//                     <span className="ml-2 text-sm text-gray-500 line-through">
//                       {formatMoney(variant.originalPrice)}
//                     </span>
//                   )}
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     );
//   };

//   // Update the ImagePreviewModal component
//   const ImagePreviewModal: React.FC<{
//     imageUrl: string | null;
//     onClose: () => void;
//     images?: Review["images"];
//     currentImageIndex?: number;
//     onImageChange?: (index: number) => void;
//   }> = ({
//     imageUrl,
//     onClose,
//     images = [],
//     currentImageIndex = 0,
//     onImageChange,
//   }) => {
//       if (!imageUrl) return null;

//       const handlePrevious = (e: React.MouseEvent) => {
//         e.stopPropagation();
//         if (images.length > 1 && onImageChange) {
//           const newIndex =
//             (currentImageIndex - 1 + images.length) % images.length;
//           onImageChange(newIndex);
//         }
//       };

//       const handleNext = (e: React.MouseEvent) => {
//         e.stopPropagation();
//         if (images.length > 1 && onImageChange) {
//           const newIndex = (currentImageIndex + 1) % images.length;
//           onImageChange(newIndex);
//         }
//       };

//       // Add keyboard event listener
//       useEffect(() => {
//         const handleKeyDown = (e: KeyboardEvent) => {
//           if (e.key === "ArrowLeft") {
//             handlePrevious(e as any);
//           } else if (e.key === "ArrowRight") {
//             handleNext(e as any);
//           } else if (e.key === "Escape") {
//             onClose();
//           }
//         };

//         window.addEventListener("keydown", handleKeyDown);
//         return () => window.removeEventListener("keydown", handleKeyDown);
//       }, [currentImageIndex, images.length]);

//       return (
//         <div
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 px-2 sm:px-0"
//           onClick={onClose}
//         >
//           <div
//             className="relative w-full max-w-md sm:max-w-4xl bg-white rounded-lg overflow-hidden"
//             onClick={(e) => e.stopPropagation()}
//           >
//             {/* Header */}
//             <div className="flex justify-between items-center p-4 border-b">
//               <h3 className="text-lg font-medium text-gray-900">
//                 Review Image{" "}
//                 {images.length > 1
//                   ? `(${currentImageIndex + 1}/${images.length})`
//                   : ""}
//               </h3>
//               <button
//                 onClick={onClose}
//                 className="text-gray-500 hover:text-gray-700 transition-colors"
//               >
//                 <X size={24} />
//               </button>
//             </div>

//             {/* Image Container */}
//             <div className="relative p-4">
//               <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
//                 <img
//                   src={imageUrl}
//                   alt="Review"
//                   className="w-full h-full object-contain"
//                   onError={(e) => {
//                     console.error("Error loading preview image:", imageUrl);
//                     const target = e.target as HTMLImageElement;
//                     target.src = "/placeholder-image.jpg";
//                   }}
//                 />
//               </div>

//               {/* Navigation Arrows */}
//               {images.length > 1 && (
//                 <>
//                   <button
//                     onClick={handlePrevious}
//                     className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
//                     aria-label="Previous image"
//                   >
//                     <ChevronLeft size={24} className="text-gray-700" />
//                   </button>
//                   <button
//                     onClick={handleNext}
//                     className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
//                     aria-label="Next image"
//                   >
//                     <ChevronRight size={24} className="text-gray-700" />
//                   </button>
//                 </>
//               )}
//             </div>

//             {/* Footer */}
//             <div className="p-4 border-t bg-gray-50">
//               <p className="text-sm text-gray-500 text-center">
//                 {images.length > 1 ? (
//                   <>
//                     Use arrow keys or click the arrows to navigate between images.
//                     <br />
//                     Press ESC or click outside to close
//                   </>
//                 ) : (
//                   "Click outside to close"
//                 )}
//               </p>
//             </div>
//           </div>
//         </div>
//       );
//     };

//   // Update the review images section to handle image navigation
//   const handleImageClick = (images: Review["images"], index: number) => {
//     setSelectedImageIndex(index);
//     setSelectedPreviewImage(images[index].image_url);
//   };

//   const handleImageChange = (index: number) => {
//     setSelectedImageIndex(index);
//     setSelectedPreviewImage(
//       reviews[activeTab === "reviews" ? reviewPage - 1 : 0].images[index]
//         .image_url
//     );
//   };

//   // Update the renderReviewImages function
//   const renderReviewImages = (images: Review["images"]) => {
//     if (!images || images.length === 0) return null;

//     return (
//       <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
//         {images.map((image, index) => (
//           <div
//             key={image.image_id}
//             className="relative group cursor-pointer aspect-square"
//             onClick={() => handleImageClick(images, index)}
//           >
//             <img
//               src={image.image_url}
//               alt="Review"
//               className="w-full h-full object-cover rounded-md hover:opacity-90 transition-opacity"
//               onError={(e) => {
//                 console.error("Error loading review image:", image.image_url);
//                 const target = e.target as HTMLImageElement;
//                 target.src = "/placeholder-image.jpg";
//               }}
//             />
//             <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-md" />
//           </div>
//         ))}
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <div className="container mx-auto px-1 xs:px-2 sm:px-4 md:px-10 xl:px-14 py-4 sm:py-8">
//         {/* Breadcrumbs */}
//         <nav className="flex flex-wrap items-center text-xs mb-3 overflow-x-auto whitespace-nowrap">
//           <Link
//             to="/"
//             className="text-gray-500 hover:text-primary-600 transition-colors"
//           >
//             Home
//           </Link>
//           <ChevronRight size={12} className="mx-1 text-gray-400" />
//           <Link
//             to="/products"
//             className="text-gray-500 hover:text-primary-600 transition-colors"
//           >
//             Products
//           </Link>
//           <ChevronRight size={12} className="mx-1 text-gray-400" />
//           <Link
//             to={`/category/${product.category?.category_id}`}
//             className="text-gray-500 hover:text-primary-600 transition-colors"
//           >
//             {translatedCategory || product.category?.name}
//           </Link>
//           <ChevronRight size={12} className="mx-1 text-gray-400" />
//           <span className="text-gray-900 font-medium">
//             {translatedText.name || product.product_name}
//           </span>
//         </nav>

//         {/* Product Overview Section */}
//         <div className="bg-white rounded-lg shadow-sm overflow-visible mb-4">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-2 sm:p-4">
//             {/* Product Images */}
//             <div className="space-y-2">
//               <div className="flex flex-col items-center">
//                 {/* Main Product Image with Navigation */}
//                 <div className="mb-3 sm:mb-6 w-full max-w-xs xs:max-w-sm sm:max-w-lg flex justify-center relative mx-auto">
//                   {/* Check if current selected image is a video */}
//                   {product.media.find(media => media.url === selectedImage)?.type?.toLowerCase() === 'video' ? (
//                     <video
//                         src={selectedImage}
//                         controls
//                         className="rounded-lg shadow-md object-contain w-full max-h-60 xs:max-h-80 sm:max-h-96"
//                       />
//                     ) : (
//                       <img
//                         src={selectedImage}
//                         alt={product.product_name}
//                         className="rounded-lg shadow-md object-contain w-full max-h-60 xs:max-h-80 sm:max-h-96"
//                       />
//                     )}
//                     {/* Left Arrow Button */}
//                     <button
//                       onClick={() => {
//                         const currentIndex = product.media.findIndex(
//                           (media) => media.url === selectedImage
//                         );
//                         const previousIndex =
//                           (currentIndex - 1 + product.media.length) %
//                           product.media.length;
//                         setSelectedImage(product.media[previousIndex].url);
//                       }}
//                       className="absolute left-2 top-1/2 transform -translate-y-1/2 p-3 bg-white text-gray-800 rounded-md shadow-md hover:bg-gray-100 transition-colors z-10"
//                       aria-label="Previous image"
//                     >
//                       <ChevronLeft size={24} />
//                     </button>

//                     {/* Right Arrow Button */}
//                     <button
//                       onClick={() => {
//                         const currentIndex = product.media.findIndex(
//                           (media) => media.url === selectedImage
//                         );
//                         const nextIndex =
//                           (currentIndex + 1) % product.media.length;
//                         setSelectedImage(product.media[nextIndex].url);
//                       }}
//                       className="absolute right-2 top-1/2 transform -translate-y-1/2 p-3 bg-white text-gray-800 rounded-md shadow-md hover:bg-gray-100 transition-colors z-10"
//                       aria-label="Next image"
//                     >
//                       <ChevronRight size={24} />
//                     </button>
//                   </div>

//                   {/* Thumbnail Images */}
//                   <div className="flex flex-nowrap space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 justify-center w-full max-w-sm xs:max-w-sm  sm:max-w-lg mx-auto">
//                     {product.media.map((media) => (
//                       <div
//                         key={media.media_id}
//                         className={`relative min-w-[60px] min-h-[60px] w-16 h-16 xs:w-20 xs:h-20 cursor-pointer border-2 rounded-md overflow-hidden ${selectedImage === media.url
//                             ? "border-primary-500"
//                             : "border-transparent"
//                           }`}
//                         onClick={() => setSelectedImage(media.url)}
//                       >
//                         {media.type?.toLowerCase() === 'video' ? (
//                           <div className="relative w-full h-full">
//                             <video
//                               src={media.url}
//                               className="w-full h-full object-cover rounded-md"
//                               muted
//                             />
//                             <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
//                               <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
//                                 <svg className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
//                                   <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z"/>
//                                 </svg>
//                               </div>
//                             </div>
//                           </div>
//                         ) : (
//                           <img
//                             src={media.url}
//                             alt={`${product.product_name} thumbnail`}
//                             className="w-full h-full object-cover rounded-md"
//                           />
//                         )}
//                       </div>
//                     ))}
//                   </div>
//                 </div>
//             </div>

//             {/* Product Info */}
//             <div className="flex flex-col mt-2 md:mt-0">
//               <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1">
//                 {translatedText.name || product.product_name}
//               </h1>

//               <div className="mb-3">
//                 <div className="flex items-baseline space-x-2">
//                   <span className="text-xl sm:text-2xl font-bold text-gray-900">
//                     {formatMoney(product.price || product.selling_price)}
//                   </span>
//                   {product.originalPrice &&
//                     product.originalPrice >
//                     (product.price || product.selling_price) && (
//                       <span className="text-sm text-gray-500 line-through">
//                         {formatMoney(product.originalPrice)}
//                       </span>
//                     )}
//                   {!product.originalPrice &&
//                     product.cost_price >
//                     (product.price || product.selling_price) && (
//                       <span className="text-sm text-gray-500 line-through">
//                         {formatMoney(product.cost_price)}
//                       </span>
//                     )}
//                   {product.is_on_special_offer && (
//                     <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
//                       Special Offer
//                     </span>
//                   )}
//                 </div>
//               </div>

//               <div className="mb-2">
//                 <div className="text-sm font-medium mb-1">
//                   Category: {translatedCategory || product.category?.name}
//                 </div>
//                 <div className="text-sm font-medium mb-1">
//                   Brand: {translatedBrand || product.brand?.name}
//                 </div>
//                 <div className="flex items-center gap-2 mt-1">
//                   {renderStars(averageRating)}
//                   <span className="text-sm text-gray-600">
//                     {averageRating > 0
//                       ? `${averageRating} (${reviews.length} reviews)`
//                       : "No reviews yet"}
//                   </span>
//                 </div>
//               </div>

//               {/* Short Description */}
//         {(translatedText.short_desc || product.meta?.short_desc) && (
//                 <div className="mb-4">
//                   <div
//                     className="text-sm text-gray-600 prose prose-sm max-w-none"
//                     dangerouslySetInnerHTML={{
//           __html: translatedText.short_desc || product.meta.short_desc,
//                     }}
//                   />
//                 </div>
//               )}

//               {/* Attribute Options */}
//               {renderAttributeOptions()}

//               {/* Selected Attributes Summary */}
//               {Object.keys(selectedAttributes).length > 0 && (
//                 <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-lg">
//                   <div className="text-sm font-medium text-primary-800 mb-2">
//                     Selected Options:
//                   </div>
//                   <div className="flex flex-wrap gap-2">
//                     {Object.entries(selectedAttributes).map(
//                       ([attributeId, values]) => {
//                         const attribute = product.attributes.find(
//                           (attr) => attr.attribute_id.toString() === attributeId
//                         );
//                         const attributeName =
//                           (attribute && translatedAttrNames[attribute.attribute_id]) ||
//                           attribute?.attribute_name ||
//                           `Attribute ${attributeId}`;
//                         const displayValues = Array.isArray(values)
//                           ? values
//                           : [values];

//                         const mapSelectedValue = (value: string) => {
//                           if (!attribute) return value;
//                           const match = product.attributes.find((a) => {
//                             const dv = a.is_text_based ? a.value_text : a.value_label || a.value_text;
//                             return a.attribute_id === attribute.attribute_id && dv === value;
//                           });
//                           if (!match) return value;
//                           const key = `attrVal:${match.attribute_id}|${match.value_code || value}`;
//                           return translatedAttrValues[key] || value;
//                         };

//                         return displayValues.map((value, index) => (
//                           <span
//                             key={`${attributeId}-${index}`}
//                             className="inline-flex items-center px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full font-medium"
//                           >
//                             {attributeName}: {mapSelectedValue(value)}
//                           </span>
//                         ));
//                       }
//                     )}
//                   </div>
//                 </div>
//               )}

//               {/* Current Product Attributes Summary (when no explicit selection) */}
//               {Object.keys(selectedAttributes).length === 0 &&
//                 product.attributes &&
//                 product.attributes.length > 0 && (
//                   <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
//                     <div className="text-sm font-medium text-gray-700 mb-2">
//                       Product Specifications:
//                     </div>
//                     <div className="flex flex-wrap gap-2">
//                       {product.attributes.map((attr) => {
//                         const value = attr.is_text_based
//                           ? attr.value_text
//                           : attr.value_label || attr.value_text;
//                         const valKey = `attrVal:${attr.attribute_id}|${attr.value_code || value}`;
//                         const displayValue = translatedAttrValues[valKey] || value;
//                         const displayName = translatedAttrNames[attr.attribute_id] || attr.attribute_name;
//                         return (
//                           <span
//                             key={attr.attribute_id}
//                             className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full font-medium"
//                           >
//                             {displayName}: {displayValue}
//                           </span>
//                         );
//                       })}
//                     </div>
//                   </div>
//                 )}

//               {/* Quantity Selector and Add to Cart Row */}
//               <div className="mb-3">
//                 <div className="text-sm font-medium mb-1">Quantity:</div>
//                 {/* Mobile layout: Quantity, Share, Wishlist in a row; action buttons below */}
//                 <div className="flex flex-col gap-2 nav:hidden">
//                   <div className="flex flex-row items-center gap-2 w-full">
//                     {/* Quantity Changer */}
//                     <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-[90px] h-9">
//                       <button
//                         className="w-8 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg disabled:opacity-30"
//                         onClick={() => handleQuantityChange(-1)}
//                         disabled={quantity <= 1}
//                       >
//                         -
//                       </button>
//                       <span className="w-8 text-center text-sm select-none">
//                         {quantity}
//                       </span>
//                       <button
//                         className="w-8 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg"
//                         onClick={() => handleQuantityChange(1)}
//                       >
//                         +
//                       </button>
//                     </div>
//                     {/* Share Button */}
//                     <div className="relative">
//                       <button
//                         className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[40px] text-gray-600 flex items-center justify-center`}
//                         onClick={() => setShowShareOptions(!showShareOptions)}
//                         aria-label="Share this product"
//                       >
//                         <Share2 size={18} />
//                       </button>
//                       {/* Share Options Dropdown */}
//                       {showShareOptions && (
//                         <div ref={shareDropdownRef} className="absolute left-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-10">
//                           <div className="p-3 border-b border-gray-100">
//                             <h3 className="text-sm font-medium text-gray-700">
//                               Share this product
//                             </h3>
//                           </div>
//                           <div className="p-2">
//                             <button
//                               onClick={copyToClipboard}
//                               className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                             >
//                               {copiedToClipboard ? (
//                                 <>
//                                   <Check
//                                     size={16}
//                                     className="text-green-500 mr-2"
//                                   />{" "}
//                                   Copied!
//                                 </>
//                               ) : (
//                                 <>
//                                   <Copy size={16} className="mr-2" /> Copy link
//                                 </>
//                               )}
//                             </button>
//                             <button
//                               onClick={() => shareViaPlatform("facebook")}
//                               className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                             >
//                               <Facebook
//                                 size={16}
//                                 className="text-[#1877F2] mr-2"
//                               />{" "}
//                               Facebook
//                             </button>
//                             <button
//                               onClick={() => shareViaPlatform("twitter")}
//                               className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                             >
//                               <Twitter
//                                 size={16}
//                                 className="text-[#1DA1F2] mr-2"
//                               />{" "}
//                               Twitter
//                             </button>
//                             <button
//                               onClick={() => shareViaPlatform("email")}
//                               className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                             >
//                               <Mail size={16} className="text-gray-600 mr-2" />{" "}
//                               Email
//                             </button>
//                           </div>
//                         </div>
//                       )}
//                     </div>
//                     {/* Favourites Button */}
//                     <button
//                       className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[40px] ${isInWishlist(Number(product?.product_id))
//                         ? "text-primary-600"
//                         : "text-gray-600 flex items-center justify-center"
//                       }`}
//                       onClick={handleWishlist}
//                       disabled={wishlistLoading}
//                       aria-label="Add to Wishlist"
//                     >
//                       {wishlistLoading ? (
//                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
//                       ) : (
//                         <Heart
//                           size={18}
//                           className={
//                             isInWishlist(Number(product?.product_id))
//                               ? "fill-current"
//                               : ""
//                           }
//                         />
//                       )}
//                     </button>
//                   </div>
//                   {/* Action Buttons (always below on mobile) */}
//                   <div className="flex gap-2 w-full mt-2">
//                     {/* Buy Now Button */}
//                     <button
//                       onClick={handleBuyNow}
//                       className="bg-primary-500 text-white px-5 py-2 rounded-md hover:bg-primary-600 duration-300 transition-colors font-medium text-sm min-w-[120px] w-full"
//                     >
//                       Buy Now
//                     </button>
//                     {/* Add to Cart Button */}
//                     <button
//                       onClick={handleAddToCart}
//                       className="bg-primary-500 text-white px-5 py-2 rounded-md hover:bg-primary-600 duration-300 transition-colors font-medium text-sm min-w-[120px] w-full"
//                     >
//                       Add To Cart
//                     </button>
//                   </div>
//                 </div>
//                 {/* Desktop layout: original order (sm+) */}
//                 <div className="hidden nav:flex nav:flex-row nav:items-center nav:gap-3">
//                   {/* Quantity Changer */}
//                   <div className="flex items-center border border-gray-300 rounded-md overflow-hidden w-[90px] h-9">
//                     <button
//                       className="w-8 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg disabled:opacity-30"
//                       onClick={() => handleQuantityChange(-1)}
//                       disabled={quantity <= 1}
//                     >
//                       -
//                     </button>
//                     <span className="w-8 text-center text-sm select-none">
//                       {quantity}
//                     </span>
//                     <button
//                       className="w-8 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg"
//                       onClick={() => handleQuantityChange(1)}
//                     >
//                       +
//                     </button>
//                   </div>
//                   {/* Action Buttons */}
//                   <div className="flex gap-2 nav:gap-3">
//                     {/* Buy Now Button */}
//                     <button
//                       onClick={handleBuyNow}
//                       className="bg-primary-500 text-white px-5 py-2 rounded-md hover:bg-primary-600 duration-300 transition-colors font-medium text-sm min-w-[120px]"
//                     >
//                       Buy Now
//                     </button>
//                     {/* Add to Cart Button */}
//                     <button
//                       onClick={handleAddToCart}
//                       className="bg-primary-500 text-white px-5 py-2 rounded-md hover:bg-primary-600 duration-300 transition-colors font-medium text-sm min-w-[120px]"
//                     >
//                       Add To Cart
//                     </button>
//                   </div>
//                   {/* Share Button */}
//                   <div className="relative z-10">
//                     <button
//                       className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[40px] text-gray-600 flex items-center justify-center`}
//                       onClick={() => setShowShareOptions(!showShareOptions)}
//                       aria-label="Share this product"
//                     >
//                       <Share2 size={18} />
//                     </button>
//                     {/* Share Options Dropdown */}
//                     {showShareOptions && (
//                       <div ref={shareDropdownRef} className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
//                         <div className="p-3 border-b border-gray-100">
//                           <h3 className="text-sm font-medium text-gray-700">
//                             Share this product
//                           </h3>
//                         </div>
//                         <div className="p-2">
//                           <button
//                             onClick={copyToClipboard}
//                             className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                           >
//                             {copiedToClipboard ? (
//                               <>
//                                 <Check
//                                   size={16}
//                                   className="text-green-500 mr-2"
//                                 />{" "}
//                                 Copied!
//                               </>
//                             ) : (
//                               <>
//                                 <Copy size={16} className="mr-2" /> Copy link
//                               </>
//                             )}
//                           </button>
//                           <button
//                             onClick={() => shareViaPlatform("facebook")}
//                             className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                           >
//                             <Facebook
//                               size={16}
//                               className="text-[#1877F2] mr-2"
//                             />{" "}
//                             Facebook
//                           </button>
//                           <button
//                             onClick={() => shareViaPlatform("twitter")}
//                             className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                           >
//                             <Twitter
//                               size={16}
//                               className="text-[#1DA1F2] mr-2"
//                             />{" "}
//                             Twitter
//                           </button>
//                           <button
//                             onClick={() => shareViaPlatform("email")}
//                             className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
//                           >
//                             <Mail size={16} className="text-gray-600 mr-2" />{" "}
//                             Email
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                   {/* Favourites Button */}
//                   <button
//                     className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors min-w-[40px] ${isInWishlist(Number(product?.product_id))
//                       ? "text-primary-600"
//                       : "text-gray-600 flex items-center justify-center"
//                     }`}
//                     onClick={handleWishlist}
//                     disabled={wishlistLoading}
//                     aria-label="Add to Wishlist"
//                   >
//                     {wishlistLoading ? (
//                       <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mx-auto"></div>
//                     ) : (
//                       <Heart
//                         size={18}
//                         className={
//                           isInWishlist(Number(product?.product_id))
//                             ? "fill-current"
//                             : ""
//                         }
//                       />
//                     )}
//                   </button>
//                 </div>
//               </div>

//               {/* Replace the dummy variant selector with the new renderVariants function */}
//               {renderVariants()}
//             </div>
//           </div>
//         </div>

//         {/* Tabs Section */}
//         <div className="bg-white rounded-lg shadow-sm overflow-visible">
//           <div className="border-b border-gray-200 overflow-x-auto">
//             <nav className="flex min-w-[320px]">
//               <button
//                 onClick={() => setActiveTab("product-details")}
//                 className={`py-2 px-4 font-medium border-b-2 ${activeTab === "product-details"
//                     ? "border-primary-500 text-primary-500"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                   } transition-colors`}
//               >
//                 Description
//               </button>
//               <button
//                 onClick={() => setActiveTab("information")}
//                 className={`py-2 px-4 font-medium border-b-2 ${activeTab === "information"
//                     ? "border-primary-500 text-primary-500"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                   } transition-colors`}
//               >
//                 Specifications
//               </button>
//               <button
//                 onClick={() => setActiveTab("reviews")}
//                 className={`py-2 px-4 font-medium border-b-2 ${activeTab === "reviews"
//                     ? "border-primary-500 text-primary-500"
//                     : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
//                   } transition-colors`}
//               >
//                 Reviews
//               </button>
//             </nav>
//           </div>

//           <div className="p-2 sm:p-4">{renderTabContent()}</div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ProductDetail;








import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  Star,
  Check,
  Heart,
  ArrowLeft,
  ChevronRight,
  ChevronLeft,
  Share2,
  X,
  Copy,
  Facebook,
  Twitter,
  Mail,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { toast } from "react-hot-toast";
import useClickOutside from "../hooks/useClickOutside";
import { useTranslation } from "react-i18next";
import { useAmazonTranslate } from "../hooks/useAmazonTranslate";

import { formatMoney } from "../utils/money";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Tab type
type TabType = "product-details" | "information" | "reviews";

interface ProductMedia {
  media_id: number;
  type: string;
  url: string;
  sort_order: number;
}

interface ProductMeta {
  short_desc: string;
  full_desc: string;
  meta_title: string;
  meta_desc: string;
  meta_keywords: string;
}

interface ProductAttribute {
  attribute_id: number;
  attribute_name: string;
  value_code: string;
  value_text: string;
  value_label: string | null;
  is_text_based: boolean;
}

interface ProductDetails {
  stock: number;
  product_id: number;
  product_name: string;
  cost_price: number;
  selling_price: number;
  price?: number; // Backend-calculated price (with special price logic)
  originalPrice?: number; // Backend-calculated original price
  discount_pct: number;
  special_price: number | null;
  is_on_special_offer?: boolean;
  description: string;
  media: ProductMedia[];
  meta: ProductMeta;
  attributes: ProductAttribute[];
  category: {
    category_id: number;
    name: string;
  };
  brand: {
    brand_id: number;
    name: string;
  };
  parent_product_id: number | null;
  is_variant: boolean;
  variants: ProductVariant[];
}

// Extend the Product type to match what the cart expects
interface CartProduct extends Omit<ProductDetails, "category" | "brand"> {
  id: number;
  name: string;
  price: number;
  original_price: number;
  special_price: number | null;
  currency: string;
  image: string;
  image_url: string;
  stock: number;
  isNew: boolean;
  isBuiltIn: boolean;
  rating: number;
  reviews: number;
  sku: string;
  category: {
    category_id: number;
    name: string;
  };
  brand: {
    brand_id: number;
    name: string;
  };
  is_deleted: boolean;
}

// Add new interface for variants
interface ProductVariant {
  id: string;
  name: string;
  price: number;
  originalPrice: number;
  sku: string;
  isVariant: boolean;
  isParent: boolean;
  parentProductId: string | null;
  media: ProductMedia[];
}

// Add Review interface
interface Review {
  review_id: number;
  product_id: number;
  user_id: number;
  order_id: string;
  rating: number;
  title: string;
  body: string;
  created_at: string;
  updated_at: string;
  images: {
    image_id: number;
    image_url: string;
    sort_order: number;
    type: string;
    created_at: string;
    updated_at: string;
  }[];
  user: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface ReviewResponse {
  status: string;
  data: {
    reviews: Review[];
    total: number;
    pages: number;
    current_page: number;
  };
}

const ProductDetail: React.FC = () => {
  const { productId } = useParams<{ productId: string }>();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const {
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    loading: wishlistLoading,
    wishlistItems,
  } = useWishlist();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("product-details");
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [totalReviewPages, setTotalReviewPages] = useState(1);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<
    string | null
  >(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [selectedAttributes, setSelectedAttributes] = useState<{
    [key: number]: string | string[];
  }>({});
  const { i18n } = useTranslation();
  const { translateBatch } = useAmazonTranslate(API_BASE_URL);
  const [translatedText, setTranslatedText] = useState<{
    name?: string;
    meta_title?: string;
    short_desc?: string;
    full_desc?: string;
    description?: string;
  }>({});

  // Image Modal State for amzon like popup viewer of image 
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  // Additional display-only translated fields
  const [translatedCategory, setTranslatedCategory] = useState<string | undefined>(undefined);
  const [translatedBrand, setTranslatedBrand] = useState<string | undefined>(undefined);
  const [translatedAttrNames, setTranslatedAttrNames] = useState<Record<number, string>>({});
  const [translatedAttrValues, setTranslatedAttrValues] = useState<Record<string, string>>({});
  const [translatedVariantNames, setTranslatedVariantNames] = useState<Record<string, string>>({});
  // Display-only translations for reviews (title/body)
  const [translatedReviews, setTranslatedReviews] = useState<Record<number, { title?: string; body?: string }>>({});
  // Variants fetched via dedicated endpoint
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState<boolean>(false);
  const shareDropdownRef = useRef<HTMLDivElement>(null);
  useClickOutside(shareDropdownRef, () => {
    if (showShareOptions) setShowShareOptions(false);
  });

  // copy product link to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToClipboard(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopiedToClipboard(false), 2000);
    setShowShareOptions(false);
  };

  // Handle attribute selection for multi-select attributes
  const handleAttributeSelect = (
    attributeId: number,
    value: string,
    isMultiSelect: boolean
  ) => {
    // console.log("Attribute selection:", { attributeId, value, isMultiSelect });
    setSelectedAttributes((prev) => {
      // console.log("Previous selected attributes:", prev);
      if (isMultiSelect) {
        const currentValues = (prev[attributeId] as string[]) || [];
        const newValues = currentValues.includes(value)
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value];
        // console.log("New multi-select values:", newValues);
        return { ...prev, [attributeId]: newValues };
      } else {
        // console.log("New single-select value:", value);
        return { ...prev, [attributeId]: value };
      }
    });
  };

  // component for image popup modal 
  interface ImageZoomGalleryProps {
    images: { url: string }[];
    index: number;
    onClose: () => void;
    setIndex: (i: number) => void;
  }

  const ImageZoomGallery: React.FC<ImageZoomGalleryProps> = ({
    images,
    index,
    onClose,
    setIndex
  }) => {
    if (!images || !images.length) return null;

    const handlePrev = () => setIndex((index - 1 + images.length) % images.length);
    const handleNext = () => setIndex((index + 1) % images.length);

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm z-[9999] flex items-center justify-center px-2 sm:px-4"
        onClick={onClose}
      >
        <div
          className="bg-white rounded-lg max-w-5xl w-full p-4 relative shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="absolute top-3 right-3 bg-gray-200 hover:bg-gray-300 rounded-full p-1 transition z-[99999]"
          >
            <X size={22} />
          </button>


          {/* Main Image */}
          <div className="relative flex items-center justify-center select-none">
            <button
              onClick={handlePrev}
              className="absolute left-2 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full shadow hidden sm:flex"
            >
              <ChevronLeft size={28} />
            </button>

            <img
              src={images[index].url}
              className="max-h-[70vh] w-full object-contain mx-auto"
            />

            <button
              onClick={handleNext}
              className="absolute right-2 bg-white bg-opacity-70 hover:bg-opacity-100 p-2 rounded-full shadow hidden sm:flex"
            >
              <ChevronRight size={28} />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-3 overflow-x-auto mt-4 p-1 scrollbar-hide">
            {images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                onClick={() => setIndex(i)}
                className={`w-20 h-20 object-cover rounded-md cursor-pointer border-2 transition ${i === index ? "border-primary-500" : "border-transparent"
                  }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };



  // function to share via social platforms
  const shareViaPlatform = (platform: string) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(
      product?.product_name || "Check out this product"
    );

    let shareUrl = "";

    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${title}&body=Check out this product: ${url}`;
        break;
      default:
        return;
    }

    window.open(shareUrl, "_blank");
    setShowShareOptions(false);
  };

  // Add function to fetch reviews
  const fetchProductReviews = async (page: number = 1) => {
    try {
      setLoadingReviews(true);
      // console.log("Fetching reviews for product:", productId, "page:", page);

      const response = await fetch(
        `${API_BASE_URL}/api/reviews/product/${productId}?page=${page}&per_page=5`,
        {
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        }
      );

      // console.log("Review API Response Status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Review API Error Response:", errorData);
        throw new Error(errorData.message || "Failed to fetch reviews");
      }

      const data: ReviewResponse = await response.json();
      // console.log("Review API Success Response:", data);

      if (data.status === "success" && data.data) {
        // console.log("Reviews Data:", data.data.reviews);
        // console.log("Total Reviews:", data.data.total);
        // console.log("Total Pages:", data.data.pages);

        setReviews(data.data.reviews);
        setTotalReviewPages(data.data.pages);
        setReviewPage(page);

        // Calculate average rating
        if (data.data.reviews.length > 0) {
          const totalRating = data.data.reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          );
          const avgRating = totalRating / data.data.reviews.length;
          setAverageRating(Number(avgRating.toFixed(1)));
        }
      } else {
        console.error("Unexpected API Response Format:", data);
        throw new Error("Invalid response format from review API");
      }
    } catch (error) {
      console.error("Error in fetchProductReviews:", error);
      console.error("Error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
      toast.error("Failed to load reviews");
    } finally {
      setLoadingReviews(false);
    }
  };

  // Function to convert video URLs from non-browser-compatible formats to .mp4 for Cloudinary
  const convertVideoUrl = (url: string, mediaType: string): string => {
    if (mediaType?.toLowerCase() === 'video' && url.includes('cloudinary')) {
      // List of video extensions that are not directly playable in browsers
      const nonBrowserCompatibleExtensions = [
        '.ts',     // MPEG Transport Stream
        '.avi',    // Audio Video Interleave
        '.wmv',    // Windows Media Video
        '.flv',    // Flash Video
        '.mov',    // QuickTime Movie (limited browser support)
        '.mkv',    // Matroska Video
        '.m4v',    // iTunes Video
        '.3gp',    // 3GP multimedia
        '.asf',    // Advanced Systems Format
        '.vob',    // DVD Video Object
        '.mts',    // MPEG Transport Stream
        '.m2ts',   // Blu-ray MPEG-2 Transport Stream
        '.f4v',    // Flash MP4 Video
        '.rm',     // RealMedia
        '.rmvb',   // RealMedia Variable Bitrate
        '.divx',   // DivX Video
        '.xvid'    // Xvid Video
      ];

      // Check if URL ends with any of the non-compatible extensions
      for (const ext of nonBrowserCompatibleExtensions) {
        if (url.endsWith(ext)) {
          return url.replace(new RegExp(`\\${ext}$`), '.mp4');
        }
      }
    }
    return url;
  };

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `${API_BASE_URL}/api/products/${productId}/details`,
          {
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to fetch product details: ${response.status}`
          );
        }

        const data = await response.json();
        // Debug: Inspect variants payload from API
        // Using console.debug to keep noise lower than console.log
        console.debug('[ProductDetail] Fetched product details', {
          productId,
          hasVariantsArray: Array.isArray(data?.variants),
          variantsCount: Array.isArray(data?.variants) ? data.variants.length : 'n/a',
          isVariant: data?.is_variant,
          parentProductId: data?.parent_product_id,
        });

        //         console.log("Product Data:", {
        //           selling_price: data.selling_price,
        //           cost_price: data.cost_price,
        //           discount_pct: data.discount_pct,
        //           attributes: data.attributes,
        //         });

        // Convert video URLs in media array
        if (data.media && data.media.length > 0) {
          data.media = data.media.map((media: ProductMedia) => ({
            ...media,
            url: convertVideoUrl(media.url, media.type)
          }));
        }

        // Convert video URLs in variants media array
        if (data.variants && data.variants.length > 0) {
          data.variants = data.variants.map((variant: ProductVariant) => ({
            ...variant,
            media: variant.media ? variant.media.map((media: ProductMedia) => ({
              ...media,
              url: convertVideoUrl(media.url, media.type)
            })) : []
          }));
          console.debug('[ProductDetail] Variants after media normalization', {
            variantsCount: data.variants.length,
            sampleVariant: data.variants[0],
          });
        }


        setProduct(data);
        if (data.media && data.media.length > 0) {
          setSelectedImage(data.media[0].url);
        }
      } catch (err) {
        setError("Failed to fetch product details");
        console.error("Error fetching product:", err);
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchProductDetails();
    }
  }, [productId]);

  // Fetch variants via dedicated endpoint
  const fetchProductVariants = async (productId: string) => {
    try {
      setLoadingVariants(true);
      const response = await fetch(`${API_BASE_URL}/api/products/${productId}/variants`, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch product variants');
      }

      const data = await response.json();
      console.debug('[ProductDetail] Fetched variants via endpoint', {
        count: Array.isArray(data?.variants) ? data.variants.length : 'n/a',
      });
      setVariants(data.variants || []);
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoadingVariants(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProductVariants(productId);
    }
  }, [productId]);

  // Update useEffect to fetch reviews when product changes
  useEffect(() => {
    if (productId) {
      fetchProductReviews();
    }
  }, [productId]);

  // Translate review titles and bodies (display-only)
  useEffect(() => {
    const run = async () => {
      const lang = (i18n.language || 'en').split('-')[0];
      if (!reviews.length || lang === 'en') {
        setTranslatedReviews({});
        return;
      }
      try {
        const items: { id: string; text: string }[] = [];
        reviews.forEach((r) => {
          if (r.title) items.push({ id: `t:${r.review_id}`, text: r.title });
          if (r.body) items.push({ id: `b:${r.review_id}`, text: r.body });
        });
        if (!items.length) {
          setTranslatedReviews({});
          return;
        }
        const map = await translateBatch(items, lang, 'text/plain');
        const tMap: Record<number, { title?: string; body?: string }> = {};
        reviews.forEach((r) => {
          const title = map[`t:${r.review_id}`];
          const body = map[`b:${r.review_id}`];
          if (title || body) tMap[r.review_id] = { title, body };
        });
        setTranslatedReviews(tMap);
      } catch (e) {
        // fail open – keep originals
        setTranslatedReviews((prev) => prev);
      }
    };
    run();
  }, [reviews, i18n.language, translateBatch]);

  // Translate dynamic content when language changes
  useEffect(() => {
    const doTranslate = async () => {
      if (!product) return;
      const lang = (i18n.language || 'en').split('-')[0];
      if (lang === 'en') {
        setTranslatedText({});
        setTranslatedCategory(undefined);
        setTranslatedBrand(undefined);
        setTranslatedAttrNames({});
        setTranslatedAttrValues({});
        setTranslatedVariantNames({});
        return;
      }
      try {
        const plainItems: { id: string; text: string }[] = [];
        if (product.product_name) plainItems.push({ id: 'name', text: product.product_name });
        if (product.meta?.meta_title) plainItems.push({ id: 'meta_title', text: product.meta.meta_title });
        if (product.category?.name) plainItems.push({ id: 'category_name', text: product.category.name });
        if (product.brand?.name) plainItems.push({ id: 'brand_name', text: product.brand.name });

        const seenAttrIds = new Set<number>();
        for (const attr of product.attributes || []) {
          if (!seenAttrIds.has(attr.attribute_id) && attr.attribute_name) {
            plainItems.push({ id: `attrName:${attr.attribute_id}`, text: attr.attribute_name });
            seenAttrIds.add(attr.attribute_id);
          }
        }
        const seenAttrVals = new Set<string>();
        for (const attr of product.attributes || []) {
          const displayVal = attr.is_text_based ? attr.value_text : (attr.value_label || attr.value_text);
          if (displayVal) {
            const key = `attrVal:${attr.attribute_id}|${attr.value_code || displayVal}`;
            if (!seenAttrVals.has(key)) {
              plainItems.push({ id: key, text: displayVal });
              seenAttrVals.add(key);
            }
          }
        }
        for (const v of product.variants || []) {
          if (v?.name) plainItems.push({ id: `variant:${v.id}`, text: v.name });
        }

        const htmlItems: { id: string; text: string }[] = [];
        if (product.meta?.short_desc) htmlItems.push({ id: 'short_desc', text: product.meta.short_desc });
        if (product.meta?.full_desc) htmlItems.push({ id: 'full_desc', text: product.meta.full_desc });
        if (!product.meta?.full_desc && product.description) htmlItems.push({ id: 'description', text: product.description });

        const [plainMap, htmlMap] = await Promise.all([
          plainItems.length ? translateBatch(plainItems, lang, 'text/plain') : Promise.resolve({} as Record<string, string>),
          htmlItems.length ? translateBatch(htmlItems, lang, 'text/html') : Promise.resolve({} as Record<string, string>),
        ]);

        setTranslatedText({
          name: plainMap['name'] || undefined,
          meta_title: plainMap['meta_title'] || undefined,
          short_desc: htmlMap['short_desc'] || undefined,
          full_desc: htmlMap['full_desc'] || undefined,
          description: htmlMap['description'] || undefined,
        });

        setTranslatedCategory(plainMap['category_name'] || undefined);
        setTranslatedBrand(plainMap['brand_name'] || undefined);

        const newAttrNames: Record<number, string> = {};
        const newAttrValues: Record<string, string> = {};
        for (const attr of product.attributes || []) {
          const nk = `attrName:${attr.attribute_id}`;
          if (plainMap[nk]) newAttrNames[attr.attribute_id] = plainMap[nk];
          const displayVal = attr.is_text_based ? attr.value_text : (attr.value_label || attr.value_text);
          if (displayVal) {
            const vk = `attrVal:${attr.attribute_id}|${attr.value_code || displayVal}`;
            if (plainMap[vk]) newAttrValues[vk] = plainMap[vk];
          }
        }
        setTranslatedAttrNames(newAttrNames);
        setTranslatedAttrValues(newAttrValues);

        const vMap: Record<string, string> = {};
        for (const v of product.variants || []) {
          const key = `variant:${v.id}`;
          if (plainMap[key]) vMap[v.id] = plainMap[key];
        }
        setTranslatedVariantNames(vMap);
      } catch (e) {
        // Fail open: keep English
        setTranslatedText((prev) => prev);
        // Keep previous maps as-is
      }
    };
    doTranslate();
  }, [product, i18n.language]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "The product you're looking for does not exist or has been removed."}
          </p>
          <Link
            to="/wholesale"
            className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-md hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft size={18} />
            <span>Back to Products</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    const calculatedPrice = product.price || product.selling_price;
    const calculatedOriginalPrice = product.originalPrice || product.cost_price;

    // console.log("Cart Debug:", {
    //   "product.price": product.price,
    //   "product.originalPrice": product.originalPrice,
    //   "product.selling_price": product.selling_price,
    //   "product.cost_price": product.cost_price,
    //   calculatedPrice: calculatedPrice,
    //   calculatedOriginalPrice: calculatedOriginalPrice,
    // });

    const cartProduct: CartProduct = {
      ...product,
      id: product.product_id,
      name: product.product_name,
      price: calculatedPrice, // Use backend-calculated price (with special price logic)
      original_price: calculatedOriginalPrice, // Use backend-calculated original price
      special_price: product.special_price,
      currency: "INR",
      image: product.media[0]?.url || "",
      image_url: product.media[0]?.url || "",
      stock: 100,
      isNew: true,
      isBuiltIn: false,
      rating: 0,
      reviews: 0,
      sku: `SKU-${product.product_id}`,
      category: product.category || { category_id: 0, name: "" },
      brand: product.brand || { brand_id: 0, name: "" },
      is_deleted: false,
    };

    addToCart(cartProduct, quantity, selectedAttributes);
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to proceed with purchase");
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin
    if (user?.role === "merchant" || user?.role === "admin") {
      toast.error("Merchants and admins cannot make purchases");
      return;
    }

    if (product?.stock === 0 || product?.stock < quantity) {
      toast.error("Insufficient stock");
      return
    }

    const calculatedPrice = product.price || product.selling_price;
    const calculatedOriginalPrice = product.originalPrice || product.cost_price;

    const productForPurchase = {
      id: product.product_id,
      name: product.product_name,
      price: calculatedPrice,
      original_price: calculatedOriginalPrice,
      special_price: product.special_price,
      image_url: product.media[0]?.url || "",
      stock: 100,
      is_deleted: false,
      sku: `SKU-${product.product_id}`,
      category: product.category,
      brand: product.brand,
    };

    const directPurchaseItem = {
      product: productForPurchase,
      quantity: quantity,
      selected_attributes:
        Object.keys(selectedAttributes).length > 0
          ? selectedAttributes
          : undefined,
    };

    // Navigate to payment page with direct purchase data
    navigate("/payment", {
      state: {
        directPurchase: directPurchaseItem,
        discount: 0,
        appliedPromo: null,
        itemDiscounts: {},
      },
    });
  };

  const handleQuantityChange = (value: number) => {
    const newQuantity = quantity + value;
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to wishlist");
      const returnUrl = encodeURIComponent(window.location.pathname);
      navigate(`/sign-in?returnUrl=${returnUrl}`);
      return;
    }

    // Check if user is a merchant or admin
    if (user?.role === "merchant" || user?.role === "admin") {
      toast.error("Merchants and admins cannot add items to wishlist");
      return;
    }

    try {
      const productId = Number(product?.product_id);
      const isInWishlistItem = isInWishlist(productId);

      if (isInWishlistItem) {
        // Find the wishlist item ID from the wishlist items
        const wishlistItem = wishlistItems.find(
          (item) => item.product_id === productId
        );
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem.wishlist_item_id);
        }
      } else {
        // console.log("Attempting to add to wishlist, product ID:", productId);
        await addToWishlist(productId);
      }
    } catch (error) {
      console.error("Wishlist error details:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update wishlist"
      );
    }
  };

  const renderAttributeOptions = () => {
    if (!product?.attributes || product.attributes.length === 0) return null;

    // Group attributes by name to combine similar ones
    const groupedAttributes = product.attributes.reduce((groups, attr) => {
      const key = attr.attribute_name.toLowerCase();
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(attr);
      return groups;
    }, {} as { [key: string]: typeof product.attributes });

    return (
      <div className="mb-6 space-y-4">
        {/* All attributes with interactive selection */}
        {Object.entries(groupedAttributes).map(([groupKey, attributes]) => {
          const firstAttr = attributes[0];
          // Determine if attribute should be multi-select based on common patterns
          const isMultiSelect =
            firstAttr.attribute_name.toLowerCase().includes("color") ||
            firstAttr.attribute_name.toLowerCase().includes("size") ||
            firstAttr.attribute_name.toLowerCase().includes("style") ||
            firstAttr.attribute_name.toLowerCase().includes("ram") ||
            firstAttr.attribute_name.toLowerCase().includes("storage") ||
            firstAttr.attribute_name.toLowerCase().includes("memory") ||
            firstAttr.attribute_name.toLowerCase().includes("capacity");

          if (isMultiSelect) {
            // For multi-select attributes, show all options in one row
            const selectedValues =
              (selectedAttributes[firstAttr.attribute_id] as string[]) || [];

            return (
              <div key={groupKey} className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-medium text-gray-700 min-w-[100px]">
                  {translatedAttrNames[firstAttr.attribute_id] || firstAttr.attribute_name}:
                </div>
                <div className="flex flex-wrap gap-3">
                  {attributes.map((attr) => {
                    const currentValue = attr.is_text_based
                      ? attr.value_text
                      : attr.value_label || attr.value_text;
                    const isSelected = selectedValues.includes(currentValue);

                    const valKey = `attrVal:${firstAttr.attribute_id}|${attr.value_code || currentValue}`;
                    const displayValue = translatedAttrValues[valKey] || currentValue;
                    return (
                      <button
                        key={attr.attribute_id}
                        onClick={() =>
                          handleAttributeSelect(
                            firstAttr.attribute_id,
                            currentValue,
                            true
                          )
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
                          ? "border-2 border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                          : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {displayValue}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          } else {
            // For single-select attributes, show as interactive buttons
            const selectedValue = selectedAttributes[
              firstAttr.attribute_id
            ] as string;

            return (
              <div key={groupKey} className="flex flex-wrap items-center gap-4">
                <div className="text-sm font-medium text-gray-700 min-w-[100px]">
                  {translatedAttrNames[firstAttr.attribute_id] || firstAttr.attribute_name}:
                </div>
                <div className="flex flex-wrap gap-3">
                  {attributes.map((attr) => {
                    const value = attr.is_text_based
                      ? attr.value_text
                      : attr.value_label || attr.value_text;
                    const isSelected = selectedValue === value;

                    const valKey = `attrVal:${firstAttr.attribute_id}|${attr.value_code || value}`;
                    const displayValue = translatedAttrValues[valKey] || value;
                    return (
                      <button
                        key={attr.attribute_id}
                        onClick={() =>
                          handleAttributeSelect(
                            firstAttr.attribute_id,
                            value,
                            false
                          )
                        }
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isSelected
                          ? "border-2 border-primary-500 bg-primary-50 text-primary-700 shadow-sm"
                          : "border-2 border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                          }`}
                      >
                        {displayValue}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  };

  // Add function to render star rating
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={`${star <= rating ? "text-yellow-400 fill-current" : "text-gray-300"
              }`}
          />
        ))}
      </div>
    );
  };

  // Helper: get best variant thumbnail url
  const getVariantThumbUrl = (variant: ProductVariant): string | null => {
    if (variant?.media && variant.media.length > 0) {
      return variant.media[0].url;
    }
    const anyVariant = variant as unknown as { primary_image?: string };
    if (anyVariant && typeof anyVariant.primary_image === 'string') return anyVariant.primary_image;
    return null;
  };

  // Update the reviews tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case "product-details":
        return (
          <div className="py-6">
            <h3 className="text-xl font-medium mb-4 text-gray-900">
              {translatedText.meta_title || product.meta?.meta_title || translatedText.name || product.product_name}
            </h3>
            {/* Short Description */}
            {(translatedText.short_desc || product.meta?.short_desc) && (
              <div className="mb-4">
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: translatedText.short_desc || product.meta.short_desc }}
                />
              </div>
            )}
            {/* Full Description */}
            {(translatedText.full_desc || product.meta?.full_desc) && (
              <div className="mt-6">
                <h4 className="text-lg font-medium mb-3 text-gray-900">
                  Full Description
                </h4>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: translatedText.full_desc || product.meta.full_desc }}
                />
              </div>
            )}
            {/* Fallback to basic description if no meta description */}
            {!product.meta?.full_desc && (translatedText.description || product.description) && (
              <div className="mt-6">
                <h4 className="text-lg font-medium mb-3 text-gray-900">
                  Description
                </h4>
                <div
                  className="prose prose-sm max-w-none text-gray-700"
                  dangerouslySetInnerHTML={{ __html: translatedText.description || product.description }}
                />
              </div>
            )}
          </div>
        );
      case "information":
        return (
          <div className="py-4 sm:py-6">
            <h3 className="text-base sm:text-xl font-medium mb-4 sm:mb-6 text-gray-900">
              Specifications
            </h3>
            <div className="border-t border-gray-200 overflow-x-auto">
              <table className="min-w-[340px] sm:min-w-full">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-medium text-gray-700 w-1/3">
                      Product
                    </td>
                    <td className="py-3 text-gray-800">
                      {translatedText.name || product.product_name}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-medium text-gray-700">
                      Category
                    </td>
                    <td className="py-3 text-gray-800">
                      {product.category?.name}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-medium text-gray-700">
                      Brand
                    </td>
                    <td className="py-3 text-gray-800">
                      {product.brand?.name}
                    </td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-3 pr-4 font-medium text-gray-700">
                      Price
                    </td>
                    <td className="py-3 text-gray-800">
                      {formatMoney(product.price || product.selling_price)}
                    </td>
                  </tr>
                  {/* Product Attributes */}
                  {product.attributes &&
                    product.attributes.map((attr) => (
                      <tr
                        key={`${attr.attribute_id}-${attr.value_code}`}
                        className="border-b border-gray-200"
                      >
                        <td className="py-3 pr-4 font-medium text-gray-700">
                          {translatedAttrNames[attr.attribute_id] || attr.attribute_name}
                        </td>
                        <td className="py-3 text-gray-800">
                          {(() => {
                            const displayVal = attr.is_text_based
                              ? attr.value_text
                              : attr.value_label || attr.value_text;
                            const key = `attrVal:${attr.attribute_id}|${attr.value_code || displayVal}`;
                            return translatedAttrValues[key] || displayVal;
                          })()}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      case "reviews":
        return (
          <div className="py-6">
            {loadingReviews ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-6">
                {reviews.map((review) => (
                  <div
                    key={review.review_id}
                    className="border-b border-gray-200 pb-6 last:border-b-0"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {translatedReviews[review.review_id]?.title || review.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(review.rating)}
                          <span className="text-sm text-gray-500">
                            by {review.user?.first_name || "Anonymous"}{" "}
                            {review.user?.last_name || ""}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-2">{translatedReviews[review.review_id]?.body || review.body}</p>
                    {renderReviewImages(review.images)}
                  </div>
                ))}

                {/* Pagination */}
                {totalReviewPages > 1 && (
                  <div className="flex justify-center gap-2 mt-6">
                    <button
                      onClick={() => fetchProductReviews(reviewPage - 1)}
                      disabled={reviewPage === 1}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {reviewPage} of {totalReviewPages}
                    </span>
                    <button
                      onClick={() => fetchProductReviews(reviewPage + 1)}
                      disabled={reviewPage === totalReviewPages}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500">
                No reviews available yet.
              </div>
            )}

            {/* Image Preview Modal */}
            <ImagePreviewModal
              imageUrl={selectedPreviewImage}
              onClose={() => setSelectedPreviewImage(null)}
              images={
                reviews[activeTab === "reviews" ? reviewPage - 1 : 0]?.images
              }
              currentImageIndex={selectedImageIndex}
              onImageChange={handleImageChange}
            />
          </div>
        );
      default:
        return null;
    }
  };

  // Replace the dummy variant selector with real variants
  const renderVariants = () => {
    // Determine which variants to use: fetched or included in product details
    const variantSource: ProductVariant[] = (variants && variants.length > 0)
      ? variants
      : (product?.variants || []);

    // Debug: Log at render-time to confirm variants availability
    console.debug('[ProductDetail] Render variants check', {
      hasProduct: !!product,
      hasVariantsArray: Array.isArray(variantSource),
      variantsCount: Array.isArray(variantSource) ? variantSource.length : 0,
      isVariantFlag: product?.is_variant,
      parentProductId: product?.parent_product_id,
      loadingVariants,
    });
    if (loadingVariants) {
      return (
        <div className="mt-6 sm:mt-8">
          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-3 sm:mb-4">Loading variants…</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="border rounded-lg p-3 sm:p-4 animate-pulse">
                <div className="bg-gray-200 rounded-md h-24 sm:h-32 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        </div>
      );
    }
    if (!variantSource || variantSource.length === 0) return null;

    // Sort variants to show parent product first, then other variants
    const sortedVariants = [...variantSource].sort((a, b) => {
      if (a.isParent) return -1;
      if (b.isParent) return 1;
      return 0;
    });

    return (
      <div className="mt-6 sm:mt-8">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-medium text-gray-900">
            {product.is_variant ? "Related Products" : "Available Variants"}
          </h3>
          <span className="text-xs sm:text-sm text-gray-500">{sortedVariants.length} option{sortedVariants.length === 1 ? '' : 's'}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {sortedVariants.map((variant) => {
            const thumbUrl = getVariantThumbUrl(variant);
            return (
              <div
                key={variant.id}
                className={`w-full border rounded-lg p-3 sm:p-4 cursor-pointer transition-all ${variant.id === product.product_id.toString()
                  ? "border-blue-500 bg-blue-50"
                  : "hover:border-gray-400"
                  }`}
                onClick={() => {
                  if (variant.id !== product.product_id.toString()) {
                    navigate(`/product/${variant.id}`);
                  }
                }}
              >
                <div className="aspect-w-1 aspect-h-1 mb-4">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={variant.name}
                      className="object-cover rounded-lg w-full h-full"
                    />
                  ) : (
                    <div className="bg-gray-100 rounded-lg flex items-center justify-center w-full h-full">
                      <span className="text-gray-400">No image</span>
                    </div>
                  )}
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 mb-0.5 truncate max-w-[150px] sm:max-w-[180px]">
                      {translatedVariantNames[variant.id] || variant.name}
                    </h4>
                    <p className="text-xs text-gray-500 truncate max-w-[150px] sm:max-w-[180px]">SKU: {variant.sku}</p>
                  </div>
                  {variant.id === product.product_id.toString() && (
                    <span className="text-[10px] sm:text-xs text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full h-fit">Current</span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-lg font-medium text-gray-900">
                    {formatMoney(variant.price)}
                  </span>
                  {variant.originalPrice > variant.price && (
                    <span className="ml-2 text-sm text-gray-500 line-through">
                      {formatMoney(variant.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Update the ImagePreviewModal component
  const ImagePreviewModal: React.FC<{
    imageUrl: string | null;
    onClose: () => void;
    images?: Review["images"];
    currentImageIndex?: number;
    onImageChange?: (index: number) => void;
  }> = ({
    imageUrl,
    onClose,
    images = [],
    currentImageIndex = 0,
    onImageChange,
  }) => {
      if (!imageUrl) return null;

      const handlePrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (images.length > 1 && onImageChange) {
          const newIndex =
            (currentImageIndex - 1 + images.length) % images.length;
          onImageChange(newIndex);
        }
      };

      const handleNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (images.length > 1 && onImageChange) {
          const newIndex = (currentImageIndex + 1) % images.length;
          onImageChange(newIndex);
        }
      };

      // Add keyboard event listener
      useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
          if (e.key === "ArrowLeft") {
            handlePrevious(e as any);
          } else if (e.key === "ArrowRight") {
            handleNext(e as any);
          } else if (e.key === "Escape") {
            onClose();
          }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
      }, [currentImageIndex, images.length]);

      return (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 px-2 sm:px-0"
          onClick={onClose}
        >
          <div
            className="relative w-full max-w-md sm:max-w-4xl bg-white rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-medium text-gray-900">
                Review Image{" "}
                {images.length > 1
                  ? `(${currentImageIndex + 1}/${images.length})`
                  : ""}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Container */}
            <div className="relative p-4">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Review"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    console.error("Error loading preview image:", imageUrl);
                    const target = e.target as HTMLImageElement;
                    target.src = "/placeholder-image.jpg";
                  }}
                />
              </div>

              {/* Navigation Arrows */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={handlePrevious}
                    className="absolute left-6 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={24} className="text-gray-700" />
                  </button>
                  <button
                    onClick={handleNext}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight size={24} className="text-gray-700" />
                  </button>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <p className="text-sm text-gray-500 text-center">
                {images.length > 1 ? (
                  <>
                    Use arrow keys or click the arrows to navigate between images.
                    <br />
                    Press ESC or click outside to close
                  </>
                ) : (
                  "Click outside to close"
                )}
              </p>
            </div>
          </div>
        </div>
      );
    };

  // Update the review images section to handle image navigation
  const handleImageClick = (images: Review["images"], index: number) => {
    setSelectedImageIndex(index);
    setSelectedPreviewImage(images[index].image_url);
  };

  const handleImageChange = (index: number) => {
    setSelectedImageIndex(index);
    setSelectedPreviewImage(
      reviews[activeTab === "reviews" ? reviewPage - 1 : 0].images[index]
        .image_url
    );
  };

  // Update the renderReviewImages function
  const renderReviewImages = (images: Review["images"]) => {
    if (!images || images.length === 0) return null;

    return (
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {images.map((image, index) => (
          <div
            key={image.image_id}
            className="relative group cursor-pointer aspect-square"
            onClick={() => handleImageClick(images, index)}
          >
            <img
              src={image.image_url}
              alt="Review"
              className="w-full h-full object-cover rounded-md hover:opacity-90 transition-opacity"
              onError={(e) => {
                console.error("Error loading review image:", image.image_url);
                const target = e.target as HTMLImageElement;
                target.src = "/placeholder-image.jpg";
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity rounded-md" />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/80">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-14 py-4 sm:py-6 lg:py-8">
        {/* Breadcrumbs */}
        <nav className="flex flex-wrap items-center gap-1 text-xs sm:text-sm mb-4 sm:mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide" aria-label="Breadcrumb">
          <Link to="/" className="text-gray-500 hover:text-primary-600 transition-colors py-1">
            Home
          </Link>
          <ChevronRight size={14} className="text-gray-400 shrink-0" aria-hidden />
          <Link to="/products" className="text-gray-500 hover:text-primary-600 transition-colors py-1">
            Products
          </Link>
          <ChevronRight size={14} className="text-gray-400 shrink-0" aria-hidden />
          <Link to={`/category/${product.category?.category_id}`} className="text-gray-500 hover:text-primary-600 transition-colors py-1">
            {translatedCategory || product.category?.name}
          </Link>
          <ChevronRight size={14} className="text-gray-400 shrink-0" aria-hidden />
          <span className="text-gray-900 font-medium py-1 truncate max-w-[180px] sm:max-w-none">
            {translatedText.name || product.product_name}
          </span>
        </nav>

        {/* Product Overview Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-visible mb-6 sm:mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 p-4 sm:p-6 lg:p-8">
            {/* Product Images */}
            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col items-center w-full">
                {/* Main Product Image with Navigation */}
                <div className="mb-3 sm:mb-4 w-full max-w-md flex justify-center relative mx-auto aspect-square max-h-[280px] xs:max-h-[320px] sm:max-h-[400px] md:max-h-[420px] bg-gray-50 rounded-xl overflow-hidden">
                  <div
                    onClick={() => {
                      const idx = product.media.findIndex(m => m.url === selectedImage);
                      setModalImageIndex(idx);
                      setShowImageModal(true);
                    }}
                    className="cursor-zoom-in w-full h-full flex justify-center items-center"
                  >
                    {product.media.find(media => media.url === selectedImage)?.type?.toLowerCase() === 'video' ? (
                      <video
                        src={selectedImage}
                        controls
                        className="rounded-xl object-contain w-full h-full max-h-[280px] xs:max-h-[320px] sm:max-h-[400px] md:max-h-[420px]"
                      />
                    ) : (
                      <img
                        src={selectedImage}
                        alt={product.product_name}
                        className="rounded-xl object-contain w-full h-full max-h-[280px] xs:max-h-[320px] sm:max-h-[400px] md:max-h-[420px]"
                      />
                    )}
                  </div>
                  {/* Left Arrow */}
                  <button
                    onClick={() => {
                      const currentIndex = product.media.findIndex(
                        (media) => media.url === selectedImage
                      );
                      const previousIndex =
                        (currentIndex - 1 + product.media.length) %
                        product.media.length;
                      setSelectedImage(product.media[previousIndex].url);
                    }}
                    className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-white/95 text-gray-700 rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all z-10 border border-gray-100"
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={22} className="sm:w-6 sm:h-6" />
                  </button>
                  <button
                    onClick={() => {
                      const currentIndex = product.media.findIndex(
                        (media) => media.url === selectedImage
                      );
                      const nextIndex =
                        (currentIndex + 1) % product.media.length;
                      setSelectedImage(product.media[nextIndex].url);
                    }}
                    className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 bg-white/95 text-gray-700 rounded-full shadow-md hover:bg-white hover:shadow-lg transition-all z-10 border border-gray-100"
                    aria-label="Next image"
                  >
                    <ChevronRight size={22} className="sm:w-6 sm:h-6" />
                  </button>
                </div>

                {/* Thumbnail strip */}
                <div className="flex flex-nowrap gap-2 overflow-x-auto scrollbar-hide justify-center w-full max-w-md mx-auto pb-1">
                  {product.media.map((media) => (
                    <div
                      key={media.media_id}
                      className={`relative shrink-0 w-14 h-14 sm:w-16 sm:h-16 cursor-pointer border-2 rounded-lg overflow-hidden transition-colors ${selectedImage === media.url
                        ? "border-primary-600 ring-2 ring-primary-600/20"
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                      onClick={() => {
                        setSelectedImage(media.url);
                        const idx = product.media.findIndex(m => m.url === media.url);
                        setModalImageIndex(idx);
                        setShowImageModal(true);
                      }}

                    >
                      {media.type?.toLowerCase() === 'video' ? (
                        <div className="relative w-full h-full">
                          <video
                            src={media.url}
                            className="w-full h-full object-cover rounded-md"
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-gray-800 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img
                          src={media.url}
                          alt={`${product.product_name} thumbnail`}
                          className="w-full h-full object-cover rounded-md"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="flex flex-col mt-0 md:mt-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                {translatedText.name || product.product_name}
              </h1>

              <div className="mb-4">
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                    {formatMoney(product.price || product.selling_price)}
                  </span>
                  {product.originalPrice &&
                    product.originalPrice >
                    (product.price || product.selling_price) && (
                      <span className="text-base text-gray-500 line-through">
                        {formatMoney(product.originalPrice)}
                      </span>
                    )}
                  {!product.originalPrice &&
                    product.cost_price >
                    (product.price || product.selling_price) && (
                      <span className="text-base text-gray-500 line-through">
                        {formatMoney(product.cost_price)}
                      </span>
                    )}
                  {product.is_on_special_offer && (
                    <span className="bg-primary-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                      Special Offer
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.category && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                      {translatedCategory || product.category?.name}
                    </span>
                  )}
                  {product.brand && (
                    <span className="text-sm text-gray-600 bg-gray-100 px-2.5 py-1 rounded-md">
                      {translatedBrand || product.brand?.name}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(averageRating)}
                  <span className="text-sm text-gray-600">
                    {averageRating > 0
                      ? `${averageRating} (${reviews.length} reviews)`
                      : "No reviews yet"}
                  </span>
                </div>
              </div>

              {/* Short Description */}
              {(translatedText.short_desc || product.meta?.short_desc) && (
                <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div
                    className="text-sm text-gray-600 prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: translatedText.short_desc || product.meta.short_desc,
                    }}
                  />
                </div>
              )}

              {/* Attribute Options */}
              {renderAttributeOptions()}

              {/* Selected Attributes Summary */}
              {Object.keys(selectedAttributes).length > 0 && (
                <div className="mb-4 p-3 sm:p-4 bg-primary-600/5 border border-primary-600/20 rounded-xl">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      Selected options
                    </div>
                    <div className="flex flex-wrap gap-2">
                    {Object.entries(selectedAttributes).map(
                      ([attributeId, values]) => {
                        const attribute = product.attributes.find(
                          (attr) => attr.attribute_id.toString() === attributeId
                        );
                        const attributeName =
                          (attribute && translatedAttrNames[attribute.attribute_id]) ||
                          attribute?.attribute_name ||
                          `Attribute ${attributeId}`;
                        const displayValues = Array.isArray(values)
                          ? values
                          : [values];

                        const mapSelectedValue = (value: string) => {
                          if (!attribute) return value;
                          const match = product.attributes.find((a) => {
                            const dv = a.is_text_based ? a.value_text : a.value_label || a.value_text;
                            return a.attribute_id === attribute.attribute_id && dv === value;
                          });
                          if (!match) return value;
                          const key = `attrVal:${match.attribute_id}|${match.value_code || value}`;
                          return translatedAttrValues[key] || value;
                        };

                        return displayValues.map((value, index) => (
                          <span
                            key={`${attributeId}-${index}`}
                            className="inline-flex items-center px-3 py-1.5 bg-primary-600/15 text-gray-800 text-sm rounded-lg font-medium"
                          >
                            {attributeName}: {mapSelectedValue(value)}
                          </span>
                        ));
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Current Product Attributes Summary (when no explicit selection) */}
              {Object.keys(selectedAttributes).length === 0 &&
                product.attributes &&
                product.attributes.length > 0 && (
                  <div className="mb-4 p-3 sm:p-4 bg-gray-50 border border-gray-100 rounded-xl">
                    <div className="text-sm font-semibold text-gray-800 mb-2">
                      Specifications
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.attributes.map((attr) => {
                        const value = attr.is_text_based
                          ? attr.value_text
                          : attr.value_label || attr.value_text;
                        const valKey = `attrVal:${attr.attribute_id}|${attr.value_code || value}`;
                        const displayValue = translatedAttrValues[valKey] || value;
                        const displayName = translatedAttrNames[attr.attribute_id] || attr.attribute_name;
                        return (
                          <span
                            key={attr.attribute_id}
                            className="inline-flex items-center px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-sm rounded-lg font-medium"
                          >
                            {displayName}: {displayValue}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

              {/* Quantity Selector and Add to Cart Row */}
              <div className="mb-4">
                <div className="text-sm font-medium text-gray-700 mb-2">Quantity</div>
                {/* Mobile layout: Quantity, Share, Wishlist in a row; action buttons below */}
                <div className="flex flex-col gap-3 nav:hidden">
                  <div className="flex flex-row items-center gap-3 w-full">
                    {/* Quantity Changer - touch-friendly */}
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-[110px] min-h-[44px] bg-gray-50">
                      <button
                        className="w-10 h-11 sm:h-12 bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors text-lg font-medium disabled:opacity-40 disabled:pointer-events-none"
                        onClick={() => handleQuantityChange(-1)}
                        disabled={quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="flex-1 min-w-[2rem] text-center text-sm font-medium select-none">
                        {quantity}
                      </span>
                      <button
                        className="w-10 h-11 sm:h-12 bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors text-lg font-medium"
                        onClick={() => handleQuantityChange(1)}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    {/* Share Button */}
                    <div className="relative">
                      <button
                        className="p-2.5 min-h-[44px] min-w-[44px] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 flex items-center justify-center"
                        onClick={() => setShowShareOptions(!showShareOptions)}
                        aria-label="Share this product"
                      >
                        <Share2 size={20} />
                      </button>
                      {/* Share Options Dropdown */}
                      {showShareOptions && (
                        <div ref={shareDropdownRef} className="absolute left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-10 overflow-hidden">
                          <div className="p-3 border-b border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-800">
                              Share this product
                            </h3>
                          </div>
                          <div className="p-2">
                            <button
                              onClick={copyToClipboard}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                              {copiedToClipboard ? (
                                <>
                                  <Check
                                    size={16}
                                    className="text-green-500 mr-2"
                                  />{" "}
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={16} className="mr-2" /> Copy link
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => shareViaPlatform("facebook")}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                              <Facebook
                                size={16}
                                className="text-[#1877F2] mr-2"
                              />{" "}
                              Facebook
                            </button>
                            <button
                              onClick={() => shareViaPlatform("twitter")}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                              <Twitter
                                size={16}
                                className="text-[#1DA1F2] mr-2"
                              />{" "}
                              Twitter
                            </button>
                            <button
                              onClick={() => shareViaPlatform("email")}
                              className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                              <Mail size={16} className="text-gray-600 mr-2" />{" "}
                              Email
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Favourites Button */}
                    <button
                      className={`p-2.5 min-h-[44px] min-w-[44px] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center ${isInWishlist(Number(product?.product_id))
                        ? "text-primary-600 border-primary-600/30"
                        : "text-gray-600"
                        }`}
                      onClick={handleWishlist}
                      disabled={wishlistLoading}
                      aria-label="Add to Wishlist"
                    >
                      {wishlistLoading ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600/30 border-t-primary-600"></div>
                      ) : (
                        <Heart
                          size={20}
                          className={isInWishlist(Number(product?.product_id)) ? "fill-current" : ""}
                        />
                      )}
                    </button>
                  </div>
                  {/* Action Buttons (mobile - full width, touch-friendly) */}
                  <div className="flex gap-3 w-full mt-1">
                    <button
                      onClick={handleBuyNow}
                      className="flex-1 min-h-[48px] bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all font-semibold text-sm"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="flex-1 min-h-[48px] bg-primary-600 text-white px-4 py-3 rounded-xl hover:bg-primary-700 active:scale-[0.98] transition-all font-semibold text-sm"
                    >
                      Add To Cart
                    </button>
                  </div>
                </div>
                {/* Desktop layout */}
                <div className="hidden nav:flex nav:flex-row nav:items-center nav:gap-3">
                  <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden w-[110px] h-11 bg-gray-50">
                    <button
                      className="w-9 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium disabled:opacity-40 disabled:pointer-events-none"
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <span className="flex-1 min-w-[2rem] text-center text-sm font-medium select-none">
                      {quantity}
                    </span>
                    <button
                      className="w-9 h-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors text-lg font-medium"
                      onClick={() => handleQuantityChange(1)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBuyNow}
                      className="min-h-[44px] bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-semibold text-sm min-w-[120px]"
                    >
                      Buy Now
                    </button>
                    <button
                      onClick={handleAddToCart}
                      className="min-h-[44px] bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-700 transition-colors font-semibold text-sm min-w-[120px]"
                    >
                      Add To Cart
                    </button>
                  </div>
                  <div className="relative z-10">
                    <button
                      className="p-2.5 min-h-[44px] min-w-[44px] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-600 flex items-center justify-center"
                      onClick={() => setShowShareOptions(!showShareOptions)}
                      aria-label="Share this product"
                    >
                      <Share2 size={20} />
                    </button>
                    {/* Share Options Dropdown */}
                    {showShareOptions && (
                      <div ref={shareDropdownRef} className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                        <div className="p-3 border-b border-gray-100">
                          <h3 className="text-sm font-semibold text-gray-800">
                            Share this product
                          </h3>
                        </div>
                        <div className="p-2">
                          <button
                            onClick={copyToClipboard}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            {copiedToClipboard ? (
                              <>
                                <Check
                                  size={16}
                                  className="text-green-500 mr-2"
                                />{" "}
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy size={16} className="mr-2" /> Copy link
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => shareViaPlatform("facebook")}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Facebook
                              size={16}
                              className="text-[#1877F2] mr-2"
                            />{" "}
                            Facebook
                          </button>
                          <button
                            onClick={() => shareViaPlatform("twitter")}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Twitter
                              size={16}
                              className="text-[#1DA1F2] mr-2"
                            />{" "}
                            Twitter
                          </button>
                          <button
                            onClick={() => shareViaPlatform("email")}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                          >
                            <Mail size={16} className="text-gray-600 mr-2" />{" "}
                            Email
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    className={`p-2.5 min-h-[44px] min-w-[44px] border rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center ${isInWishlist(Number(product?.product_id))
                      ? "text-primary-600 border-primary-600/30"
                      : "text-gray-600 border-gray-200"
                      }`}
                    onClick={handleWishlist}
                    disabled={wishlistLoading}
                    aria-label="Add to Wishlist"
                  >
                    {wishlistLoading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600/30 border-t-primary-600"></div>
                    ) : (
                      <Heart size={20} className={isInWishlist(Number(product?.product_id)) ? "fill-current" : ""} />
                    )}
                  </button>
                </div>
              </div>

              {/* Replace the dummy variant selector with the new renderVariants function */}
              {renderVariants()}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 overflow-visible">
          <div className="border-b border-gray-100 overflow-x-auto scrollbar-hide">
            <nav className="flex min-w-0 gap-1 p-1 sm:px-2" role="tablist">
              <button
                role="tab"
                aria-selected={activeTab === "product-details"}
                onClick={() => setActiveTab("product-details")}
                className={`py-3 px-4 sm:px-5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "product-details"
                  ? "bg-primary-600/10 text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Description
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "information"}
                onClick={() => setActiveTab("information")}
                className={`py-3 px-4 sm:px-5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "information"
                  ? "bg-primary-600/10 text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Specifications
              </button>
              <button
                role="tab"
                aria-selected={activeTab === "reviews"}
                onClick={() => setActiveTab("reviews")}
                className={`py-3 px-4 sm:px-5 text-sm font-semibold rounded-t-lg whitespace-nowrap transition-colors ${activeTab === "reviews"
                  ? "bg-primary-600/10 text-primary-600 border-b-2 border-primary-600"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
              >
                Reviews
              </button>
            </nav>
          </div>
          {showImageModal && (
            <ImageZoomGallery
              images={product.media}
              index={modalImageIndex}
              setIndex={setModalImageIndex}
              onClose={() => setShowImageModal(false)}
            />
          )}

          <div className="p-4 sm:p-6">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;








