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
  Info
} from 'lucide-react';
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

export default function AdminSettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<VoiceAssistantSettings>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [loadingSettings, setLoadingSettings] = useState(true);

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
      const response = await fetch('/api/admin/settings/voice-assistant');
      if (response.ok) {
        const data = await response.json();
        if (data.data) {
          setSettings({ ...DEFAULT_SETTINGS, ...data.data });
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
      const response = await fetch('/api/admin/settings/voice-assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
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
    setSettings(DEFAULT_SETTINGS);
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
          Configure voice assistant AI parameters and behavior
        </p>
      </div>

      {/* Save Status Alert */}
      {saveStatus === 'success' && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-600">Settings Saved</AlertTitle>
          <AlertDescription className="text-green-600">
            Voice assistant settings have been updated successfully.
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

      {/* Settings Card */}
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

      {/* Additional Info Card */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">Testing Your Changes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            After saving settings, the voice assistant will use the new parameters for all users.
          </p>
          <p>
            To test changes:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Save your settings</li>
            <li>Go to any recipe page</li>
            <li>Click the voice assistant button</li>
            <li>Ask a cooking question</li>
            <li>Observe the response quality and adjust parameters as needed</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
