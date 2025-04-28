# Meme Generator Web Application (AWS Full-Stack Project)

This project is a full-stack meme generator web application deployed on AWS, allowing users to create, store, and manage custom memes. The platform supports both static and dynamic meme generation, user authentication, and personalized meme libraries, while including an admin dashboard formanaging user generation.

## Features

### Authentication & Authorization
- **JWT-based Authentication**: Secure token generation and validation
- **Role-based Access Control**: Managing user permissions and access levels
- **AWS Cognito Integration**: User pool management and identity tokens
- **Google OAuth Integration**: Federated login with Google through AWS Cognito Identity Pool

### Image Processing Functions
- **Meme Generation**: Dynamic meme creation with customizable text and random effect generation
- **Image Resizing**: Automatic image resizing and optimization
- **Format Conversion**: Support for converting between different image formats

### User Features
- **Meme gallery**: Access to their saved meme library, allowing updates and deletions
- **Pagination & Filtering**: Custom pagination and search functionality for browsing meme history
- **Admin panel**: Flagging and deleting inappropriate user generated contents

### Performance Testing
- **Load Testing**: Comprehensive load testing scripts for AWS Lambda functions and ECS
- **Concurrent Request Handling**: Testing function behavior under various load conditions


## Core Technologies

- **Runtime**: Node.js
- **Web Framework**: Express.js
- **AWS SDK**: For interacting with AWS services
- **Testing**: Load testing scripts
- **Authentication**: JWT tokens, AWS Cognito
- **Image Processing**: Sharp library

## AWS Infrastructure

- **Infrastructure as Code (IaC)**:
  - CloudFormation (for infrastructure deployment)
- **Servers**:
  - EC2 (for virtual machines)
  - ECS (for containerized applications)
  - Application Load Balancer (ALB)
- **Serverless**:
  - AWS Lambda (for managing S3 content after uploading)
- **Storage**: 
  - S3 (for image storage)
  - DynamoDB (for metadata storage)
  - ElastiCache (for Memcached caching)
  - EFS (for static assets storage)
- **Messaging**: 
  - SQS (for asynchronous processing)
- **Configuration**: 
  - Parameter Store (for secure configuration)
  - Secrets Manager (for sensitive data)
- **Security**:
  - IAM (for access control)
  - Cognito (for user authentication and management)
  - CloudWatch (for logs and metrics)
- **Networking**:
  - VPC (for internal port routing)
  - Route 53 (for DNS management)

## Prerequisites

- Node.js (v14 or higher)
- AWS Account with appropriate permissions
- AWS CLI
- Docker

## Configuration

1. Clone the repository
```bash
git clone [repository-url]
cd [project-directory]
```

2. Install dependencies
```bash
npm install
```

3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your AWS credentials and configuration
```

## Deployment

1. Deploy to AWS
```bash
npm run deploy
```

2. Run tests
```bash
npm run test
```

## Load Testing
The project includes load testing scripts to evaluate function performance:

```bash
npm run loadtest
```

This will execute various test scenarios:
- Concurrent user authentication
- Bulk image processing
- High-frequency API calls

## License
This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

## Author
- Ka Long Arnald Shek



