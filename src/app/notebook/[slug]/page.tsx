import { getGroups } from "@/app/actions/notebook";
import { GroupDetailClient } from "./GroupDetailClient";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialGroups = await getGroups();
  return <GroupDetailClient slug={slug} initialGroups={initialGroups} />;
}
