
import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const UserProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    emergencyContact: "",
    emergencyPhone: "",
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [loading, setLoading] = useState(true);

  // Load profile data from database
  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error loading profile:', error);
          return;
        }

        if (data) {
          setProfile({
            name: data.name || "",
            email: data.email || user.email || "",
            phone: data.phone_number || "",
            address: "", // Not in profiles table yet
            city: "", // Not in profiles table yet
            emergencyContact: data.emergency_contact_name || "",
            emergencyPhone: data.emergency_contact_phone || "",
          });
        } else {
          // Set basic info from auth user if no profile exists
          setProfile(prev => ({
            ...prev,
            name: user.name || "",
            email: user.email || "",
          }));
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditedProfile(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!user?.id) return;
    
    try {
      // Format phone number for WhatsApp (add +974 if it's 8 digits)
      let formattedPhone = editedProfile.phone;
      if (editedProfile.phone && /^\d{8}$/.test(editedProfile.phone.trim())) {
        formattedPhone = `+974${editedProfile.phone.trim()}`;
      }

      // Update profiles table with original phone number (for display)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          name: editedProfile.name,
          phone_number: editedProfile.phone, // Store original format for display
          emergency_contact_name: editedProfile.emergencyContact,
          emergency_contact_phone: editedProfile.emergencyPhone,
        })
        .eq('id', user.id);

      if (profileError) {
        toast({
          title: "Error",
          description: "Failed to update profile. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Update members table with formatted phone number for WhatsApp notifications
      const { error: memberError } = await supabase
        .from('members')
        .update({
          phone: formattedPhone, // Store formatted version for WhatsApp
          name: editedProfile.name,
        })
        .eq('email', editedProfile.email);

      // Note: We don't fail if member update fails as it might not exist
      if (memberError) {
        console.log('Member record not found or failed to update:', memberError);
      }

      setProfile(editedProfile);
      setIsEditing(false);
      
      toast({
        title: "Profile updated",
        description: `Your profile has been updated successfully. Phone number formatted for WhatsApp: ${formattedPhone}`,
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Special validation for phone number - only allow digits and max 8 characters
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 8);
      setEditedProfile((prev) => ({ ...prev, [name]: digitsOnly }));
    } else {
      setEditedProfile((prev) => ({ ...prev, [name]: value }));
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
                    Phone Number
                  </label>
                  <Input
                    id="phone"
                    name="phone"
                    value={editedProfile.phone}
                    onChange={handleChange}
                    placeholder="66787778"
                    maxLength={8}
                    pattern="[0-9]{8}"
                  />
                   <p className="text-xs text-gray-500">
                     Enter 8-digit Qatar mobile number (e.g., 66787778, 55331144).
                   </p>
                   {editedProfile.phone && /^\d{8}$/.test(editedProfile.phone.trim()) && (
                     <p className="text-xs text-green-600">
                       WhatsApp format: +974{editedProfile.phone}
                    </p>
                  )}
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