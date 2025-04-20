const Cognito = require("@aws-sdk/client-cognito-identity-provider");
const jwt = require("aws-jwt-verify");  
const axios = require("axios");  
const asyncHandler = require('express-async-handler');
const { URLSearchParams } = require("url"); 
const { SSMClient, GetParametersCommand } = require('@aws-sdk/client-ssm');

// Initilaize AWS Parameter Store
const client = new SSMClient({ region: "ap-southeast-2" });
const REDIRECT_URI = process.env.REDIRECT_URI || 'https://meme-generator-app.example.com/callback';

// Initialize AWS Cognito Identity Provider
const cognito = new Cognito.CognitoIdentityProviderClient({
    region: "ap-southeast-2"
});

const clientSecretPath = process.env.SSM_CLIENT_SECRET_PATH;
const cognitoClientIdPath = process.env.SSM_COGNITO_CLIENT_ID_PATH;
const cognitoDomainPath = process.env.SSM_COGNITO_DOMAIN_PATH;
const googleClientIdPath = process.env.SSM_GOOGLE_CLIENT_ID_PATH;
const userPoolIdPath = process.env.SSM_USER_POOL_ID_PATH;

exports.loadCognitoParameters = async function() {
    const parameterNames = [ 
        clientSecretPath,       
        cognitoClientIdPath,    
        cognitoDomainPath,
        googleClientIdPath,        
        userPoolIdPath      
    ];
    const variableNames = [ 
        'CLIENT_SECRET',                   
        'COGNITO_CLIENT_ID',               
        'COGNITO_DOMAIN',  
        'GOOGLE_CLIENT_ID',                 
        'COGNITO_USER_POOL_ID',
    ];
    const config = {};

    try {
        // Fetch parameters from the Parameter Store
        const command = new GetParametersCommand({
            Names: parameterNames,
            WithDecryption: true  
        });

        const response = await client.send(command);

        // Extract the parameters and store them in a key-value object
        for (var i = 0; i < variableNames.length; i++) {
            config[variableNames[i]] = response.Parameters[i].Value;
        }
        return config;

    } catch (error) {
        console.error("Error fetching parameters:", error);
        throw error;
    }
}

// Function to create access and id verifier
exports.createAccessIdVerifier = async function() {

    // Load Cognito parameters
    const config = await exports.loadCognitoParameters();

    const accessVerifier = jwt.CognitoJwtVerifier.create({
        userPoolId: config.COGNITO_USER_POOL_ID,
        tokenUse: "access",
        clientId: config.COGNITO_CLIENT_ID,
    });
      
    const idVerifier = jwt.CognitoJwtVerifier.create({
        userPoolId: config.COGNITO_USER_POOL_ID,
        tokenUse: "id",
        clientId: config.COGNITO_CLIENT_ID,
    });

    return { accessVerifier, idVerifier }
}

// Function to authenticate the user with AWS Cognito
exports.authenticateUser = async (req, res, next) => {
    const { email, password } = req.body;

    // Load Cognito parameters and verifiers
    const config = await exports.loadCognitoParameters();
    const { accessVerifier, idVerifier } = await exports.createAccessIdVerifier();

    const command = new Cognito.InitiateAuthCommand({
        AuthFlow: Cognito.AuthFlowType.USER_PASSWORD_AUTH,
        AuthParameters: {
            USERNAME: email,
            PASSWORD: password,
        },
        ClientId: config.COGNITO_CLIENT_ID,
    });

    try {
        const response = await cognito.send(command);

        // Redirect to password change if new password required
        if (response.ChallengeName === 'NEW_PASSWORD_REQUIRED') {
            const sessionId = response.Session;
            res.status(200).json({
                success: false,
                password_change: true,
                message: 'Password expired. Please change password before logging in.',
                email: email,
                sessionId: sessionId,
            });

        } else {
            // Return tokens and username
            req.accessToken = response.AuthenticationResult.AccessToken;
            req.idToken = response.AuthenticationResult.IdToken;
            const decodedToken = await accessVerifier.verify(req.accessToken);  
            req.user = decodedToken;
            next();
        }

    } catch (error) {
        console.error('Cognito Authentication Error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid credentials or Cognito error',
        });
    }
};

// Middleware to check if the user is authenticated using Cognito JWT
exports.checkAuthenticated = async (req, res, next) => {
    const { accessVerifier, idVerifier } = await exports.createAccessIdVerifier();
    const authHeader = req.headers['authorization'];  
    const token = authHeader && authHeader.split(' ')[1];  
    if (token) {
        try {
            const decodedToken = await accessVerifier.verify(token);  
            req.user = decodedToken;  
            req.accessToken = token;
            next();
        } catch (error) {
            res.status(401).json({
                success: false,
                message: 'Session expired! Please login again.'
            });
        }
    } else {
        res.status(401).json({
            success: false,
            message: 'Please login to continue'
        });
    }
};

// Get google login URL
exports.googleAuthenticate = async (req, res, next) => {
    try {
        const config = await exports.loadCognitoParameters();
        const scope = 'openid email profile';
        const googleLoginUrl = `https://${config.COGNITO_DOMAIN}/oauth2/authorize?identity_provider=Google&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=CODE&client_id=${config.COGNITO_CLIENT_ID}&scope=${encodeURIComponent(scope)}`;
        res.status(200).json({
            success: true,
            googleLoginUrl: googleLoginUrl,
        });
    } catch (error) {
        console.error('Google Authentication Error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initiate Google authentication',
        });
    }
};

// Callback to handle login from Google
exports.googleCallback = async (req, res) => {

    const config = await exports.loadCognitoParameters();
    const code = req.query.code; 

    if (!code) {
        return res.status(400).json({ message: 'Authorization code is missing' });
    }

    try {
        // Prepare token request to Cognito
        const tokenUrl = `https://${config.COGNITO_DOMAIN}/oauth2/token`;
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        // Prepare data for the request
        const data = new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: config.COGNITO_CLIENT_ID,
            code: code,
            redirect_uri: REDIRECT_URI,
        });

        // Send request to Cognito
        const response = await axios.post(tokenUrl, data, { headers });

        // Get the access and ID tokens from the response
        const accessToken = response.data.access_token;
        const idToken = response.data.id_token;

        // Handle the tokens (store them, send them back to the client, etc.)
        res.redirect(`/callback-success?idToken=${idToken}&accessToken=${accessToken}`);

    } catch (error) {
        console.error('Error exchanging code for tokens:', error.response.data);
        res.status(500).json({
            success: false,
            message: 'Failed to exchange code for tokens',
        });
    }
};


// Function to log out user using Global Sign-Out
exports.logoutUser = async (req, res) => {
    const authHeader = req.headers['authorization'];  
    const accessToken = authHeader && authHeader.split(' ')[1];      

    if (!accessToken) {
        return res.status(400).json({ message: 'No access token provided' });
    }

    try {
        // Global sign-out request
        const command = new Cognito.GlobalSignOutCommand({
            AccessToken: accessToken,
        });
        await cognito.send(command);  

        res.status(200).json({
            success: true,
            message: 'User logged out successfully',
        });
    } catch (error) {
        console.error('Error during logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error during logout',
            error: error.message,
        });
    }
};

exports.passwordChange = async (req, res) => {
    const { email, newPassword, sessionId } = req.body;

    // Load Cognito parameters and verifiers
    const config = await exports.loadCognitoParameters();

    const command = new Cognito.RespondToAuthChallengeCommand({
        ChallengeName: 'NEW_PASSWORD_REQUIRED',
        ClientId: config.COGNITO_CLIENT_ID,
        ChallengeResponses: {
            USERNAME: email,
            NEW_PASSWORD: newPassword,
        },
        Session: sessionId, 
    });

    try {
        const response = await cognito.send(command);
        res.status(200).json({ success: true, message: 'Password changed successfully!' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ success: false, message: error.message });
    }

}

