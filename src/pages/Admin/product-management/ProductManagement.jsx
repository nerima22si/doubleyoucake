import { useMemo, useState } from "react";
import ProductHeader from "./components/ProductHeader";
import ProductStatsCard from "./components/ProductStatsCard";
import ProductSearchBar from "./components/ProductSearchBar";
import ProductTable from "./components/ProductTable";
import ProductGrid from "./components/ProductGrid";
import ProductFormModal from "./components/ProductFormModal";
import CategoryManagement from "./components/CategoryManagement";
import CategoryFormModal from "./components/CategoryFormModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import Toast from "./components/Toast";


import { useProducts } from "../../../hooks/useProduct";
import {useCategories} from "../../../hooks/useCategories";
import { getProductStats } from "../../../utils/productUtils";

export default function ProductManagementMain() {
    const [activeTab, setActiveTab] = useState("products");
    const [view, setView] = useState("table");
    const [search, setSearch] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [status, setStatus] = useState("");

    const [productModal, setProductModal] = useState({
        open: false,
        editing: null,
    });

    const [categoryModal, setCategoryModal] = useState({
        open: false,
        editing: null,
    });

    const [confirm, setConfirm] = useState({
        open: false,
        type: null,
        item: null,
    });

    const [toast, setToast] = useState(null);

    const {
        products,
        loading: productsLoading,
        addProduct,
        updateProduct,
        deleteProduct,
    } = useProducts();

    const {
        categories,
        loading: categoriesLoading,
        addCategory,
        updateCategory,
        deleteCategory,
    } = useCategories();

    const showToast = (message, type = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 2200);
    };

    const filteredProducts = useMemo(() => {
        const q = search.toLowerCase();

        return products.filter((product) => {
            const name = product.name?.toLowerCase() || "";
            const desc = product.description?.toLowerCase() || "";
            const category = product.categories?.name?.toLowerCase() || "";

            const matchSearch =
                name.includes(q) ||
                desc.includes(q) ||
                category.includes(q);

            const matchCategory =
                !categoryId || String(product.category_id) === String(categoryId);

            const matchStatus =
                !status || product.product_status === status;

            return matchSearch && matchCategory && matchStatus;
        });
    }, [products, search, categoryId, status]);

    const stats = useMemo(() => getProductStats(products), [products]);

    const handleProductSubmit = async (payload, imageFile, oldImageUrl) => {
        try {
            if (productModal.editing) {
                await updateProduct(
                    productModal.editing.id,
                    payload,
                    imageFile,
                    oldImageUrl
                );

                showToast("Product updated successfully");
            } else {
                await addProduct(payload, imageFile);
                showToast("Product added successfully");
            }

            setProductModal({ open: false, editing: null });
        } catch (error) {
            showToast(error.message, "error");
        }
    };

    const handleCategorySubmit = async (payload) => {
        try {
            if (categoryModal.editing) {
                await updateCategory(categoryModal.editing.id, payload);
                showToast("Category updated successfully");
            } else {
                await addCategory(payload);
                showToast("Category added successfully");
            }

            setCategoryModal({ open: false, editing: null });
        } catch (error) {
            showToast(error.message, "error");
        }
    };

    const handleDelete = async () => {
        try {
            if (confirm.type === "product") {
                await deleteProduct(confirm.item);
                showToast("Product deleted successfully");
            }

            if (confirm.type === "category") {
                await deleteCategory(confirm.item.id);
                showToast("Category deleted successfully");
            }

            setConfirm({ open: false, type: null, item: null });
        } catch (error) {
            showToast(error.message, "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] p-6 text-[#4A2C2A]">
            <Toast toast={toast} />

            <div className="max-w-7xl mx-auto">
                <ProductHeader
                    activeTab={activeTab}
                    setActiveTab={setActiveTab}
                    onAddProduct={() =>
                        setProductModal({ open: true, editing: null })
                    }
                    onAddCategory={() =>
                        setCategoryModal({ open: true, editing: null })
                    }
                />

                {activeTab === "products" && (
                    <>
                        <ProductStatsCard stats={stats} />

                        <ProductSearchBar
                            search={search}
                            setSearch={setSearch}
                            categoryId={categoryId}
                            setCategoryId={setCategoryId}
                            status={status}
                            setStatus={setStatus}
                            categories={categories}
                            view={view}
                            setView={setView}
                        />

                        {view === "table" ? (
                            <ProductTable
                                products={filteredProducts}
                                loading={productsLoading}
                                onEdit={(product) =>
                                    setProductModal({
                                        open: true,
                                        editing: product,
                                    })
                                }
                                onDelete={(product) =>
                                    setConfirm({
                                        open: true,
                                        type: "product",
                                        item: product,
                                    })
                                }
                            />
                        ) : (
                            <ProductGrid
                                products={filteredProducts}
                                loading={productsLoading}
                                onEdit={(product) =>
                                    setProductModal({
                                        open: true,
                                        editing: product,
                                    })
                                }
                                onDelete={(product) =>
                                    setConfirm({
                                        open: true,
                                        type: "product",
                                        item: product,
                                    })
                                }
                            />
                        )}
                    </>
                )}

                {activeTab === "categories" && (
                    <CategoryManagement
                        categories={categories}
                        loading={categoriesLoading}
                        products={products}
                        onEdit={(category) =>
                            setCategoryModal({
                                open: true,
                                editing: category,
                            })
                        }
                        onDelete={(category) =>
                            setConfirm({
                                open: true,
                                type: "category",
                                item: category,
                            })
                        }
                    />
                )}
            </div>

            <ProductFormModal
                open={productModal.open}
                editing={productModal.editing}
                categories={categories}
                onClose={() => setProductModal({ open: false, editing: null })}
                onSubmit={handleProductSubmit}
            />

            <CategoryFormModal
                open={categoryModal.open}
                editing={categoryModal.editing}
                onClose={() => setCategoryModal({ open: false, editing: null })}
                onSubmit={handleCategorySubmit}
            />

            <DeleteConfirmModal
                open={confirm.open}
                title={
                    confirm.type === "product"
                        ? "Delete product?"
                        : "Delete category?"
                }
                desc="Data yang dihapus tidak bisa dikembalikan."
                onCancel={() => setConfirm({ open: false, type: null, item: null })}
                onConfirm={handleDelete}
            />
        </div>
    );
}