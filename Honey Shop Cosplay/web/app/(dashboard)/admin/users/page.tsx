import { UserManager } from '../../../../components/admin/AdminData';
import { AdminListPageHeader } from '../../../../components/admin/AdminListPageHeader';
export default function UsersPage(){return <div className="min-w-0"><AdminListPageHeader title="Nhân sự & lời mời" description="Quản lý tài khoản và quyền truy cập." /><UserManager/></div>}
