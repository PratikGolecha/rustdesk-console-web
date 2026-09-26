export default {
  dev: {
    "/api/": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
    "/webclient-config/index.js": {
      target: "http://localhost:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/webclient-config/index.js": "/api/web-client/config.js",
      },
    },
  },
  test: {
    "/api/": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
    "/webclient-config/index.js": {
      target: "http://localhost:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/webclient-config/index.js": "/api/web-client/config.js",
      },
    },
  },
  pre: {
    "/api/": {
      target: "http://localhost:3000",
      changeOrigin: true,
    },
    "/webclient-config/index.js": {
      target: "http://localhost:3000",
      changeOrigin: true,
      pathRewrite: {
        "^/webclient-config/index.js": "/api/web-client/config.js",
      },
    },
  },
};
