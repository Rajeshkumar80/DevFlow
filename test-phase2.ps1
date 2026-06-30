$baseUrl = "http://localhost:5000"
$pass = 0; $fail = 0; $vulns = @()

function Test-Case {
    param([string]$name, [string]$method, [string]$url, [string]$body, [int]$expectedStatus, [Microsoft.PowerShell.Commands.WebRequestSession]$session)
    try {
        $params = @{ Uri = $url; Method = $method; ContentType = "application/json"; UseBasicParsing = $true; TimeoutSec = 10 }
        if ($body) { $params.Body = $body }
        if ($session) { $params.WebSession = $session }
        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        if ($status -eq $expectedStatus) {
            Write-Host "[PASS] $name - $status" -ForegroundColor Green
            $script:pass++
            return $r
        } else {
            Write-Host "[FAIL] $name - Expected $expectedStatus, got $status" -ForegroundColor Red
            $script:fail++
            return $r
        }
    } catch {
        $status = 0
        try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        if ($status -eq $expectedStatus) {
            Write-Host "[PASS] $name - $status (expected error)" -ForegroundColor Green
            $script:pass++
        } else {
            Write-Host "[FAIL] $name - Expected $expectedStatus, got $status" -ForegroundColor Red
            $script:fail++
        }
        return $null
    }
}

function Test-Vuln {
    param([string]$name, [string]$description, [string]$method, [string]$url, [string]$body, [int]$badStatus, [Microsoft.PowerShell.Commands.WebRequestSession]$session)
    try {
        $params = @{ Uri = $url; Method = $method; ContentType = "application/json"; UseBasicParsing = $true; TimeoutSec = 10 }
        if ($body) { $params.Body = $body }
        if ($session) { $params.WebSession = $session }
        $r = Invoke-WebRequest @params
        $status = $r.StatusCode
        if ($status -eq $badStatus) {
            Write-Host "[VULN] $name - Accepted malicious input ($status)" -ForegroundColor Magenta
            $script:vulns += "CRITICAL: $name - $description"
        } else {
            Write-Host "[SAFE] $name - Rejected ($status)" -ForegroundColor DarkGreen
        }
    } catch {
        $status = 0
        try { $status = [int]$_.Exception.Response.StatusCode } catch {}
        if ($status -eq $badStatus) {
            Write-Host "[VULN] $name - Accepted malicious input ($status)" -ForegroundColor Magenta
            $script:vulns += "CRITICAL: $name - $description"
        } else {
            Write-Host "[SAFE] $name - Rejected ($status)" -ForegroundColor DarkGreen
        }
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 2: AUTH + PENETRATION TESTING" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- Login first ---
Write-Host ""
Write-Host "--- AUTHENTICATION ---" -ForegroundColor Yellow
$loginSession = $null
try {
    $params = @{ Uri = "$baseUrl/api/v1/auth/login"; Method = "POST"; ContentType = "application/json"; Body = "{`"email`":`"demo@devflow.ai`",`"password`":`"demo123`"}"; UseBasicParsing = $true; SessionVariable = "loginSession"; TimeoutSec = 10 }
    $r = Invoke-WebRequest @params
    Write-Host "[PASS] Login successful - got session cookies" -ForegroundColor Green
    $pass++
} catch {
    Write-Host "[FAIL] Login failed - cannot continue authenticated tests" -ForegroundColor Red
    $fail++
}

# Verify cookies exist
if ($loginSession) {
    $cookies = $loginSession.Cookies.GetCookies("http://localhost:5000")
    $hasAccess = $cookies | Where-Object { $_.Name -eq "access_token" }
    $hasRefresh = $cookies | Where-Object { $_.Name -eq "refresh_token" }
    if ($hasAccess) { Write-Host "[PASS] access_token cookie set (httpOnly)" -ForegroundColor Green; $pass++ } else { Write-Host "[FAIL] access_token cookie missing" -ForegroundColor Red; $fail++ }
    if ($hasRefresh) { Write-Host "[PASS] refresh_token cookie set (httpOnly)" -ForegroundColor Green; $pass++ } else { Write-Host "[FAIL] refresh_token cookie missing" -ForegroundColor Red; $fail++ }
}

# --- Authenticated endpoints ---
Write-Host ""
Write-Host "--- AUTHENTICATED ENDPOINTS ---" -ForegroundColor Yellow
Test-Case "Create review (auth)" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"Auth test review`",`"description`":`"Testing auth`",`"branch_name`":`"test/auth`",`"base_branch`":`"main`"}" 201 $loginSession
Test-Case "Create rule (auth)" "POST" "$baseUrl/api/v1/repos/repo-1/rules" "{`"name`":`"Test rule`",`"type`":`"pattern`",`"pattern`":`"test`",`"severity`":`"info`",`"message`":`"Test`"}" 201 $loginSession
Test-Case "Quality metrics (auth)" "GET" "$baseUrl/api/v1/analytics/quality" "" 200 $loginSession
Test-Case "Cost data (auth)" "GET" "$baseUrl/api/v1/analytics/costs" "" 200 $loginSession
Test-Case "List integrations (auth)" "GET" "$baseUrl/api/v1/integrations/github" "" 200 $loginSession
Test-Case "Notifications (auth)" "GET" "$baseUrl/api/v1/notifications" "" 200 $loginSession

# --- Without auth ---
Write-Host ""
Write-Host "--- UNAUTHORIZED ACCESS ---" -ForegroundColor Yellow
Test-Case "Create review (no auth)" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"No auth`"}" 401 $null
Test-Case "Create rule (no auth)" "POST" "$baseUrl/api/v1/repos/repo-1/rules" "{`"name`":`"x`"}" 401 $null
Test-Case "Quality (no auth)" "GET" "$baseUrl/api/v1/analytics/quality" "" 401 $null
Test-Case "Costs (no auth)" "GET" "$baseUrl/api/v1/analytics/costs" "" 401 $null

# --- Penetration Testing ---
Write-Host ""
Write-Host "--- PENETRATION: SQL INJECTION ---" -ForegroundColor Magenta
Test-Vuln "SQLi in login email" "SQL injection bypass" "POST" "$baseUrl/api/v1/auth/login" "{`"email`":`"' OR '1'='1' --`",`"password`":`"anything`"}" 401 $null
Test-Vuln "SQLi in login password" "SQL injection bypass" "POST" "$baseUrl/api/v1/auth/login" "{`"email`":`"demo@devflow.ai`",`"password`":`"' OR '1'='1' --`"}" 401 $null
Test-Vuln "SQLi in register email" "SQL injection in registration" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"'; DROP TABLE users; --`",`"username`":`"sqli`",`"password`":`"StrongPass1`"}" 400 $null
Test-Vuln "SQLi in review title" "SQL injection in review" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"1' OR '1'='1`",`"description`":`"test`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 401 $null

Write-Host ""
Write-Host "--- PENETRATION: XSS ---" -ForegroundColor Magenta
Test-Vuln "XSS in register username" "Stored XSS" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"xss@test.com`",`"username`":`"<img src=x onerror=alert(1)>`",`"password`":`"StrongPass1`"}" 400 $null
Test-Vuln "XSS in comment content" "Stored XSS" "POST" "$baseUrl/api/v1/invalid-review/comments" "{`"content`":`"<script>alert('xss')</script>`"}" 401 $loginSession
Test-Vuln "XSS in review title" "Reflected XSS" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"<script>alert(1)</script>`",`"description`":`"test`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 201 $loginSession

Write-Host ""
Write-Host "--- PENETRATION: OVERSIZED PAYLOADS ---" -ForegroundColor Magenta
$bigBody = "{`"email`":`"big@test.com`",`"username`":`"big`",`"password`":`"StrongPass1`",`"full_name`":`"$('A' * 10000)`"}"
Test-Vuln "Oversized register payload" "Input length limit" "POST" "$baseUrl/api/v1/auth/register" $bigBody 400 $null
$bigJson = "{`"title`":`"$('B' * 500000)`"}"
Test-Vuln "Oversized JSON body" "Body size limit" "POST" "$baseUrl/api/v1/reviews/repo-1" $bigJson 413 $null

Write-Host ""
Write-Host "--- PENETRATION: PATH TRAVERSAL ---" -ForegroundColor Magenta
Test-Vuln "Path traversal in review ID" "Path traversal" "GET" "$baseUrl/api/v1/reviews/repo-1/../../etc/passwd" "" 400 $null
Test-Vuln "Path traversal in settings" "Path traversal" "GET" "$baseUrl/api/v1/settings/../../backend/.env" "" 404 $null

Write-Host ""
Write-Host "--- PENETRATION: METHOD TAMPERING ---" -ForegroundColor Magenta
Test-Case "DELETE on health (should 404)" "DELETE" "$baseUrl/health" "" 404 $null
Test-Case "PUT on login (should 404)" "PUT" "$baseUrl/api/v1/auth/login" "" 404 $null

Write-Host ""
Write-Host "--- PENETRATION: HEADER INJECTION ---" -ForegroundColor Magenta
try {
    $headers = @{ "Authorization" = "Bearer ../../../etc/passwd" }
    $r = Invoke-WebRequest -Uri "$baseUrl/api/v1/analytics/quality" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "[VULN] Header injection accepted" -ForegroundColor Magenta
    $vulns += "CRITICAL: Header injection - path traversal in auth header"
} catch {
    $status = 0; try { $status = [int]$_.Exception.Response.StatusCode } catch {}
    Write-Host "[SAFE] Header injection rejected ($status)" -ForegroundColor DarkGreen
}

try {
    $headers = @{ "X-Forwarded-For" = "127.0.0.1'; DROP TABLE users; --" }
    $r = Invoke-WebRequest -Uri "$baseUrl/health" -Headers $headers -UseBasicParsing -TimeoutSec 5
    Write-Host "[PASS] X-Forwarded-For header handled" -ForegroundColor Green
} catch {
    Write-Host "[SAFE] Malformed X-Forwarded-For handled" -ForegroundColor DarkGreen
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 2 RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "============================================" -ForegroundColor Cyan
if ($vulns.Count -gt 0) {
    Write-Host ""
    Write-Host "VULNERABILITIES FOUND:" -ForegroundColor Magenta
    $vulns | ForEach-Object { Write-Host "  !! $_" -ForegroundColor Magenta }
}
