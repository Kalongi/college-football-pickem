"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/mypicks", label: "My Picks" },
  { href: "/teams", label: "Teams" },
  { href: "/admin/select-games", label: "Select Games" },
  { href: "/admin/reset-teams", label: "Reset Teams" },
  { href: "/about", label: "About" },
];

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <nav style={{
      width: '100%',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 200,
      background: 'transparent',
      minHeight: 0,
      margin: 0,
      padding: 0,
    }}>
      <style>{`
        @media (max-width: 700px) {
          .nav-links-row { display: none !important; }
          .nav-hamburger { display: flex !important; }
          .nav-mobile-menu { display: ${open ? 'flex' : 'none'} !important; }
        }
        @media (min-width: 701px) {
          .nav-links-row { display: flex !important; flex-direction: row !important; align-items: center !important; justify-content: center !important; }
          .nav-hamburger { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
        .main-nav-link:hover {
          background: #f3f8fd !important;
          color: #1976d2 !important;
        }
        .main-nav-link.active {
          background: #e3e8ee !important;
          color: #1976d2 !important;
          font-weight: 800 !important;
        }
      `}</style>
      <div style={{
        width: '100%',
        maxWidth: 1000,
        margin: '0 auto',
        background: '#fff',
        borderRadius: 10,
        boxShadow: '0 2px 8px rgba(34,34,34,0.08)',
        border: '1px solid #e3e8ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0.25rem 0.5rem',
        position: 'relative',
      }}>
        {/* Hamburger for mobile */}
        <button
          className="nav-hamburger"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          style={{
            background: 'none',
            border: 'none',
            color: '#222',
            fontSize: '2rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            display: 'none',
          }}
        >
          {open ? "✕" : "☰"}
        </button>
        {/* Desktop nav */}
        <div className="nav-links-row" style={{
          display: 'flex', gap: '2rem', alignItems: 'center', fontWeight: 700, fontSize: '1.1rem', width: '100%', justifyContent: 'center',
        }}>
          {links.map(link => {
            // Mark as active if pathname starts with link.href (for nested routes)
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={`main-nav-link${isActive ? ' active' : ''}`} style={{
                color: isActive ? '#1976d2' : '#222',
                textDecoration: 'none',
                background: isActive ? '#e3e8ee' : 'none',
                fontWeight: isActive ? 800 : 700,
                transition: 'background 0.2s, color 0.2s',
                padding: '0.25rem 0.75rem',
                borderRadius: 6,
              }}>{link.label}</Link>
            );
          })}
        </div>
        {/* Mobile menu */}
        <div className="nav-mobile-menu" style={{
          display: 'none', flexDirection: 'column', position: 'absolute', top: '100%', left: 0, width: '100%', background: '#fff', boxShadow: '0 2px 8px rgba(34,34,34,0.12)',
        }}>
          {links.map(link => {
            const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <Link key={link.href} href={link.href} className={`main-nav-link${isActive ? ' active' : ''}`} style={{
                color: isActive ? '#1976d2' : '#222',
                background: isActive ? '#e3e8ee' : 'none',
                fontWeight: isActive ? 800 : 700,
                textDecoration: 'none',
                transition: 'background 0.2s, color 0.2s',
                fontSize: '1.15rem',
                padding: '0.75rem 1.2rem',
                width: '100%',
                borderRadius: 0,
              }} onClick={() => setOpen(false)}>{link.label}</Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
