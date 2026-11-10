import React from 'react';
import Flower from './Flower';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <div className="footer-logo">
          <span className="footer-word">élan</span>
          <Flower size={56} />
        </div>

        <div className="footer-credits">
          <p>Élan &middot; Coach de Vie</p>
        </div>
      </div>
    </footer>
  );
}
