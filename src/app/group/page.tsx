import Link from 'next/link';
import { GroupDashboard } from '@/components/group/group-dashboard';

/**
 * Group Dashboard page - Server Component shell
 * Renders the client-side dashboard components
 */
export default function GroupPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 text-center border-b bg-white sticky top-0 z-10">
        <Link href="/" className="text-xl font-bold hover:underline">
          割り勘計算
        </Link>
      </header>

      {/* Content */}
      <GroupDashboard />
    </main>
  );
}
