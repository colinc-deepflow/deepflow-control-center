import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

interface WelcomeScreenProps {
  onGetStarted: () => void;
}

export const WelcomeScreen = ({ onGetStarted }: WelcomeScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-subtle flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              DeepFlow AI
            </h1>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground">
            Welcome to Your Command Center
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Connect your Google Sheet to manage all your automation projects in one place. 
            Track leads, monitor pipeline value, and keep everything organized.
          </p>
        </div>

        <div className="bg-card rounded-2xl p-8 shadow-lg border border-border space-y-6">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-foreground">What You'll Get:</h3>
            <ul className="text-left space-y-3 text-muted-foreground">
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span>View all your client projects in one dashboard</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span>Track status, revenue, and lead scores instantly</span>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>
                <span>Real-time sync with your Google Sheets data</span>
              </li>
            </ul>
          </div>

          <Button 
            onClick={onGetStarted}
            size="lg"
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Connect Google Sheets
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          Your API key and data are stored securely in your browser
        </p>
      </div>
    </div>
  );
};
