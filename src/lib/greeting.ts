export const greetingFor = (name?: string | null) => {
  const hour = new Date().getHours();
  let base = "Karibu";
  if (hour >= 5 && hour < 12) base = "Good morning";
  else if (hour >= 12 && hour < 17) base = "Good afternoon";
  else if (hour >= 17 && hour < 22) base = "Good evening";
  else base = "Karibu";
  const first = (name || "").trim().split(/\s+/)[0];
  return first ? `${base}, ${first}` : `${base}!`;
};
