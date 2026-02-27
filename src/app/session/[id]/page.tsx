import { MapInterface } from "@/components/MapInterface";

export default async function SessionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const role = resolvedSearchParams.role === "tracker" ? "tracker" : "tracked";

  return (
    <main className="w-full h-screen relative bg-slate-900 outline-none">
      <MapInterface roomId={id} role={role} />
    </main>
  );
}
