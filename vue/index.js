import EthiopiaMap from './EthiopiaMap.vue';

// Install as a Vue plugin: app.use(EthiopiaBoundaries)
export default {
  install(app) {
    app.component('EthiopiaMap', EthiopiaMap);
  }
};

// Or register manually: import { EthiopiaMap } from 'ethiopia-boundaries/vue'
export { EthiopiaMap };
