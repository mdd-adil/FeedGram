
const postModel=require("../models/postModel");

const finder=async (req,res)=>{
const posts=await postModel.find().sort({timestamp:1});
if(!posts)return res.status(401).send("posts not Found");
res.status(200).send(posts)
}
module.exports=finder;