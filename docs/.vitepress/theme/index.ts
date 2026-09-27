import { h } from 'vue';
import DefaultTheme from 'vitepress/theme-without-fonts';
// La police des titres d'Archipéo, embarquée comme dans l'application (aucune ressource externe).
import '@fontsource/montserrat/latin-700.css';
import './custom.css';

export default {
  extends: DefaultTheme,
  // Dans la barre du haut : « Archipéo » (police des titres), puis « Documentation » (police de lecture).
  Layout: () => h(DefaultTheme.Layout, null, { 'nav-bar-title-after': () => h('span', { class: 'arch-sous-titre' }, 'Documentation') }),
};
