import { RentalDetail } from '../../../../../components/admin/RentalDetail';

export default async function RentalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RentalDetail id={id} />;
}
