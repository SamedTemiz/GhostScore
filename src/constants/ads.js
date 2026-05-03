import { Platform } from 'react-native';

const IS_ANDROID = Platform.OS === 'android';

// Test ID'leri geliştirme sırasında kullanılır, production'da gerçek ID'ler devreye girer
const TEST_IDS = {
  BANNER: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
};

const PROD_IDS = {
  BANNER: 'ca-app-pub-1547168097704291/6465193389',
  INTERSTITIAL: 'ca-app-pub-1547168097704291/6694310594',
  REWARDED: 'ca-app-pub-1547168097704291/5254295909',
};

const __DEV_MODE__ = __DEV__;

export const AD_UNIT_IDS = {
  BANNER: __DEV_MODE__ ? TEST_IDS.BANNER : PROD_IDS.BANNER,
  INTERSTITIAL: __DEV_MODE__ ? TEST_IDS.INTERSTITIAL : PROD_IDS.INTERSTITIAL,
  REWARDED: __DEV_MODE__ ? TEST_IDS.REWARDED : PROD_IDS.REWARDED,
};
