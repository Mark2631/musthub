const REDIRECT_KEY = "musthub:intended_path";

export const saveIntendedPath = (path: string) => {
  if (!path || !path.startsWith("/")) return;
  localStorage.setItem(REDIRECT_KEY, path);
};

export const consumeIntendedPath = () => {
  const path = localStorage.getItem(REDIRECT_KEY);
  localStorage.removeItem(REDIRECT_KEY);
  if (!path || !path.startsWith("/")) return "/";
  return path;
};
