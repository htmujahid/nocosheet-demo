import { useSuspenseQuery } from "@tanstack/react-query";

import { adminUserQueryOptions } from "@/data/admin/user";

import { MemberAccount } from "./member-account";
import { MemberDangerZone } from "./member-danger-zone";
import { MemberProfileForm } from "./member-profile-form";
import { MemberRole } from "./member-role";

export function MemberProfile({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));

  return (
    <>
      <MemberProfileForm key={member.updatedAt.toString()} member={member} isSelf={isSelf} />
      <MemberRole userId={member.id} name={member.name} role={member.role} />
      <MemberAccount userId={member.id} />
      {!isSelf && <MemberDangerZone member={member} />}
    </>
  );
}
