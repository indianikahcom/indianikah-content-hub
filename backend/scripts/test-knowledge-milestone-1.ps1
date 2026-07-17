$ErrorActionPreference = "Stop"
$base = "http://localhost:3000/api/knowledge"

Write-Host "1. Creating knowledge item..."
$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$created = Invoke-RestMethod `
  -Uri $base `
  -Method Post `
  -ContentType "application/json" `
  -Body (@{
    type = "MARRIAGE_TIP"
    title = "Milestone 1 test $stamp"
    content = "A production-quality Knowledge Base test item."
    summary = "Milestone test"
    language = "en"
    category = "Marriage"
    subcategory = "Communication"
    tags = @("marriage", "communication", "test")
    metadata = @{
      test = $true
      generatedBy = "milestone-1-smoke-test"
    }
    references = @()
  } | ConvertTo-Json -Depth 10)

$id = $created.data.id
Write-Host "Created id: $id"

Write-Host "2. Reading item..."
Invoke-RestMethod -Uri "$base/$id" -Method Get | ConvertTo-Json -Depth 10

Write-Host "3. Listing filtered items..."
Invoke-RestMethod `
  -Uri "$base?type=MARRIAGE_TIP&status=DRAFT&tag=communication&page=1&limit=20" `
  -Method Get | ConvertTo-Json -Depth 10

Write-Host "4. Updating item..."
Invoke-RestMethod `
  -Uri "$base/$id" `
  -Method Patch `
  -ContentType "application/json" `
  -Body (@{
    summary = "Updated milestone test summary"
  } | ConvertTo-Json) | ConvertTo-Json -Depth 10

Write-Host "5. Submitting for approval..."
Invoke-RestMethod `
  -Uri "$base/$id/status" `
  -Method Patch `
  -ContentType "application/json" `
  -Body (@{
    status = "PENDING_APPROVAL"
    reason = "Milestone 1 smoke test"
  } | ConvertTo-Json) | ConvertTo-Json -Depth 10

Write-Host "6. Approving..."
Invoke-RestMethod `
  -Uri "$base/$id/status" `
  -Method Patch `
  -ContentType "application/json" `
  -Body (@{
    status = "APPROVED"
    reason = "Smoke test approval"
  } | ConvertTo-Json) | ConvertTo-Json -Depth 10

Write-Host "7. Reading statistics..."
Invoke-RestMethod -Uri "$base/statistics" -Method Get | ConvertTo-Json -Depth 10

Write-Host ""
Write-Host "Milestone 1 smoke test completed successfully."
Write-Host "Test item remains APPROVED with id $id."
