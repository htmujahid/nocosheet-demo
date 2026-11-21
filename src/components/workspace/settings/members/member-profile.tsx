import { useSuspenseQuery } from "@tanstack/react-query";

import { adminUserQueryOptions } from "@/data/admin/user";

import { MemberAccessProfile } from "./member-access-profile";
import { MemberAccount } from "./member-account";
import { MemberDangerZone } from "./member-danger-zone";
import { MemberProfileForm } from "./member-profile-form";

export function MemberProfile({ userId, isSelf }: { userId: string; isSelf: boolean }) {
  const { data: member } = useSuspenseQuery(adminUserQueryOptions(userId));

  return (
    <>
      <MemberProfileForm key={member.updatedAt.toString()} member={member} isSelf={isSelf} />
      <MemberAccessProfile userId={member.id} name={member.name} role={member.role} />
      <MemberAccount userId={member.id} />
      {!isSelf && <MemberDangerZone member={member} />}
    </>
  );
}
