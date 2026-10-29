import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/AuthContext';
import { CompanyProvider } from './lib/CompanyContext';
import AppShell from './layouts/AppShell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Settings from './pages/Settings';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import ProductDetail from './pages/ProductDetail';
import Inventory from './pages/Inventory';
import Quotations from './pages/Quotations';
import QuotationForm from './pages/QuotationForm';
import QuotationDetail from './pages/QuotationDetail';
import Invoices from './pages/Invoices';
import InvoiceForm from './pages/InvoiceForm';
import InvoiceDetail from './pages/InvoiceDetail';
import Payments from './pages/Payments';
import Ledger from './pages/Ledger';
import Expenses from './pages/Expenses';
import Suppliers from './pages/Suppliers';
import SupplierDetail from './pages/SupplierDetail';
import Purchases from './pages/Purchases';
import SalesReturns from './pages/SalesReturns';
import Reports from './pages/Reports';
import SearchResults from './pages/SearchResults';
import Pos from './pages/Pos';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-ink-700/60">
        Checking your session…
      </div>
    );
  }
  const workspaceRoles = ['User', 'Admin', 'Manager', 'Sales Person', 'Accountant', 'Employee'];
  if (
    !user ||
    user.status !== 'Approved' ||
    !workspaceRoles.includes(user.role)
  ) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />

            <Route path="/" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="pos" element={<Pos />} />

              <Route path="customers" element={<Customers />} />
              <Route path="customers/:id" element={<CustomerDetail />} />

              <Route path="products" element={<Products />} />
              <Route path="products/new" element={<ProductForm />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="products/:id/edit" element={<ProductForm />} />
              <Route path="inventory" element={<Inventory />} />

              <Route path="quotations" element={<Quotations />} />
              <Route path="quotations/new" element={<QuotationForm />} />
              <Route path="quotations/:id" element={<QuotationDetail />} />
              <Route path="quotations/:id/edit" element={<QuotationForm />} />

              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/new" element={<InvoiceForm />} />
              <Route path="invoices/:id" element={<InvoiceDetail />} />
              <Route path="invoices/:id/edit" element={<InvoiceForm />} />

              <Route path="payments" element={<Payments />} />
              <Route path="ledger" element={<Ledger />} />
              <Route path="expenses" element={<Expenses />} />

              <Route path="suppliers" element={<Suppliers />} />
              <Route path="suppliers/:id" element={<SupplierDetail />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="sales-returns" element={<SalesReturns />} />

              <Route path="reports" element={<Reports />} />
              <Route path="search" element={<SearchResults />} />

              <Route path="settings" element={<Settings />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CompanyProvider>
    </AuthProvider>
  );
}
