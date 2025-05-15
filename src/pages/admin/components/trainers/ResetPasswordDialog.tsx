
import PasswordResetDialog from "@/components/shared/PasswordResetDialog";
import { Trainer } from "./types";

interface ResetPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  trainer: Trainer | null;
}

const ResetPasswordDialog = ({ isOpen, onClose, onConfirm, trainer }: ResetPasswordDialogProps) => {
  if (!trainer) return null;

  return (
    <PasswordResetDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      entityName={trainer.name}
      entityType="trainer"
    />
  );
};

export default ResetPasswordDialog;
