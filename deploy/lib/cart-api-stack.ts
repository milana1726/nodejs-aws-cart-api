import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class CartApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cartLambda = new NodejsFunction(this, 'CartApiLambda', {
      functionName: 'cartApiLambda',
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'handler',
      entry: path.join(__dirname, '../src/lambda.ts'),
      memorySize: 512,
      timeout: cdk.Duration.seconds(10),
      bundling: {
        externalModules: [
          'class-transformer',
          'class-validator',
          '@nestjs/websockets',
          '@nestjs/microservices',
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
    });

    api.root.addProxy({
      defaultIntegration: new apigateway.LambdaIntegration(cartLambda),
    });
  }
}
