import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quyền riêng tư & bảo mật',
  description: 'Thông tin về dữ liệu khách hàng, mục đích sử dụng và cách bảo vệ thông tin tại Honey Shop Cosplay.',
};

export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#fff6dc] py-12"><article className="shell">
    <p className="inline-flex border-2 border-[#24150e] bg-[#ffe75c] px-4 py-2 text-xs font-extrabold shadow-[3px_4px_0_#24150e]">MINH BẠCH & AN TOÀN</p>
    <h1 className="display mt-5 text-4xl font-extrabold text-[#24150e] sm:text-5xl">Quyền riêng tư & bảo mật</h1>
    <p className="mt-3 text-sm text-[#624b40]">Cập nhật: 06/10/2026</p>
    <div className="sticker mt-8 space-y-7 bg-white p-6 leading-7 text-[#624b40] sm:p-9">
      <section><h2 className="display text-2xl font-extrabold text-[#24150e]">Thông tin Honey xử lý</h2><p className="mt-2">Khi bạn đăng nhập bằng Google, Honey nhận thông tin hồ sơ cơ bản mà Google chia sẻ theo lựa chọn và quyền bạn cấp, như tên, địa chỉ email và trạng thái xác minh email. Honey không nhận hoặc lưu mật khẩu Google. Bạn có thể tự bổ sung tên hiển thị, đường dẫn Facebook và thông tin cần thiết để xử lý yêu cầu thuê.</p></section>
      <section><h2 className="display text-2xl font-extrabold text-[#24150e]">Mục đích sử dụng</h2><p className="mt-2">Thông tin được sử dụng để xác định và bảo vệ phiên đăng nhập, ghép yêu cầu thuê với hồ sơ của bạn, quản lý lịch thuê và điểm thành viên (nếu có), phản hồi câu hỏi, hỗ trợ sau thuê và duy trì an toàn hệ thống. Honey không bán dữ liệu cá nhân hoặc sử dụng dữ liệu cho quảng cáo cá nhân hóa. Honey không sử dụng thông tin cho mục đích khác ngoài các mục đích đã thông báo, trừ khi pháp luật yêu cầu hoặc bạn đồng ý.</p></section>
      <section><h2 className="display text-2xl font-extrabold text-[#24150e]">Chia sẻ và lưu trữ</h2><p className="mt-2">Google xử lý việc xác thực theo chính sách của Google. Honey chỉ chia sẻ dữ liệu với nhà cung cấp hạ tầng cần thiết để vận hành website, hoặc với cơ quan có thẩm quyền khi có căn cứ pháp luật. Dữ liệu được lưu trong thời gian cần thiết cho các mục đích nêu trên, việc hỗ trợ khách hàng và nghĩa vụ lưu trữ theo quy định áp dụng; sau đó sẽ được xóa hoặc ẩn danh khi phù hợp.</p></section>
      <section><h2 className="display text-2xl font-extrabold text-[#24150e]">Bảo vệ tài khoản và quyền của bạn</h2><p className="mt-2">Honey áp dụng các biện pháp kỹ thuật và quản trị phù hợp để hạn chế truy cập trái phép. Bạn có thể yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân, hoặc rút lại quyền đăng nhập Google trong phạm vi pháp luật cho phép. Một số dữ liệu có thể cần được giữ lại nếu cần thiết để giải quyết yêu cầu đang xử lý hoặc tuân thủ nghĩa vụ pháp lý.</p></section>
      <section><h2 className="display text-2xl font-extrabold text-[#24150e]">Phạm vi hoạt động</h2><p className="mt-2">Website giới thiệu trang phục cosplay cho thuê và tiếp nhận yêu cầu để Honey trao đổi, xác nhận trực tiếp với khách. Website không cung cấp chức năng đặt hàng và thanh toán trực tuyến. Nội dung này mô tả cách vận hành hiện tại; việc phân loại và nghĩa vụ pháp lý còn phụ thuộc vào hoạt động thực tế và quy định tại thời điểm áp dụng.</p></section>
      <section><h2 className="display text-2xl font-extrabold text-[#24150e]">Liên hệ</h2><p className="mt-2">Để gửi yêu cầu về dữ liệu cá nhân, vui lòng liên hệ Honey qua thông tin điện thoại, email hoặc mạng xã hội được hiển thị ở cuối trang.</p></section>
      <p className="border-t border-neutral-200 pt-4 text-xs leading-5 text-neutral-500">Thông báo này nhằm giải thích hoạt động xử lý dữ liệu của website, không thay thế tư vấn pháp lý. Honey sẽ cập nhật nội dung nếu cách xử lý hoặc quy định áp dụng thay đổi.</p>
    </div>
  </article></main>;
}
