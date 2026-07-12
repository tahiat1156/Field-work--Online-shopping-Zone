import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Wishlist from './pages/Wishlist.jsx';
import Checkout from './pages/Checkout.jsx';
import Contact from './pages/Contact.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Orders from './pages/Orders.jsx';
import Admin from './pages/Admin.jsx';

const pages = {
  home: Home,
  shop: Shop,
  wishlist: Wishlist,
  checkout: Checkout,
  contact: Contact,
  login: Login,
  register: Register,
  orders: Orders,
  admin: Admin
};

export default function App() {
  const [page, setPage] = useState('home');
  const [routeData, setRouteData] = useState({});

  useEffect(() => {
    const handleHash = () => {
      const raw = window.location.hash.replace('#/', '') || 'home';
      const [name, query] = raw.split('?');
      const params = Object.fromEntries(new URLSearchParams(query || ''));
      setPage(pages[name] ? name : 'home');
      setRouteData(params);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const Page = pages[page] || Home;

  function navigate(nextPage, data = {}) {
    const query = new URLSearchParams(data).toString();
    window.location.hash = `/${nextPage}${query ? `?${query}` : ''}`;
  }

  const isAdminPage = page === 'admin';

  if (isAdminPage) {
    return (
      <main className="admin-only-main">
        <Page navigate={navigate} routeData={routeData} />
      </main>
    );
  }

  return (
    <>
      <Navbar activePage={page} navigate={navigate} />
      <main>
        <Page navigate={navigate} routeData={routeData} />
      </main>
      <Footer navigate={navigate} />
      <CartDrawer navigate={navigate} />
    </>
  );
}
