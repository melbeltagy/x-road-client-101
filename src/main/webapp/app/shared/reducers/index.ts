import { ReducersMapObject } from '@reduxjs/toolkit';
import { loadingBarReducer as loadingBar } from 'react-redux-loading-bar';

import locale from './locale';
import xroadHistory from './xroad-history';

const rootReducer: ReducersMapObject = {
  locale,
  xroadHistory,
  loadingBar,
};

export default rootReducer;
