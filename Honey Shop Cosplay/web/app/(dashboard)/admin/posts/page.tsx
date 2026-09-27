import { ContentManager } from '../../../../components/admin/ContentManager';

export default async function PostsPage() {
  return (
    <div className="p-4 md:p-7">
      <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 md:text-3xl">Bài viết</h1>
      <div className="mt-4 md:mt-5">
        <ContentManager type="ARTICLE" />
      </div>
    </div>
  );
}

