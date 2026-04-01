import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";
import { LogIn, Loader2, BookOpen, ArrowLeft, Mail, Lock, CheckCircle2 } from "lucide-react";
import backgroundImage from "../../layouts/GộvsSus.png";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { user, token } = useAuthStore();

  // Redirect if already authenticated
  React.useEffect(() => {
    if (user && token) {
      if (user.role === "HOC_VIEN") {
        navigate("/student/dashboard");
      } else if (user.role === "GIA_SU") {
        navigate("/tutor/dashboard");
      } else if (user.role === "ADMIN") {
        navigate("/dashboard");
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
          role: "ADMIN",
        },
        "admin-local-token",
      );
      navigate("/dashboard");
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
        navigate("/dashboard");
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
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden font-sans"
      style={{
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Dynamic Overlay */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

      {/* Animated Shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/20 rounded-full blur-[120px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>

      <div className="max-w-xl w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/40 p-8 md:p-12 overflow-hidden transform transition-all hover:scale-[1.01]">
          {/* Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50"></div>

          <div className="mb-10 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-emerald-600 transition-all mb-8 bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại trang chủ
            </Link>

            <div className="flex flex-col items-center gap-4">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-2xl shadow-xl shadow-emerald-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <BookOpen className="text-white w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                  TutorConnect
                </h1>
                <div className="h-1 w-12 bg-emerald-500 rounded-full mx-auto mt-1"></div>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold text-slate-800">Chào mừng trở lại!</h2>
              <p className="text-slate-500 mt-2 font-medium">
                Sẵn sàng để tiếp tục hành trình chi phục tri thức?
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-slate-700 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="block text-sm font-bold text-slate-700">
                  Mật khẩu
                </label>
                <a
                  href="#"
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-12 pr-4 py-4 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <label className="relative flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    className="peer sr-only"
                  />
                  <div className="w-5 h-5 border-2 border-slate-300 rounded-md peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white scale-0 peer-checked:scale-100 transition-transform" />
                  </div>
                </div>
                <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                  Ghi nhớ đăng nhập
                </span>
              </label>
            </div>

            <button
              type="submit"
              disabled={login.isPending}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:shadow-emerald-500/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 group"
            >
              {login.isPending ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <span>Đăng nhập</span>
                  <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-slate-200/50 text-center">
            <p className="text-slate-500 font-medium">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-emerald-600 font-black hover:text-emerald-700 transition-colors relative inline-block group"
              >
                Đăng ký ngay
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-600 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></span>
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
