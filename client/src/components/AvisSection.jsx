import React from 'react';
import { useSelector } from 'react-redux';
import { etoiles } from '../utils/format';

export default function AvisSection() {
  const { items } = useSelector((state) => state.avis);

  if (!items || items.length === 0) return null;

  return (
    <section className="testimonials wrap">
      <div className="section-head center">
        <p className="eyebrow">Témoignages</p>
        <h2 className="section-title">Ils ont retrouvé leur élan</h2>
        <p className="section-sub">
          Des avis vérifiés, laissés uniquement après une séance terminée.
        </p>
      </div>

      <div className="testimonial-grid">
        {items.map((avis) => (
          <article className="testimonial-card" key={avis._id}>
            <span className="stars">{etoiles(avis.note)}</span>
            <p className="testimonial-text">&laquo; {avis.texte} &raquo;</p>
            <div className="testimonial-author">
              <strong>{avis.client?.name || 'Client'}</strong>
              {avis.rendezVous?.service?.nom && <span>{avis.rendezVous.service.nom}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
