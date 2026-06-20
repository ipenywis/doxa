import type { ContentAdapter } from "../lib/content/types";
import { renderDocsRoute } from "./route-renderer";
import type {
  RuntimeRenderInput,
  RuntimeRenderResult,
  RuntimeSiteConfig,
} from "./site-config";

export interface DoxaDocsRuntimeConfig {
  contentAdapter: ContentAdapter;
  siteConfig: RuntimeSiteConfig;
}

export interface DoxaDocsRuntime {
  render(input: RuntimeRenderInput): Promise<RuntimeRenderResult>;
}

export function createDoxaDocsRuntime(
  config: DoxaDocsRuntimeConfig
): DoxaDocsRuntime {
  return {
    render(input) {
      return renderDocsRoute(config, input);
    },
  };
}
