'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAtom, useSetAtom } from 'jotai';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { groupAtom, membersAtom, expensesAtom, selectedCurrenciesAtom } from '@/atoms';
import { createGroupSchema, addMemberSchema } from '@/lib/schemas';
import { generateId } from '@/lib/currency';
import type { Member } from '@/types';
import { X, Plus } from 'lucide-react';

/**
 * Form for creating a new group with members
 * Client Component - uses Jotai atoms and form state
 */
export function CreateGroupForm() {
  const router = useRouter();
  const setGroup = useSetAtom(groupAtom);
  const [members, setMembers] = useAtom(membersAtom);
  const setExpenses = useSetAtom(expensesAtom);
  const setSelectedCurrencies = useSetAtom(selectedCurrenciesAtom);

  // Reset all group-related state when component mounts (creating a new group)
  useEffect(() => {
    setGroup(null);
    setMembers([]);
    setExpenses([]);
    setSelectedCurrencies(['JPY']);
  }, [setGroup, setMembers, setExpenses, setSelectedCurrencies]);

  const [groupName, setGroupName] = useState('');
  const [memberName, setMemberName] = useState('');
  const [groupNameError, setGroupNameError] = useState('');
  const [memberNameError, setMemberNameError] = useState('');

  const memberInputRef = useRef<HTMLInputElement>(null);

  /**
   * Add a new member to the list
   */
  const handleAddMember = () => {
    // Validate member name
    const result = addMemberSchema.safeParse({ name: memberName.trim() });
    if (!result.success) {
      setMemberNameError(result.error.issues[0]?.message ?? 'エラー');
      return;
    }

    // Check for duplicate names
    if (members.some((m) => m.name === memberName.trim())) {
      setMemberNameError('同じ名前のメンバーがいます');
      return;
    }

    // Add member
    const newMember: Member = {
      id: generateId(),
      name: memberName.trim(),
    };
    setMembers([...members, newMember]);
    setMemberName('');
    setMemberNameError('');

    // Keep focus on input for quick consecutive additions
    memberInputRef.current?.focus();
  };

  /**
   * Remove a member from the list
   */
  const handleRemoveMember = (memberId: string) => {
    setMembers(members.filter((m) => m.id !== memberId));
  };

  /**
   * Handle Enter key press in member input
   */
  const handleMemberKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddMember();
    }
  };

  /**
   * Create the group and navigate to the group page
   */
  const handleCreateGroup = () => {
    // Validate group name
    const result = createGroupSchema.safeParse({ name: groupName.trim() });
    if (!result.success) {
      setGroupNameError(result.error.issues[0]?.message ?? 'エラー');
      return;
    }

    // Check minimum members
    if (members.length < 2) {
      toast.error('メンバーを2人以上追加してください');
      return;
    }

    // Create group
    setGroup({
      id: generateId(),
      name: groupName.trim(),
      createdAt: new Date(),
    });

    toast.success('グループを作成しました');
    router.push('/group');
  };

  return (
    <div className="space-y-6 py-4">
      {/* Group Name */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">グループ名</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="例: 北海道旅行"
            value={groupName}
            onChange={(e) => {
              setGroupName(e.target.value);
              setGroupNameError('');
            }}
            className="text-lg"
          />
          {groupNameError && <p className="text-sm text-red-500 mt-1">{groupNameError}</p>}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">メンバー名</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Member Input */}
          <div className="flex gap-2">
            <Input
              ref={memberInputRef}
              placeholder="名前を入力"
              value={memberName}
              onChange={(e) => {
                setMemberName(e.target.value);
                setMemberNameError('');
              }}
              onKeyDown={handleMemberKeyDown}
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddMember}
              className="text-orange-500 border-orange-300 hover:bg-orange-50"
            >
              <Plus className="w-4 h-4 mr-1" />
              追加
            </Button>
          </div>
          {memberNameError && <p className="text-sm text-red-500">{memberNameError}</p>}

          {/* Member List */}
          {members.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{member.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMember(member.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Member count hint */}
          <p className="text-sm text-gray-500">
            {members.length === 0 ? 'メンバーを追加してください' : `${members.length}人のメンバー`}
          </p>
        </CardContent>
      </Card>

      {/* Create Button */}
      <Button
        onClick={handleCreateGroup}
        disabled={members.length < 2}
        className="w-full bg-orange-400 hover:bg-orange-500 text-white font-bold py-6 rounded-full text-lg"
      >
        グループを作成
      </Button>
    </div>
  );
}
