import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { connectKeplr, getKeplrAccount, suggestChain } from '../services/wallet';
import { Link, useNavigate } from 'react-router-dom';

export default function Apps() {
  const { session } = useAuth();
  const [selectedApp, setSelectedApp] = useState(null);
  const [copyStatus, setCopyStatus] = useState('');
  const [walletStatus, setWalletStatus] = useState({
    connected: false,
    address: null,
    error: null
  });
  const [showHistory, setShowHistory] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  const transactions = [
    { 
      id: 1, 
      type: '#pay',
      summary: 'Sent 100 USDC to Bob, due in 90 days',
      amount: '100 USDC',
      to: '@bob',
      status: 'completed',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      postUrl: '/post/abc123',
      description: '#pay $100 @bob #90days'
    },
    { 
      id: 2, 
      type: '#swap',
      summary: 'Swapped 50 ATOM for OSMO',
      amount: '50 ATOM',
      to: 'OSMO',
      status: 'completed',
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      postUrl: '/post/def456',
      description: '#swap 50ATOM to OSMO'
    },
    { 
      id: 3, 
      type: '#lend',
      summary: 'Lent 1000 USDC to Carol at 5% APY',
      amount: '1000 USDC',
      to: '@carol',
      status: 'active',
      timestamp: new Date(Date.now() - 86400000).toISOString(),
      postUrl: '/post/ghi789',
      description: '#lend 1000USDC @carol #5%APY'
    }
  ];

  const apps = [
    { 
      tag: '#pay', 
      description: 'Send payments', 
      color: '#22c55e',
      contract: 'cosmos1abc...def',
      example: '#pay $100 @bob #90days',
      settingsPath: '/settings/pay'
    },
    { 
      tag: '#swap', 
      description: 'Swap assets', 
      color: '#3b82f6',
      contract: 'cosmos2def...abc',
      example: '#swap 50ATOM to OSMO @alice',
      settingsPath: '/settings/swap'
    },
    { 
      tag: '#lend', 
      description: 'Lend assets', 
      color: '#f59e0b',
      contract: 'cosmos3ghi...jkl',
      example: '#lend 1000USDC @carol #5%APY',
      settingsPath: '/settings/lend'
    },
    { 
      tag: '#invest', 
      description: 'Invest in assets', 
      color: '#8b5cf6',
      contract: 'cosmos4mno...pqr',
      example: '#invest $500 @dao #6months',
      settingsPath: '/settings/invest'
    },
    { 
      tag: '#node', 
      description: 'Create Cycles Node', 
      color: '#ec4899',
      contract: 'cosmos5stu...vwx',
      example: '#node create @mynode #validator',
      settingsPath: '/settings/node'
    }
  ];

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    const account = await getKeplrAccount();
    if (account.success) {
      setWalletStatus({
        connected: true,
        address: account.data.address,
        error: null
      });
    }
  };

  const handleConnectWallet = async () => {
    try {
      await suggestChain();
      const result = await connectKeplr();
      
      if (result.success) {
        setWalletStatus({
          connected: true,
          address: result.data.address,
          error: null
        });
      } else {
        setWalletStatus(prev => ({
          ...prev,
          error: result.error
        }));
      }
    } catch (error) {
      setWalletStatus(prev => ({
        ...prev,
        error: error.message
      }));
    }
  };

  const handleAppClick = (app) => {
    if (!walletStatus.connected) {
      handleConnectWallet();
      return;
    }
    setSelectedApp(app);
    navigate('/?post=' + encodeURIComponent(app.tag + ' '));
  };

  const copyExample = async (example, e) => {
    e.stopPropagation();
    const textArea = document.createElement('textarea');
    textArea.value = example;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopyStatus(`Copied: ${example}`);
    } catch (err) {
      console.error('Copy failed:', err);
      setCopyStatus('Failed to copy - please copy manually');
    }
    
    textArea.remove();
  };

  const filteredTransactions = transactions.filter(tx => 
    activeFilter === 'all' || tx.type === activeFilter
  );

  return (
    <div className="container">
      <div className="apps-header">
        <div className="apps-title">
          <h2>Apps</h2>
          <p className="apps-subtitle">Quick access to financial operations</p>
        </div>
        <div className="apps-controls">
          {walletStatus.connected ? (
            <>
              <div className="wallet-status success">
                Connected: {walletStatus.address.slice(0, 8)}...{walletStatus.address.slice(-6)}
              </div>
              <button 
                className="btn-icon"
                onClick={() => setShowHistory(!showHistory)}
                title={showHistory ? 'Show Apps' : 'Show History'}
              >
                {showHistory ? '📱' : '📋'}
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={handleConnectWallet}>
              Connect Keplr Wallet
            </button>
          )}
        </div>
        {walletStatus.error && (
          <div className="error">{walletStatus.error}</div>
        )}
      </div>

      {showHistory ? (
        <div className="history-section">
          <div className="history-filters">
            <button 
              className={`btn btn-filter ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All
            </button>
            {apps.map(app => (
              <button
                key={app.tag}
                className={`btn btn-filter ${activeFilter === app.tag ? 'active' : ''}`}
                onClick={() => setActiveFilter(app.tag)}
                style={{ '--filter-color': app.color }}
              >
                {app.tag}
              </button>
            ))}
          </div>
          <div className="transactions-list">
            {filteredTransactions.map(tx => (
              <div key={tx.id} className="transaction-item">
                <div className="transaction-icon" style={{ backgroundColor: apps.find(app => app.tag === tx.type)?.color }}>
                  {tx.type === '#pay' ? '💸' : 
                   tx.type === '#swap' ? '🔄' : 
                   tx.type === '#lend' ? '🏦' : 
                   tx.type === '#invest' ? '📈' : '🔧'}
                </div>
                <div className="transaction-details">
                  <div className="transaction-header">
                    <span className="transaction-type">{tx.type}</span>
                    <span className="transaction-time">
                      {new Date(tx.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <Link to={tx.postUrl} className="transaction-summary">
                    {tx.summary}
                  </Link>
                  <div className="transaction-meta">
                    <span className="transaction-amount">{tx.amount}</span>
                    <span className="transaction-status" data-status={tx.status}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="apps-grid">
          {apps.map((app) => (
            <div
              key={app.tag}
              className="app-card"
              style={{ '--app-color': app.color }}
            >
              <div className="app-header">
                <div className="app-tag">{app.tag}</div>
                <Link 
                  to={app.settingsPath} 
                  className="app-settings"
                  onClick={(e) => e.stopPropagation()}
                >
                  ⚙️
                </Link>
              </div>
              <div className="app-description">{app.description}</div>
              <div className="app-contract">
                Contract: <span className="monospace">{app.contract}</span>
              </div>
              <div 
                className="app-example"
                onClick={(e) => copyExample(app.example, e)}
              >
                <span className="example-label">Example (click to copy):</span>
                <code>{app.example}</code>
              </div>
              <button 
                className="btn btn-secondary app-action"
                onClick={() => handleAppClick(app)}
              >
                Use {app.tag}
              </button>
            </div>
          ))}
        </div>
      )}

      {copyStatus && (
        <div className="copy-notification">
          {copyStatus}
        </div>
      )}

      {selectedApp && (
        <div className="app-modal">
          <div className="modal-header">
            <h3>{selectedApp.tag}</h3>
            <button 
              className="modal-close"
              onClick={() => setSelectedApp(null)}
            >
              ×
            </button>
          </div>
          <div className="modal-content">
            <p>Contract Address: {selectedApp.contract}</p>
            <p>Example Usage: {selectedApp.example}</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={(e) => copyExample(selectedApp.example, e)}
              >
                Copy Example
              </button>
              <Link 
                to={selectedApp.settingsPath}
                className="btn btn-primary"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
