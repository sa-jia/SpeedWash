export const getImageUrl = (path) => {
  if (!path || path === 'null' || path === 'undefined') return void 0;
  const baseUrl = import.meta.env.VITE_IMAGE_BASE_URL;
  if (path.startsWith(baseUrl) || path.startsWith('https://')) return path;
  return encodeURI(`${baseUrl}${path}`);
};