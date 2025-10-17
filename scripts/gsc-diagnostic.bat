@echo off
:: GSC Diagnostic Command Runner
:: Systematic validation and debugging for GSC Coverage errors

setlocal enabledelayedexpansion
echo.
echo ===============================================================================
echo                        GSC DIAGNOSTIC WORKFLOW
echo                    Systematic Debugging & Validation
echo ===============================================================================
echo.

:: Check current directory
cd /d "C:\Users\Renaud Gagne\Desktop\HustleGPT\PickAFarm"

:: Create necessary directories
if not exist docs\gsc\exports mkdir docs\gsc\exports
if not exist docs\gsc\fixes mkdir docs\gsc\fixes
if not exist docs\gsc\diagnostics mkdir docs\gsc\diagnostics

:: Check command argument
if "%1"=="" goto :menu
if /i "%1"=="phase1" goto :phase1
if /i "%1"=="phase2" goto :phase2
if /i "%1"=="phase3" goto :phase3
if /i "%1"=="phase4" goto :phase4
if /i "%1"=="analyze" goto :analyze
if /i "%1"=="validate" goto :validate
if /i "%1"=="test" goto :test
if /i "%1"=="help" goto :help
goto :menu

:menu
echo Select a diagnostic phase:
echo.
echo   [1] Phase 1: Data Collection ^& Initial Analysis
echo   [2] Phase 2: Root Cause Identification
echo   [3] Phase 3: Fix Implementation
echo   [4] Phase 4: Validation ^& Monitoring
echo.
echo   [A] Run Enhanced Analyzer (requires GSC exports)
echo   [V] Validate Existing Redirects
echo   [T] Test Specific URL Patterns
echo   [H] Help ^& Documentation
echo   [Q] Quit
echo.
set /p choice="Enter your choice: "

if /i "%choice%"=="1" goto :phase1
if /i "%choice%"=="2" goto :phase2
if /i "%choice%"=="3" goto :phase3
if /i "%choice%"=="4" goto :phase4
if /i "%choice%"=="a" goto :analyze
if /i "%choice%"=="v" goto :validate
if /i "%choice%"=="t" goto :test
if /i "%choice%"=="h" goto :help
if /i "%choice%"=="q" goto :end
goto :menu

:phase1
echo.
echo ===============================================================================
echo                           PHASE 1: DATA COLLECTION
echo ===============================================================================
echo.
echo Step 1: Check for GSC export files...
echo.

set missing_files=0

if not exist docs\gsc\exports\404-errors.csv (
    echo   [!] Missing: 404-errors.csv
    set missing_files=1
) else (
    echo   [✓] Found: 404-errors.csv
)

if not exist docs\gsc\exports\redirect-issues.csv (
    echo   [!] Missing: redirect-issues.csv
    set missing_files=1
) else (
    echo   [✓] Found: redirect-issues.csv
)

if not exist docs\gsc\exports\noindex-issues.csv (
    echo   [?] Optional: noindex-issues.csv (not found)
) else (
    echo   [✓] Found: noindex-issues.csv
)

echo.

if %missing_files%==1 (
    echo ACTION REQUIRED:
    echo ----------------
    echo 1. Go to Google Search Console: https://search.google.com/search-console
    echo 2. Navigate to "Indexing" → "Pages"
    echo 3. Click on "Not found (404)" → Export → Download CSV
    echo 4. Save as: docs\gsc\exports\404-errors.csv
    echo 5. Click on "Page with redirect" → Export → Download CSV
    echo 6. Save as: docs\gsc\exports\redirect-issues.csv
    echo 7. If available, export "Excluded by 'noindex' tag" as noindex-issues.csv
    echo.
    echo After exporting, run this script again.
    pause
    goto :menu
)

echo Step 2: Running Enhanced Analyzer...
echo ----------------------------------------
node scripts\gsc-enhanced-analyzer.js

if errorlevel 1 (
    echo.
    echo [!] Analyzer failed. Check error messages above.
    pause
    goto :menu
)

echo.
echo Step 3: Validating Existing Redirects...
echo ----------------------------------------
node scripts\gsc-redirect-validator.js

if errorlevel 1 (
    echo.
    echo [!] Validator failed. Check error messages above.
    pause
    goto :menu
)

echo.
echo Phase 1 Complete!
echo.
echo Generated Files:
echo   - docs\gsc\fixes\analysis-report.json
echo   - docs\gsc\fixes\redirects-to-add.js
echo   - docs\gsc\fixes\robots-additions.txt
echo   - docs\gsc\redirect-validation-report.json
echo.
pause
goto :menu

:phase2
echo.
echo ===============================================================================
echo                      PHASE 2: ROOT CAUSE IDENTIFICATION
echo ===============================================================================
echo.
echo Analyzing why existing redirects aren't working...
echo.

:: Check if Phase 1 has been run
if not exist docs\gsc\redirect-validation-report.json (
    echo [!] Please run Phase 1 first to generate diagnostic data.
    pause
    goto :menu
)

echo Step 1: Checking Next.js Configuration...
echo ----------------------------------------

:: Create a test script to verify next.config.js patterns
echo const fs = require('fs'); > temp_test_redirects.js
echo const path = require('path'); >> temp_test_redirects.js
echo. >> temp_test_redirects.js
echo // Load validation report >> temp_test_redirects.js
echo const report = JSON.parse(fs.readFileSync('docs/gsc/redirect-validation-report.json', 'utf-8')); >> temp_test_redirects.js
echo. >> temp_test_redirects.js
echo console.log('Unmatched URL samples that should be caught by existing patterns:'); >> temp_test_redirects.js
echo console.log('---------------------------------------------------------------'); >> temp_test_redirects.js
echo. >> temp_test_redirects.js
echo // Test patterns that should work >> temp_test_redirects.js
echo const testPatterns = [ >> temp_test_redirects.js
echo   { pattern: /\/all-farms-near\/near\//, name: 'Legacy routes (Pattern 0)' }, >> temp_test_redirects.js
echo   { pattern: /-(al^|fl^|tx^|ny^|ca^|mi^|oh^|pa)-canada/, name: 'US as Canada (Pattern 1)' }, >> temp_test_redirects.js
echo   { pattern: /-california-^|-texas-^|-florida-/, name: 'Full state names (Pattern 2)' } >> temp_test_redirects.js
echo ]; >> temp_test_redirects.js
echo. >> temp_test_redirects.js
echo report.unmatchedSamples.forEach(url =^> { >> temp_test_redirects.js
echo   testPatterns.forEach(test =^> { >> temp_test_redirects.js
echo     if (test.pattern.test(url)) { >> temp_test_redirects.js
echo       console.log(`${test.name}: ${url}`); >> temp_test_redirects.js
echo     } >> temp_test_redirects.js
echo   }); >> temp_test_redirects.js
echo }); >> temp_test_redirects.js

node temp_test_redirects.js
del temp_test_redirects.js

echo.
echo Step 2: Common Issues Found...
echo ----------------------------------------
echo.
echo Potential problems with existing redirects:
echo.
echo 1. REGEX ESCAPING: Special characters in patterns may not be escaped properly
echo 2. ORDER MATTERS: More specific patterns must come before general ones
echo 3. TRAILING SLASH: Even with trailingSlash:true, some patterns might conflict
echo 4. QUERY STRINGS: Patterns don't match URLs with query parameters
echo 5. CASE SENSITIVITY: Some patterns might be case-sensitive
echo.
echo Step 3: Generating Debug Tests...
echo ----------------------------------------

:: Create specific test cases
echo Creating targeted test file: docs\gsc\diagnostics\test-urls.txt
echo.

type docs\gsc\fixes\analysis-report.json | findstr /C:"samples" > temp_samples.txt

echo Test URLs have been extracted to diagnostics folder.
echo.
echo Next Actions:
echo -------------
echo 1. Review docs\gsc\fixes\analysis-report.json for pattern breakdown
echo 2. Check if Pattern 0-8 in next.config.js are in correct order
echo 3. Test individual patterns with sample URLs
echo 4. Consider if new patterns are needed for uncaught cases
echo.
pause
goto :menu

:phase3
echo.
echo ===============================================================================
echo                       PHASE 3: FIX IMPLEMENTATION
echo ===============================================================================
echo.
echo Implementing validated fixes...
echo.

if not exist docs\gsc\fixes\redirects-to-add.js (
    echo [!] No fix files found. Please run Phase 1 first.
    pause
    goto :menu
)

echo Current fixes available:
echo ------------------------
echo.
type docs\gsc\fixes\redirects-to-add.js | findstr /C:"source:" /C:"comment"
echo.

echo Manual Steps Required:
echo ----------------------
echo.
echo 1. REDIRECTS:
echo    - Open web\next.config.js
echo    - Review existing redirects (Pattern 0-8)
echo    - Add new patterns from docs\gsc\fixes\redirects-to-add.js
echo    - Ensure patterns are in correct order (specific → general)
echo.
echo 2. ROBOTS.TXT:
echo    - Open web\public\robots.txt
echo    - Add exclusions from docs\gsc\fixes\robots-additions.txt
echo    - Verify Disallow paths are correct
echo.
echo 3. BUILD & TEST:
echo    - Run: cd web ^&^& npm run build
echo    - Check for redirect warnings in build output
echo    - Test sample URLs locally
echo.
echo 4. DEPLOY:
echo    - Commit changes to Git
echo    - Push to trigger deployment
echo    - Wait for Cloudflare Pages to build
echo.
pause
goto :menu

:phase4
echo.
echo ===============================================================================
echo                     PHASE 4: VALIDATION & MONITORING
echo ===============================================================================
echo.
echo Setting up ongoing monitoring...
echo.

echo Step 1: Validate Fix in GSC
echo ----------------------------
echo.
echo 1. Go to GSC URL Inspection tool
echo 2. Test a few fixed URLs:
echo    - Enter old URL (404 error)
echo    - Click "Test Live URL"
echo    - Should show redirect to new URL
echo.
echo 3. Request validation for error groups:
echo    - Go to Coverage report
echo    - Click on error type
echo    - Click "Validate Fix"
echo.

echo Step 2: Set up monitoring schedule
echo -----------------------------------
echo.
echo Creating scheduled task for monitoring...

:: Create monitoring schedule batch file
echo @echo off > docs\gsc\monitor-schedule.bat
echo :: GSC Monitoring Schedule >> docs\gsc\monitor-schedule.bat
echo cd /d "C:\Users\Renaud Gagne\Desktop\HustleGPT\PickAFarm" >> docs\gsc\monitor-schedule.bat
echo. >> docs\gsc\monitor-schedule.bat
echo echo Running GSC monitoring... >> docs\gsc\monitor-schedule.bat
echo node scripts\gsc-monitor.js >> docs\gsc\monitor-schedule.bat
echo node scripts\gsc-coverage-monitor.js >> docs\gsc\monitor-schedule.bat
echo node scripts\gsc-unified-dashboard.js >> docs\gsc\monitor-schedule.bat
echo. >> docs\gsc\monitor-schedule.bat
echo echo Monitoring complete. Check docs\gsc\unified-dashboard.html >> docs\gsc\monitor-schedule.bat

echo.
echo Monitoring schedule created: docs\gsc\monitor-schedule.bat
echo.
echo Run this every 3 days to track progress.
echo.
pause
goto :menu

:analyze
echo.
echo Running Enhanced Analyzer...
echo ============================
node scripts\gsc-enhanced-analyzer.js
pause
goto :menu

:validate
echo.
echo Validating Existing Redirects...
echo =================================
node scripts\gsc-redirect-validator.js
pause
goto :menu

:test
echo.
echo Test Specific URL Pattern
echo ==========================
echo.
set /p testurl="Enter URL to test (e.g., /all-farms-near/near/toronto-on-canada/): "

:: Create temporary test script
echo const url = '%testurl%'; > temp_test_single.js
echo console.log('Testing URL:', url); >> temp_test_single.js
echo console.log(''); >> temp_test_single.js
echo. >> temp_test_single.js
echo // Test patterns >> temp_test_single.js
echo const patterns = [ >> temp_test_single.js
echo   { name: 'Legacy route', regex: /\/all-farms-near\/near\// }, >> temp_test_single.js
echo   { name: 'US as Canada', regex: /-(al^|fl^|tx^|ny)-canada\// }, >> temp_test_single.js
echo   { name: 'Full state', regex: /-california-^|-texas-^|-florida-/ }, >> temp_test_single.js
echo   { name: 'Missing slash', regex: /[^^\/]$/ ^&^& !url.includes('.') } >> temp_test_single.js
echo ]; >> temp_test_single.js
echo. >> temp_test_single.js
echo patterns.forEach(p =^> { >> temp_test_single.js
echo   if (typeof p.regex === 'boolean' ? p.regex : p.regex.test(url)) { >> temp_test_single.js
echo     console.log(`[MATCH] ${p.name}`); >> temp_test_single.js
echo   } else { >> temp_test_single.js
echo     console.log(`[MISS]  ${p.name}`); >> temp_test_single.js
echo   } >> temp_test_single.js
echo }); >> temp_test_single.js

node temp_test_single.js
del temp_test_single.js

echo.
pause
goto :menu

:help
echo.
echo ===============================================================================
echo                              HELP & DOCUMENTATION
echo ===============================================================================
echo.
echo WORKFLOW OVERVIEW:
echo ------------------
echo This diagnostic tool helps systematically debug GSC Coverage errors.
echo.
echo PHASES:
echo -------
echo Phase 1: Export GSC data and run initial analysis
echo Phase 2: Identify why existing redirects aren't working
echo Phase 3: Implement validated fixes
echo Phase 4: Set up monitoring and validation
echo.
echo KEY SCRIPTS:
echo ------------
echo - gsc-enhanced-analyzer.js   : Analyzes GSC export patterns
echo - gsc-redirect-validator.js  : Tests URLs against redirect patterns
echo - gsc-monitor.js            : Monitors performance issues
echo - gsc-coverage-monitor.js   : Tracks coverage errors
echo - gsc-unified-dashboard.js  : Generates visual dashboard
echo.
echo COMMON ISSUES:
echo --------------
echo 1. Redirects exist but don't work:
echo    - Check pattern order in next.config.js
echo    - Verify regex escaping
echo    - Test with exact URLs from GSC
echo.
echo 2. High 404 count:
echo    - Legacy routes not redirecting
echo    - Missing trailing slashes
echo    - Wrong country codes
echo.
echo 3. Crawl budget waste:
echo    - Private routes not in robots.txt
echo    - Query parameters causing duplicates
echo    - Redirect chains
echo.
echo FILES & LOCATIONS:
echo ------------------
echo Exports:    docs\gsc\exports\*.csv
echo Fixes:      docs\gsc\fixes\*
echo Reports:    docs\gsc\*.json
echo Dashboard:  docs\gsc\unified-dashboard.html
echo.
pause
goto :menu

:end
echo.
echo Diagnostic workflow ended.
echo Check docs\gsc\ for all generated reports and fixes.
endlocal
exit /b