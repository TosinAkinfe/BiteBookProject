const runtimeApiUrl =
  typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:3000`
    : "http://localhost:3000";

const configuredApiUrl = import.meta.env.VITE_API_URL;

export const API_URL =
  configuredApiUrl &&
  !/localhost|127\.0\.0\.1|0\.0\.0\.0/.test(configuredApiUrl)
    ? configuredApiUrl
    : runtimeApiUrl;
