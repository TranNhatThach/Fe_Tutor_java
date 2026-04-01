import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BookOpen, User, UserCheck, ArrowLeft, Loader2, Mail, Lock, Phone, MapPin, UserCircle } from "lucide-react";
import { apiClient } from "../../api/client";
import backgroundImage from "../../layouts/GộvsSus.png";

export function RegisterPage() {
  const [role, setRole] = useState<"HOC_VIEN" | "GIA_SU">("HOC_VIEN");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiClient<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          username: name,
          email,
          password,
          confirmPassword,
          role,
          phone,
          address,
        }),
      });

      if (response.success) {
        alert("Đăng ký thành công! Vui lòng đăng nhập.");
        navigate("/login");
      } else {
        alert(
          "Đăng ký thất bại: " + (response.message || "Lỗi không xác định."),
        );
      }
    } catch (err: any) {
      alert(err.message || "Có lỗi xảy ra trong quá trình đăng ký.");
    } finally {
      setIsLoading(false);
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
      {/* Background Layer */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>

      {/* Particle Background */}


      <div className="max-w-4xl w-full relative z-10 my-8">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/40 p-8 md:p-12 overflow-hidden">
          {/* Top Glow */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-50"></div>

          <div className="flex flex-col md:flex-row gap-12">
            {/* Left Side: Info */}
            <div className="md:w-1/3 flex flex-col justify-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-emerald-600 transition-all mb-8 w-fit bg-white/50 px-4 py-2 rounded-full border border-slate-200/50 shadow-sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" /> Quay lại
              </Link>

              <div className="bg-gradient-to-br from-emerald-400 to-emerald-600 p-4 rounded-2xl shadow-xl shadow-emerald-500/20 w-16 h-16 flex items-center justify-center mb-6">
                <BookOpen className="text-white w-8 h-8" />
              </div>

              <h1 className="text-3xl font-black text-slate-900 mb-4 leading-tight">
                Tạo tài khoản <span className="text-emerald-600">Mới</span>
              </h1>
              <p className="text-slate-600 font-medium leading-relaxed">
                Bắt đầu hành trình kết nối tri thức cùng hàng ngàn gia sư và học viên khác.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-slate-700 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">01</div>
                  Chọn vai trò của bạn
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">02</div>
                  Điền thông tin cá nhân
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-semibold">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">03</div>
                  Bắt đầu trải nghiệm
                </div>
              </div>
            </div>

            {/* Right Side: Form */}
            <div className="md:w-2/3">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Role Switcher */}
                <div className="grid grid-cols-2 gap-4 p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/50">
                  <button
                    type="button"
                    onClick={() => setRole("HOC_VIEN")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${role === "HOC_VIEN"
                        ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <User className="w-5 h-5" />
                    Học viên
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("GIA_SU")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${role === "GIA_SU"
                        ? "bg-white text-emerald-600 shadow-md ring-1 ring-black/5"
                        : "text-slate-500 hover:text-slate-700"
                      }`}
                  >
                    <UserCheck className="w-5 h-5" />
                    Gia sư
                  </button>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Họ và tên</label>
                    <div className="relative group">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="Nguyễn Văn A"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Email</label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="email"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="name@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Mật khẩu</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="password"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Xác nhận mật khẩu</label>
                    <div className="relative group">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="password"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Số điện thoại</label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="tel"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="0123 456 789"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 ml-1">Địa chỉ</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                      <input
                        type="text"
                        required
                        className="w-full pl-12 pr-4 py-3.5 bg-white/50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-medium"
                        placeholder="Thành phố, Quận/Huyện"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-500 font-medium">
                    Bằng cách đăng ký, bạn đồng ý với <a href="#" className="text-emerald-600 font-bold hover:underline">Điều khoản dịch vụ</a> và <a href="#" className="text-emerald-600 font-bold hover:underline">Chính sách bảo mật</a>.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transform active:scale-[0.98] transition-all flex items-center justify-center disabled:opacity-70 group"
                >
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Đăng ký ngay"
                  )}
                </button>
              </form>

              <div className="mt-8 text-center">
                <p className="text-slate-500 font-medium">
                  Đã có tài khoản?{" "}
                  <Link
                    to="/login"
                    className="text-emerald-600 font-black hover:text-emerald-700 transition-colors"
                  >
                    Đăng nhập ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
