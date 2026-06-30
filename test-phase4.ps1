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
            Write-Host "[PASS] $name" -ForegroundColor Green
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
            Write-Host "[PASS] $name" -ForegroundColor Green
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
Write-Host "  PHASE 4: COMPREHENSIVE E2E TESTING" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- Login ---
$loginSession = $null
try {
    $params = @{ Uri = "$baseUrl/api/v1/auth/login"; Method = "POST"; ContentType = "application/json"; Body = "{`"email`":`"demo@devflow.ai`",`"password`":`"demo123`"}"; UseBasicParsing = $true; SessionVariable = "loginSession"; TimeoutSec = 10 }
    $r = Invoke-WebRequest @params
    Write-Host "[PASS] Login" -ForegroundColor Green; $pass++
} catch { Write-Host "[FAIL] Login" -ForegroundColor Red; $fail++ }

# --- Fix #3: Timing attack ---
Write-Host ""
Write-Host "--- FIX #3: TIMING ATTACK VERIFICATION ---" -ForegroundColor Yellow
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try { Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body "{`"email`":`"demo@devflow.ai`",`"password`":`"wrong1`"}" -UseBasicParsing -TimeoutSec 5 } catch {}
$sw.Stop(); $t1 = $sw.ElapsedMilliseconds
$sw = [System.Diagnostics.Stopwatch]::StartNew()
try { Invoke-WebRequest -Uri "$baseUrl/api/v1/auth/login" -Method POST -ContentType "application/json" -Body "{`"email`":`"nonexist@test.com`",`"password`":`"wrong2`"}" -UseBasicParsing -TimeoutSec 5 } catch {}
$sw.Stop(); $t2 = $sw.ElapsedMilliseconds
$diff = [Math]::Abs($t1 - $t2)
Write-Host "  Existing user: ${t1}ms | Non-existent: ${t2}ms | Diff: ${diff}ms" -ForegroundColor Gray
if ($diff -lt 50) {
    Write-Host "[SAFE] Timing attack mitigated" -ForegroundColor DarkGreen
} else {
    Write-Host "[WARN] Timing difference: ${diff}ms (may need further mitigation)" -ForegroundColor Yellow
}

# --- Review status fix ---
Write-Host ""
Write-Host "--- FIX #3: REVIEW STATUS ---" -ForegroundColor Yellow
$cr = Test-Case "Create review for status test" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"Status test`",`"description`":`"test`",`"branch_name`":`"test/status`",`"base_branch`":`"main`"}" 201 $loginSession
if ($cr) {
    $rid = ($cr.Content | ConvertFrom-Json).id
    Test-Case "Status: open -> in_progress" "PATCH" "$baseUrl/api/v1/reviews/repo-1/$rid/status" "{`"status`":`"in_progress`"}" 200 $loginSession
    Test-Case "Status: in_progress -> approved" "PATCH" "$baseUrl/api/v1/reviews/repo-1/$rid/status" "{`"status`":`"approved`"}" 200 $loginSession
    Test-Case "Status: invalid status" "PATCH" "$baseUrl/api/v1/reviews/repo-1/$rid/status" "{`"status`":`"invalid`"}" 400 $loginSession
}

# --- Full workflow ---
Write-Host ""
Write-Host "--- FULL WORKFLOW: CREATE -> ANALYZE -> COMMENT -> RESOLVE ---" -ForegroundColor Yellow
$wr = Test-Case "1. Create review" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"Workflow test`",`"description`":`"Full E2E test`",`"branch_name`":`"test/workflow`",`"base_branch`":`"main`"}" 201 $loginSession
if ($wr) {
    $wrid = ($wr.Content | ConvertFrom-Json).id
    Write-Host "  Review ID: $wrid" -ForegroundColor Gray
    
    # Analyze
    $ar = Test-Case "2. Analyze review" "POST" "$baseUrl/api/v1/$wrid/analyze" "" 200 $loginSession
    
    # Get issues
    $ir = Test-Case "3. Get issues" "GET" "$baseUrl/api/v1/$wrid/issues" "" 200 $loginSession
    
    # Add comment
    $commentBody = "{`"content`":`"This looks good, but consider adding error handling`",`"file_path`":`"src/index.ts`",`"line_number`":42}"
    $commentResult = Test-Case "4. Add comment" "POST" "$baseUrl/api/v1/$wrid/comments" $commentBody 201 $loginSession
    
    # Get comments
    Test-Case "5. Get comments" "GET" "$baseUrl/api/v1/$wrid/comments" "" 200 $loginSession
    
    # Approve
    Test-Case "6. Approve review" "PATCH" "$baseUrl/api/v1/reviews/repo-1/$wrid/status" "{`"status`":`"approved`"}" 200 $loginSession
}

# --- Edge cases ---
Write-Host ""
Write-Host "--- EDGE CASES ---" -ForegroundColor Yellow
Test-Case "Get non-existent review" "GET" "$baseUrl/api/v1/reviews/repo-1/non-existent-id" "" 404 $loginSession
Test-Case "Delete non-existent review" "DELETE" "$baseUrl/api/v1/reviews/repo-1/non-existent-id" "" 404 $loginSession
Test-Case "Empty JSON body" "POST" "$baseUrl/api/v1/reviews/repo-1" "" 400 $loginSession
Test-Case "Invalid JSON" "POST" "$baseUrl/api/v1/reviews/repo-1" "not json" 400 $loginSession
Test-Case "SQL injection in query param" "GET" "$baseUrl/api/v1/reviews/repo-1?status='; DROP TABLE reviews; --" "" 200 $loginSession
Test-Case "Unicode in review title" "POST" "$baseUrl/api/v1/reviews/repo-1" "{`"title`":`"Test \u00e9\u00e8\u00ea`",`"description`":`"unicode test`",`"branch_name`":`"test/unicode`",`"base_branch`":`"main`"}" 201 $loginSession

# --- Settings security ---
Write-Host ""
Write-Host "--- SETTINGS SECURITY ---" -ForegroundColor Yellow
Test-Case "Get settings" "GET" "$baseUrl/api/v1/settings" "" 200 $loginSession
Test-Case "Update valid model" "POST" "$baseUrl/api/v1/settings" "{`"model`":`"openai/gpt-4o-mini`"}" 200 $loginSession
Test-Case "Update invalid model" "POST" "$baseUrl/api/v1/settings" "{`"model`":`"invalid/model`"}" 400 $loginSession
Test-Case "Update with SQL injection" "POST" "$baseUrl/api/v1/settings" "{`"model`":`"'; DROP TABLE settings; --`"}" 400 $loginSession

# --- Notification endpoints ---
Write-Host ""
Write-Host "--- NOTIFICATIONS ---" -ForegroundColor Yellow
Test-Case "Get notifications" "GET" "$baseUrl/api/v1/notifications" "" 200 $loginSession

# --- Analytics ---
Write-Host ""
Write-Host "--- ANALYTICS ---" -ForegroundColor Yellow
Test-Case "Team analytics" "GET" "$baseUrl/api/v1/analytics/team/team-1" "" 200 $loginSession
Test-Case "Developer analytics" "GET" "$baseUrl/api/v1/analytics/developer/user-1" "" 200 $loginSession

# --- Sessions ---
Write-Host ""
Write-Host "--- SESSIONS ---" -ForegroundColor Yellow
Test-Case "Create session" "POST" "$baseUrl/api/v1/sessions" "{`"title`":`"Pair session`",`"description`":`"Test`"}" 201 $loginSession
Test-Case "List sessions" "GET" "$baseUrl/api/v1/sessions" "" 200 $loginSession

# --- Repositories ---
Write-Host ""
Write-Host "--- REPOSITORIES ---" -ForegroundColor Yellow
Test-Case "Create repository" "POST" "$baseUrl/api/v1/repositories" "{`"name`":`"test-repo`",`"primary_language`":`"TypeScript`"}" 201 $loginSession
Test-Case "List repositories" "GET" "$baseUrl/api/v1/repositories" "" 200 $loginSession

# --- Webhook without body ---
Write-Host ""
Write-Host "--- WEBHOOKS ---" -ForegroundColor Yellow
Test-Case "Webhook empty body" "POST" "$baseUrl/api/v1/webhooks/github" "" 400 $null
Test-Case "Webhook invalid JSON" "POST" "$baseUrl/api/v1/webhooks/github" "invalid" 400 $null

# --- Static files ---
Write-Host ""
Write-Host "--- STATIC/UNKNOWN ROUTES ---" -ForegroundColor Yellow
Test-Case "Unknown route" "GET" "$baseUrl/api/v1/nonexistent" "" 404 $null
Test-Case "Root path" "GET" "$baseUrl/" "" 404 $null

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  PHASE 4 RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Red" })
Write-Host "============================================" -ForegroundColor Cyan
if ($vulns.Count -gt 0) {
    Write-Host ""
    Write-Host "VULNERABILITIES:" -ForegroundColor Magenta
    $vulns | ForEach-Object { Write-Host "  !! $_" -ForegroundColor Magenta }
}
