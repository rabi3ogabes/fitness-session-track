
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Mail, Clock, Image, Trash } from "lucide-react";
import { Switch } from "@/components/ui/switch";

const Settings = () => {
  const [cancellationHours, setCancellationHours] = useState(4);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [membershipExpiry, setMembershipExpiry] = useState({
    basic: 30,   // days
    standard: 60, // days
    premium: 90  // days
  });
  
  const { toast } = useToast();

  useEffect(() => {
    // Load logo from local storage if exists
    const savedLogo = localStorage.getItem("gymLogo");
    if (savedLogo) {
      setLogo(savedLogo);
    }
  }, []);

  const handleSaveSettings = () => {
    setIsLoading(true);

    // Save logo to localStorage
    if (logo) {
      localStorage.setItem("gymLogo", logo);
    } else {
      localStorage.removeItem("gymLogo");
    }

    // Save other settings to localStorage
    localStorage.setItem("cancellationHours", cancellationHours.toString());
    localStorage.setItem("emailNotifications", emailNotifications.toString());
    localStorage.setItem("membershipExpiry", JSON.stringify(membershipExpiry));

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
    }, 500);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && typeof event.target.result === 'string') {
          setLogo(event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteLogo = () => {
    setLogo(null);
    setLogoFile(null);
    toast({
      title: "Logo deleted",
      description: "The logo has been removed.",
    });
  };

  return (
    <DashboardLayout title="System Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Image className="h-5 w-5 text-gym-blue" />
              <CardTitle>Logo Settings</CardTitle>
            </div>
            <CardDescription>
              Upload and manage your gym logo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {logo && (
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <img 
                    src={logo} 
                    alt="Gym Logo" 
                    className="max-h-32 max-w-full object-contain border rounded-md"
                  />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-0 right-0 p-1 h-7 w-7" 
                    onClick={handleDeleteLogo}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
            <div>
              <Label htmlFor="logo-upload">Upload Logo</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="mt-2"
              />
              <p className="text-sm text-gray-500 mt-1">
                Recommended size: 200x60 pixels. Max file size: 2MB.
              </p>
            </div>
          </CardContent>
        </Card>

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

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <SettingsIcon className="h-5 w-5 text-gym-blue" />
              <CardTitle>Membership Expiry</CardTitle>
            </div>
            <CardDescription>
              Configure how many days members have to use their purchased sessions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Label htmlFor="basic-expiry" className="w-24">Basic Plan:</Label>
                <Input
                  id="basic-expiry"
                  type="number"
                  min={7}
                  value={membershipExpiry.basic}
                  onChange={(e) => setMembershipExpiry({
                    ...membershipExpiry,
                    basic: parseInt(e.target.value) || membershipExpiry.basic
                  })}
                  className="w-20"
                />
                <span className="text-gray-500">days</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="standard-expiry" className="w-24">Standard Plan:</Label>
                <Input
                  id="standard-expiry"
                  type="number"
                  min={7}
                  value={membershipExpiry.standard}
                  onChange={(e) => setMembershipExpiry({
                    ...membershipExpiry,
                    standard: parseInt(e.target.value) || membershipExpiry.standard
                  })}
                  className="w-20"
                />
                <span className="text-gray-500">days</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Label htmlFor="premium-expiry" className="w-24">Premium Plan:</Label>
                <Input
                  id="premium-expiry"
                  type="number"
                  min={7}
                  value={membershipExpiry.premium}
                  onChange={(e) => setMembershipExpiry({
                    ...membershipExpiry,
                    premium: parseInt(e.target.value) || membershipExpiry.premium
                  })}
                  className="w-20"
                />
                <span className="text-gray-500">days</span>
              </div>
              
              <p className="text-sm text-gray-500 mt-2">
                Unused sessions will expire after the specified number of days.
              </p>
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
