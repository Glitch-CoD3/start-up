import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import RequireAuth from './guards/RequireAuth'
import RequireAdmin from './guards/RequireAdmin'
import MainLayout from '../components/layouts/MainLayout'
import AdminLayout from '../components/layouts/AdminLayout'

const HomePage = lazy(() => import('../features/catalog/pages/HomePage'))
const ProductListPage = lazy(() => import('../features/catalog/pages/ProductListPage'))
const ProductDetailPage = lazy(() => import('../features/catalog/pages/ProductDetailPage'))
const CartPage = lazy(() => import('../features/cart/pages/CartPage'))
const ProfilePage = lazy(() => import('../features/account/pages/ProfilePage'))
const AddressesPage = lazy(() => import('../features/account/pages/AddressesPage'))
const AuthPage = lazy(() => import('../features/auth/pages/AuthPage'))
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage'))
const AdminDashboardPage = lazy(() => import('../features/admin/pages/DashboardPage'))
const AdminProductsPage = lazy(() => import('../features/admin/pages/ProductsPage'))
const AdminProductEditPage = lazy(() => import('../features/admin/pages/ProductEditPage'))
const AdminInventoryPage = lazy(() => import('../features/admin/pages/InventoryPage'))
const AdminOrdersPage = lazy(() => import('../features/admin/pages/OrdersPage'))
const AdminOrderDetailPage = lazy(() => import('../features/admin/pages/OrderDetailPage'))
const AdminCategoriesPage = lazy(() => import('../features/admin/pages/CategoriesPage'))
const AdminBrandsPage = lazy(() => import('../features/admin/pages/BrandsPage'))
const AdminFeatureImagesPage = lazy(() => import('../features/admin/pages/FeatureImagesPage'))
const AdminLayoutPage = lazy(() => import('../features/admin/pages/LayoutPage'))
const AdminSettingsPage = lazy(() => import('../features/admin/pages/SettingsPage'))
const CheckoutPage = lazy(() => import('../features/checkout/pages/CheckoutPage'))
const OrderSuccessPage = lazy(() => import('../features/checkout/pages/OrderSuccessPage'))

export default function AppRouter() {
  return (
    <Suspense fallback={<div className="detail-loading" aria-label="Loading page"><span /></div>}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="shop" element={<ProductListPage />} />
          <Route path="product/:slug" element={<ProductDetailPage />} />
          <Route path="cart" element={<CartPage />} />
          <Route
            path="checkout"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="order-success/:id"
            element={
              <RequireAuth>
                <OrderSuccessPage />
              </RequireAuth>
            }
          />
          <Route
            path="account"
            element={
              <RequireAuth>
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route
            path="account/addresses"
            element={
              <RequireAuth>
                <AddressesPage />
              </RequireAuth>
            }
          />
        </Route>
        <Route path="login" element={<AuthPage mode="login" />} />
        <Route path="signup" element={<AuthPage mode="signup" />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductEditPage />} />
          <Route path="products/:id/edit" element={<AdminProductEditPage />} />
          <Route path="inventory" element={<AdminInventoryPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="images" element={<AdminFeatureImagesPage />} />
          <Route path="layout" element={<AdminLayoutPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}