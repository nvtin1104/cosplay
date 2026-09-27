import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ContentManager } from './ContentManager';

type ContentKind = 'ARTICLE' | 'GUIDE';

export function ContentEditorPage({ type, editId }: { type: ContentKind; editId?: string }) {
  const isGuide = type === 'GUIDE';
  const listPath = isGuide ? '/admin/guides' : '/admin/posts';

  return (
    <div className="p-4 md:p-6">
      <Link href={listPath} className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-neutral-950">
        <ArrowLeft size={16} /> Quay lại {isGuide ? 'hướng dẫn' : 'bài viết'}
      </Link>
      <ContentManager type={type} editorOnly editId={editId} />
    </div>
  );
}
