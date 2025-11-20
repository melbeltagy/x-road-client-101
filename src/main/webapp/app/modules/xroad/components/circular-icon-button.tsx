import React from 'react';
import { Button } from 'reactstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

interface CircularIconButtonProps {
  icon: IconProp;
  color: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'light' | 'dark';
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  title: string;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

/**
 * Reusable circular icon button component that follows the Cosmo theme design.
 * Used for actions like Add, Delete, View, Clear, etc.
 */
export const CircularIconButton: React.FC<CircularIconButtonProps> = ({
  icon,
  color,
  onClick,
  title,
  type = 'button',
  className = '',
  disabled = false,
}) => {
  return (
    <Button
      color={color}
      outline
      onClick={onClick}
      type={type}
      title={title}
      disabled={disabled}
      className={`rounded-circle p-2 ${className}`}
      style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <FontAwesomeIcon icon={icon} size="2x" />
    </Button>
  );
};
