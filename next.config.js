/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  async rewrites() {
    return [
      {
        source: "/.well-known/apple-app-site-association",
        destination: "https://api.togeda.net/.well-known/apple-app-site-association",
      },
      {
        source: "/.well-known/assetlinks.json",
        destination: "https://api.togeda.net/.well-known/assetlinks.json",
      },
    ];
  },
};

export default config;
