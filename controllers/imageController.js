const express = require('express');
const multer = require('multer');
const path = require('path');
const asyncHandler = require('express-async-handler');
const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand} = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const SQS = require("@aws-sdk/client-sqs");

// Initialize the S3 client
const s3Client = new S3Client({ region: 'ap-southeast-2' });
const bucketName = process.env.S3_BUCKET;

// Initialize sqs client
const sqs = new SQS.SQSClient({ region: "ap-southeast-2" });

// Function to get pre-signed URL for uploading
exports.generateUploadUrl = async function(key, mimeType, expiryTime) {
    const params = {
        Bucket: bucketName,
        Key: key,
        ContentType: mimeType
    };
    const command = new PutObjectCommand(params);
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiryTime }); 
    return uploadUrl;
}

// Function to get pre-signed URL for downloading
exports.generateRetrievalUrl = async function(key, expiryTime) {
    const params = {
        Bucket: bucketName,
        Key: key,
    };  
    const command = new GetObjectCommand(params);
    const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: expiryTime }); 
    return downloadUrl;
}

// Function to save image from S3
exports.saveImage = async function(newKey, oldKey) {

    const params = {
        Bucket: bucketName,
        CopySource: `${bucketName}/${oldKey}`,  
        Key: newKey,                                  
    };
    const command = new CopyObjectCommand(params);
    try {
        const data = await s3Client.send(command);  
        return { success: true, data };
    } catch (error) {
        console.error('Error saving file:', error);
        return { success: false, message: 'Error saving file' };
    }
}

// Function to upload an object to S3
exports.putFileToS3 = async function(key, imageBuffer, mimeType) {
    const params = {
        Bucket: bucketName, 
        Key: key,
        Body: imageBuffer,
        ContentType: mimeType
    };

    const command = new PutObjectCommand(params);

    try {
        const data = await s3Client.send(command);
        return { success: true, data };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, message: 'Error uploading file' };
    }
};


// Function to delete an object from S3
exports.deleteFileFromS3 = async function(key) {
    const params = {
        Bucket: bucketName,  
        Key: key 
    };
    const command = new DeleteObjectCommand(params);
    try {
        const data = await s3Client.send(command);
        return { success: true };
    } catch (error) {
        console.error('Error deleting file:', error);
        return { success: false, message: 'Error deleting file' };
    }
}

// Function to return both upload and retrieval URL
exports.getPresignedUrl = asyncHandler(async (req, res) => {
    const { fileName, mimeType } = req.body;  
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedMimeTypes.includes(mimeType)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid file type. Only image files are allowed.'
        });
    }
    const key = `temp/${Date.now()}-${fileName}`;  

    try {
        const uploadUrl = await exports.generateUploadUrl(key, mimeType, 60 * 2);  
        const retrieveUrl = await exports.generateRetrievalUrl(key, 60 * 60); 
        res.status(200).json({
            success: true,
            uploadUrl: uploadUrl,   
            retrieveUrl: retrieveUrl, 
            imageKey: key
        });
    } catch (error) {
        console.error('Error generating pre-signed URLs:', error);
        res.status(500).json({ success: false, message: 'Error generating URLs' });
    }
});

const sqsQueueUrl = process.env.SQS_QUEUE_URL;

// Function to return both upload and retrieval URL
exports.checkSQSMessage = asyncHandler(async (req, res) => {
    const imageKey = req.body.imageKey;  
    const receiveCommand = new SQS.ReceiveMessageCommand({
        MaxNumberOfMessages: 1,
        QueueUrl: sqsQueueUrl,
        WaitTimeSeconds: 5,
        VisibilityTimeout: 3,
        MessageAttributeNames: ["All"], 
    });
    let messageFound = false;
    const timeout = 10;
    let attempts = 0;

    try {
        while (!messageFound && attempts < timeout) {
            const result = await sqs.send(receiveCommand);
            attempts += 1;
            
            if (result.Messages) {
                
                const message = result.Messages[0];
                const key = JSON.parse(message.Body).key;

                // Check if the SQS message matches the uploaded image's ID
                if (key === imageKey) {
                    messageFound = true;

                    // Process the message 
                    res.status(200).json({
                        success: true,
                        message: "Image processing complete",
                    });

                    const deleteCommand = new SQS.DeleteMessageCommand({
                        QueueUrl: sqsQueueUrl,
                        ReceiptHandle: message.ReceiptHandle,
                     });
                     const deleteResponse = await sqs.send(deleteCommand);

                } 
            }
        }
        // If the max attempts are reached without finding the message
        if (!messageFound) {
            res.status(408).json({
                success: false,
                message: "Request timed out. Please try again later.",
            });
        }
    } catch (error) {
        console.error("Error checking SQS messages:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while checking SQS messages.",
        });
    } 
});


