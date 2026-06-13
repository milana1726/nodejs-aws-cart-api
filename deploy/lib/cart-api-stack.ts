import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CartApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    console.log({
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
    });

    const cartLambda = new NodejsFunction(this, 'CartApiLambda', {
      functionName: 'cartApiLambda',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/lambda.ts'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(30),

      environment: {
        DB_HOST: process.env.DB_HOST || 'localhost',
        DB_PORT: process.env.DB_PORT || '5432',
        DB_NAME: process.env.DB_NAME || 'cart_db',
        DB_USER: process.env.DB_USER || 'postgres',
        DB_PASSWORD: process.env.DB_PASSWORD || 'password',
      },

      bundling: {
        externalModules: [
          '@nestjs/websockets',
          '@nestjs/microservices',
          'class-validator',
          'class-transformer',
        ],
        minify: false,
        sourceMap: true,
        tsconfig: path.join(__dirname, '../tsconfig.json'),
        esbuildArgs: {
          '--keep-names': true,
        },
      },
    });

    const api = new apigateway.RestApi(this, 'CartApi', {
      restApiName: 'Cart Service API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['*'],
      },
    });

    api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(cartLambda),
    });
  }
}
