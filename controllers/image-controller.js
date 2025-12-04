const Image=require('../models/image');
const {uploadToCloudinary}=require('../helpers/cloudinaryHelper');
const { image } = require('../config/cloudinary');
const fs=require('fs');
const cloudinary=require('../config/cloudinary')

const uploadImageController=async(req, res)=>{
    try {
        //check if the file is missing in req object

        if(!req.file){
            return res.status(400).json({
                success:false,
                message:'file is required. Please upload an image.'
            })
        }

        //upload to cloudinary

        const {url, publicId}=await uploadToCloudinary(req.file.path)
        
        //store the image url and public id along with the uploaded user id in thed database
        const nwelyUploadedImage=new Image({
            url, 
            publicId,
            uploadedBy:req.userInfo.userId
        })

        await nwelyUploadedImage.save();

        //delete the file from local storage
        // fs.unlinkSync(req.file.path);

        res.status(200).json({
            success:true,
            message:'Image uploaded sucessfully.',
            image:nwelyUploadedImage
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            success:false,
            message:'something went wrong! please try again!'
        })
        
    }
}

const fetchImageController = async(req, res)=>{
    try {
        //pagination and sorting
        const page=parseInt(req.query.page) || 1;
        const limit=parseInt(req.query.limit) ||2;
        const skip=(page-1) * limit;

        const sortBy=req.query.sortBy ||'createdAt';
        const sortOrder=req.query.sortOrder ==='asc' ? 1 :-1;
        const totalImages=await Image.countDocuments();
        const totalPages=Math.ceil(totalImages/limit);

        const sortObj={};
        sortObj[sortBy]=sortOrder;
        const getImages=await Image.find().sort(sortObj).skip(skip).limit(limit);
//const getImage=await Image.find({});
        if(getImages){
            res. status(200).json({
                success:true,
                currrentPage:page,
                totalPages:totalPages,
                totalImages:totalImages,
                data:getImages
            })
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:'something went wrong! please try again!'
        })
        
        
    }
}

const deleteImageController=async(req, res)=>{
    try {
        //uploaded admin having only deleted rights other admin and user does not having rights to delete.
        const getCurrentImageToBeDeleted=req.params.id;
        const userId=req.userInfo.userId;

        const image=await Image.findById(getCurrentImageToBeDeleted);

        if(!image){
            return res.status(404).json({
                success:false,
                message:"image not found",
            })
        }
        //check if this image is uploaded by the user who is trying to delete this
        if(image.uploadedBy.toString() !==userId){
            return res.status(404).json({
                success:false,
                message:'you are not authorized to deletethis image beacause you have not uploaded it '

            })

        }

        //delete this image first from your cloudinary storage
        await cloudinary.uploader.destroy(image.publicId);

        //delete this image from mongodb database

        await Image.findByIdAndDelete(getCurrentImageToBeDeleted);
        res.status(200).json({
            success:true,
            message:'Image deleted successfully!'
        })
        
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success:false,
            message:"Something went wrong! please try again"
        })
        
        
    }
}

module.exports={
    uploadImageController,
    fetchImageController,
    deleteImageController
    
}