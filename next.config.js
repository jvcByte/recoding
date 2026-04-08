/** @type {import('next').NextConfig} */
const nextConfig = {
  // Bundle the docs/ directory so fs reads work in serverless/edge deployments.
  // Without this, the files are not included in the deployment output.
  outputFileTracingIncludes: {
    '/api/exercises/*/question/*': ['./docs/**/*'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
