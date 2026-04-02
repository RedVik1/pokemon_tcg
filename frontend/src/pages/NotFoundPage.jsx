import { useNavigate } from "react-router-dom";
import { SearchX, ArrowLeft } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-[#0a0a0a] text-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-teal-500/10 flex items-center justify-center">
          <SearchX size={32} className="text-teal-500" />
        </div>
        <h1 className="text-6xl font-black text-white mb-2">404</h1>
        <p className="text-lg text-slate-400 font-bold mb-1">Page not found</p>
        <p className="text-sm text-slate-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <button
          onClick={() => navigate("/dashboard")}
          className="px-6 py-3 bg-teal-500 text-black font-bold rounded-xl active:bg-teal-600 hover:bg-teal-400 transition-colors flex items-center justify-center gap-2 mx-auto"
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    </div>
  );
}
