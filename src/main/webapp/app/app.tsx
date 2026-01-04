import 'react-toastify/dist/ReactToastify.css';
import './app.scss';
import 'app/config/dayjs';

import React from 'react';
import { Card } from 'reactstrap';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { useAppSelector } from 'app/config/store';
import { ThemeProvider } from 'app/config/theme-context';
import Header from 'app/shared/layout/header/header';
import Footer from 'app/shared/layout/footer/footer';
import ErrorBoundary from 'app/shared/error/error-boundary';
import AppRoutes from 'app/routes';

const baseHref = document.querySelector('base').getAttribute('href').replace(/\/$/, '');

export const App = () => {
  const currentLocale = useAppSelector(state => state.locale.currentLocale);

  const paddingTop = '60px';
  return (
    <BrowserRouter basename={baseHref}>
      <ThemeProvider>
        <div className="app-container" style={{ paddingTop }}>
          <ToastContainer position="bottom-right" className="toastify-container" toastClassName="toastify-toast" />
          <ErrorBoundary>
            <Header currentLocale={currentLocale} />
          </ErrorBoundary>
          <div className="container-fluid view-container" id="app-view-container">
            <Card className="jh-card">
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
            </Card>
            <Footer />
          </div>
        </div>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
