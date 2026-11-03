import GDConfig from 'eslint-config-godaddy';
import { defineConfig } from 'eslint/config';

export default defineConfig({
  extends: [
    GDConfig
  ],
  rules: {
    'no-console': 0,
    'no-process-env': 0,
    'strict': [2, 'safe']
  }
});
