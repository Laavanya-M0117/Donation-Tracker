import { useState, useEffect } from 'react';
import { Wallet, LogOut, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

interface WalletConnectProps {
  account: string;
  onConnect: () => Promise<void>;
  onDisconnect: () => void;
}

export function WalletConnect({ account, onConnect, onDisconnect }: WalletConnectProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    setIsMetaMaskInstalled(typeof window !== 'undefined' && !!window.ethereum);
  }, []);

  useEffect(() => {
    if (account && window.ethereum) {
      fetchBalance();
    }
  }, [account]);

  const fetchBalance = async () => {
    if (!window.ethereum || !account) return;
    
    try {
      const provider = new (await import('ethers')).BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      const ethers = await import('ethers');
      setBalance(ethers.formatEther(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleConnect = async () => {
    if (!isMetaMaskInstalled) {
      toast.error('Please install MetaMask to use this application', {
        action: {
          label: 'Install MetaMask',
          onClick: () => window.open('https://metamask.io/', '_blank'),
        },
      });
      return;
    }

    setIsConnecting(true);
    try {
      await onConnect();
      toast.success('Wallet connected successfully! 🎉');
    } catch (error: any) {
      console.error('Failed to connect wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    onDisconnect();
    setBalance('0');
    setShowDetails(false);
    toast.info('Wallet disconnected');
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyAddress = () => {
    navigator.clipboard.writeText(account);
    toast.success('Address copied to clipboard');
  };

  const openInExplorer = () => {
    window.open(`https://amoy.polygonscan.com/address/${account}`, '_blank');
  };

  if (account) {
    return (
      <TooltipProvider>
        <div className="relative">
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border border-green-500/20 text-foreground px-4 py-2 rounded-xl flex items-center gap-3 cursor-pointer"
              onClick={() => setShowDetails(!showDetails)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 w-3 h-3 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="text-sm">
                <div className="font-medium">{formatAddress(account)}</div>
                <div className="text-xs text-muted-foreground">
                  {parseFloat(balance).toFixed(4)} MATIC
                </div>
              </div>
            </motion.div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDisconnect}
                  className="gap-2 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Disconnect wallet</p>
              </TooltipContent>
            </Tooltip>
          </motion.div>

          <AnimatePresence>
            {showDetails && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full right-0 mt-2 z-50"
              >
                <Card className="w-80 border-2 shadow-lg">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Wallet Details</h3>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Connected
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wide">Address</label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="text-sm bg-muted px-2 py-1 rounded font-mono flex-1">
                            {account}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyAddress}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-xs text-muted-foreground uppercase tracking-wide">Balance</label>
                        <div className="text-lg font-semibold mt-1">
                          {parseFloat(balance).toFixed(6)} MATIC
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={openInExplorer}
                          className="flex-1 gap-2"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View on Explorer
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={fetchBalance}
                          className="gap-2"
                        >
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </TooltipProvider>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {!isMetaMaskInstalled ? (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <Button
            onClick={() => window.open('https://metamask.io/', '_blank')}
            variant="outline"
            className="gap-2"
          >
            Install MetaMask
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          size="lg"
        >
          <Wallet className="w-4 h-4" />
          {isConnecting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Connecting...
            </>
          ) : (
            'Connect Wallet'
          )}
        </Button>
      )}
    </motion.div>
  );
}