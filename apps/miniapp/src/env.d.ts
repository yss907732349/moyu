declare module "*.vue" {
  import type { DefineComponent } from "vue";

  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>;
  export default component;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WECHAT_LOGIN_MOCK_ENABLED?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
