import { FeedbackManager } from '../../../../components/admin/FeedbackManager';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';

export default function FeedbackPage() {
  return <div className="min-w-0"><AdminListPageHeader title="Feedback sản phẩm" description="Duyệt ảnh và nhận xét khách gửi trước khi hiển thị." /><FeedbackManager /></div>;
}
