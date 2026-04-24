export default {
  compilerOptions: {
    paths: {
      "@/*": ["./*"],
    },
    module: "esnext",
    target: "esnext",
    moduleResolution: "node",
    strict: true,
    esModuleInterop: true,
    outDir: "dist/scripts",
    skipLibCheck: true,
    jsx: "react-jsx",
    baseUrl: ".",
  },
  include: ["scripts/**/*.ts"],
  exclude: ["node_modules", "agent", ".wtangler", ".vercel"],
};
