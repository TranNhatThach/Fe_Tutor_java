import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { Loader2 } from "lucide-react";

export function OAuth2RedirectHandler() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");

    if (token) {
      try {
        // Giải mã token dạng JWT (Base64) - lấy phần Payload (phần thứ 2)
        const base64Url = token.split(".")[1];
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        );
        const decoded = JSON.parse(jsonPayload);

        // Chuẩn bị thông tin User từ decoded JWT
        const user = {
          id: String(decoded.userId),
          userId: decoded.userId,
          email: decoded.sub,
          name: decoded.hoTen,
          role: decoded.role,
        };

        // Lưu vào store
        setAuth(user, token);

        // Chuyển hướng theo Role
        if (user.role === "HOC_VIEN") {
          navigate("/student/dashboard");
        } else if (user.role === "GIA_SU") {
          navigate("/tutor/dashboard");
        } else if (user.role === "ADMIN") {
          navigate("/dashboard");
        } else {
          navigate("/");
        }
      } catch (error) {
        console.error("Token decoding failed:", error);
        navigate("/login");
      }
    } else {
      navigate("/login");
    }
  }, [location, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800">Đang xử lý đăng nhập...</h2>
        <p className="text-slate-500">Vui lòng chờ trong giây lát</p>
      </div>
    </div>
  );
}
