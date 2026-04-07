import { HomeModernIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

interface HouseCardProps {
  alias: string;
  city?: string;
  street?: string;
  unpaidBillsCount: number;
  onClick: () => void;
}

export default function HouseCard({ alias, city, street, unpaidBillsCount, onClick }: HouseCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md hover:border-primary/50 transition cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 group-hover:text-primary transition-colors">{alias}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {city ? `${city}${street ? `, ${street}` : ''}` : (street || "Nessun indirizzo")}
          </p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-gray-700 text-primary rounded-xl">
          <HomeModernIcon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-50 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
          <DocumentTextIcon className="w-4 h-4" /> Da pagare
        </span>
        {unpaidBillsCount > 0 ? (
          <span className="px-2.5 py-1 text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            {unpaidBillsCount} {unpaidBillsCount === 1 ? 'bolletta' : 'bollette'}
          </span>
        ) : (
          <span className="px-2.5 py-1 text-xs font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            Nessuna
          </span>
        )}
      </div>
    </div>
  );
}
