import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// BASE_PATH is set by the GitHub Pages workflow, where the site lives at
// /CSEN-163-Final-Project/. Locally the app runs at the root.
export default defineConfig({
  base: process.env.BASE_PATH || "/",
  plugins: [react()],
});
