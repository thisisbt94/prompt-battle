import { Challenge } from "./types";

// Seed data. Organisers can add/edit/disable challenges from /admin —
// the in-memory store (lib/store.ts) is the source of truth at runtime.
export const DEFAULT_CHALLENGES: Challenge[] = [
  {
    id: "lead-recover-schedule",
    category: "LEADERSHIP",
    title: "Recover a slipping project",
    prompt:
      "Your project is three weeks behind schedule. Ask AI to help you recover it.",
    enabled: true,
  },
  {
    id: "lead-difficult-stakeholder",
    category: "LEADERSHIP",
    title: "Win back a difficult stakeholder",
    prompt:
      "A key stakeholder has lost confidence in your team. Ask AI to help you rebuild trust.",
    enabled: true,
  },
  {
    id: "comm-ceo-update",
    category: "COMMUNICATION",
    title: "Make it CEO-ready",
    prompt:
      "Turn a messy internal update into something a CEO would actually read.",
    enabled: true,
  },
  {
    id: "comm-bad-news",
    category: "COMMUNICATION",
    title: "Deliver the bad news",
    prompt:
      "You need to tell a client their launch date is slipping. Ask AI to help you say it well.",
    enabled: true,
  },
  {
    id: "decision-challenge-proposal",
    category: "DECISION MAKING",
    title: "Pressure-test a proposal",
    prompt: "Ask AI to challenge a proposal before leadership approves it.",
    enabled: true,
  },
  {
    id: "decision-two-options",
    category: "DECISION MAKING",
    title: "Choose between two good options",
    prompt:
      "You have two strong candidates for the same role. Ask AI to help you decide.",
    enabled: true,
  },
  {
    id: "people-underperformer",
    category: "PEOPLE",
    title: "The difficult conversation",
    prompt:
      "Prepare for a difficult conversation with an underperforming employee.",
    enabled: true,
  },
  {
    id: "people-motivate-team",
    category: "PEOPLE",
    title: "Re-energise a tired team",
    prompt:
      "Your team is burnt out after a hard quarter. Ask AI to help you re-motivate them.",
    enabled: true,
  },
  {
    id: "prod-meeting-notes",
    category: "PRODUCTIVITY",
    title: "Notes into action",
    prompt:
      "Turn these meeting notes into clear actions, owners and deadlines.",
    enabled: true,
  },
  {
    id: "prod-inbox-zero",
    category: "PRODUCTIVITY",
    title: "Tame the inbox",
    prompt:
      "You have 40 unread emails after a week of travel. Ask AI to help you triage them.",
    enabled: true,
  },
  {
    id: "wild-toast",
    category: "WILDCARD",
    title: "The retirement toast",
    prompt:
      "Ask AI to help you write a toast for a colleague's last day, in under 30 seconds to deliver.",
    enabled: true,
  },
  {
    id: "wild-icebreaker",
    category: "WILDCARD",
    title: "Rescue the icebreaker",
    prompt:
      "Your offsite icebreaker just fell flat. Ask AI to save the room in the next 60 seconds.",
    enabled: true,
  },
];
