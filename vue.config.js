// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

function configSVGIcon(config) {
  // Exclude SVG sprite directory from default svg rule
  config.module
    .rule("svg")
    .exclude.add(path.resolve(__dirname, "./src/assets/svg-icons"))
    .end();

  // Include only SVG sprite directory for new svg-icon rule
  // Use svg-sprite-loader to build SVG sprite
  // Use svgo-loader to optimize SVG files
  config.module
    .rule("svg-icon")
    .test(/\.svg$/)
    .include.add(path.resolve(__dirname, "./src/assets/svg-icons"))
    .end()
    .use("svg-sprite-loader")
    .loader("svg-sprite-loader")
    .options({
      symbolId: "icon-[name]"
    })
    .end()
    .use("svgo-loader")
    .loader("svgo-loader")
    .end();
}

module.exports = {
  configureWebpack: {
    devtool: "source-map"
  },
  chainWebpack: (config) => {
    configSVGIcon(config);

    config.plugin("html").tap((args) => {
      args[0].title = "BrickEd";
      return args;
    });
  },
  pluginOptions: {
    electronBuilder: {
      builderOptions: {
        appId: "bricked",
        productName: "BrickEd"
      },
      publish: "never",
      preload: "src/preload.js"
    }
  }
};
