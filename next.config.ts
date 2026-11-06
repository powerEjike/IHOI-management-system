import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  // Opt-in for restricted Windows build environments that cannot recreate
  // generated directories. Normal local/CI builds keep Next's clean default.
  cleanDistDir: process.env.IHOI_PRESERVE_BUILD_OUTPUT !== "true",
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default config;
