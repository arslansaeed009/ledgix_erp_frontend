// import { fileURLToPath } from 'node:url';
// import path from 'node:path';
// import { defineConfig } from 'vite';
// import react from '@vitejs/plugin-react';
// import tailwindcss from 'tailwindcss';
// import autoprefixer from 'autoprefixer';

// const frontendDir = path.dirname(fileURLToPath(import.meta.url));
// const backendDir = path.resolve(frontendDir, '../backend');

// export default defineConfig({
//   root: backendDir,
//   base: '/admin-assets/',
//   publicDir: path.join(backendDir, 'src', 'admin', 'public'),
//   plugins: [react()],
//   css: {
//     postcss: {
//       plugins: [
//         tailwindcss({ config: path.join(frontendDir, 'tailwind.config.js') }),
//         autoprefixer(),
//       ],
//     },
//   },
//   resolve: {
//     alias: {
//       react: path.resolve(frontendDir, 'node_modules/react'),
//       'react-dom': path.resolve(frontendDir, 'node_modules/react-dom'),
//       'react-router-dom': path.resolve(
//         frontendDir,
//         'node_modules/react-router-dom'
//       ),
//       'lucide-react': path.resolve(frontendDir, 'node_modules/lucide-react'),
//     },
//   },
//   build: {
//     outDir: path.join(backendDir, 'public', 'admin-ui'),
//     emptyOutDir: true,
//     rollupOptions: {
//       input: path.join(backendDir, 'admin.html'),
//     },
//   },
// });
