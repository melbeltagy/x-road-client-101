import React from 'react';
import { DropdownItem } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Translate } from 'react-jhipster';
import { useTheme, ThemeMode } from 'app/config/theme-context';
import { NavDropdown } from '../menus/menu-components';

const themeIcons: Record<ThemeMode, any> = {
  light: 'sun',
  dark: 'moon',
  system: 'circle-half-stroke',
};

const themeLabels: Record<ThemeMode, string> = {
  light: 'global.menu.theme.light',
  dark: 'global.menu.theme.dark',
  system: 'global.menu.theme.system',
};

export const ThemeToggle: React.FC = () => {
  const { themeMode, setThemeMode } = useTheme();

  const handleThemeChange = (mode: ThemeMode) => {
    setThemeMode(mode);
  };

  return (
    <NavDropdown key={themeMode} icon={themeIcons[themeMode]} name={<Translate contentKey={themeLabels[themeMode]} />} id="theme-menu">
      <DropdownItem onClick={() => handleThemeChange('light')} active={themeMode === 'light'}>
        <FontAwesomeIcon icon="sun" fixedWidth />
        <Translate contentKey="global.menu.theme.light" />
      </DropdownItem>
      <DropdownItem onClick={() => handleThemeChange('dark')} active={themeMode === 'dark'}>
        <FontAwesomeIcon icon="moon" fixedWidth />
        <Translate contentKey="global.menu.theme.dark" />
      </DropdownItem>
      <DropdownItem onClick={() => handleThemeChange('system')} active={themeMode === 'system'}>
        <FontAwesomeIcon icon="circle-half-stroke" fixedWidth />
        <Translate contentKey="global.menu.theme.system" />
      </DropdownItem>
    </NavDropdown>
  );
};
