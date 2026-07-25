const service = require("../services/profileDailySummaryService");
async function preview(req,res,next){try{res.json({success:true,message:"Anonymous profile-summary preview generated",data:await service.preview(req.query)});}catch(e){next(e);}}
async function generate(req,res,next){try{const data=await service.createDailySummary(req.body||{});const status=data.dryRun||data.reusedExistingPost?200:201;const message=data.dryRun?"Dry run completed":data.reusedExistingPost?"Existing daily summary returned":"Draft generated";res.status(status).json({success:true,message,data});}catch(e){next(e);}}
module.exports={preview,generate};
