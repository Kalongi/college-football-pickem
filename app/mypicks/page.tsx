"use client";

import React from "react";

export default function MyPicks() {
  return (
    <main style={{
      maxWidth: 800,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      alignItems: 'stretch',
    }}>
      <section style={{
        background: '#fff',
        borderRadius: 12,
        boxShadow: '0 2px 8px rgba(34,34,34,0.08)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        border: '2px solid #2196f3',
      }}>
        <h2 style={{ color: '#2196f3', fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', letterSpacing: 1 }}>My Picks</h2>
        <div style={{ marginBottom: '1.5rem', width: '100%' }}>
          <label htmlFor="week-select" style={{ fontWeight: 600, marginRight: 8 }}>Select Week:</label>
          <select id="week-select" style={{ padding: '0.5em 1em', borderRadius: 6, border: '1px solid #bbb', fontSize: '1rem' }}>
            <option>Week 1</option>
            <option>Week 2</option>
            <option>Week 3</option>
            <option>...</option>
          </select>
        </div>
        <div style={{ width: '100%', minHeight: 120, background: '#f7f7f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888', fontSize: '1.1rem', border: '1px dashed #2196f3' }}>
          Your picks for the selected week will appear here.
        </div>
      </section>
    </main>
  );
}
