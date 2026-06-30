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

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 3: FIX VERIFICATION + EDGE CASES" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- Login ---
$loginSession = $null
try {
    $params = @{ Uri = "$baseUrl/api/v1/auth/login"; Method = "POST"; ContentType = "application/json"; Body = "{`"email`":`"demo@devflow.ai`",`"password`":`"demo123`"}"; UseBasicParsing = $true; SessionVariable = "loginSession"; TimeoutSec = 10 }
    $r = Invoke-WebRequest @params
    Write-Host "[PASS] Login" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] Login" -ForegroundColor Red; $fail++ }

# --- Fix #1: Rate limit increased ---
Write-Host ""
Write-Host "--- FIX #1: RATE LIMIT (was 3/min, now 10/min) ---" -ForegroundColor Yellow
for ($i = 1; $i -le 5; $i++) {
    $uid = [guid]::NewGuid().ToString("N").Substring(0,6)
    Test-Case "Register attempt $i" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"rate_$uid@test.com`",`"username`":`"rate_$uid`",`"password`":`"StrongPass1`"}" 201 $null
}

# --- Fix #2: Input validation ---
Write-Host ""
Write-Host "--- FIX #2: INPUT VALIDATION ---" -ForegroundColor Yellow
Test-Case "XSS in review title (sanitized)" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"<script>alert(1)</script>`",`"description`":`"test`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 201 $loginSession
Test-Case "Empty review title" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"`",`"description`":`"test`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 400 $loginSession
Test-Case "Long review title (>200 chars)" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"$('A' * 300)`",`"description`":`"test`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 201 $loginSession
Test-Case "Long review description (>2000 chars)" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"Test`",`"description`":`"$('B' * 3000)`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 201 $loginSession
Test-Case "Username too short (<3 chars)" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"short@test.com`",`"username`":`"ab`",`"password`":`"StrongPass1`"}" 400 $null
Test-Case "Username too long (>30 chars)" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"long@test.com`",`"username`":`"$('a' * 31)`",`"password`":`"StrongPass1`"}" 400 $null
Test-Case "Username special chars" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"special@test.com`",`"username`":`"user@#$`",`"password`":`"StrongPass1`"}" 400 $null
Test-Case "Password too long (>128 chars)" "POST" "$baseUrl/api/v1/auth/register" "{`"email`":`"longpw@test.com`",`"username`":`"longpw`",`"password`":`"$('A' * 100)a1`"}" 400 $null

# --- Auth required ---
Write-Host ""
Write-Host "--- AUTH REQUIRED (401 for unauthenticated) ---" -ForegroundColor Yellow
Test-Case "Reviews create (no auth)" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"x`",`"description`":`"x`",`"branch_name`":`"x`",`"base_branch`":`"main`"}" 401 $null
Test-Case "Rules create (no auth)" "POST" "$baseUrl/api/v1/repos/repo-1/rules" "{`"name`":`"x`",`"type`":`"pattern`",`"pattern`":`"x`",`"severity`":`"info`"}" 401 $null
Test-Case "Personas create (no auth)" "POST" "$baseUrl/api/v1/personas" "{`"name`":`"x`",`"display_name`":`"X`",`"description`":`"x`",`"system_prompt`":`"x`",`"tone`":`"x`"}" 401 $null
Test-Case "Integrations (no auth)" "POST" "$baseUrl/api/v1/integrations/github" "{`"repo_owner`":`"x`",`"repo_name`":`"x`",`"access_token`":`"x`",`"webhook_secret`":`"x`"}" 401 $null

# --- CRUD operations ---
Write-Host ""
Write-Host "--- CRUD: CREATE + READ + UPDATE + DELETE ---" -ForegroundColor Yellow
$createdReview = Test-Case "Create review" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"CRUD test`",`"description`":`"Testing full CRUD`",`"branch_name`":`"test/crud`",`"base_branch`":`"main`"}" 201 $loginSession
if ($createdReview) {
    $reviewId = ($createdReview.Content | ConvertFrom-Json).id
    Write-Host "  Created review ID: $reviewId" -ForegroundColor Gray
    Test-Case "Read review" "GET" "$baseUrl/api/v1/reviews/repo-1/$reviewId" "" 200 $loginSession
    Test-Case "Update review status" "PATCH" "$baseUrl/api/v1/reviews/repo-1/$reviewId/status" "{`"status`":`"in_progress`"}" 200 $loginSession
    Test-Case "Delete review" "DELETE" "$baseUrl/api/v1/reviews/repo-1/$reviewId" "" 200 $loginSession
    Test-Case "Read deleted review (should 404)" "GET" "$baseUrl/api/v1/reviews/repo-1/$reviewId" "" 404 $loginSession
}

# --- CORS test ---
Write-Host ""
Write-Host "--- CORS ---" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/health" -Headers @{ "Origin" = "http://evil.com" } -UseBasicParsing -TimeoutSec 5
    $cors = $r.Headers["Access-Control-Allow-Origin"]
    if ($cors -eq "http://evil.com") {
        Write-Host "[VULN] CORS allows arbitrary origins" -ForegroundColor Magenta
        $vulns += "CRITICAL: CORS allows arbitrary origins"
    } else {
        Write-Host "[SAFE] CORS rejected evil origin" -ForegroundColor DarkGreen
    }
} catch {
    Write-Host "[SAFE] CORS request blocked" -ForegroundColor DarkGreen
}

# --- Cookie security ---
Write-Host ""
Write-Host "--- COOKIE SECURITY ---" -ForegroundColor Yellow
if ($loginSession) {
    $cookies = $loginSession.Cookies.GetCookies("http://localhost:5000")
    foreach ($c in $cookies) {
        $httpOnly = $c.HttpOnly
        $secure = $c.Secure
        Write-Host "  Cookie: $($c.Name) | HttpOnly: $httpOnly | Secure: $secure | SameSite: $($c.SameSite)" -ForegroundColor Gray
        if (-not $httpOnly) {
            Write-Host "[VULN] Cookie $($c.Name) not HttpOnly" -ForegroundColor Magenta
            $vulns += "CRITICAL: Cookie $($c.Name) not HttpOnly"
        }
    }
}

# --- Error message leakage ---
Write-Host ""
Write-Host "--- ERROR MESSAGE LEAKAGE ---" -ForegroundColor Yellow
try {
    $r = Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body "{`"email`":`"demo@devflow.ai`",`"password`":`"wrong`"}" -UseBasicParsing -TimeoutSec 5
} catch {
    $status = [int]$_.Exception.Response.StatusCode
    $body = $_.ErrorDetails.Message
    if ($body -match "password_hash" -or $body -match "bcrypt" -or $body -match "stack trace") {
        Write-Host "[VULN] Error message leaks sensitive info" -ForegroundColor Magenta
        $vulns += "CRITICAL: Error messages leak sensitive info"
    } else {
        Write-Host "[SAFE] Error message is generic ($status)" -ForegroundColor DarkGreen
    }
}

# --- Timing attack ---
Write-Host ""
Write-Host "--- TIMING ATTACK ---" -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try { Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body "{`"email`":`"demo@devflow.ai`",`"password`":`"wrong1`"}" -UseBasicParsing -TimeoutSec 5 } catch {}
$sw.Stop(); $t1 = $sw.ElapsedMilliseconds
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try { Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body "{`"email`":`"nonexist@test.com`",`"password`":`"wrong2`"}" -UseBasicParsing -TimeoutSec 5 } catch {}
$sw.Stop(); $t2 = $sw.ElapsedMilliseconds
$diff = [Math]::Abs($t1 - $t2)
Write-Host "  Existing user: ${t1}ms | Non-existent: ${t2}ms | Diff: ${diff}ms" -ForegroundColor Gray
if ($diff -gt 100) {
    Write-Host "[VULN] Timing difference could leak user existence" -ForegroundColor Magenta
    $vulns += "MEDIUM: Timing attack on login could leak user existence"
} else {
    Write-Host "[SAFE] Timing difference negligible" -ForegroundColor DarkGreen
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 3 RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "============================================" -ForegroundColor Cyan
if ($vulns.Count -gt 0) {
    Write-Host ""
    Write-Host "VULNERABILITIES:" -ForegroundColor Magenta
    $vulns | ForEach-Object { Write-Host "  !! $_" -ForegroundColor Magenta }
}
