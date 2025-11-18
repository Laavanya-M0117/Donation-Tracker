import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Heart, DollarSign, Wallet, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NGO {
  wallet: string;
  name: string;
  description?: string;
  approved: boolean;
}

interface DonationFormProps {
  account: string;
  ngos: NGO[];
  onDonate: (ngoWallet: string, amount: string, message: string) => Promise<void>;
}

export function DonationForm({ account, ngos, onDonate }: DonationFormProps) {
  const [selectedNGO, setSelectedNGO] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [balance, setBalance] = useState('0');
  const [gasEstimate, setGasEstimate] = useState('0.001');

  const approvedNGOs = ngos.filter(ngo => ngo.approved);
  const selectedNGOData = approvedNGOs.find(ngo => ngo.wallet === selectedNGO);

  useEffect(() => {
    if (account && window.ethereum) {
      fetchBalance();
    }
  }, [account]);

  const fetchBalance = async () => {
    if (!window.ethereum || !account) return;
    
    try {
      const { BrowserProvider, formatEther } = await import('ethers');
      const provider = new BrowserProvider(window.ethereum);
      const balance = await provider.getBalance(account);
      setBalance(formatEther(balance));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!selectedNGO) {
      toast.error('Please select an NGO to donate to');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error('Please enter a valid donation amount');
      return;
    }

    const donationAmount = parseFloat(amount);
    const accountBalance = parseFloat(balance);
    const totalCost = donationAmount + parseFloat(gasEstimate);

    if (totalCost > accountBalance) {
      toast.error(`Insufficient balance. Need ${totalCost.toFixed(4)} MATIC but have ${accountBalance.toFixed(4)} MATIC`);
      return;
    }

    setIsSubmitting(true);
    try {
      await onDonate(selectedNGO, amount, message);
      
      setSelectedNGO('');
      setAmount('');
      setMessage('');
      
      // Refresh balance after donation
      setTimeout(fetchBalance, 2000);
    } catch (error: any) {
      console.error('Donation error:', error);
      // Error is already handled in the parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = ['0.01', '0.05', '0.1', '0.5', '1.0'];
  
  const isValidAmount = amount && parseFloat(amount) > 0;
  const hasBalance = parseFloat(balance) > (parseFloat(amount || '0') + parseFloat(gasEstimate));
  const canDonate = account && selectedNGO && isValidAmount && hasBalance;

  return (
    <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Make a Donation
            </div>
            {account && (
              <Badge variant="outline" className="gap-1">
                <Wallet className="w-3 h-3" />
                {parseFloat(balance).toFixed(4)} MATIC
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          {approvedNGOs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No approved NGOs available yet.</p>
              <p className="text-sm">Check back later or register your NGO!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ngo-select">Select NGO to Support</Label>
                <Select value={selectedNGO} onValueChange={setSelectedNGO}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Choose an NGO..." />
                  </SelectTrigger>
                  <SelectContent>
                    {approvedNGOs.map((ngo) => (
                      <SelectItem key={ngo.wallet} value={ngo.wallet}>
                        <div className="flex flex-col items-start w-full">
                          <span className="font-medium">{ngo.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {ngo.wallet.slice(0, 10)}...{ngo.wallet.slice(-6)}
                          </span>
                          {ngo.description && (
                            <span className="text-xs text-muted-foreground mt-1 line-clamp-1">
                              {ngo.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedNGOData && (
                  <div className="bg-muted/50 rounded-lg p-3 mt-2">
                    <p className="text-sm text-muted-foreground">
                      {selectedNGOData.description || 'Supporting this organization with your donation.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="donation-amount">Donation Amount</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="donation-amount"
                    type="number"
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className={`pl-10 h-12 text-lg ${
                      amount && !hasBalance ? 'border-red-500 focus:border-red-500' : ''
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-muted-foreground">
                    MATIC
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      type="button"
                      variant={amount === quickAmount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAmount(quickAmount)}
                      className="text-xs"
                      disabled={parseFloat(quickAmount) > parseFloat(balance)}
                    >
                      <Zap className="w-3 h-3 mr-1" />
                      {quickAmount}
                    </Button>
                  ))}
                </div>

                {/* Balance and cost info */}
                {account && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Donation:</span>
                      <span>{amount || '0'} MATIC</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Gas:</span>
                      <span>{gasEstimate} MATIC</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Total:</span>
                      <span>{(parseFloat(amount || '0') + parseFloat(gasEstimate)).toFixed(4)} MATIC</span>
                    </div>
                    {amount && !hasBalance && (
                      <div className="flex items-center gap-1 text-red-500 mt-2">
                        <AlertCircle className="w-3 h-3" />
                        <span>Insufficient balance</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="donation-message">Message of Support (Optional)</Label>
                <Textarea
                  id="donation-message"
                  placeholder="Share why you're supporting food relief in India..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[100px] resize-none"
                  maxLength={500}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {message.length}/500 characters
                </div>
              </div>

              <Button
                type="submit"
                disabled={isSubmitting || !canDonate}
                className="w-full h-12 text-lg bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-400"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Sending Donation...
                  </>
                ) : !account ? (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet to Donate
                  </>
                ) : !hasBalance && amount ? (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Insufficient Balance
                  </>
                ) : (
                  <>
                    <Heart className="w-4 h-4 mr-2" />
                    Donate {amount ? `${amount} MATIC` : 'Now'}
                  </>
                )}
              </Button>
              
              {!account && (
                <p className="text-sm text-muted-foreground text-center">
                  Connect your wallet to start making a difference
                </p>
              )}
            </form>
          )}
        </CardContent>
      </Card>
  );
}