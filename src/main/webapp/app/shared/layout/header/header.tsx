import './header.scss';

import React, { useState } from 'react';
import { Storage, Translate } from 'app/shared/i18n';
import { Collapse, Nav, Navbar, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import LoadingBar from 'react-redux-loading-bar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch } from 'app/config/store';
import { setLocale } from 'app/shared/reducers/locale';
import { toggleHistorySidebar } from 'app/shared/reducers/xroad-history';
import { LocaleMenu } from '../menus';
import { Brand } from './header-components';
import { ThemeToggle } from './theme-toggle';

export interface IHeaderProps {
  currentLocale: string;
}

const Header = (props: IHeaderProps) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const dispatch = useAppDispatch();

  const handleLocaleChange = event => {
    const langKey = event.target.value;
    Storage.session.set('locale', langKey);
    dispatch(setLocale(langKey));
  };

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <div id="app-header">
      <LoadingBar className="loading-bar" />
      <Navbar data-cy="navbar" dark expand="md" fixed="top" className="bg-primary">
        <NavbarToggler aria-label="Menu" onClick={toggleMenu} />
        <Brand />
        <Collapse isOpen={menuOpen} navbar>
          <Nav id="header-tabs" className="ms-auto" navbar>
            <NavItem>
              <NavLink onClick={() => dispatch(toggleHistorySidebar())} style={{ cursor: 'pointer' }}>
                <FontAwesomeIcon icon="history" />
                <span className="ms-2">
                  <Translate contentKey="xroad.history.button">History</Translate>
                </span>
              </NavLink>
            </NavItem>
            <ThemeToggle />
            <LocaleMenu currentLocale={props.currentLocale} onClick={handleLocaleChange} />
          </Nav>
        </Collapse>
      </Navbar>
    </div>
  );
};

export default Header;
