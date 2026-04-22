import { supabase } from "@/lib/supabase";

const ATTEMPTS_KEY = "musthub:login_attempts";
const WINDOW_MS = 15 * 60 * 1000;
const LIMIT = 8;

type AttemptMap = Record<string, number[]>;

const readAttempts = (): AttemptMap => {
  const raw = localStorage.getItem(ATTEMPTS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as AttemptMap;
  } catch {
    return {};
  }
};

const writeAttempts = (attempts: AttemptMap) => {
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts));
};

const prune = (timestamps: number[]) => timestamps.filter((t) => Date.now() - t < WINDOW_MS);

export const isRateLimited = (email: string) => {
  const attempts = readAttempts();
  const key = email.toLowerCase();
  const recent = prune(attempts[key] ?? []);
  attempts[key] = recent;
  writeAttempts(attempts);
  return recent.length >= LIMIT;
};

export const trackFailedAttempt = async (email: string, reason: string) => {
  const attempts = readAttempts();
  const key = email.toLowerCase();
  const recent = prune(attempts[key] ?? []);
  recent.push(Date.now());
  attempts[key] = recent;
  writeAttempts(attempts);

  // Fire-and-forget telemetry table in Supabase for abuse monitoring.
  await supabase.from("auth_login_attempts").insert({
    email: key,
    status: "failed",
    reason,
  });
};

export const clearFailedAttempts = (email: string) => {
  const attempts = readAttempts();
  const key = email.toLowerCase();
  delete attempts[key];
  writeAttempts(attempts);
};
