$baseUrl = "http://localhost:5000"
$pass = 0
$fail = 0
$issues = @()

function Test-Case {
    param([string]$name, [string]$method, [string]$url, [string]$body, [int]$expectedStatus, [string]$contains)
    try {
        $params = @{
            Uri = $url
            Method = $method
            ContentType = "application/json"
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        if ($body) { $params.Body = $body }
        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        if ($status -eq $expectedStatus) {
            if ($contains -and $r.Content -notmatch $contains) {
                Write-Host "[WARN] $name - Status OK ($status) but missing: $contains" -ForegroundColor Yellow
                $script:fail++
                $script:issues += "$name - Response missing expected content"
            } else {
                Write-Host "[PASS] $name - $status" -ForegroundColor Green
                $script:pass++
            }
        } else {
            Write-Host "[FAIL] $name - Expected $expectedStatus, got $status" -ForegroundColor Red
            $script:fail++
            $script:issues += "$name - Expected status $expectedStatus, got $status"
        }
        return $r
    } catch {
        $status = 0
        try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        if ($status -eq $expectedStatus) {
            Write-Host "[PASS] $name - $status (expected error)" -ForegroundColor Green
            $script:pass++
        } else {
            $errMsg = $_.Exception.Message
            if ($errMsg.Length -gt 80) { $errMsg = $errMsg.Substring(0, 80) + "..." }
            Write-Host "[FAIL] $name - Expected $expectedStatus, got $status | $errMsg" -ForegroundColor Red
            $script:fail++
            $script:issues += "$name - Expected $expectedStatus, got $status"
        }
        return $null
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 1: CORE API ENDPOINT TESTING" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# --- HEALTH ---
Write-Host "--- HEALTH ---" -ForegroundColor Yellow
Test-Case "Health check" "GET" "$baseUrl/health" "" 200 "ok"

# --- AUTH ---
Write-Host ""
Write-Host "--- AUTH: REGISTER ---" -ForegroundColor Yellow
$uniqueId = [guid]::NewGuid().ToString("N").Substring(0,8)
Test-Case "Register valid user" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"test_$uniqueId@test.com`",`"username`":`"user_$uniqueId`",`"password`":`"StrongPass1`",`"full_name`":`"Test User`"}" 201 ""
Test-Case "Register weak password (no uppercase)" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"a@b.com`",`"username`":`"x`",`"password`":`"nouppercase1`"}" 400 ""
Test-Case "Register weak password (too short)" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"a@b.com`",`"username`":`"x`",`"password`":`"Ab1`"}" 400 ""
Test-Case "Register invalid email" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"notemail`",`"username`":`"x`",`"password`":`"StrongPass1`"}" 400 ""
Test-Case "Register empty body" "POST" "$baseUrl/api/v1/auth/register" "{}" 400 ""
Test-Case "Register duplicate email" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"demo@devflow.ai`",`"username`":`"dup_$uniqueId`",`"password`":`"StrongPass1`"}" 400 ""
Test-Case "Register SQL injection in email" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"' OR 1=1 --`",`"username`":`"sql_$uniqueId`",`"password`":`"StrongPass1`"}" 400 ""
Test-Case "Register XSS in username" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"xss_$uniqueId@test.com`",`"username`":`"<script>alert(1)</script>`",`"password`":`"StrongPass1`"}" 400 ""

Write-Host ""
Write-Host "--- AUTH: LOGIN ---" -ForegroundColor Yellow
$loginResult = Test-Case "Login valid credentials" "POST" "$baseUrl/api/v1/auth/login" "{`"email`":`"demo@devflow.ai`",`"password`":`"demo123`"}" 200 "user"
Test-Case "Login wrong password" "POST" "$baseUrl/api/v1/auth/login" "{`"email`":`"demo@devflow.ai`",`"password`":`"wrongpass`"}" 401 ""
Test-Case "Login non-existent user" "POST" "$baseUrl/api/v1/auth/login" "{`"email`":`"nobody@test.com`",`"password`":`"StrongPass1`"}" 401 ""
Test-Case "Login empty body" "POST" "$baseUrl/api/v1/auth/login" "{}" 400 ""
Test-Case "Login SQL injection" "POST" "$baseUrl/api/v1/auth/login" "{`"email`":`"' OR '1'='1`",`"password`":`"anything`"}" 401 ""

Write-Host ""
Write-Host "--- SETTINGS ---" -ForegroundColor Yellow
Test-Case "Get settings" "GET" "$baseUrl/api/v1/settings" "" 200 "apiKey"
Test-Case "Update settings model" "POST" "$baseUrl/api/v1/settings" "{`"model`":`"openai/gpt-4o-mini`"}" 200 ""
Test-Case "Update settings invalid model" "POST" "$baseUrl/api/v1/settings" "{`"model`":`"invalid/model`"}" 400 ""

Write-Host ""
Write-Host "--- PERSONAS ---" -ForegroundColor Yellow
Test-Case "List personas" "GET" "$baseUrl/api/v1/personas" "" 200 "personas"

Write-Host ""
Write-Host "--- RULES ---" -ForegroundColor Yellow
Test-Case "List rules" "GET" "$baseUrl/api/v1/repos/repo-1/rules" "" 200 "rules"
Test-Case "Create rule" "POST" "$baseUrl/api/v1/repos/repo-1/rules" "{`"name`":`"No console.log`",`"type`":`"pattern`",`"pattern`":`"console\\\\.log`",`"severity`":`"warning`",`"message`":`"Use logger`"}" 201 ""
Test-Case "Create rule invalid" "POST" "$baseUrl/api/v1/repos/repo-1/rules" "{}" 400 ""

Write-Host ""
Write-Host "--- REVIEWS ---" -ForegroundColor Yellow
Test-Case "List reviews" "GET" "$baseUrl/api/v1/reviews/repo-1" "" 200 ""
Test-Case "Create review" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"Test review`",`"description`":`"Automated test`",`"branch_name`":`"test/branch`",`"base_branch`":`"main`"}" 201 ""

Write-Host ""
Write-Host "--- INTEGRATIONS ---" -ForegroundColor Yellow
Test-Case "List integrations (unauth)" "GET" "$baseUrl/api/v1/integrations/github" "" 401 ""

Write-Host ""
Write-Host "--- WEBHOOKS ---" -ForegroundColor Yellow
Test-Case "Webhook without signature" "POST" "$baseUrl/api/v1/webhooks/github" "{`"action`":`"opened`"}" 400 ""

Write-Host ""
Write-Host "--- QUALITY ---" -ForegroundColor Yellow
Test-Case "Get quality metrics" "GET" "$baseUrl/api/v1/analytics/quality" "" 200 "snapshots"

Write-Host ""
Write-Host "--- COSTS ---" -ForegroundColor Yellow
Test-Case "Get cost data" "GET" "$baseUrl/api/v1/analytics/costs" "" 200 "totalCost"

Write-Host ""
Write-Host "--- DEPENDENCIES ---" -ForegroundColor Yellow
Test-Case "Get impact" "GET" "$baseUrl/api/v1/repos/repo-1/impact/src" "" 200 ""

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 1 RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "============================================" -ForegroundColor Cyan
if ($issues.Count -gt 0) {
    Write-Host ""
    Write-Host "Issues found:" -ForegroundColor Red
    $issues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}
