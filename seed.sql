INSERT INTO "User" (
  id, email, name, role, passwordHash, commissionBps, createdAt, updatedAt
) VALUES (
  '1',
  'admin@tuempresa.com',
  'Admin',
  'ADMIN',
  '$2a$10$<$2a$10$oQyGDyf3.pDf/W4/Of71wO7vBPsLm24yd7UYjeQjTDrNEsPYFpY6y',
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);
