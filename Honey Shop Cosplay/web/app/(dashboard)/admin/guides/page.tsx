import { ContentManager } from '../../../../components/admin/ContentManager';

export default function GuidesAdminPage() {
  return <div className="p-5 md:p-8"><p className="text-sm font-semibold text-neutral-400">CONTENT</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Hướng dẫn</h1><div className="mt-7"><ContentManager type="GUIDE" /></div></div>;
}
