import { h } from 'vue';
import DefaultTheme from 'vitepress/theme-without-fonts';
// La police des titres de Blocland, embarquée comme dans l'application (aucune ressource externe).
import '@fontsource/archivo-black/latin-400.css';
import './custom.css';

export default {
  extends: DefaultTheme,
  // Dans la barre du haut : « DysApps » (police des titres), puis « Documentation » (police de lecture).
  Layout: () => h(DefaultTheme.Layout, null, { 'nav-bar-title-after': () => h('span', { class: 'bl-sous-titre' }, 'Documentation') }),
};
