
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordResetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  title?: string;
  entityName: string;
  entityType: "trainer" | "member";
}

const PasswordResetDialog = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Reset Password", 
  entityName,
  entityType
}: PasswordResetDialogProps) => {
  const [newPassword, setNewPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleConfirm = () => {
    if (!newPassword || newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }
    onConfirm(newPassword);
    setNewPassword("");
    setPasswordError("");
  };

  const handleDialogClose = () => {
    setNewPassword("");
    setPasswordError("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleDialogClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            Enter a new password for {entityName}.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-3">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input 
              id="new-password"
              type="password" 
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="Enter new password"
              className={passwordError ? "border-red-500" : ""}
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDialogClose}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleConfirm} 
            className="bg-gym-blue hover:bg-gym-dark-blue"
          >
            Reset Password
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PasswordResetDialog;
