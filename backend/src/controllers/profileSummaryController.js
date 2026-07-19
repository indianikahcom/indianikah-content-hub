const service = require("../services/profileDailySummaryService");
async function preview(req,res,next){try{res.json({success:true,message:"Anonymous profile-summary preview generated",data:await service.preview(req.query)});}catch(e){next(e);}}
async function generate(req,res,next){try{const data=await service.createDailySummary(req.body||{});res.status(data.dryRun?200:201).json({success:true,message:data.dryRun?"Dry run completed":"Draft generated",data});}catch(e){next(e);}}
module.exports={preview,generate};
