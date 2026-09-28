import { FeedbackManager } from '../../../../components/admin/FeedbackManager';

export default function FeedbackPage() {
  return <div className="p-5 md:p-8"><p className="text-sm font-semibold uppercase tracking-[.16em] text-amber-700">Nội dung khách hàng</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Feedback sản phẩm</h1><p className="mt-2 text-sm text-neutral-500">Duyệt ảnh và nhận xét khách gửi, sau đó hiển thị trên trang chi tiết sản phẩm.</p><div className="mt-7"><FeedbackManager /></div></div>;
}
