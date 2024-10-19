import { ConfigAPI } from "@babel/core";

export default function (api: ConfigAPI) {
  api.cache.forever();
  return {
    presets: ["babel-preset-expo"],
  };
}
