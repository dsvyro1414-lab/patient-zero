/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    // proxy /ml/* to the Python ML service so the browser hits same-origin
    const base = process.env.ML_SERVICE_URL || "http://localhost:8000";
    return [{ source: "/ml/:path*", destination: `${base}/:path*` }];
  },
};
export default nextConfig;
