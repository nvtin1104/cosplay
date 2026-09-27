import { ContentManager } from '../../../../components/admin/ContentManager';

export default async function PostsPage() {
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold text-neutral-400">CONTENT</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Bài viết</h1>
      <div className="mt-7">
        <ContentManager type="ARTICLE" />
      </div>
    </div>
  );
}

