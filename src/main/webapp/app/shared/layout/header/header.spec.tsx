import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import initStore from 'app/config/store';
import { ThemeProvider } from 'app/config/theme-context';
import Header from './header';

describe('Header', () => {
  let mountedWrapper;
  const devProps = {
    currentLocale: 'en',
    ribbonEnv: 'dev',
    isInProduction: false,
  };
  const prodProps = {
    ...devProps,
    ribbonEnv: 'prod',
    isInProduction: true,
  };

  const wrapper = (props = devProps) => {
    if (!mountedWrapper) {
      const store = initStore();
      const { container } = render(
        <Provider store={store}>
          <ThemeProvider>
            <MemoryRouter>
              <Header {...props} />
            </MemoryRouter>
          </ThemeProvider>
        </Provider>,
      );
      mountedWrapper = container.innerHTML;
    }
    return mountedWrapper;
  };

  beforeEach(() => {
    mountedWrapper = undefined;
  });

  // All tests will go here
  it('Renders a Header component in dev profile with LoadingBar, Navbar, Nav and dev ribbon.', () => {
    const html = wrapper();

    // Find Navbar component
    expect(html).toContain('navbar');
    // Ribbon
    expect(html).toContain('ribbon');
  });

  it('Renders a Header component in prod profile with LoadingBar, Navbar, Nav.', () => {
    const html = wrapper(prodProps);

    // Find Navbar component
    expect(html).toContain('navbar');
    // No Ribbon
    expect(html).not.toContain('ribbon');
  });
});
