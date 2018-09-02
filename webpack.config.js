const path = require("path");

module.exports = {
  target: "node",
  mode: "development",
  devtool: "source-map",
  entry: "./src/index.ts",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: "ts-loader"
      }
    ]
  },
  resolve: {
    extensions: [".ts"]
  },
  output: {
    path: path.resolve(__dirname, "bin"),
    filename: "index.js",
    devtoolModuleFilenameTemplate: "[absolute-resource-path]"
  }
};
