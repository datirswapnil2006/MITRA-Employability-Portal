export const getFileUrl = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const envUrl = import.meta.env.VITE_API_URL;
  let baseUrl = "";
  if (envUrl) {
    baseUrl = envUrl.replace(/\/api\/?$/, "").replace(/\/+$/, "");
  } else if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    baseUrl = "http://localhost:5000";
  }
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${cleanPath}`;
};

