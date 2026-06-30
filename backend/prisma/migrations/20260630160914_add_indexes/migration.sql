-- CreateIndex
CREATE INDEX "Comment_review_id_idx" ON "Comment"("review_id");

-- CreateIndex
CREATE INDEX "Comment_author_id_idx" ON "Comment"("author_id");

-- CreateIndex
CREATE INDEX "Comment_resolved_idx" ON "Comment"("resolved");

-- CreateIndex
CREATE INDEX "CostEvent_user_id_idx" ON "CostEvent"("user_id");

-- CreateIndex
CREATE INDEX "CostEvent_created_at_idx" ON "CostEvent"("created_at");

-- CreateIndex
CREATE INDEX "CostEvent_model_idx" ON "CostEvent"("model");

-- CreateIndex
CREATE INDEX "GithubConfig_user_id_idx" ON "GithubConfig"("user_id");

-- CreateIndex
CREATE INDEX "GithubConfig_repo_full_name_idx" ON "GithubConfig"("repo_full_name");

-- CreateIndex
CREATE INDEX "Issue_review_id_idx" ON "Issue"("review_id");

-- CreateIndex
CREATE INDEX "Issue_severity_idx" ON "Issue"("severity");

-- CreateIndex
CREATE INDEX "Issue_status_idx" ON "Issue"("status");

-- CreateIndex
CREATE INDEX "Notification_user_id_idx" ON "Notification"("user_id");

-- CreateIndex
CREATE INDEX "Notification_user_id_is_read_idx" ON "Notification"("user_id", "is_read");

-- CreateIndex
CREATE INDEX "Notification_created_at_idx" ON "Notification"("created_at");

-- CreateIndex
CREATE INDEX "QualitySnapshot_team_id_idx" ON "QualitySnapshot"("team_id");

-- CreateIndex
CREATE INDEX "QualitySnapshot_team_id_period_start_idx" ON "QualitySnapshot"("team_id", "period_start");

-- CreateIndex
CREATE INDEX "Review_repo_id_idx" ON "Review"("repo_id");

-- CreateIndex
CREATE INDEX "Review_status_idx" ON "Review"("status");

-- CreateIndex
CREATE INDEX "Review_author_id_idx" ON "Review"("author_id");

-- CreateIndex
CREATE INDEX "Review_created_at_idx" ON "Review"("created_at");

-- CreateIndex
CREATE INDEX "Review_repo_id_status_idx" ON "Review"("repo_id", "status");

-- CreateIndex
CREATE INDEX "Session_creator_id_idx" ON "Session"("creator_id");

-- CreateIndex
CREATE INDEX "Session_status_idx" ON "Session"("status");
