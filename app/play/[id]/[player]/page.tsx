import { notFound } from "next/navigation";
import { PlayerApp } from "@/components/PlayerApp";
import { BattleId, Player } from "@/lib/types";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string; player: string }>;
}) {
  const { id, player } = await params;
  if (id !== "a" && id !== "b") notFound();
  const p = player.toUpperCase();
  if (p !== "A" && p !== "B") notFound();
  return <PlayerApp id={id as BattleId} player={p as Player} />;
}
