import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Security headers applied to all responses.
  // These complement the platform's own auth/CSRF via NextAuth.
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking — disallow framing our site
          { key: "X-Frame-Options", value: "DENY" },
          // Force HTTPS for 1 year (incl. subdomains)
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // Hide the Referer header when navigating away (privacy)
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Restrict permissions (camera, mic, geolocation...) — all denied by default
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
        ],
      },
      // Public survey responses API: extra CORS lock-down (same-origin only)
      {
        source: "/api/public/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "same-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
