import { ContentEditorPage } from '../../../../../../components/admin/ContentEditorPage';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContentEditorPage type="ARTICLE" editId={id} />;
}
