import { CheckCircleIcon, ExclamationCircleIcon, ClockIcon } from "@heroicons/react/24/outline";

interface BillListItemProps {
  title: string;
  category: string;
  date: string;
  dueDate: string | null;
  paymentDate: string | null;
  amount: number;
  onClick: () => void;
}

export default function BillListItem({ title, category, date, dueDate, paymentDate, amount, onClick }: BillListItemProps) {
  const isPaid = !!paymentDate;
  const isOverdue = !isPaid && dueDate && new Date(dueDate) < new Date();

  return (
    <div
      onClick={onClick}
      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition cursor-pointer shadow-sm hover:shadow"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-full ${
          isPaid
            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
            : isOverdue
              ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400'
        }`}>
          {isPaid ? <CheckCircleIcon className="w-6 h-6" /> : isOverdue ? <ExclamationCircleIcon className="w-6 h-6" /> : <ClockIcon className="w-6 h-6" />}
        </div>
        <div>
          <p className="font-semibold text-gray-800 dark:text-gray-100">{title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{new Date(date).toLocaleDateString()} • {category}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-gray-900 dark:text-gray-100">€{amount.toFixed(2)}</p>
        <p className={`text-xs font-medium ${
          isPaid
            ? 'text-green-600 dark:text-green-400'
            : isOverdue
              ? 'text-red-600 dark:text-red-400'
              : 'text-yellow-600 dark:text-yellow-400'
        }`}>
          {isPaid ? "Pagato" : isOverdue ? "Scaduto" : "Da Pagare"}
        </p>
      </div>
    </div>
  );
}
