import { CreateGroupForm } from '@/components/group/create-group-form';

/**
 * Home page - Group creation
 * No landing page, directly show the form
 */
export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 text-center border-b bg-white">
        <h1 className="text-xl font-bold">割り勘計算</h1>
      </header>

      {/* Content */}
      <div className="container mx-auto max-w-md p-4">
        <CreateGroupForm />
      </div>
    </main>
  );
}
