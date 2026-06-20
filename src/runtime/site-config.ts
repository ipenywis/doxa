export interface RuntimeSiteConfig {
  name: string;
  description?: string;
  url: string;
}

export interface RuntimeNavPage {
  title: string;
  href: string;
}

export interface RuntimeRenderInput {
  docsPath: string;
  basePath?: string;
}

export interface RuntimeRenderResult {
  status: number;
  html: string;
  headers: Record<string, string>;
}
