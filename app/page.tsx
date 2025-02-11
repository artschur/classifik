import { getMockImage } from '@/db/queries/images';

export default async function CompanionsPage() {
  const images = await getMockImage();
  if (!images) return null;
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Companions</h1>
      {images.publicUrl}
    </div>
  );
}
