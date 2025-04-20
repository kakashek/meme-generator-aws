const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const url = require('url');
const { v4: uuidv4 } = require('uuid');
const unlinkAsync = util.promisify(fs.unlink);
const axios = require('axios');
const asyncHandler = require("express-async-handler");
const { read } = require('fs');
const { saveImage, deleteFileFromS3, generateUploadUrl, generateRetrievalUrl } = require("../controllers/imageController");
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB
const client = new DynamoDBClient({
    region: 'ap-southeast-2',
});
const docClient = DynamoDBDocumentClient.from(client);
const tableName = process.env.DYNAMODB_MEME_TABLE;
const username = process.env.USERNAME;


// Function to find memes by creator
async function findByCreator(creator) {
    const params = {
        TableName: tableName,
        FilterExpression: "#creator = :creator",
        ExpressionAttributeNames: {
            "#creator": "creator", 
        },
        ExpressionAttributeValues: {
            ":creator": creator 
        },
    };

    try {
        // Query the DynamoDB table by creator
        const command = new ScanCommand(params);
        const result = await docClient.send(command);

        if (result.Items.length === 0) {
            return { success: false, message: 'No memes found for this creator' };
        }
        const memesWithUrls = await Promise.all(result.Items.map(async (meme) => {
            const extension = '.jpg';
            const s3Key = `memes/${meme.memeId}${extension}`; 
            const imageUrl = await generateRetrievalUrl(s3Key, 3600); 
            return {
                ...meme,  
                imageUrl  
            }
        }));
        return { success: true, data: memesWithUrls };

    } catch (error) {
        console.error('Error querying memes by creator:', error);
        return { success: false, message: 'Error retrieving memes', error: error.message };
    }
}

// Function to retrieve all memes
async function getAllMemes() {
    const params = {
        TableName: tableName,
    };
    try {
        // Scan the DynamoDB table for all items
        const command = new ScanCommand(params);
        const result = await docClient.send(command);

        if (result.Items.length === 0) {
            return { success: false, message: 'No memes found' };
        }

        const memesWithUrls = await Promise.all(result.Items.map(async (meme) => {
            const extension = '.jpg';
            const s3Key = `memes/${meme.memeId}${extension}`; 
            const imageUrl = await generateRetrievalUrl(s3Key, 3600); 
            return {
                ...meme,  
                imageUrl  
            }
        }));

        return { success: true, data: memesWithUrls };

    } catch (error) {
        console.error('Error retrieving all memes:', error);
        return { success: false, message: 'Error retrieving memes', error: error.message };
    }
}



// Function to create meme
exports.meme_create = asyncHandler(async (req, res) => {
    try {
        // Generate unique ID for the meme
        const memeId = uuidv4();
        const extension = '.jpg';
        const s3Key = `memes/${memeId}${extension}`;  

        // Save the image in S3
        const imageSaveResponse = await saveImage(s3Key, req.body.generatedImageKey);
        if (!imageSaveResponse.success) {
            throw new Error(imageSaveResponse.message);  
        }

        // Create a new meme object to store in DynamoDB
        const newMeme = {
            "username": username,
            memeId: memeId,
            creator: req.user.sub,
            title: req.body.storedTitle,
            metadata: req.body.storedMetadata,
            createdAt: new Date().toISOString()
        };

        // Put the new meme into DynamoDB
        const command = new PutCommand({
            TableName: tableName,
            Item: newMeme
        });
        await docClient.send(command);

        // Return response
        res.status(201).json({
            success: true,
            message: 'Meme created successfully',
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Unable to create meme" });
    }
});

// Delete a meme
exports.meme_delete = asyncHandler(async (req, res) => {
    try {
        const memeId = req.params.memeId;
        const extension = '.jpg';
        const s3Key = `memes/${memeId}${extension}`;  

        // Delete meme from S3
        const deleteS3Response = await deleteFileFromS3(s3Key);
        if (!deleteS3Response.success) {
            return res.status(500).json({ success: false, message: 'Failed to delete image from S3' });
        }
        // Delete meme from dynamodb
        const deleteParams = {
            TableName: tableName, 
            Key: { 
                "username": username,
                memeId: memeId 
            }  
        };
        const deleteCommand = new DeleteCommand(deleteParams);
        await docClient.send(deleteCommand);

        res.status(200).json({ success: true, message: 'Meme deleted successfully' });

    } catch (error) {
        console.error('Error deleting meme:', error);
        res.status(500).json({ success: false, message: 'Failed to delete meme', error: error.message });
    }
});

// Display memes for a user
exports.meme_list = asyncHandler(async (req, res) => {
    try {
        let result;
        if (req.user['cognito:groups'] && req.user['cognito:groups'].includes('admin')) {
            result = await getAllMemes();

        } else {
            const creator = req.user.sub;
            result = await findByCreator(creator);
        }

        if (!result.success) {
            return res.status(404).json(result); 
        }
        res.status(200).json({ success: true, data: result.data });
        

    } catch (error) {
        console.error('Error retrieving meme list:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve memes', error: error.message });
    }
});

