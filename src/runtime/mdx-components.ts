import React, { type PropsWithChildren, type ReactNode } from "react";

function cx(...values: (string | false | null | undefined)[]): string {
  return values.filter(Boolean).join(" ");
}

export function RuntimeLink({
  href = "#",
  children,
}: PropsWithChildren<{ href?: string }>) {
  const external = /^https?:\/\//i.test(href);
  return React.createElement(
    "a",
    {
      href,
      ...(external ? { target: "_blank", rel: "noopener noreferrer" } : {}),
    },
    children
  );
}

export function Card({
  title,
  description,
  href,
  icon,
  children,
}: PropsWithChildren<{
  title: string;
  description?: string;
  href?: string;
  icon?: string;
}>) {
  const body = React.createElement(
    "div",
    { className: "doxa-card" },
    icon
      ? React.createElement("span", { className: "doxa-card-icon" }, icon)
      : null,
    React.createElement("strong", null, title),
    description ? React.createElement("p", null, description) : null,
    children
  );

  return href ? React.createElement(RuntimeLink, { href }, body) : body;
}

export function CardGrid({ children }: PropsWithChildren) {
  return React.createElement("div", { className: "doxa-card-grid" }, children);
}

export function Note({
  title = "Note",
  type = "note",
  children,
}: PropsWithChildren<{
  title?: string;
  type?: "note" | "success" | "warning" | "danger" | "info";
}>) {
  return React.createElement(
    "aside",
    { className: cx("doxa-note", `doxa-note-${type}`) },
    React.createElement("strong", null, `${title}:`),
    React.createElement("div", null, children)
  );
}

export function Step({ children }: PropsWithChildren) {
  const items = React.Children.toArray(children);
  return React.createElement(
    "div",
    { className: "doxa-steps" },
    items.map((child, index) =>
      React.createElement(
        "div",
        { className: "doxa-step", key: index },
        React.createElement(
          "span",
          { className: "doxa-step-number" },
          index + 1
        ),
        React.createElement("div", null, child)
      )
    )
  );
}

export function StepItem({
  title,
  children,
}: PropsWithChildren<{ title?: string }>) {
  return React.createElement(
    "section",
    null,
    title ? React.createElement("h3", null, title) : null,
    children
  );
}

export function FileTree({ children }: PropsWithChildren) {
  return React.createElement("pre", { className: "doxa-file-tree" }, children);
}

export function Folder({
  name,
  children,
}: PropsWithChildren<{ name?: string }>) {
  return React.createElement("span", null, name ? `${name}/` : "", children);
}

export function File({ name }: { name?: string }) {
  return React.createElement("span", null, name ?? "");
}

export function Mermaid({
  chart,
  children,
}: PropsWithChildren<{ chart?: string }>) {
  return React.createElement(
    "pre",
    { className: "doxa-mermaid" },
    chart ?? children
  );
}

export function Tabs({ children }: PropsWithChildren) {
  return React.createElement("div", { className: "doxa-tabs" }, children);
}

export function TabsList({ children }: PropsWithChildren) {
  return React.createElement("div", { className: "doxa-tabs-list" }, children);
}

export function TabsTrigger({
  children,
}: PropsWithChildren<{ value?: string }>) {
  return React.createElement(
    "span",
    { className: "doxa-tabs-trigger" },
    children
  );
}

export function TabsContent({
  children,
}: PropsWithChildren<{ value?: string }>) {
  return React.createElement(
    "div",
    { className: "doxa-tabs-content" },
    children
  );
}

export function Pre({ children, ...props }: { children?: ReactNode }) {
  return React.createElement("pre", props, children);
}

export const runtimeComponents = {
  a: RuntimeLink,
  Card,
  CardGrid,
  File,
  FileTree,
  Folder,
  Mermaid,
  Note,
  Step,
  StepItem,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  pre: Pre,
};

export type RuntimeMdxComponents = typeof runtimeComponents &
  Record<string, unknown>;
