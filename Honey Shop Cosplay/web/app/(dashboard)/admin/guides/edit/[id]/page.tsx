import { ContentEditorPage } from '../../../../../../components/admin/ContentEditorPage';

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ContentEditorPage type="GUIDE" editId={id} />;
}
