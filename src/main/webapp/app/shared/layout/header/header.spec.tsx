import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router';

import initStore from 'app/config/store';
import { ThemeProvider } from 'app/config/theme-context';
import Header from './header';

describe('Header', () => {
  const defaultProps = {
    currentLocale: 'en',
  };

  const renderHeader = (props = defaultProps) => {
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
    return container.innerHTML;
  };

  it('Renders a Header component with Navbar.', () => {
    const html = renderHeader();

    expect(html).toContain('navbar');
    expect(html).toContain('X-Road REST Client');
  });
});
