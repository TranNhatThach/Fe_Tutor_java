import React from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, Star, CheckCircle, ArrowRight, Search, MessageSquare, Monitor, Map, Compass, Target, Rocket } from "lucide-react";
import { motion } from "motion/react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                TutorConnect
              </span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a
                href="#features"
                className="hover:text-emerald-600 transition-colors"
              >
                Tính năng
              </a>
              <a
                href="#how-it-works"
                className="hover:text-emerald-600 transition-colors"
              >
                Cách hoạt động
              </a>
              <a
                href="#roadmap"
                className="hover:text-emerald-600 transition-colors"
              >
                Lộ trình
              </a>
            </div>
            <div className="flex items-center gap-4">
              <Link
                to="/login"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                to="/login"
                className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-emerald-700 transition-all shadow-md shadow-emerald-200"
              >
                Bắt đầu ngay
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold mb-6 tracking-wide uppercase">
              Nền tảng kết nối gia sư hàng đầu
            </span>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-tight">
              Tìm gia sư phù hợp <br />
              <span className="text-emerald-600">Nâng tầm tri thức</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              Kết nối học viên với những gia sư giỏi nhất, tận tâm nhất. Học tập
              hiệu quả với lộ trình cá nhân hóa và sự hỗ trợ 24/7.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
              >
                Tìm gia sư ngay <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/login"
                className="w-full sm:w-auto bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full text-lg font-medium hover:bg-slate-50 transition-all"
              >
                Trở thành gia sư
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="mt-16 relative"
          >
            <div className="absolute inset-0 bg-emerald-500/10 blur-3xl rounded-full -z-10 transform -translate-y-1/2"></div>
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80"
              alt="Students studying"
              className="rounded-3xl shadow-2xl border border-slate-100 mx-auto max-w-5xl w-full object-cover h-[400px] md:h-[600px]"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-slate-900 mb-2">1k+</div>
              <div className="text-sm text-slate-500 uppercase tracking-wider font-medium">
                Học viên
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 mb-2">200+</div>
              <div className="text-sm text-slate-500 uppercase tracking-wider font-medium">
                Gia sư giỏi
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 mb-2">50+</div>
              <div className="text-sm text-slate-500 uppercase tracking-wider font-medium">
                Lớp Học Chất lượng
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-slate-900 mb-2">98%</div>
              <div className="text-sm text-slate-500 uppercase tracking-wider font-medium">
                Hài lòng
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Cách hoạt động
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Chỉ với vài bước đơn giản để bạn có thể bắt đầu hành trình học tập hiệu quả.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Search, title: "Tìm gia sư", desc: "Dễ dàng tìm kiếm gia sư phù hợp với nhu cầu và môn học của bạn." },
              { icon: MessageSquare, title: "Trao đổi", desc: "Kết nối trực tiếp để thống nhất lộ trình và thời gian học tập." },
              { icon: Monitor, title: "Bắt đầu học", desc: "Tham gia lớp học trực tuyến và tiến bộ nhanh chóng mỗi ngày." }
            ].map((step, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <step.icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Learning Roadmap Section */}
      <section id="roadmap" className="py-24 px-4 bg-slate-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Lộ trình học tập chuyên sâu
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Chúng tôi xây dựng lộ trình cá nhân hóa giúp bạn đạt được mục tiêu học tập nhanh nhất.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Compass, title: "Xác định mục tiêu", desc: "Đánh giá năng lực đầu vào và đặt ra mục tiêu học tập rõ ràng." },
              { icon: Map, title: "Lên kế hoạch", desc: "Xây dựng lịch trình học tập linh hoạt, phù hợp với thời gian biểu." },
              { icon: Target, title: "Tập trung thực hành", desc: "Học đi đôi với hành thông qua các bài tập và dự án thực tế." },
              { icon: Rocket, title: "Bứt phá kết quả", desc: "Kiểm tra định kỳ và tinh chỉnh lộ trình để đạt kết quả tối ưu." }
            ].map((item, idx) => (
              <div key={idx} className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                  <item.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Tại sao chọn TutorConnect?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Chúng tôi mang đến giải pháp học tập toàn diện, minh bạch và hiệu
              quả nhất cho mọi lứa tuổi.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                <Users className="text-emerald-600 group-hover:text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Gia sư chất lượng
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Đội ngũ gia sư được tuyển chọn kỹ lưỡng, có bằng cấp và kinh
                nghiệm giảng dạy thực tế.
              </p>
            </div>
            <div className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                <Star className="text-emerald-600 group-hover:text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Lộ trình cá nhân
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Mỗi học viên được thiết kế một lộ trình học tập riêng biệt phù
                hợp với năng lực và mục tiêu.
              </p>
            </div>
            <div className="p-8 rounded-3xl border border-slate-100 bg-white hover:shadow-xl transition-all group">
              <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-500 transition-colors">
                <CheckCircle className="text-emerald-600 group-hover:text-white w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                Minh bạch & An toàn
              </h3>
              <p className="text-slate-600 leading-relaxed">
                Hệ thống đánh giá công khai, thanh toán an toàn và hỗ trợ giải
                quyết mọi thắc mắc.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <div className="bg-emerald-500 p-2 rounded-lg">
                <BookOpen className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight">
                TutorConnect
              </span>
            </div>
            <p className="text-slate-400 max-w-sm">
              Nâng tầm giáo dục thông qua sự kết nối thông minh giữa người dạy
              và người học.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Liên kết</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a
                  href="#roadmap"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Lộ trình
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Môn học
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Blog
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Hỗ trợ</h4>
            <ul className="space-y-2 text-slate-400">
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Trung tâm trợ giúp
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Điều khoản dịch vụ
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
          © 2026 TutorConnect. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
