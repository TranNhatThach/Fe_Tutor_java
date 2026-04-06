import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { GraduationCap, BookUser, ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export function SelectRolePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState<string | null>(null);

  const params = new URLSearchParams(location.search);
  const email = params.get("email");
  const name = params.get("name");
  const avatar = params.get("avatar");

  const handleSelectRole = async (role: "HOC_VIEN" | "GIA_SU") => {
    setLoading(role);
    try {
      // Gọi API hoàn tất đăng ký social
      const response = await fetch("http://localhost:8080/api/auth/social-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, avatar, role }),
      });

      const data = await response.json();

      if (data.success) {
        const user = {
          id: String(data.userId),
          userId: data.userId,
          email: data.email || email,
          name: data.username || name,
          role: data.role,
        };

        setAuth(user, data.token);

        // Chuyển hướng
        if (role === "HOC_VIEN") navigate("/student/dashboard");
        else navigate("/tutor/dashboard");
      }
    } catch (error) {
      console.error("Lỗi hoàn tất đăng nhập:", error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-10">
          {avatar && (
            <div className="flex justify-center mb-4">
              <img 
                src={avatar} 
                alt="Avatar" 
                className="w-20 h-20 rounded-full border-4 border-white shadow-lg object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}
          <h1 className="text-3xl font-black text-slate-900 mb-2">Bạn tham gia với vai trò nào?</h1>
          <p className="text-slate-500 font-medium">Chào mừng {name}! Vui lòng chọn vai trò để tiếp tục.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Học viên Card */}
          <button
            onClick={() => handleSelectRole("HOC_VIEN")}
            disabled={!!loading}
            className="group relative bg-white border-2 border-slate-200 rounded-[2rem] p-8 text-left transition-all hover:border-emerald-500 hover:shadow-2xl hover:shadow-emerald-500/10 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="bg-emerald-100 text-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3">
              <GraduationCap size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-emerald-600">Tôi là Học viên</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Tìm kiếm gia sư phù hợp, đăng tin yêu cầu và kết nối để bắt đầu hành trình học tập.
            </p>
            <div className="flex items-center text-emerald-600 font-bold text-sm">
              {loading === "HOC_VIEN" ? <Loader2 className="animate-spin" /> : <>Bắt đầu ngay <ArrowRight className="ml-2 w-4 h-4" /></>}
            </div>
          </button>

          {/* Gia sư Card */}
          <button
            onClick={() => handleSelectRole("GIA_SU")}
            disabled={!!loading}
            className="group relative bg-white border-2 border-slate-200 rounded-[2rem] p-8 text-left transition-all hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-[0.98] disabled:opacity-50"
          >
            <div className="bg-blue-100 text-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 group-hover:-rotate-3">
              <BookUser size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600">Tôi là Gia sư</h3>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              Tìm kiếm lớp dạy, quản lý học viên và chia sẻ kiến thức để nâng cao thu nhập.
            </p>
            <div className="flex items-center text-blue-600 font-bold text-sm">
              {loading === "GIA_SU" ? <Loader2 className="animate-spin" /> : <>Ứng tuyển ngay <ArrowRight className="ml-2 w-4 h-4" /></>}
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
