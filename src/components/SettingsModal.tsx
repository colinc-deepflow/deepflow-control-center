import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GoogleSheetsConfig } from "@/lib/googleSheets";
import { ExternalLink } from "lucide-react";

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (config: GoogleSheetsConfig, autoRefresh: boolean) => void;
  initialConfig?: GoogleSheetsConfig | null;
  autoRefresh: boolean;
}

export const SettingsModal = ({ open, onOpenChange, onSave, initialConfig, autoRefresh }: SettingsModalProps) => {
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [spreadsheetId, setSpreadsheetId] = useState(initialConfig?.spreadsheetId || '');
  const [sheetName, setSheetName] = useState(initialConfig?.sheetName || 'Projects');
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(autoRefresh);

  const handleSave = () => {
    if (!apiKey || !spreadsheetId || !sheetName) {
      return;
    }
    onSave({ apiKey, spreadsheetId, sheetName }, autoRefreshEnabled);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Google Sheets Configuration</DialogTitle>
          <DialogDescription>
            Connect your Google Sheet to sync project data.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">Google Sheets API Key</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your API key"
            />
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              Get API Key from Google Cloud Console
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
            <Input
              id="spreadsheetId"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              placeholder="Found in your sheet URL"
            />
            <p className="text-xs text-muted-foreground">
              From: https://docs.google.com/spreadsheets/d/<span className="font-mono bg-muted px-1 rounded">SPREADSHEET_ID</span>/edit
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sheetName">Sheet Name</Label>
            <Input
              id="sheetName"
              value={sheetName}
              onChange={(e) => setSheetName(e.target.value)}
              placeholder="Projects"
            />
            <p className="text-xs text-muted-foreground">
              The name of the sheet tab (default: "Projects")
            </p>
          </div>

          <div className="flex items-center justify-between space-x-2 pt-4 border-t">
            <div className="space-y-0.5">
              <Label htmlFor="auto-refresh">Auto-refresh</Label>
              <p className="text-xs text-muted-foreground">
                Automatically check for new projects every 30 seconds
              </p>
            </div>
            <Switch
              id="auto-refresh"
              checked={autoRefreshEnabled}
              onCheckedChange={setAutoRefreshEnabled}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey || !spreadsheetId || !sheetName}>
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
