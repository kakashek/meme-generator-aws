#!/bin/bash

# Load environment variables from .env file
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Deploy CloudFormation stack
aws cloudformation deploy \
    --template-file cloudformation.yaml \
    --stack-name ${STACK_NAME:-meme-generator-stack} \
    --region ${AWS_REGION:-ap-southeast-2} \
    --parameter-overrides \
        ProjectPrefix=${PROJECT_PREFIX:-meme-generator} \
        UserPoolId=${COGNITO_USER_POOL_ID} \
        ClientId=${COGNITO_CLIENT_ID} \
        ClientSecret=${COGNITO_CLIENT_SECRET} \
        HostedZoneName=${ROUTE53_HOSTED_ZONE} \
    --capabilities CAPABILITY_IAM 