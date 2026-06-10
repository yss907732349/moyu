import { createSSRApp } from "vue";
import App from "./App.vue";

export function createApp() {
  const app = createSSRApp(App);

  app.config.errorHandler = (error, _instance, info) => {
    console.error("moyuxia runtime error", info, error);
  };

  return {
    app
  };
}
