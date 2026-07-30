import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Starfield from "@/components/Starfield";
import Navbar from "@/components/Navbar";
import Landing from "@/pages/Landing";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import Horoscopes from "@/pages/Horoscopes";
import BirthChart from "@/pages/BirthChart";
import Compatibility from "@/pages/Compatibility";
import AIChat from "@/pages/AIChat";
import Pricing from "@/pages/Pricing";
import PaymentSuccess from "@/pages/PaymentSuccess";
import PaymentCancel from "@/pages/PaymentCancel";
import "@/App.css";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>;
  if (!user) return <Navigate to="/auth" replace />;
  return children;
}

function Shell() {
  return (
    <>
      <Starfield density={120} />
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/horoscopes" element={<Horoscopes />} />
        <Route path="/compatibility" element={<Compatibility />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />
        <Route path="/payment/cancel" element={<PaymentCancel />} />
        <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
        <Route path="/birth-chart" element={<Protected><BirthChart /></Protected>} />
        <Route path="/ai-astrologer" element={<Protected><AIChat /></Protected>} />
      </Routes>
      <Toaster position="top-right" theme="dark" />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Shell />
      </BrowserRouter>
    </AuthProvider>
  );
}
