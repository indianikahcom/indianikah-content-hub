const base = process.env.SMOKE_BASE_URL || "http://localhost:3000";
async function call(path, options) {
  const response = await fetch(base+path, options);
  const body = await response.json().catch(()=>({}));
  if (!response.ok) throw new Error(`${response.status}: ${JSON.stringify(body)}`);
  return body;
}
(async()=>{
  await call("/api/health");
  const preview = await call("/api/profile-summaries/daily/preview?hours=24&topLimit=5&fetchLimit=5000");
  if (!preview.success) throw new Error("Preview failed");
  const dry = await call("/api/profile-summaries/daily/generate",{
    method:"POST",headers:{"Content-Type":"application/json"},
    body:JSON.stringify({hours:24,dryRun:true,composePlatforms:true})
  });
  if (!dry.success || dry.data?.variants?.length !== 6) throw new Error("Dry run/variants failed");
  console.log("Milestone 4 v2 smoke test passed.", {
    totalProfiles: dry.data.statistics.totalProfiles,
    variantCount: dry.data.variants.length
  });
})().catch(e=>{console.error(e);process.exit(1);});
