/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    trailingSlash: true,
    skipTrailingSlashRedirect: true,
    experimental: {
        missingSuspenseWithCSRBailout: false,
    },
    outDir: './out'
};

export default nextConfig;
