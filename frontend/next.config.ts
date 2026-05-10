import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/xl-ai", 
    "@blocknote/server-util",
  ],
};

export default withSerwist(nextConfig);