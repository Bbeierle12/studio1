'use client';

import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Mic, 
  Brain, 
  Save, 
  RotateCcw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Info,
  Globe,
  Mail,
  Key,
  Wrench,
  Shield
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface VoiceAssistantSettings {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  systemPrompt: string;
  responseMaxLength: number;
}

interface GeneralSettings {
  siteName: string;
  siteDescription: string;
  contactEmail: string;
  maxRecipesPerUser: number;
  enableRegistration: boolean;
  enableGuestMode: boolean;
}

interface MaintenanceSettings {
  maintenanceMode: boolean;
  maintenanceMessage: string;
}

const DEFAULT_SETTINGS: VoiceAssistantSettings = {
  model: 'gpt-4-turbo',
  temperature: 0.7,
  maxTokens: 500,
  topP: 1.0,
  frequencyPenalty: 0.0,
  presencePenalty: 0.0,
  systemPrompt: `You are Chef Assistant, a helpful AI cooking companion designed to help people while they cook. 

You are especially helpful when someone has dirty hands and needs voice assistance. Keep responses concise but informative - ideal for speaking aloud.

You can help with:
- Cooking techniques and tips
- Ingredient substitutions
- Recipe modifications
- Food safety advice
- Timing and temperature guidance
- Kitchen equipment questions
- Dietary restrictions and alternatives

Keep responses under 100 words when possible, and always prioritize food safety. Be encouraging and friendly.`,
  responseMaxLength: 100,
};

const DEFAULT_GENERAL_SETTINGS: GeneralSettings = {
  siteName: 'Recipe Hub',
  siteDescription: 'Your digital cookbook and meal planning companion',
  contactEmail: 'admin@recipehub.com',
  maxRecipesPerUser: 100,
  enableRegistration: true,
  enableGuestMode: true,
};

const DEFAULT_MAINTENANCE_SETTINGS: MaintenanceSettings = {
  maintenanceMode: false,
  maintenanceMessage: 'We are currently performing maintenance. Please check back soon!',
};

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<VoiceAssistantSettings>(DEFAULT_SETTINGS);
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(DEFAULT_GENERAL_SETTINGS);
  const [maintenanceSettings, setMaintenanceSettings] = useState<MaintenanceSettings>(DEFAULT_MAINTENANCE_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    if (!loading && (!user || user.role !== 'SUPER_ADMIN')) {
      router.push('/admin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.role === 'SUPER_ADMIN') {
      fetchSettings();
    }
  }, [user]);

  const fetchSettings = async () => {
    try {
      const [voiceResponse, generalResponse, maintenanceResponse] = await Promise.all([
        fetch('/api/admin/settings/voice-assistant'),
        fetch('/api/admin/settings/general'),
        fetch('/api/admin/settings/maintenance'),
      ]);

      if (voiceResponse.ok) {
        const data = await voiceResponse.json();
        if (data.data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.data });
        }
      }

      if (generalResponse.ok) {
        const data = await generalResponse.json();
        if (data.data) {
          setGeneralSettings({ ...DEFAULT_GENERAL_SETTINGS, ...data.data });
        }
      }

      if (maintenanceResponse.ok) {
        const data = await maintenanceResponse.json();
        if (data.data) {
          setMaintenanceSettings({ ...DEFAULT_MAINTENANCE_SETTINGS, ...data.data });
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    
    try {
      let endpoint = '';
      let body = {};

      switch (activeTab) {
        case 'general':
          endpoint = '/api/admin/settings/general';
          body = generalSettings;
          break;
        case 'voice':
          endpoint = '/api/admin/settings/voice-assistant';
          body = settings;
          break;
        case 'maintenance':
          endpoint = '/api/admin/settings/maintenance';
          body = maintenanceSettings;
          break;
        default:
          throw new Error('Invalid tab');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    switch (activeTab) {
      case 'general':
        setGeneralSettings(DEFAULT_GENERAL_SETTINGS);
        break;
      case 'voice':
        setSettings(DEFAULT_SETTINGS);
        break;
      case 'maintenance':
        setMaintenanceSettings(DEFAULT_MAINTENANCE_SETTINGS);
        break;
    }
    setSaveStatus('idle');
  };

  if (loading || loadingSettings) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!user || user.role !== 'SUPER_ADMIN') {
    return (
      <div className='flex h-screen items-center justify-center'>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Unauthorized Access
            </CardTitle>
            <CardDescription>
              Only Super Admins can access system settings.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/admin">Go to Admin Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 max-w-5xl'>
      {/* Header */}
      <div className='mb-8'>
        <div className='flex items-center gap-2 mb-2'>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/admin">← Back to Dashboard</Link>
          </Button>
        </div>
        <h1 className='text-3xl font-bold mb-2'>System Settings</h1>
        <p className='text-muted-foreground'>
          Configure system-wide settings and preferences
        </p>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'success' && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Settings Saved</AlertTitle>
          <AlertDescription className="text-green-600">
            Settings have been updated successfully.
          </AlertDescription>
        </Alert>
      )}

      {saveStatus === 'error' && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to save settings. Please try again.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabbed Settings Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="voice" className="flex items-center gap-2">
            <Mic className="h-4 w-4" />
            <span className="hidden sm:inline">Voice AI</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            <span className="hidden sm:inline">Maintenance</span>
          </TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Configure basic application settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={generalSettings.siteName}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteName: e.target.value })}
                  placeholder="Recipe Hub"
                />
                <p className="text-xs text-muted-foreground">
                  The name of your application displayed throughout the site
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="siteDescription">Site Description</Label>
                <Textarea
                  id="siteDescription"
                  value={generalSettings.siteDescription}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, siteDescription: e.target.value })}
                  placeholder="Your digital cookbook and meal planning companion"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Brief description for SEO and meta tags
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={generalSettings.contactEmail}
                  onChange={(e) => setGeneralSettings({ ...generalSettings, contactEmail: e.target.value })}
                  placeholder="admin@recipehub.com"
                />
                <p className="text-xs text-muted-foreground">
                  Email address for system notifications and user inquiries
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="maxRecipes">Max Recipes Per User</Label>
                  <span className="text-sm text-muted-foreground font-mono">
                    {generalSettings.maxRecipesPerUser}
                  </span>
                </div>
                <Slider
                  id="maxRecipes"
                  min={10}
                  max={500}
                  step={10}
                  value={[generalSettings.maxRecipesPerUser]}
                  onValueChange={([value]) => setGeneralSettings({ ...generalSettings, maxRecipesPerUser: value })}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Maximum number of recipes a single user can create
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableRegistration">Enable Registration</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow new users to create accounts
                    </p>
                  </div>
                  <Switch
                    id="enableRegistration"
                    checked={generalSettings.enableRegistration}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, enableRegistration: checked })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="enableGuestMode">Enable Guest Mode</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow users to browse without an account
                    </p>
                  </div>
                  <Switch
                    id="enableGuestMode"
                    checked={generalSettings.enableGuestMode}
                    onCheckedChange={(checked) => setGeneralSettings({ ...generalSettings, enableGuestMode: checked })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Voice Assistant Settings Tab */}
        <TabsContent value="voice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Voice Assistant Configuration
              </CardTitle>
              <CardDescription>
            Adjust OpenAI API parameters for the cooking assistant
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Model
            </Label>
            <Select
              value={settings.model}
              onValueChange={(value) => setSettings({ ...settings, model: value })}
            >
              <SelectTrigger id="model">
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo (Recommended)</SelectItem>
                <SelectItem value="gpt-4">GPT-4</SelectItem>
                <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Faster)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              GPT-4 Turbo provides the best responses for cooking questions
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="temperature">Temperature</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.temperature.toFixed(2)}
              </span>
            </div>
            <Slider
              id="temperature"
              min={0}
              max={2}
              step={0.1}
              value={[settings.temperature]}
              onValueChange={([value]) => setSettings({ ...settings, temperature: value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Controls randomness: Lower is more focused and deterministic, higher is more creative (0.0 - 2.0)
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.maxTokens}
              </span>
            </div>
            <Slider
              id="maxTokens"
              min={50}
              max={2000}
              step={50}
              value={[settings.maxTokens]}
              onValueChange={([value]) => setSettings({ ...settings, maxTokens: value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Maximum length of the response (higher = longer responses, more cost)
            </p>
          </div>

          {/* Top P */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="topP">Top P (Nucleus Sampling)</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.topP.toFixed(2)}
              </span>
            </div>
            <Slider
              id="topP"
              min={0}
              max={1}
              step={0.05}
              value={[settings.topP]}
              onValueChange={([value]) => setSettings({ ...settings, topP: value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Alternative to temperature - controls diversity via nucleus sampling (0.0 - 1.0)
            </p>
          </div>

          {/* Frequency Penalty */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="frequencyPenalty">Frequency Penalty</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.frequencyPenalty.toFixed(2)}
              </span>
            </div>
            <Slider
              id="frequencyPenalty"
              min={-2}
              max={2}
              step={0.1}
              value={[settings.frequencyPenalty]}
              onValueChange={([value]) => setSettings({ ...settings, frequencyPenalty: value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Reduces repetition of token sequences - higher values = less repetition (-2.0 to 2.0)
            </p>
          </div>

          {/* Presence Penalty */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="presencePenalty">Presence Penalty</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.presencePenalty.toFixed(2)}
              </span>
            </div>
            <Slider
              id="presencePenalty"
              min={-2}
              max={2}
              step={0.1}
              value={[settings.presencePenalty]}
              onValueChange={([value]) => setSettings({ ...settings, presencePenalty: value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Encourages talking about new topics - higher values = more topic diversity (-2.0 to 2.0)
            </p>
          </div>

          {/* Response Max Length */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="responseMaxLength">Response Max Length (words)</Label>
              <span className="text-sm text-muted-foreground font-mono">
                {settings.responseMaxLength}
              </span>
            </div>
            <Slider
              id="responseMaxLength"
              min={50}
              max={300}
              step={10}
              value={[settings.responseMaxLength]}
              onValueChange={([value]) => setSettings({ ...settings, responseMaxLength: value })}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Suggested word limit mentioned in the system prompt for voice-friendly responses
            </p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={settings.systemPrompt}
              onChange={(e) => setSettings({ ...settings, systemPrompt: e.target.value })}
              rows={12}
              className="font-mono text-sm"
              placeholder="Enter the system prompt that defines the assistant's behavior..."
            />
            <p className="text-xs text-muted-foreground">
              This prompt defines the assistant's personality, role, and capabilities
            </p>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How These Settings Work</AlertTitle>
            <AlertDescription className="text-sm space-y-2 mt-2">
              <p><strong>Temperature:</strong> 0.7 is balanced - good for most cooking questions</p>
              <p><strong>Max Tokens:</strong> 500 is optimal for voice responses (not too long)</p>
              <p><strong>Frequency/Presence Penalties:</strong> Keep at 0 for consistent cooking advice</p>
              <p><strong>System Prompt:</strong> Customize to change the assistant's personality and focus areas</p>
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
              disabled={isSaving}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Manage API keys and external service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertTitle>Security Notice</AlertTitle>
                <AlertDescription>
                  API keys are stored securely in environment variables. These settings control which keys are active.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label htmlFor="openaiKey">OpenAI API Key Status</Label>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50">
                  {process.env.NEXT_PUBLIC_OPENAI_API_KEY ? (
                    <>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-sm">Configured</p>
                        <p className="text-xs text-muted-foreground">
                          Key ends with: •••{process.env.NEXT_PUBLIC_OPENAI_API_KEY?.slice(-4)}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-medium text-sm">Not Configured</p>
                        <p className="text-xs text-muted-foreground">
                          Set OPENAI_API_KEY in your environment variables
                        </p>
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Required for AI recipe generation and voice assistant features
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>Managing API Keys</AlertTitle>
                <AlertDescription className="text-sm space-y-2 mt-2">
                  <p>To update API keys:</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Add/update the key in your <code className="text-xs bg-muted px-1 py-0.5 rounded">.env.local</code> file</li>
                    <li>Restart your development server</li>
                    <li>For production, update environment variables in your hosting platform</li>
                  </ol>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Control site accessibility during updates and maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant={maintenanceSettings.maintenanceMode ? "destructive" : "default"}>
                <Info className="h-4 w-4" />
                <AlertTitle>
                  {maintenanceSettings.maintenanceMode ? 'Maintenance Mode Active' : 'Site Operational'}
                </AlertTitle>
                <AlertDescription>
                  {maintenanceSettings.maintenanceMode
                    ? 'Only administrators can access the site. Regular users see the maintenance message.'
                    : 'All users can access the site normally.'}
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-0.5">
                    <Label htmlFor="maintenanceMode" className="text-base font-semibold">
                      Enable Maintenance Mode
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict site access to administrators only
                    </p>
                  </div>
                  <Switch
                    id="maintenanceMode"
                    checked={maintenanceSettings.maintenanceMode}
                    onCheckedChange={(checked) => setMaintenanceSettings({ ...maintenanceSettings, maintenanceMode: checked })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Textarea
                  id="maintenanceMessage"
                  value={maintenanceSettings.maintenanceMessage}
                  onChange={(e) => setMaintenanceSettings({ ...maintenanceSettings, maintenanceMessage: e.target.value })}
                  placeholder="We are currently performing maintenance. Please check back soon!"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  This message will be displayed to users when maintenance mode is active
                </p>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How Maintenance Mode Works</AlertTitle>
                <AlertDescription className="text-sm space-y-2 mt-2">
                  <p>When enabled:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Regular users see the maintenance message</li>
                    <li>Administrators can still access and use the site normally</li>
                    <li>API endpoints return 503 status for non-admin requests</li>
                    <li>The site automatically redirects users to the maintenance page</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Action Buttons - Shown for all tabs */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
              <Button
                onClick={handleReset}
                variant="outline"
                disabled={isSaving}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
