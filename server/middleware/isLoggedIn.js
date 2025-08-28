const jwt=require('jsonwebtoken');
const cookieParser=require('cookie-parser');
const isLoggedIn=(req,res,next)=>{
    const token=req.cookies.token ;
    if(!token){
return res.status(401).send({message:'Access denied. No token provided.'});
       
    }
    try{
        const data=jwt.verify(token,process.env.SECRET);
        console.log(data);
        req.user=data;
        next();
    }catch(error){
        res.status(400).send({message:'Invalid token.'});
    }
}
module.exports=isLoggedIn;