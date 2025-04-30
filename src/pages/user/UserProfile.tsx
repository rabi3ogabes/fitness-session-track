
import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock user profile data
  const [profile, setProfile] = useState({
    name: user?.name || "John Doe",
    email: user?.email || "john@example.com",
    phone: "(555) 123-4567",
    address: "123 Main St",
    city: "Anytown",
    emergencyContact: "Jane Doe",
    emergencyPhone: "(555) 987-6543",
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = () => {
    setProfile(editedProfile);
    setIsEditing(false);
    
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedProfile((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <DashboardLayout title="My Profile">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Personal Information</h2>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline" className="text-gym-blue border-gym-blue hover:bg-gym-light">
                Edit Profile
              </Button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={editedProfile.name}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={editedProfile.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editedProfile.phone}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <Input
                    id="address"
                    name="address"
                    value={editedProfile.address}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <Input
                    id="city"
                    name="city"
                    value={editedProfile.city}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-3">Emergency Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700">
                      Contact Name
                    </label>
                    <Input
                      id="emergencyContact"
                      name="emergencyContact"
                      value={editedProfile.emergencyContact}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700">
                      Contact Phone
                    </label>
                    <Input
                      id="emergencyPhone"
                      name="emergencyPhone"
                      value={editedProfile.emergencyPhone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button onClick={handleCancel} variant="outline">
                  Cancel
                </Button>
                <Button onClick={handleSave} className="bg-gym-blue hover:bg-gym-dark-blue">
                  Save Changes
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium">{profile.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{profile.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{profile.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium">{profile.address}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">City</p>
                  <p className="font-medium">{profile.city}</p>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <h3 className="text-lg font-semibold mb-3">Emergency Contact Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6">
                  <div>
                    <p className="text-sm text-gray-500">Contact Name</p>
                    <p className="font-medium">{profile.emergencyContact}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Contact Phone</p>
                    <p className="font-medium">{profile.emergencyPhone}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-bold mb-6">Account Settings</h2>
          <div className="space-y-4">
            <Button variant="outline" className="text-gym-blue border-gym-blue hover:bg-gym-light w-full md:w-auto">
              Change Password
            </Button>
            <p className="text-sm text-gray-500 mt-2">
              For security reasons, please contact the gym administration if you need to make changes to your account email.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UserProfile;
