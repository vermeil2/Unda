import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';

// 개발 환경에서 프론트(5173) -> 백엔드(8000) API 프록시
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});

  