import { PostManager } from '../../../../components/admin/AdminData';
import { getPosts } from '../../../../lib/api';

export default async function PostsPage() {
  const initialPosts = await getPosts();
  return (
    <div className="p-5 md:p-8">
      <p className="text-sm font-semibold text-neutral-400">CONTENT</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight">Bài viết & hướng dẫn</h1>
      <div className="mt-7">
        <PostManager initialPosts={initialPosts} />
      </div>
    </div>
  );
}

