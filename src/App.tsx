import { useState, useEffect } from 'react';
import { Web3Provider } from './context/Web3Context';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { ValidatorDemo } from './pages/ValidatorDemo';
import { Contact } from './pages/Contact';
import { Events } from './pages/Events';

type Tab = 'home' | 'events' | 'ticket' | 'validator' | 'admin';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<Tab>('home');

  useEffect(() => {
    const handleLocationCheck = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;
      if (path === '/admin' || hash === '#admin') {
        setCurrentTab('admin');
      } else if (path === '/events' || hash === '#events') {
        setCurrentTab('events');
      } else if (path === '/ticket' || hash === '#ticket') {
        setCurrentTab('ticket');
      } else if (path === '/validator' || hash === '#validator') {
        setCurrentTab('validator');
      } else if (path === '/' || hash === '#home') {
        setCurrentTab('home');
      }
    };
    
    handleLocationCheck();
    window.addEventListener('popstate', handleLocationCheck);
    window.addEventListener('hashchange', handleLocationCheck);
    return () => {
      window.removeEventListener('popstate', handleLocationCheck);
      window.removeEventListener('hashchange', handleLocationCheck);
    };
  }, []);

  // Wrapper that casts string → Tab so child components typed as
  // (tab: string) => void remain compatible without changing their prop types.
  const navigate = (tab: string) => setCurrentTab(tab as Tab);

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home setCurrentTab={navigate} />;
      case 'events':
        return <Events setCurrentTab={navigate} />;
      case 'ticket':
        return <Dashboard activePane="ticket" setCurrentTab={navigate} />;
      case 'validator':
        return <ValidatorDemo setCurrentTab={navigate} />;
      case 'admin':
        return <Contact />;
      default:
        return <Home setCurrentTab={navigate} />;
    }
  };

  return (
    <>
      <Navbar currentTab={currentTab} setCurrentTab={navigate} />
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {renderContent()}
      </main>

      <footer style={{
        borderTop: '3px solid rgba(27,170,255,0.3)',
        background: 'rgba(2, 11, 45, 0.95)',
        backdropFilter: 'blur(20px)',
        padding: '1.75rem 1.5rem',
        marginTop: 'auto',
        fontFamily: 'var(--font-family-body)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <img
              src="/injpass_logo.png"
              alt="InjPass Logo"
              style={{
                height: '28px',
                width: 'auto',
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 8px rgba(27,170,255,0.4))'
              }}
            />
            <span style={{ fontSize: '0.82rem', color: '#6A8DB5', fontWeight: 500 }}>
              © 2026 InjPass — Web3 Stadium Ticketing on Injective Protocol.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem' }}>
            {[
              { label: 'How It Works', action: () => setCurrentTab('home' as Tab) },
              { label: 'Turnstile Demo', action: () => setCurrentTab('validator' as Tab) },
              { label: 'Admin Panel', action: () => setCurrentTab('admin' as Tab) },
            ].map((item) => (
              <span
                key={item.label}
                style={{
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#6A8DB5',
                  transition: 'color 0.15s ease',
                }}
                onClick={item.action}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#1BAAFF')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6A8DB5')}
              >
                {item.label}
              </span>
            ))}
            <a
              href="https://injective.com"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#6A8DB5',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#1BAAFF')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6A8DB5')}
            >
              Injective Docs ↗
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

function App() {
  return (
    <Web3Provider>
      <AppContent />
    </Web3Provider>
  );
}

export default App;