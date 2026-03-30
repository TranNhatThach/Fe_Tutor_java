import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { LogIn, Loader2, BookOpen, ArrowLeft } from "lucide-react";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { user, token } = useAuthStore();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user && token) {
      console.log("User already logged in, redirecting...", user);
      if (user.role === "HOC_VIEN") {
        navigate("/student/dashboard");
      } else if (user.role === "GIA_SU") {
        navigate("/tutor/dashboard");
      } else if (user.role === "ADMIN") {
        navigate("/users");
      }
    }
  }, [user, token, navigate]);

  const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL;
  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      useAuthStore.getState().setAuth(
        {
          id: "admin",
          email: ADMIN_EMAIL,
          name: "Admin",
          role: "ADMIN", // ✅ Khớp với type Role
        },
        "admin-local-token",
      );
      navigate("/users");
      return;
    }
    try {
      const data = await login.mutateAsync({ email, password });

      if (!data || !data.token) {
        alert(
          "Lỗi đăng nhập: " +
            (data?.message || "Dữ liệu trả về từ server không hợp lệ."),
        );
        return;
      }
      const role = data.role;

      if (role === "HOC_VIEN") {
        navigate("/student/dashboard");
      } else if (role === "GIA_SU") {
        navigate("/tutor/dashboard");
      } else if (role === "ADMIN") {
        navigate("/users");
      } else {
        navigate("/");
      }
    } catch (err: any) {
      alert(
        err.message ||
          "Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.",
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>

        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-sm text-slate-500 hover:text-emerald-600 transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Quay lại trang chủ
          </Link>

          <div className="flex items-center gap-2 mb-4">
            <div className="bg-emerald-500 p-2 rounded-lg shadow-lg shadow-emerald-200">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              TutorConnect
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-1">
            Chào mừng trở lại!
          </h1>
          <p className="text-slate-500">
            Đăng nhập để tiếp tục hành trình học tập
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Mật khẩu
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-400"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              Ghi nhớ đăng nhập
            </label>
            <a
              href="#"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Quên mật khẩu?
            </a>
          </div>

          <button
            type="submit"
            disabled={login.isPending}
            className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center disabled:opacity-70 active:scale-[0.98]"
          >
            {login.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5 mr-2" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            to="/register"
            className="text-emerald-600 font-bold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
