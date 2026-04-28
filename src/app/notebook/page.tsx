import {getGroups} from "@/app/actions/notebook";
import {NotebookPageClient} from "./NotebookPageClient";

export default async function NotebookPage() {
  const initialGroups = await getGroups();
  return <NotebookPageClient initialGroups={initialGroups} />;
}
