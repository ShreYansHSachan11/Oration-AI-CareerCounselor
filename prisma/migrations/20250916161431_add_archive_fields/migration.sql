-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_chat_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT,
    "userId" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chat_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_chat_sessions" ("createdAt", "id", "title", "updatedAt", "userId") SELECT "createdAt", "id", "title", "updatedAt", "userId" FROM "chat_sessions";
DROP TABLE "chat_sessions";
ALTER TABLE "new_chat_sessions" RENAME TO "chat_sessions";
CREATE INDEX "idx_chat_sessions_user_created" ON "chat_sessions"("userId", "createdAt");
CREATE INDEX "idx_chat_sessions_user_updated" ON "chat_sessions"("userId", "updatedAt");
CREATE INDEX "idx_chat_sessions_user_archived" ON "chat_sessions"("userId", "isArchived");
CREATE INDEX "idx_chat_sessions_title" ON "chat_sessions"("title");
CREATE INDEX "idx_chat_sessions_updated" ON "chat_sessions"("updatedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
