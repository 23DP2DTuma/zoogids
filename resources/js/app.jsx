import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ConfirmProvider } from './components/ConfirmDialog';
import { GuestOnly, RequireAdmin, RequireAuth } from './components/Guards';
import Layout from './components/Layout';
import { I18nProvider, useI18n } from './lang';
import { AuthProvider } from './lib/auth';
import { StoreProvider } from './lib/store';
import AdminLayout, { AdminDashboard } from './pages/admin/AdminLayout';
import { ArticlesAdmin, BrandsAdmin, CategoriesAdmin, ProblemsAdmin, ProductsAdmin } from './pages/admin/CatalogAdmin';
import { OrdersAdmin, ReviewsAdmin, SubscriptionsAdmin, UsersAdmin } from './pages/admin/SalesAdmin';
import Calculator from './pages/Calculator';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound, { Forbidden } from './pages/NotFound';
import { OrderDetail } from './pages/Orders';
import Pets from './pages/Pets';
import Product from './pages/Product';
import Profile from './pages/Profile';
import Register from './pages/Register';
import SmartFilter from './pages/SmartFilter';
import { Article, Tips } from './pages/Tips';

function AppRoutes() {
    // Mainot valodu, lapas tiek pārzīmētas no jauna ar jaunajiem tekstiem
    const { lang } = useI18n();
    return (
        <Routes key={lang}>
            <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="katalogs" element={<Catalog />} />
                <Route path="produkts/:id" element={<Product />} />
                <Route path="gudrais-filtrs" element={<SmartFilter />} />
                <Route path="kalkulators" element={<Calculator />} />
                <Route path="grozs" element={<Cart />} />
                <Route path="padomi" element={<Tips />} />
                <Route path="padomi/:id" element={<Article />} />
                <Route path="pieslegties" element={<GuestOnly><Login /></GuestOnly>} />
                <Route path="registreties" element={<GuestOnly><Register /></GuestOnly>} />

                <Route element={<RequireAuth />}>
                    <Route path="profils" element={<Profile />} />
                    <Route path="mani-miluli" element={<Pets />} />
                    <Route path="pasutijums/:id" element={<OrderDetail />} />
                </Route>

                <Route path="admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                    <Route index element={<AdminDashboard />} />
                    <Route path="produkti" element={<ProductsAdmin />} />
                    <Route path="kategorijas" element={<CategoriesAdmin />} />
                    <Route path="zimoli" element={<BrandsAdmin />} />
                    <Route path="problemas" element={<ProblemsAdmin />} />
                    <Route path="raksti" element={<ArticlesAdmin />} />
                    <Route path="pasutijumi" element={<OrdersAdmin />} />
                    <Route path="abonementi" element={<SubscriptionsAdmin />} />
                    <Route path="atsauksmes" element={<ReviewsAdmin />} />
                    <Route path="lietotaji" element={<UsersAdmin />} />
                </Route>

                <Route path="403" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
            </Route>
        </Routes>
    );
}

createRoot(document.getElementById('root')).render(
    <I18nProvider>
        <AuthProvider>
            <StoreProvider>
                <ConfirmProvider>
                    <BrowserRouter>
                        <AppRoutes />
                    </BrowserRouter>
                </ConfirmProvider>
            </StoreProvider>
        </AuthProvider>
    </I18nProvider>,
);
