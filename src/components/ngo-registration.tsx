import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Building2, Link, User } from 'lucide-react';
import { toast } from 'sonner';

interface NGORegistrationProps {
  account: string;
  onRegister: (name: string, metadata: string, description: string, website: string, contact: string) => Promise<void>;
}

export function NGORegistration({ account, onRegister }: NGORegistrationProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    website: '',
    contact: '',
    metadata: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.name.trim()) {
      toast.error('NGO name is required');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Description is required');
      return;
    }

    setIsSubmitting(true);
    try {
      await onRegister(
        formData.name,
        formData.metadata,
        formData.description,
        formData.website,
        formData.contact
      );
      
      setFormData({
        name: '',
        description: '',
        website: '',
        contact: '',
        metadata: '',
      });
      
      toast.success('NGO registration submitted! Awaiting admin approval.');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error('Failed to register NGO');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Register Your Food Bank/NGO
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Join India's blockchain-powered food relief network. All organizations operating in India are welcome, with primary focus on food distribution.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ngo-name">NGO Name *</Label>
              <Input
                id="ngo-name"
                placeholder="Enter your NGO name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ngo-contact">Contact Person</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="ngo-contact"
                  placeholder="Contact person name"
                  value={formData.contact}
                  onChange={(e) => handleChange('contact', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ngo-description">Description *</Label>
            <Textarea
              id="ngo-description"
              placeholder="Describe your food bank or relief organization's mission and activities in India..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="min-h-[100px]"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ngo-website">Website</Label>
            <div className="relative">
              <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="ngo-website"
                placeholder="https://your-ngo-website.com"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ngo-metadata">Metadata/Documentation Link</Label>
            <Input
              id="ngo-metadata"
              placeholder="IPFS CID or link to your documents"
              value={formData.metadata}
              onChange={(e) => handleChange('metadata', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional: Link to registration documents, certificates, etc.
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isSubmitting || !account}
            className="w-full"
          >
            {isSubmitting ? 'Submitting...' : 'Register NGO'}
          </Button>
          
          {!account && (
            <p className="text-sm text-muted-foreground text-center">
              Connect your wallet to register as an NGO
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}