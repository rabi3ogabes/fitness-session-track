
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Mail, Clock } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const [cancellationHours, setCancellationHours] = useState(4);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSaveSettings = () => {
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    }, 500);
  };

  return (
    <DashboardLayout title="System Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gym-blue" />
              <CardTitle>Booking Cancellation</CardTitle>
            </div>
            <CardDescription>
              Configure how many hours before a class members can cancel their booking
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cancellation-hours">Hours before class</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  id="cancellation-hours"
                  type="number"
                  min={1}
                  max={48}
                  value={cancellationHours}
                  onChange={(e) => setCancellationHours(parseInt(e.target.value))}
                  className="w-20"
                />
                <span className="text-gray-500">hours</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Members will not be able to cancel their booking if it's less than {cancellationHours} hours before the class starts.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-gym-blue" />
              <CardTitle>Notification Settings</CardTitle>
            </div>
            <CardDescription>
              Configure email notifications for trainers
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email notifications for trainers</p>
                <p className="text-sm text-gray-500">
                  Trainers will receive email notifications when members book or cancel sessions
                </p>
              </div>
              <Switch 
                checked={emailNotifications} 
                onCheckedChange={setEmailNotifications} 
              />
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Button 
            onClick={handleSaveSettings} 
            className="bg-gym-blue hover:bg-gym-dark-blue"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Settings;
