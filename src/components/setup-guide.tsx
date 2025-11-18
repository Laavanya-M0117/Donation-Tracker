import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { motion } from 'framer-motion';
import { getSetupInstructions } from '../lib/config';
import { 
  CheckCircle, 
  Circle, 
  ExternalLink, 
  Copy, 
  Code, 
  Zap,
  Shield,
  Globe,
  Wallet,
  Terminal
} from 'lucide-react';
import { toast } from 'sonner';

interface SetupGuideProps {
  onDismiss: () => void;
}

export function SetupGuide({ onDismiss }: SetupGuideProps) {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStep = (stepIndex: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepIndex) 
        ? prev.filter(i => i !== stepIndex)
        : [...prev, stepIndex]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const setupInstructions = getSetupInstructions();
  
  const setupSteps = [
    {
      title: "Deploy Smart Contract",
      description: "Deploy your donation tracker smart contract to Polygon Amoy testnet",
      code: `npx hardhat run scripts/deploy.js --network amoy`,
      links: [
        { label: "Hardhat Documentation", url: "https://hardhat.org/docs" },
        { label: "Polygon Amoy Testnet", url: "https://amoy.polygonscan.com/" }
      ]
    },
    {
      title: "Configure Environment Variables",
      description: "Set your deployed contract address in environment variables",
      envVars: setupInstructions.environmentVariables,
      note: "Create a .env.local file in your project root"
    },
    {
      title: "Get Testnet MATIC",
      description: "Get free MATIC tokens for testing on Polygon Amoy",
      links: [
        { label: "Polygon Faucet", url: "https://faucet.polygon.technology/" },
        { label: "Alchemy Faucet", url: "https://www.alchemy.com/faucets/polygon-amoy" }
      ]
    },
    {
      title: "Install MetaMask",
      description: "Install MetaMask browser extension and add Polygon Amoy network",
      links: [
        { label: "Install MetaMask", url: "https://metamask.io/" },
        { label: "Add Polygon Amoy", url: "https://chainlist.org/chain/80002" }
      ]
    }
  ];

  const features = [
    {
      icon: <Shield className="w-5 h-5 text-blue-500" />,
      title: "Secure & Transparent",
      description: "All donations are recorded on-chain with full transparency"
    },
    {
      icon: <Globe className="w-5 h-5 text-green-500" />,
      title: "Global Access",
      description: "Anyone can donate from anywhere in the world"
    },
    {
      icon: <Zap className="w-5 h-5 text-purple-500" />,
      title: "Instant Verification",
      description: "Real-time proof of impact with IPFS integration"
    },
    {
      icon: <Wallet className="w-5 h-5 text-orange-500" />,
      title: "Direct Funding",
      description: "Funds go directly to NGOs without intermediaries"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-4xl w-full max-h-[90vh] overflow-auto"
      >
        <Card className="border-2 shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto">
              <Code className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Welcome to BlockchainGive
            </CardTitle>
            <CardDescription className="text-lg max-w-2xl mx-auto">
              A transparent donation tracker built on blockchain technology. 
              Follow these steps to set up your development environment.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8">
            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3 p-4 rounded-lg bg-muted/50"
                >
                  {feature.icon}
                  <div>
                    <h4 className="font-medium">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Separator />

            {/* Setup Steps */}
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Setup Steps</h3>
              
              {setupSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className={`transition-all duration-300 ${
                    completedSteps.includes(index) ? 'border-green-500 bg-green-50 dark:bg-green-950/20' : ''
                  }`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStep(index)}
                          className="p-0 h-auto"
                        >
                          {completedSteps.includes(index) ? (
                            <CheckCircle className="w-6 h-6 text-green-500" />
                          ) : (
                            <Circle className="w-6 h-6 text-muted-foreground" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <CardTitle className="text-lg">{step.title}</CardTitle>
                          </div>
                          <CardDescription>{step.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0 space-y-3">
                      {step.code && (
                        <div className="relative">
                          <pre className="bg-muted/50 p-3 rounded-lg text-sm overflow-x-auto">
                            <code>{step.code}</code>
                          </pre>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(step.code, 'Code')}
                            className="absolute top-2 right-2 h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

                      {(step as any).envVars && (
                        <div className="space-y-2">
                          {(step as any).envVars.map((envVar: any, envIndex: number) => (
                            <div key={envIndex} className="space-y-2">
                              <div className="text-sm font-medium flex items-center gap-2">
                                <Terminal className="w-4 h-4" />
                                {envVar.name}
                              </div>
                              <div className="relative">
                                <pre className="bg-muted/50 p-3 rounded-lg text-sm overflow-x-auto">
                                  <code>{envVar.example}</code>
                                </pre>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => copyToClipboard(envVar.example, envVar.name)}
                                  className="absolute top-2 right-2 h-6 w-6 p-0"
                                >
                                  <Copy className="w-3 h-3" />
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground">{envVar.description}</p>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {step.note && (
                        <Alert>
                          <AlertDescription>{step.note}</AlertDescription>
                        </Alert>
                      )}
                      
                      {step.links && (
                        <div className="flex flex-wrap gap-2">
                          {step.links.map((link, linkIndex) => (
                            <Button
                              key={linkIndex}
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="gap-2"
                            >
                              <ExternalLink className="w-3 h-3" />
                              {link.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={onDismiss}
                className="px-8"
              >
                I'll Set This Up Later
              </Button>
              <Button
                onClick={onDismiss}
                className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Let's Get Started!
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}