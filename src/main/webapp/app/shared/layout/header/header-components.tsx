import React from 'react';
import { Translate } from 'react-jhipster';

import { NavItem, NavLink, NavbarBrand } from 'reactstrap';
import { NavLink as Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export const BrandIcon = props => (
  <div {...props} className="brand-icon">
    {/* Logo intentionally removed - minimal UI design */}
  </div>
);

export const Brand = () => (
  <NavbarBrand tag={Link} to="/" className="brand-logo">
    <BrandIcon />
    <span className="brand-title">
      <Translate contentKey="global.title">X-Road REST Client</Translate>
    </span>
    <span className="navbar-version">{VERSION.toLowerCase().startsWith('v') ? VERSION : `v${VERSION}`}</span>
  </NavbarBrand>
);

export const XRoadClient = () => (
  <NavItem>
    <NavLink tag={Link} to="/xroad" className="d-flex align-items-center">
      <FontAwesomeIcon icon="exchange-alt" />
      <span>X-Road Client</span>
    </NavLink>
  </NavItem>
);
