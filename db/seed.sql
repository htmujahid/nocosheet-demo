INSERT OR IGNORE INTO "user" ("id", "name", "email", "emailVerified", "role", "banned", "createdAt", "updatedAt")
VALUES
  ('seed-user-admin',  'Admin User',    'admin@example.com',         1, 'admin', 0, (strftime('%s', 'now') - 400 * 86400) * 1000, (strftime('%s', 'now') - 400 * 86400) * 1000),
  ('seed-user-member', 'Member User',   'member@example.com',        1, 'user',  0, (strftime('%s', 'now') - 150 * 86400) * 1000, (strftime('%s', 'now') - 150 * 86400) * 1000),
  ('seed-user-maya',   'Maya Chen',     'maya.chen@example.com',     1, 'user',  0, (strftime('%s', 'now') - 120 * 86400) * 1000, (strftime('%s', 'now') - 120 * 86400) * 1000),
  ('seed-user-kai',    'Kai Morgan',    'kai.morgan@example.com',    1, 'user',  0, (strftime('%s', 'now') - 100 * 86400) * 1000, (strftime('%s', 'now') - 100 * 86400) * 1000),
  ('seed-user-priya',  'Priya Nair',    'priya.nair@example.com',    1, 'user',  0, (strftime('%s', 'now') -  80 * 86400) * 1000, (strftime('%s', 'now') -  80 * 86400) * 1000),
  ('seed-user-diego',  'Diego Alvarez', 'diego.alvarez@example.com', 1, 'user',  0, (strftime('%s', 'now') -  60 * 86400) * 1000, (strftime('%s', 'now') -  60 * 86400) * 1000);

INSERT OR IGNORE INTO "account" ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
SELECT 'seed-account-' || substr("id", 11), "id", 'credential', "id",
       'e6d84aff8cf3ea4b658f546198d4bde2:6d7baa39dab646b34148c766d85efd14c4f866b39c3d7436ed602053f7d8b69481961c28baecae4f8cd56654201b4616792fa366ceadf3d5c4d2c14fce081384',
       "createdAt", "updatedAt"
FROM "user"
WHERE "id" LIKE 'seed-user-%';


INSERT OR IGNORE INTO "default__access_profile_member" ("user_id", "profile_id", "assigned_by", "assigned_at")
SELECT 'seed-user-maya', "id", 'seed-user-admin', strftime('%s', 'now') * 1000
FROM "default__access_profile" WHERE "name" = 'Editor';

INSERT OR IGNORE INTO "default__access_profile_member" ("user_id", "profile_id", "assigned_by", "assigned_at")
SELECT 'seed-user-kai', "id", 'seed-user-admin', strftime('%s', 'now') * 1000
FROM "default__access_profile" WHERE "name" = 'Contributor';
