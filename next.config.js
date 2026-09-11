module.exports = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "storage.googleapis.com",
        pathname: "**",
      },
    ],
  },
  async redirects() {
    return [
      {
        source: "/menu",
        has: [
          {
            type: "query",
            key: "category",
            value: "(?<slug>.+)",
          },
        ],
        destination: "/menu/:slug",
        permanent: true,
      },
    ];
  },
};
