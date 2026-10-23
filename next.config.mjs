/** @type {import('next').NextConfig} */
const nextConfig = {
  // Importul în masă al agențiilor trimite un fișier CSV de până la 3 MB (implicit, Next primește doar 1 MB).
  experimental: { serverActions: { bodySizeLimit: "4mb" } },
};

export default nextConfig;
