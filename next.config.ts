import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: ["res.cloudinary.com"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⚠️ Ignorar errores de TypeScript durante el build de producción
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
