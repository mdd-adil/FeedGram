const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const isLoggedIn=(req,res,next)=>{
    const token=req.cookies.token || req.header('Authorization')?.replace('Bearer ','');
    if(!token){
res.status(401).send({message:'Access denied. No token provided.'});
        return false;
    }
    try{
        const decoded=jwt.verify(token,process.env.SECRET);
        req.user=decoded;
        next();
    }catch(error){
        res.status(400).send({message:'Invalid token.'});
    }
}
module.exports=isLoggedIn;