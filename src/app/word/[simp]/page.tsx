import type { Metadata } from "next";
import { WordDetailPage } from "./WordDetailPage";

interface Props {
  params: Promise<{ simp: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { simp } = await params;
  const decoded = decodeURIComponent(simp);
  return {
    title: `${decoded} — Hiểu Chữ Hán`,
    description: `Tra nghĩa và phân tích chữ Hán: ${decoded}`,
  };
}

export default async function WordPage({ params }: Props) {
  const { simp } = await params;
  const decoded = decodeURIComponent(simp);
  return <WordDetailPage simp={decoded} />;
}
