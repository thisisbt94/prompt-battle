import { notFound } from "next/navigation";
import { BattleApp } from "@/components/BattleApp";
import { BattleId } from "@/lib/types";

export default async function BattlePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (id !== "a" && id !== "b") notFound();
  return <BattleApp id={id as BattleId} />;
}
