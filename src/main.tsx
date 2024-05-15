
import React from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux';

// Services
import { store } from "./services/redux/store.ts"

// Components
import App from './App'

// Get CSS from the 'bootstrap' package
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.scss'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>

    {/* This provides our global Redux store to any child component
        and is required for useAppDispatch().
        See: https://react-redux.js.org/using-react-redux/accessing-store
    */}
    <Provider store={ store }>
      <App />
    </Provider>
  </React.StrictMode>
);
