-- Migration number: 0006 	 2025-05-29T23:59:06.018Z
-- CreateIndex
CREATE UNIQUE INDEX "applications_title_company_key" ON "applications"("title", "company");

-- CreateIndex
CREATE UNIQUE INDEX "applications_url_key" ON "applications"("url");