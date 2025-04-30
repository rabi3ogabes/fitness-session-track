
import { ReactNode } from "react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  change?: string;
  positive?: boolean;
}

const StatsCard = ({ title, value, icon, change, positive }: StatsCardProps) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {change && (
            <p className={`text-xs ${positive ? "text-green-500" : "text-red-500"} mt-2`}>
              {positive ? "+" : "-"}{change} since last month
            </p>
          )}
        </div>
        <div className="p-3 bg-gym-light rounded-full">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;
