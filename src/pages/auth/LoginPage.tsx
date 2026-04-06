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

      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/40 p-6 md:p-8 overflow-hidden transform transition-all hover:scale-[1.01]">
          {/* Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50"></div>

          <div className="mb-10 text-center">
            <Link
              to="/"
              className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-emerald-600 transition-all mb-4 bg-white/50 px-3 py-1.5 rounded-full border border-slate-200/50 shadow-sm"
            >
              <ArrowLeft className="w-3 h-3 mr-2" /> Quay lại trang chủ
            </Link>

            <div className="flex flex-col items-center gap-2">
              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-2.5 rounded-xl shadow-xl shadow-emerald-500/20 transform -rotate-3 hover:rotate-0 transition-transform duration-300">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                  TutorConnect
                </h1>
                <div className="h-1 w-10 bg-emerald-500 rounded-full mx-auto mt-1"></div>
              </div>
            </div>

            <div className="mt-4">
              <h2 className="text-lg font-bold text-slate-800">Chào mừng trở lại!</h2>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 font-medium text-sm"
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
                  className="w-full pl-12 pr-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-400 text-sm"
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3.5 rounded-2xl font-black text-base hover:shadow-2xl hover:shadow-emerald-500/40 transform active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-70 group"
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

          {/* Social Login Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
              <span className="px-2 bg-white text-slate-400 font-bold">Hoặc</span>
            </div>
          </div>

          <button
            onClick={() => window.location.href = "http://localhost:8080/oauth2/authorization/google"}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-100 text-slate-700 py-3 rounded-2xl font-bold border border-slate-200 shadow-sm transition-all transform active:scale-[0.98] group"
          >
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="group-hover:text-slate-900">Tiếp tục với Google</span>
          </button>

          <div className="mt-6 pt-6 border-t border-slate-200/50 text-center">
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
