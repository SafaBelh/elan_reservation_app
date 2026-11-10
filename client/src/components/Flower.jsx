import React from 'react';

// Fleur « élan » : 8 pétales alternés rose / violet qui se superposent,
// cœur doré. Utilisée dans le hero, la page de connexion et les cartes.
const PETALES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function Flower({ size = 220, className = '', style }) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
      focusable="false"
    >
      <g style={{ mixBlendMode: 'multiply' }}>
        {PETALES.map((angle, index) => (
          <ellipse
            key={angle}
            cx="100"
            cy="56"
            rx="27"
            ry="44"
            fill={index % 2 === 0 ? '#ef4d7f' : '#8b5cf6'}
            transform={`rotate(${angle} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="17" fill="#f6b93b" />
    </svg>
  );
}
