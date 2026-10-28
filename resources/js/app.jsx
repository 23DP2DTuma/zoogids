import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import { StoreProvider } from './lib/store';
import Calculator from './pages/Calculator';
import Cart from './pages/Cart';
import Catalog from './pages/Catalog';
import Home from './pages/Home';
import NotFound from './pages/NotFound';
import Pets from './pages/Pets';
import Product from './pages/Product';
import SmartFilter from './pages/SmartFilter';
import { Article, Tips } from './pages/Tips';

createRoot(document.getElementById('root')).render(
    <StoreProvider>
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="katalogs" element={<Catalog />} />
                    <Route path="produkts/:id" element={<Product />} />
                    <Route path="gudrais-filtrs" element={<SmartFilter />} />
                    <Route path="kalkulators" element={<Calculator />} />
                    <Route path="mani-miluli" element={<Pets />} />
                    <Route path="grozs" element={<Cart />} />
                    <Route path="padomi" element={<Tips />} />
                    <Route path="padomi/:id" element={<Article />} />
                    <Route path="*" element={<NotFound />} />
                </Route>
            </Routes>
        </BrowserRouter>
    </StoreProvider>,
);
