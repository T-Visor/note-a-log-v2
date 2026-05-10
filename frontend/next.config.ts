import { withSerwist } from "@serwist/turbopack";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@blocknote/core",
    "@blocknote/react",
    "@blocknote/xl-ai", // Add this one too, as it's where your error originated
    "@blocknote/server-util",
  ],
};

export default withSerwist(nextConfig);