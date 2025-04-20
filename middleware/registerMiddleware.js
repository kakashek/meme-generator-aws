const Cognito = require("@aws-sdk/client-cognito-identity-provider");
const { loadCognitoParameters } = require('../middleware/authMiddleware');
const client = new Cognito.CognitoIdentityProviderClient({ region: 'ap-southeast-2' });

// Handle registration check
exports.registerCheck = async (req, res, next) => {

    // Load Cognito parameters and verifiers
    const config = await loadCognitoParameters();

    const { username, password, email } = req.body;

    try {
        const command = new Cognito.SignUpCommand({
            ClientId: config.COGNITO_CLIENT_ID,
            Username: username,
            Password: password,
            UserAttributes: [
                { Name: "email", Value: email },
            ]
        });

        const response = await client.send(command);
        res.status(201).json({ success: true });
    } catch (error) {
        console.error("Cognito SignUp Error:", error);
        if (error.name === "UsernameExistsException") {
            res.status(400).json({ success: false, message: "Username already exists." });
        } else if (error.name === "InvalidPasswordException") {
            res.status(400).json({ success: false, message: "Password does not meet the required criteria." });
        } else {
            res.status(500).json({ success: false, message: "Internal server error." });
        }
    }
};

// Handle email confirmation check
exports.confirmEmailCheck = async (req, res, next) => {

    // Load Cognito parameters and verifiers
    const config = await loadCognitoParameters();

    const { username, confirmationCode } = req.body;

    try {
        const command = new Cognito.ConfirmSignUpCommand({
            ClientId: Config.COGNITO_CLIENT_ID,
            Username: username,
            ConfirmationCode: confirmationCode,
        });

        const response = await client.send(command);
        console.log("Cognito ConfirmSignUp Response:", response);

        res.json({ success: true, message: "Email confirmed successfully!" });
    } catch (error) {
        console.error("Cognito ConfirmSignUp Error:", error);

        if (error.name === "CodeMismatchException") {
            res.status(400).json({ success: false, message: "Invalid confirmation code. Please try again." });
        } else if (error.name === "ExpiredCodeException") {
            res.status(400).json({ success: false, message: "Confirmation code has expired. Please request a new code." });
        } else if (error.name === "NotAuthorizedException") {
            res.status(400).json({ success: false, message: "User is already confirmed." });
        } else {
            res.status(500).json({ success: false, message: "Internal server error." });
        }
    }
};

// Admin registration
exports.adminRegister = async function (req, res) {

    // Load Cognito parameters and verifiers
    const config = await loadCognitoParameters();

    try {
        const command = new Cognito.UpdateUserAttributesCommand({
            AccessToken: req.AccessToken,
            UserAttributes: [
                { Name: "email", Value: 'admin@example.com' },
                { Name:"custom:admin", Value: "true"}
            ]
        });

        const response = await client.send(command);
        console.log("User attributes updated:", response);
        res.status(201).json({ success: true, message: "Admin user successfully created!" });
    } catch (error) {
        console.error("Cognito SignUp Error:", error);
        if (error.name === "UsernameExistsException") {
            res.status(400).json({ success: false, message: "Username already exists." });
        } else if (error.name === "InvalidPasswordException") {
            res.status(400).json({ success: false, message: "Password does not meet the required criteria." });
        } else {
            res.status(500).json({ success: false, message: "Internal server error." });
        }
    }
};

