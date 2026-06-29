-- CreateTable
CREATE TABLE "GithubConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "repo_owner" TEXT NOT NULL,
    "repo_name" TEXT NOT NULL,
    "repo_full_name" TEXT NOT NULL,
    "github_repo_id" INTEGER,
    "webhook_secret" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "auto_review" BOOLEAN NOT NULL DEFAULT true,
    "default_persona" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "GithubConfig_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WebhookLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "github_config_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "pr_number" INTEGER NOT NULL,
    "pr_title" TEXT,
    "status" TEXT NOT NULL DEFAULT 'received',
    "error_message" TEXT,
    "payload" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebhookLog_github_config_id_fkey" FOREIGN KEY ("github_config_id") REFERENCES "GithubConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FixSuggestion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "issue_id" TEXT NOT NULL,
    "review_id" TEXT NOT NULL,
    "original_code" TEXT NOT NULL,
    "fixed_code" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "applied_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FixSuggestion_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "Issue" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FixSuggestion_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewRule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repo_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "pattern" TEXT,
    "max_value" INTEGER,
    "forbidden" TEXT,
    "require" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "message" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewRule_repo_id_fkey" FOREIGN KEY ("repo_id") REFERENCES "Repository" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CostEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "review_id" TEXT,
    "model" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "cost_cents" INTEGER NOT NULL,
    "duration_ms" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'success',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostEvent_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CostEvent_review_id_fkey" FOREIGN KEY ("review_id") REFERENCES "Review" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "QualitySnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "team_id" TEXT NOT NULL,
    "period_start" DATETIME NOT NULL,
    "period_end" DATETIME NOT NULL,
    "avg_score" REAL,
    "issues_per_review" REAL,
    "resolution_rate" REAL,
    "critical_rate" REAL,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "issue_count" INTEGER NOT NULL DEFAULT 0,
    "resolved_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "FileDependency" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "repo_id" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "imports" TEXT NOT NULL,
    "imported_by" TEXT NOT NULL,
    "language" TEXT,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ReviewPersona" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "system_prompt" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "icon" TEXT,
    "is_custom" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CodeOwnership" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "repo_id" TEXT NOT NULL,
    "file_pattern" TEXT NOT NULL,
    "review_count" INTEGER NOT NULL DEFAULT 0,
    "last_reviewed" DATETIME,
    "expertise_score" REAL NOT NULL DEFAULT 0,
    CONSTRAINT "CodeOwnership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "FileDependency_repo_id_file_path_key" ON "FileDependency"("repo_id", "file_path");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewPersona_name_key" ON "ReviewPersona"("name");

-- CreateIndex
CREATE UNIQUE INDEX "CodeOwnership_user_id_repo_id_file_pattern_key" ON "CodeOwnership"("user_id", "repo_id", "file_pattern");
