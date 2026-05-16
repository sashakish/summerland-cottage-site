import path from 'node:path';

const nextConfig = {
  outputFileTracingRoot: path.resolve(process.cwd()),
  turbopack: {
    root: path.resolve(process.cwd())
  }
};

export default nextConfig;
